-- 002_rooms.sql
DO $$ BEGIN
  CREATE TYPE room_status AS ENUM ('available', 'occupied', 'maintenance', 'inactive');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS room_types (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  description   TEXT,
  base_price    DECIMAL(10,2) NOT NULL,
  max_guests    INT NOT NULL DEFAULT 2,
  amenities     JSONB DEFAULT '[]',
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rooms (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number     VARCHAR(20) UNIQUE NOT NULL,
  room_type_id    INT REFERENCES room_types(id) ON DELETE RESTRICT,
  floor           INT NOT NULL DEFAULT 1,
  status          room_status DEFAULT 'available',
  price_override  DECIMAL(10,2),
  description     TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS room_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     UUID REFERENCES rooms(id) ON DELETE CASCADE,
  url         VARCHAR(500) NOT NULL,
  public_id   VARCHAR(200),
  is_primary  BOOLEAN DEFAULT FALSE,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_rooms_type ON rooms(room_type_id);
