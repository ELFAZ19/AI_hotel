require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { pool } = require("../config/db");
const logger = require("./logger");

const runMigrations = async () => {
  try {
    const migrationsDir = path.join(__dirname, "../../migrations");
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith(".sql")).sort();

    logger.info("Running database migrations...");
    for (const file of files) {
      const migrationPath = path.join(migrationsDir, file);
      const migration = fs.readFileSync(migrationPath, "utf-8");
      logger.info(`Running ${file}...`);
      await pool.query(migration);
      logger.success(`${file} completed successfully.`);
    }
    logger.success("All database migrations completed successfully");
    await pool.end();
  } catch (error) {
    logger.error("Migration failed", {
      message: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
};

runMigrations();
