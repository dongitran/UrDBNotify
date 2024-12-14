const { MongoClient } = require("mongodb");
let client;

const CHANGE_SCHEMA = {
  timestamp: Date,
  source: String,
  databaseType: String,
  database: String,
  table: String,
  collection: String,
  action: String,
  data: Object,
  oldData: Object,
  metadata: {
    databaseName: String,
    tableName: String,
    collectionName: String,
    documentId: String,
    timestamp: Date,
  },
};

async function initMongoLogger() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_LOGGER_URL);
    await client.connect();

    const db = client.db(process.env.MONGO_LOGGER_DB);
    const collection = db.collection(process.env.MONGO_LOGGER_COLLECTION);

    await collection.createIndex({ database: 1, table: 1 });
    await collection.createIndex({ database: 1, collection: 1 });
    await collection.createIndex({ timestamp: 1 });
    await collection.createIndex({ databaseType: 1 });
  }
  return client;
}

async function logDatabaseChange(change) {
  try {
    const client = await initMongoLogger();
    const db = client.db(process.env.MONGO_LOGGER_DB);
    const collection = db.collection(process.env.MONGO_LOGGER_COLLECTION);

    const dbChange = {
      timestamp: new Date(),
      source: change.source || null,
      databaseType: change.databaseType || null,
      database: change.database || null,
      table: change.table || null,
      collection: change.collection || null,
      action: change.action || null,
      data: change.data || null,
      oldData: change.oldData || null,
      metadata: {
        databaseName: change.metadata?.databaseName || null,
        tableName: change.metadata?.tableName || null,
        collectionName: change.metadata?.collectionName || null,
        documentId: change.metadata?.documentId || null,
        timestamp: change.metadata?.timestamp || new Date(),
      },
    };

    await collection.insertOne(dbChange);
  } catch (error) {
    console.error("Error logging database change:", error);
    throw error;
  }
}

module.exports = {
  initMongoLogger,
  logDatabaseChange,
  CHANGE_SCHEMA,
};
