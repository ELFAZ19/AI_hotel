require("dotenv").config();
const app = require("./app");
const { testConnection } = require("./config/db");
const logger = require("./utils/logger");
const { expireStaleReservations } = require("./modules/reservations/reservations.service");

const PORT = process.env.PORT || 5000;

// ---------------------------------------------------------------------------
// Validate required environment variables on startup
// ---------------------------------------------------------------------------
const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET', 'GEMINI_API_KEY'];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length > 0) {
  logger.error(`Missing required environment variables: ${missing.join(', ')}`);
  logger.error('Copy .env.example to .env and fill in the values.');
  process.exit(1);
}

const startServer = async () => {
  try {
    const connectionOk = await testConnection();

    if (!connectionOk) {
      logger.error("Failed to connect to database. Exiting.");
      process.exit(1);
    }

    app.listen(PORT, () => {
      logger.success(`Server running on http://localhost:${PORT}`);
      logger.info(
        `Swagger Docs available at http://localhost:${PORT}/api-docs`,
      );
    });

    // Clean up stale pending reservations on startup
    await expireStaleReservations(15);

    // Run cleanup every 5 minutes
    setInterval(() => expireStaleReservations(15), 5 * 60 * 1000);

  } catch (error) {
    logger.error("Failed to start server", {
      message: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
};

startServer();
