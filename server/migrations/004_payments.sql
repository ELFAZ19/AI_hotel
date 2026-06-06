CREATE TYPE payment_status AS ENUM ('pending', 'success', 'failed', 'refunded');

CREATE TABLE payments (
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
  created_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payments_tx_ref ON payments(chapa_tx_ref);
CREATE INDEX idx_payments_reservation ON payments(reservation_id);
