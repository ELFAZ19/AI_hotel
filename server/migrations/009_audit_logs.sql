-- 009_audit_logs.sql
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  action      VARCHAR(100) NOT NULL,
  entity      VARCHAR(100),
  entity_id   VARCHAR(100),
  old_value   JSONB DEFAULT '{}',
  new_value   JSONB DEFAULT '{}',
  ip_address  VARCHAR(45),
  created_at  TIMESTAMP DEFAULT NOW()
);
