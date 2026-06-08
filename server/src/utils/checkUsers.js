require("dotenv").config();
const { pool } = require("../config/db");

const checkUsers = async () => {
  try {
    const res = await pool.query("SELECT email, password_hash, role FROM users");
    console.log("Users in DB:");
    console.table(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
};

checkUsers();
