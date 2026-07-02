require('dotenv').config();
const { pool } = require('./src/config/db');

async function run() {
  const res = await pool.query('SELECT * FROM reservations');
  console.log(res.rows);
  process.exit();
}
run();
