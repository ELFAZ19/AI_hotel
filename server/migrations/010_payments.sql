-- 010_payments.sql
DROP TABLE IF EXISTS payments CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;

CREATE TYPE payment_status AS ENUM ('pending', 'success', 'failed');

CREATE TABLE payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id      UUID REFERENCES reservations(id) ON DELETE RESTRICT,
  chapa_tx_ref        VARCHAR(200) UNIQUE NOT NULL,
  amount              DECIMAL(10,2) NOT NULL,
  currency            VARCHAR(10) DEFAULT 'ETB',
  status              payment_status DEFAULT 'pending',
  chapa_checkout_url  VARCHAR(500),
  payment_method      VARCHAR(50),           -- telebirr, cbe_birr, card, etc.
  paid_at             TIMESTAMP,
  raw_response        JSONB DEFAULT '{}',    -- store full Chapa response for debugging
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payments_tx_ref ON payments(chapa_tx_ref);
CREATE INDEX idx_payments_reservation ON payments(reservation_id);
