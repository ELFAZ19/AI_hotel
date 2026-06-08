-- 003_reservations.sql
DO $$ BEGIN
  CREATE TYPE reservation_status AS ENUM (
    'pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS reservations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id          UUID REFERENCES users(id) ON DELETE RESTRICT,
  room_id           UUID REFERENCES rooms(id) ON DELETE RESTRICT,
  check_in          DATE NOT NULL,
  check_out         DATE NOT NULL,
  adults            INT NOT NULL DEFAULT 1,
  children          INT DEFAULT 0,
  total_price       DECIMAL(10,2) NOT NULL,
  status            reservation_status DEFAULT 'pending',
  special_requests  TEXT,
  confirmed_at      TIMESTAMP,
  checked_in_at     TIMESTAMP,
  checked_out_at    TIMESTAMP,
  cancelled_at      TIMESTAMP,
  cancellation_note TEXT,
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_dates CHECK (check_out > check_in)
);

CREATE INDEX IF NOT EXISTS idx_reservations_guest ON reservations(guest_id);
CREATE INDEX IF NOT EXISTS idx_reservations_room ON reservations(room_id);
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
