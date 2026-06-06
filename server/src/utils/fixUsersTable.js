require("dotenv").config();
const { pool } = require("../config/db");

const fix = async () => {
  try {
    await pool.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
              CREATE TYPE user_role AS ENUM ('guest', 'receptionist', 'manager', 'admin');
          END IF;
      END$$;
    `);
    
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'guest',
      ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS phone VARCHAR(20)
    `);
    
    console.log("Users table updated successfully.");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
};

fix();
