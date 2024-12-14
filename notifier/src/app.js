require("dotenv").config();
const { telegramBot } = require("./services/telegramBot");
const schedule = require("node-schedule");
const { startNotificationService } = require("./services/notificationService");
const { connectToMongoDB } = require("./config/database");
const { cleanupExpiredSelections } = require("./services/userSelections");

async function start() {
  try {
    await connectToMongoDB();
    startNotificationService();
    startCleanupJob();
    await telegramBot.launch();

    console.log("Bot is running...");
  } catch (error) {
    console.error("Failed to start application:", error);
    process.exit(1);
  }
}

start();

function startCleanupJob() {
  schedule.scheduleJob("*/15 * * * *", async () => {
    try {
      await cleanupExpiredSelections();
    } catch (error) {
      console.error("Cleanup job error:", error);
    }
  });
}

process.once("SIGINT", () => telegramBot.stop("SIGINT"));
process.once("SIGTERM", () => telegramBot.stop("SIGTERM"));
