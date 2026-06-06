require("dotenv").config();
const { pool } = require("../config/db");

const listUsers = async () => {
  try {
    const users = await pool.query(`SELECT id, email, first_name, role FROM users LIMIT 10`);
    const rooms  = await pool.query(`SELECT id, room_number, status FROM rooms LIMIT 10`);

    console.log("\n=== USERS IN DATABASE ===");
    if (users.rows.length === 0) {
      console.log("NO USERS FOUND — you must register first!");
    } else {
      users.rows.forEach(u => console.log(`ID: ${u.id}  Email: ${u.email}  Role: ${u.role}`));
    }

    console.log("\n=== ROOMS IN DATABASE ===");
    if (rooms.rows.length === 0) {
      console.log("NO ROOMS FOUND — add rooms first!");
    } else {
      rooms.rows.forEach(r => console.log(`ID: ${r.id}  Number: ${r.room_number}  Status: ${r.status}`));
    }
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await pool.end();
  }
};

listUsers();
