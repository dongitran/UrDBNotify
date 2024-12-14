const { MongoClient } = require("mongodb");
let client;

async function initMongoLogger() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_LOGGER_URL);
    await client.connect();
  }
  return client;
}

async function logDatabaseChange(change) {
  try {
    const client = await initMongoLogger();
    const db = client.db(process.env.MONGO_LOGGER_DB);
    const collection = db.collection(process.env.MONGO_LOGGER_COLLECTION);

    await collection.insertOne({
      ...change,
      loggedAt: new Date(),
    });
  } catch (error) {
    console.error("Error logging database change:", error);
    throw error;
  }
}

module.exports = {
  initMongoLogger,
  logDatabaseChange,
};
