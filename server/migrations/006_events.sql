-- 006_events.sql
DO $$ BEGIN
  CREATE TYPE event_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS event_spaces (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(100) NOT NULL,
  capacity        INT NOT NULL,
  price_per_hour  DECIMAL(10,2) NOT NULL,
  amenities       JSONB DEFAULT '[]',
  is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS event_bookings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id      UUID REFERENCES users(id) ON DELETE RESTRICT,
  space_id      INT REFERENCES event_spaces(id) ON DELETE RESTRICT,
  event_name    VARCHAR(200) NOT NULL,
  event_type    VARCHAR(100),
  event_date    DATE NOT NULL,
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  guest_count   INT NOT NULL,
  total_price   DECIMAL(10,2),
  status        event_status DEFAULT 'pending',
  notes         TEXT,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_bookings_date ON event_bookings(event_date);
CREATE INDEX IF NOT EXISTS idx_event_bookings_guest ON event_bookings(guest_id);
