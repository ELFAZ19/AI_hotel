-- 010_payments.sql (idempotent version)
-- This migration recreates the payments table with the updated schema.
-- Using IF NOT EXISTS so it won't fail if already applied.

DO $$ BEGIN
  -- Drop old payment_status if it has 'refunded' value and recreate
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    -- Check if the enum has 'refunded' (old version)
    IF EXISTS (
      SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = 'payment_status' AND e.enumlabel = 'refunded'
    ) THEN
      DROP TABLE IF EXISTS payments CASCADE;
      DROP TYPE payment_status CASCADE;
      CREATE TYPE payment_status AS ENUM ('pending', 'success', 'failed');
    END IF;
  ELSE
    CREATE TYPE payment_status AS ENUM ('pending', 'success', 'failed');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id      UUID REFERENCES reservations(id) ON DELETE RESTRICT,
  chapa_tx_ref        VARCHAR(200) UNIQUE NOT NULL,
  amount              DECIMAL(10,2) NOT NULL,
  currency            VARCHAR(10) DEFAULT 'ETB',
  status              payment_status DEFAULT 'pending',
  chapa_checkout_url  VARCHAR(500),
  payment_method      VARCHAR(50),
  paid_at             TIMESTAMP,
  raw_response        JSONB DEFAULT '{}',
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_tx_ref ON payments(chapa_tx_ref);
CREATE INDEX IF NOT EXISTS idx_payments_reservation ON payments(reservation_id);
