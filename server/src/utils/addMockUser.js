require("dotenv").config();
const { pool } = require("../config/db");

const addMockUser = async () => {
  try {
    const res = await pool.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, phone, role, is_verified)
      VALUES ('guest@example.com', 'dummyhash', 'Test', 'Guest', '1234567890', 'guest', true)
      ON CONFLICT (email) DO UPDATE SET first_name = 'Test'
      RETURNING id;
    `);
    console.log("Mock guest_id:", res.rows[0].id);
  } catch (error) {
    console.error("Error adding mock user:", error);
  } finally {
    await pool.end();
  }
};

addMockUser();
