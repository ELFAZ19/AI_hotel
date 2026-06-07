require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../src/config/db');

async function seedAdmin() {
  try {
    const hash = await bcrypt.hash('adminpassword', 12);
    const res = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, role, is_verified)
       VALUES ('admin@adanehotel.com', $1, 'Admin', 'User', '0900000000', 'admin', true)
       ON CONFLICT (email) DO UPDATE SET role = 'admin', password_hash = $1
       RETURNING id, email, role`,
      [hash]
    );
    console.log('Admin user:', res.rows[0]);

    // Also make the existing user a guest for testing
    const guestHash = await bcrypt.hash('password123', 12);
    const guestRes = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, role, is_verified)
       VALUES ('john@example.com', $1, 'John', 'Doe', '0912345678', 'guest', true)
       ON CONFLICT (email) DO UPDATE SET role = 'guest', password_hash = $1
       RETURNING id, email, role`,
      [guestHash]
    );
    console.log('Guest user:', guestRes.rows[0]);

    process.exit(0);
  } catch(e) {
    console.error(e.message);
    process.exit(1);
  }
}
seedAdmin();
