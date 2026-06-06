-- Seed room types
INSERT INTO room_types (name, description, base_price, max_guests, amenities) VALUES
('Standard Room', 'Comfortable standard room with all essential amenities', 1500.00, 2,
 '["WiFi","AC","TV","Hot Shower","Wardrobe"]'),
('Single Room', 'Cozy single room perfect for solo travelers', 1200.00, 1,
 '["WiFi","AC","TV","Hot Shower"]'),
('Deluxe Double Room', 'Spacious deluxe room with premium furnishings', 2500.00, 2,
 '["WiFi","AC","Smart TV","Mini Bar","Hot Shower","Bathtub","Wardrobe","Safe"]'),
('Suite Room', 'Luxury suite with separate living area and premium services', 4500.00, 4,
 '["WiFi","AC","Smart TV","Mini Bar","Hot Shower","Bathtub","Living Room","Kitchen","Safe","Butler Service"]');

-- Seed rooms
INSERT INTO rooms (room_number, room_type_id, floor) VALUES
('101', 1, 1),
('102', 1, 1),
('103', 2, 1),
('104', 1, 1),
('105', 1, 1),
('106', 2, 1),
('107', 1, 1),
('108', 1, 1),
('109', 2, 1),
('110', 1, 1),

('201', 1, 2),
('202', 3, 2),
('203', 3, 2),
('204', 1, 2),
('205', 1, 2),
('206', 3, 2),
('207', 3, 2),
('208', 1, 2),
('209', 1, 2),
('210', 3, 2),

('301', 3, 3),
('302', 4, 3),
('303', 4, 3),
('304', 3, 3),
('305', 3, 3),
('306', 4, 3),
('307', 3, 3),
('308', 4, 3),
('309', 3, 3),
('310', 4, 3),

('401', 1, 4),
('402', 1, 4),
('403', 2, 4),
('404', 1, 4),
('405', 1, 4),
('406', 2, 4),
('407', 1, 4),
('408', 1, 4),
('409', 2, 4),
('410', 1, 4),

('501', 3, 5),
('502', 3, 5),
('503', 4, 5),
('504', 3, 5),
('505', 3, 5),
('506', 4, 5),
('507', 3, 5),
('508', 4, 5),
('509', 3, 5),
('510', 4, 5);

-- Seed event spaces
INSERT INTO event_spaces (name, capacity, price_per_hour, amenities) VALUES
('Grand Ballroom', 500, 5000.00, '["Stage","Sound System","Projector","AC","Catering Kitchen"]'),
('Conference Room A', 50, 1500.00, '["Projector","Whiteboard","AC","WiFi","Video Conferencing"]'),
('Garden Terrace', 200, 3000.00, '["Open Air","Lighting","Sound System","Catering Area"]');