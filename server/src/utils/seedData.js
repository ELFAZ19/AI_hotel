require("dotenv").config();
const { pool } = require("../config/db");
const bcrypt = require("bcryptjs");
const logger = require("./logger");

const seedData = async () => {
  const client = await pool.connect();
  try {
    logger.info("Running comprehensive seed script...");

    // Hash password for all seed users (password: Password123!)
    const passwordHash = await bcrypt.hash("Password123!", 10);

    // ======================== SEED USERS ========================
    logger.info("Seeding users...");

    const users = [
      // Admin
      {
        email: "admin@adanehotel.com",
        first_name: "Adane",
        last_name: "Admin",
        phone: "+251911000001",
        role: "admin",
      },
      // Manager
      {
        email: "manager@adanehotel.com",
        first_name: "Selam",
        last_name: "Bekele",
        phone: "+251911000002",
        role: "manager",
      },
      // Receptionist
      {
        email: "reception@adanehotel.com",
        first_name: "Hana",
        last_name: "Tadesse",
        phone: "+251911000003",
        role: "receptionist",
      },
      // Guest users
      {
        email: "guest@adanehotel.com",
        first_name: "Abel",
        last_name: "Kebede",
        phone: "+251911000004",
        role: "guest",
      },
      {
        email: "sarah.m@email.com",
        first_name: "Sarah",
        last_name: "Mohammed",
        phone: "+251922000001",
        role: "guest",
      },
      {
        email: "david.l@email.com",
        first_name: "David",
        last_name: "Lemma",
        phone: "+251922000002",
        role: "guest",
      },
    ];

    for (const user of users) {
      await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, phone, role, is_verified)
         VALUES ($1, $2, $3, $4, $5, $6, true)
         ON CONFLICT (email) DO NOTHING`,
        [user.email, passwordHash, user.first_name, user.last_name, user.phone, user.role]
      );
    }
    logger.success("Users seeded successfully.");

    // ======================== SEED ROOM TYPES ========================
    logger.info("Seeding room types...");
    const roomTypesExist = await client.query("SELECT COUNT(*) FROM room_types");
    if (parseInt(roomTypesExist.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO room_types (name, description, base_price, max_guests, amenities) VALUES
        ('Standard Room', 'Comfortable standard room with all essential amenities', 1500.00, 2,
         '["WiFi","AC","TV","Hot Shower","Wardrobe"]'),
        ('Single Room', 'Cozy single room perfect for solo travelers', 1200.00, 1,
         '["WiFi","AC","TV","Hot Shower"]'),
        ('Deluxe Double Room', 'Spacious deluxe room with premium furnishings', 2500.00, 2,
         '["WiFi","AC","Smart TV","Mini Bar","Hot Shower","Bathtub","Wardrobe","Safe"]'),
        ('Suite Room', 'Luxury suite with separate living area and premium services', 4500.00, 4,
         '["WiFi","AC","Smart TV","Mini Bar","Hot Shower","Bathtub","Living Room","Kitchen","Safe","Butler Service"]')
      `);
      logger.success("Room types seeded.");
    } else {
      logger.info("Room types already exist, skipping.");
    }

    // ======================== SEED ROOMS ========================
    logger.info("Seeding rooms...");
    const roomsExist = await client.query("SELECT COUNT(*) FROM rooms");
    if (parseInt(roomsExist.rows[0].count) === 0) {
      const roomRows = [
        // Floor 1 - Standard & Single
        ['101',1,1],['102',1,1],['103',2,1],['104',1,1],['105',1,1],
        ['106',2,1],['107',1,1],['108',1,1],['109',2,1],['110',1,1],
        // Floor 2 - Standard & Deluxe
        ['201',1,2],['202',3,2],['203',3,2],['204',1,2],['205',1,2],
        ['206',3,2],['207',3,2],['208',1,2],['209',1,2],['210',3,2],
        // Floor 3 - Deluxe & Suite
        ['301',3,3],['302',4,3],['303',4,3],['304',3,3],['305',3,3],
        ['306',4,3],['307',3,3],['308',4,3],['309',3,3],['310',4,3],
        // Floor 4 - Standard & Single
        ['401',1,4],['402',1,4],['403',2,4],['404',1,4],['405',1,4],
        ['406',2,4],['407',1,4],['408',1,4],['409',2,4],['410',1,4],
        // Floor 5 - Deluxe & Suite
        ['501',3,5],['502',3,5],['503',4,5],['504',3,5],['505',3,5],
        ['506',4,5],['507',3,5],['508',4,5],['509',3,5],['510',4,5],
      ];
      for (const [num, typeId, floor] of roomRows) {
        await client.query(
          `INSERT INTO rooms (room_number, room_type_id, floor) VALUES ($1, $2, $3)`,
          [num, typeId, floor]
        );
      }
      logger.success("Rooms seeded.");
    } else {
      logger.info("Rooms already exist, skipping.");
    }

    // ======================== SEED ROOM IMAGES ========================
    logger.info("Seeding room images...");
    const imagesExist = await client.query("SELECT COUNT(*) FROM room_images");
    if (parseInt(imagesExist.rows[0].count) === 0) {
      const roomTypeImages = {
        1: [
          'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1200&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=1200&auto=format&fit=crop'
        ],
        2: [
          'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=1200&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?q=80&w=1200&auto=format&fit=crop'
        ],
        3: [
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1200&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?q=80&w=1200&auto=format&fit=crop'
        ],
        4: [
          'https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=1200&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1591088398332-8a7791972843?q=80&w=1200&auto=format&fit=crop'
        ],
      };

      const rooms = await client.query("SELECT id, room_type_id FROM rooms");
      for (const room of rooms.rows) {
        const urls = roomTypeImages[room.room_type_id] || roomTypeImages[1];
        for (let i = 0; i < urls.length; i++) {
          await client.query(
            `INSERT INTO room_images (room_id, url, is_primary, sort_order) VALUES ($1, $2, $3, $4)`,
            [room.id, urls[i], i === 0, i]
          );
        }
      }
      logger.success("Room images seeded.");
    } else {
      logger.info("Room images already exist, skipping.");
    }

    // ======================== SEED EVENT SPACES ========================
    logger.info("Seeding event spaces...");
    const spacesExist = await client.query("SELECT COUNT(*) FROM event_spaces");
    if (parseInt(spacesExist.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO event_spaces (name, capacity, price_per_hour, amenities) VALUES
        ('Grand Ballroom', 500, 5000.00, '["Stage","Sound System","Projector","AC","Catering Kitchen"]'),
        ('Conference Room A', 50, 1500.00, '["Projector","Whiteboard","AC","WiFi","Video Conferencing"]'),
        ('Garden Terrace', 200, 3000.00, '["Open Air","Lighting","Sound System","Catering Area"]')
      `);
      logger.success("Event spaces seeded.");
    } else {
      logger.info("Event spaces already exist, skipping.");
    }

    // ======================== SEED RESTAURANT RESERVATIONS ========================
    logger.info("Seeding restaurant reservations...");
    const restResExist = await client.query("SELECT COUNT(*) FROM restaurant_reservations");
    if (parseInt(restResExist.rows[0].count) === 0) {
      const guestRes = await client.query("SELECT id FROM users WHERE email = 'guest@adanehotel.com'");
      const guestId = guestRes.rows[0]?.id;
      if (guestId) {
        await client.query(`
          INSERT INTO restaurant_reservations (guest_id, reservation_date, reservation_time, party_size, special_requests, status) VALUES
          ($1, CURRENT_DATE + INTERVAL '1 day', '19:00', 2, 'Window seat preferred', 'pending'),
          ($1, CURRENT_DATE + INTERVAL '2 days', '20:30', 4, 'Anniversary dinner', 'confirmed'),
          ($1, CURRENT_DATE, '18:00', 1, '', 'seated')
        `, [guestId]);
        logger.success("Restaurant reservations seeded.");
      }
    } else {
      logger.info("Restaurant reservations already exist, skipping.");
    }

    logger.success("=== All seed data inserted successfully! ===");
    logger.info("");
    logger.info("  Login credentials for all seed users:");
    logger.info("  Password: Password123!");
    logger.info("");
    logger.info("  admin@adanehotel.com      (Admin)");
    logger.info("  manager@adanehotel.com    (Manager)");
    logger.info("  reception@adanehotel.com  (Receptionist)");
    logger.info("  guest@adanehotel.com      (Guest)");
    logger.info("  sarah.m@email.com         (Guest)");
    logger.info("  david.l@email.com         (Guest)");
    logger.info("");

  } catch (error) {
    logger.error("Seeding failed", {
      message: error.message,
      stack: error.stack,
    });
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

seedData();
