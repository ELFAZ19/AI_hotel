require("dotenv").config();
const { pool } = require("../config/db");
const logger = require("./logger");

const resetDb = async () => {
  try {
    logger.info("Dropping all tables to reset database...");
    await pool.query("DROP SCHEMA public CASCADE;");
    await pool.query("CREATE SCHEMA public;");
    await pool.query("GRANT ALL ON SCHEMA public TO public;");
    logger.success("Database reset successfully. You can now run migrations.");
    await pool.end();
  } catch (error) {
    logger.error("Reset failed", { message: error.message });
    process.exit(1);
  }
};

resetDb();
