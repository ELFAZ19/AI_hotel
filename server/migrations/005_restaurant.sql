CREATE TYPE restaurant_status AS ENUM ('pending', 'confirmed', 'seated', 'completed', 'cancelled');

CREATE TABLE restaurant_reservations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id          UUID REFERENCES users(id) ON DELETE RESTRICT,
  reservation_date  DATE NOT NULL,
  reservation_time  TIME NOT NULL,
  party_size        INT NOT NULL,
  special_requests  TEXT,
  status            restaurant_status DEFAULT 'pending',
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_restaurant_date ON restaurant_reservations(reservation_date);
CREATE INDEX idx_restaurant_guest ON restaurant_reservations(guest_id);
