require("dotenv").config();
const app = require("./app");
const { testConnection } = require("./config/db");
const logger = require("./utils/logger");

const PORT = process.env.PORT || 5000;

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
  } catch (error) {
    logger.error("Failed to start server", {
      message: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
};

startServer();
