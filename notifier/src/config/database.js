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
  const users = db.collection("users");
  await users.createIndex({ chatId: 1 }, { unique: true });
  await users.createIndex({ status: 1 });

  const watchRequests = db.collection("watch_requests");
  await watchRequests.createIndex({ userId: 1 });
  await watchRequests.createIndex({ database: 1, table: 1 });
  await watchRequests.createIndex({ createdAt: 1 });
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
