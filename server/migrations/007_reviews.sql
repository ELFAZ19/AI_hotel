CREATE TABLE reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id        UUID REFERENCES users(id) ON DELETE RESTRICT,
  reservation_id  UUID REFERENCES reservations(id) ON DELETE CASCADE,
  room_id         UUID REFERENCES rooms(id) ON DELETE CASCADE,
  rating          INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment         TEXT,
  is_published    BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMP DEFAULT NOW()
);
