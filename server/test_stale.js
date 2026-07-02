require('dotenv').config();
const { pool } = require('./src/config/db');
pool.query("UPDATE reservations SET created_at = NOW() - INTERVAL '16 minutes' WHERE status = 'pending'").then(r => console.log('Updated', r.rowCount)).catch(console.error).finally(() => process.exit(0));
