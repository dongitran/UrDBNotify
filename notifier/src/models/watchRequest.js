const { getDb } = require("../config/database");

async function createWatchRequest(userId, database, table) {
  const watchRequests = getDb().collection("watch_requests");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 240 * 60 * 1000);

  try {
    await watchRequests.updateOne(
      { userId, database, table, expiresAt: { $gt: now } },
      {
        $set: {
          createdAt: now,
          expiresAt: expiresAt,
          status: "active",
        },
      },
      { upsert: true }
    );

    return { expiresAt };
  } catch (error) {
    throw error;
  }
}

async function getActiveWatchRequests(userId) {
  const watchRequests = getDb().collection("watch_requests");
  const now = new Date();
  return await watchRequests
    .find({
      userId,
      expiresAt: { $gt: now },
    })
    .toArray();
}

async function getUserWatchRequestHistory(userId) {
  const watchRequests = getDb().collection("watch_requests");
  return await watchRequests.find({ userId }).toArray();
}

module.exports = {
  createWatchRequest,
  getActiveWatchRequests,
  getUserWatchRequestHistory,
};
