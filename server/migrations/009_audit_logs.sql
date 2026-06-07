-- 009_audit_logs.sql
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  action      VARCHAR(100) NOT NULL,  -- 'RESERVATION_STATUS_CHANGED'
  entity      VARCHAR(100),           -- 'reservations'
  entity_id   VARCHAR(100),           -- the UUID of the record
  old_value   JSONB DEFAULT '{}',     -- state before change
  new_value   JSONB DEFAULT '{}',     -- state after change
  ip_address  VARCHAR(45),
  created_at  TIMESTAMP DEFAULT NOW()
);
