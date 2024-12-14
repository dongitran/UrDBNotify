const { MongoClient } = require("mongodb");
let client;

const LOG_LEVELS = {
  ERROR: "error",
  WARN: "warn",
  INFO: "info",
  DEBUG: "debug",
};

const LOG_SCHEMA = {
  timestamp: Date,
  level: String,
  service: String,
  message: String,
  details: Object,
  metadata: {
    source: String,
    database: String,
    error: Object,
  },
};

async function initLogger() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_LOGGER_URL);
    await client.connect();

    const db = client.db(process.env.MONGO_LOGGER_DB);
    const collection = db.collection("logs");

    await collection.createIndex({ timestamp: 1 });
    await collection.createIndex({ level: 1 });
    await collection.createIndex({ service: 1 });
    await collection.createIndex({ "metadata.source": 1 });
  }
  return client;
}

async function log(level, service, message, details = {}, metadata = {}) {
  try {
    const client = await initLogger();
    const db = client.db(process.env.MONGO_LOGGER_DB);
    const collection = db.collection("logs");

    const logEntry = {
      timestamp: new Date(),
      level,
      service,
      message,
      details,
      metadata,
    };

    await collection.insertOne(logEntry);

    if (level === LOG_LEVELS.ERROR) {
      console.error(`[${service}] ${message}`, details);
    } else {
      console.log(`[${service}] ${message}`);
    }
  } catch (error) {
    console.error("Failed to write log:", error);
  }
}

module.exports = {
  LOG_LEVELS,
  log,
  error: (service, message, details = {}, metadata = {}) =>
    log(LOG_LEVELS.ERROR, service, message, details, metadata),
  warn: (service, message, details = {}, metadata = {}) =>
    log(LOG_LEVELS.WARN, service, message, details, metadata),
  info: (service, message, details = {}, metadata = {}) =>
    log(LOG_LEVELS.INFO, service, message, details, metadata),
  debug: (service, message, details = {}, metadata = {}) =>
    log(LOG_LEVELS.DEBUG, service, message, details, metadata),
};
