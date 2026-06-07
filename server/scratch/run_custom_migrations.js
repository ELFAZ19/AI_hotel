const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { pool } = require("../src/config/db");

const run = async () => {
  try {
    const migrationsDir = path.join(__dirname, "../migrations");
    const files = ["009_audit_logs.sql", "010_payments.sql"];
    
    for (const file of files) {
      const migrationPath = path.join(migrationsDir, file);
      if (fs.existsSync(migrationPath)) {
        console.log(`Running ${file}...`);
        const migration = fs.readFileSync(migrationPath, "utf-8");
        await pool.query(migration);
        console.log(`${file} completed successfully.`);
      }
    }
    await pool.end();
  } catch (error) {
    console.error("Migration failed", error);
    process.exit(1);
  }
};
run();
