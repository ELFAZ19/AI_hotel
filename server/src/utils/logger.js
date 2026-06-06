const fs = require("fs");
const path = require("path");

const logsDir = path.join(__dirname, "../../logs");

// Ensure logs directory exists
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFile = path.join(logsDir, "log.json");

// Initialize or read existing logs
const initializeLogs = () => {
  if (!fs.existsSync(logFile)) {
    fs.writeFileSync(logFile, JSON.stringify([], null, 2));
  }
};

// Clean up logs older than 7 days
const cleanupOldLogs = () => {
  try {
    if (!fs.existsSync(logFile)) return;

    let logs = JSON.parse(fs.readFileSync(logFile, "utf-8"));
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    logs = logs.filter(
      (log) => new Date(log.timestamp).getTime() > sevenDaysAgo,
    );

    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error("Error cleaning up old logs:", error.message);
  }
};

// Log to file
const log = (level, message, details = null) => {
  try {
    initializeLogs();
    cleanupOldLogs();

    let logs = JSON.parse(fs.readFileSync(logFile, "utf-8"));

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(details && { details }),
    };

    logs.push(logEntry);

    // Keep only last 10000 entries to prevent file from getting too large
    if (logs.length > 10000) {
      logs = logs.slice(-10000);
    }

    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));

    // Also log to console
    const prefix = `[${level}]`;
    console.log(`${prefix} ${message}`, details ? details : "");
  } catch (error) {
    console.error("Error writing to log file:", error.message);
  }
};

module.exports = {
  info: (message, details) => log("INFO", message, details),
  error: (message, details) => log("ERROR", message, details),
  warn: (message, details) => log("WARN", message, details),
  debug: (message, details) => log("DEBUG", message, details),
  success: (message, details) => log("SUCCESS", message, details),
};
