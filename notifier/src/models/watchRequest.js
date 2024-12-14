const { getDb } = require("../config/database");

async function createWatchRequest(userId, database, table) {
  const watchRequests = getDb().collection("watch_requests");

  return await watchRequests.insertOne({
    userId,
    database,
    table,
    createdAt: new Date(),
  });
}

async function getUserWatchRequests(userId) {
  const watchRequests = getDb().collection("watch_requests");
  return await watchRequests.find({ userId }).toArray();
}

async function removeWatchRequest(userId, database, table) {
  const watchRequests = getDb().collection("watch_requests");
  return await watchRequests.deleteOne({ userId, database, table });
}

module.exports = {
  createWatchRequest,
  getUserWatchRequests,
  removeWatchRequest,
};
