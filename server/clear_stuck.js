require('dotenv').config();
const { pool } = require('./src/config/db');

pool.query("DELETE FROM reservations WHERE status = 'pending'")
  .then(res => {
    console.log('Deleted ' + res.rowCount + ' stuck pending reservations');
    pool.end();
  })
  .catch(console.error);
