const schedule = require("node-schedule");
const { getApprovedUsers } = require("../models/user");
const { getActiveWatchRequests } = require("../models/watchRequest");
const { getDb } = require("../config/database");
const { telegramBot } = require("./telegramBot");
const { formatChangeMessage } = require("../utils/formatters");

async function checkAndNotifyChanges(user, watchRequest) {
  const db = getDb();
  const fiveSecondsAgo = new Date(Date.now() - 5000);

  const changes = await db
    .collection("database_changes")
    .find({
      database: watchRequest.database,
      table: watchRequest.table,
      timestamp: { $gte: fiveSecondsAgo },
    })
    .toArray();

  for (const change of changes) {
    const message = formatChangeMessage(change);
    await telegramBot.telegram.sendMessage(user.chatId, message);
  }
}

async function notificationJob() {
  try {
    const users = await getApprovedUsers();

    for (const user of users) {
      const activeRequests = await getActiveWatchRequests(user.chatId);

      for (const request of activeRequests) {
        await checkAndNotifyChanges(user, request);
      }
    }
  } catch (error) {
    console.error("Notification job error:", error);
  }
}

function startNotificationService() {
  schedule.scheduleJob("*/5 * * * * *", notificationJob);
}

module.exports = { startNotificationService };
