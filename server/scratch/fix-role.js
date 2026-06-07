require('dotenv').config();
const { pool } = require('../src/config/db');

async function fixRole() {
  try {
    // Check if user_role type exists
    const typeRes = await pool.query("SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role')");
    console.log('user_role type exists:', typeRes.rows[0].exists);

    // Check if role column exists
    const colRes = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role'");
    console.log('role column exists:', colRes.rows.length > 0);

    if (colRes.rows.length === 0) {
      // Create type if missing
      if (!typeRes.rows[0].exists) {
        await pool.query("CREATE TYPE user_role AS ENUM ('guest', 'receptionist', 'manager', 'admin')");
        console.log('Created user_role type');
      }
      // Add role column
      await pool.query("ALTER TABLE users ADD COLUMN role user_role DEFAULT 'guest'");
      console.log('Added role column to users table');
    } else {
      console.log('role column already exists, nothing to fix');
    }

    // Verify
    const verify = await pool.query("SELECT id, email, role FROM users LIMIT 3");
    console.log('Users with role:', verify.rows);

    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

fixRole();
