const { MongoClient } = require("mongodb");

let client;
let db;

async function connectToMongoDB() {
  try {
    client = new MongoClient(process.env.MONGO_URL);
    await client.connect();
    db = client.db(process.env.MONGO_DB);

    await setupCollections();
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

async function setupCollections() {
  const activityScanners = db.collection(process.env.MONGO_ACTIVITY_SCANNER_COLLECTION);
  await activityScanners.createIndex({ table: 1,});
  await activityScanners.createIndex({ database: 1 });
  await activityScanners.createIndex({ timestamp: 1 });
  await activityScanners.createIndex({ type: 1 });
}

function getDb() {
  if (!db) {
    throw new Error("Database not initialized");
  }
  return db;
}

module.exports = {
  connectToMongoDB,
  getDb,
};
