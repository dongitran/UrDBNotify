const schedule = require("node-schedule");
const { getDb } = require("../config/database");
const { telegramBot } = require("./telegramBot");
const { formatChangeMessage } = require("../utils/formatters");

async function getActiveWatchRequestsByUser() {
  const db = getDb();
  const now = new Date();

  const watchRequests = await db
    .collection("watch_requests")
    .find({
      expiresAt: { $gt: now },
    })
    .toArray();
  console.log(watchRequests, "watchRequests");

  const groupedRequests = watchRequests.reduce((acc, request) => {
    if (!acc[request.userId]) {
      acc[request.userId] = [];
    }
    acc[request.userId].push({
      database: request.database,
      table: request.table,
    });
    return acc;
  }, {});

  return groupedRequests;
}

async function getRecentDatabaseChanges(database, table, timeWindow) {
  const db = getDb();
  const startTime = new Date(Date.now() - timeWindow);

  return await db
    .collection("database_changes")
    .find({
      database: database,
      table: table,
      timestamp: { $gte: startTime },
    })
    .toArray();
}

async function processUserChanges(userId, watchedTables) {
  const TIME_WINDOW = 5000;
  let allChanges = [];

  for (const { database, table } of watchedTables) {
    const changes = await getRecentDatabaseChanges(
      database,
      table,
      TIME_WINDOW
    );
    allChanges = allChanges.concat(changes);
  }

  if (allChanges.length > 0) {
    allChanges.sort((a, b) => a.timestamp - b.timestamp);

    const groupedChanges = allChanges.reduce((acc, change) => {
      const key = `${change.database}.${change.table}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(change);
      return acc;
    }, {});

    for (const [location, changes] of Object.entries(groupedChanges)) {
      let message = `🔔 Changes in ${location}\n\n`;

      changes.forEach((change, index) => {
        message += `Change ${index + 1}:\n`;
        message += `Action: ${change.action.toUpperCase()}\n`;

        if (change.data) {
          message += `New Data: \`\`\`json\n${JSON.stringify(
            change.data,
            null,
            2
          )}\n\`\`\`\n`;
        }

        if (change.oldData) {
          message += `Old Data: \`\`\`json\n${JSON.stringify(
            change.oldData,
            null,
            2
          )}\n\`\`\`\n`;
        }

        message += "\n";
      });

      try {
        await telegramBot.telegram.sendMessage(userId, message, {
          parse_mode: "Markdown",
        });
      } catch (error) {
        console.error(`Failed to send notification to user ${userId}:`, error);
      }
    }
  }
}

async function notificationJob() {
  try {
    const userWatchRequests = await getActiveWatchRequestsByUser();

    for (const [userId, watchedTables] of Object.entries(userWatchRequests)) {
      await processUserChanges(userId, watchedTables);
    }
  } catch (error) {
    console.error("Notification job error:", error);
  }
}

function startNotificationService() {
  schedule.scheduleJob("*/5 * * * * *", notificationJob);
}

module.exports = { startNotificationService };
