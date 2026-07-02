require('dotenv').config();
const { pool } = require('./src/config/db');

async function main() {
  // Test the expireStaleReservations SQL
  console.log('Testing interval SQL...');
  const test = await pool.query(
    `SELECT ($1 || ' minutes')::INTERVAL AS interval_val`,
    [15]
  );
  console.log('Interval result:', test.rows[0]);
  
  // Run expireStaleReservations manually and see what happens
  const result = await pool.query(
    `UPDATE reservations
     SET status = 'cancelled',
         cancelled_at = NOW(),
         cancellation_note = 'Auto-cancelled: payment not completed within time limit',
         updated_at = NOW()
     WHERE status = 'pending'
       AND created_at < NOW() - ($1 || ' minutes')::INTERVAL
     RETURNING id, status, created_at`,
    [15]
  );
  console.log(`\nAuto-cancelled ${result.rowCount} reservations:`);
  console.log(JSON.stringify(result.rows, null, 2));
  
  process.exit(0);
}

main().catch(e => { console.error('Error:', e.message, e.detail || ''); process.exit(1); });
