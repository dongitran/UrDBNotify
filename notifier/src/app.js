require("dotenv").config();
const { telegramBot } = require("./services/telegramBot");
const { startNotificationService } = require("./services/notificationService");
const { connectToMongoDB } = require("./config/database");

async function start() {
  try {
    await connectToMongoDB();
    await telegramBot.launch();
    startNotificationService();

    console.log("Bot is running...");
  } catch (error) {
    console.error("Failed to start application:", error);
    process.exit(1);
  }
}

start();

process.once("SIGINT", () => telegramBot.stop("SIGINT"));
process.once("SIGTERM", () => telegramBot.stop("SIGTERM"));
