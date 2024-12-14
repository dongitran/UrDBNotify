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

function splitMessageByLimit(messages, limit = 4000) {
  const chunks = [];
  let currentChunk = "";

  for (const message of messages) {
    if (
      currentChunk.length + message.length > limit &&
      currentChunk.length > 0
    ) {
      chunks.push(currentChunk);
      currentChunk = "";
    }

    if (message.length > limit) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk);
        currentChunk = "";
      }

      let remainingMessage = message;
      while (remainingMessage.length > limit) {
        let splitIndex = remainingMessage.lastIndexOf("\n", limit);
        if (splitIndex === -1 || splitIndex > limit) {
          splitIndex = limit;
        }

        chunks.push(remainingMessage.substring(0, splitIndex));
        remainingMessage = remainingMessage.substring(splitIndex);
      }

      if (remainingMessage.length > 0) {
        currentChunk = remainingMessage;
      }
    } else {
      currentChunk += message;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
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

    const changeMessages = [];
    for (const [location, changes] of Object.entries(groupedChanges)) {
      let locationMessage = `🔔 Changes in ${location}\n\n`;

      changes.forEach((change, index) => {
        locationMessage += `Change ${index + 1}:\n`;
        locationMessage += `Action: ${change.action.toUpperCase()}\n`;

        if (change.data) {
          locationMessage += `New Data: \`\`\`json\n${JSON.stringify(
            change.data,
            null,
            2
          )}\n\`\`\`\n`;
        }

        if (change.oldData) {
          locationMessage += `Old Data: \`\`\`json\n${JSON.stringify(
            change.oldData,
            null,
            2
          )}\n\`\`\`\n`;
        }
      });

      changeMessages.push(locationMessage);
    }

    const messageChunks = splitMessageByLimit(changeMessages);

    for (const chunk of messageChunks) {
      try {
        await telegramBot.telegram.sendMessage(userId, chunk, {
          parse_mode: "Markdown",
        });
      } catch (error) {
        console.error(`Failed to send notification to user ${userId}:`, error);

        try {
          const plainMessage = chunk
            .replace(/```json\n/g, "")
            .replace(/```/g, "");
          await telegramBot.telegram.sendMessage(userId, plainMessage);
        } catch (retryError) {
          console.error(
            `Failed to send plain notification to user ${userId}:`,
            retryError
          );
        }
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
