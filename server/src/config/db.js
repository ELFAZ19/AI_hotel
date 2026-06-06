const { Pool } = require("pg");
const logger = require("../utils/logger");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const query = async (text, params) => {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    logger.error("Database query error", {
      message: error.message,
      query: text,
    });
    throw error;
  }
};

const testConnection = async () => {
  try {
    const result = await pool.query("SELECT NOW()");
    logger.success("Database connection successful");
    return true;
  } catch (error) {
    logger.error("Database connection failed", { message: error.message });
    return false;
  }
};

module.exports = {
  pool,
  query,
  testConnection,
};
