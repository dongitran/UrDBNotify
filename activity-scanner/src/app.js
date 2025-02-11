require("dotenv").config();
const schedule = require("node-schedule");
const { connectToMongoDB } = require("./config/database");
const {scanTables} = require("./services/scanTables");

async function start() {
  try {
    await connectToMongoDB();
    await scanTables();
    startCleanupJob();

    console.log("Successfully scan tables");
  } catch (error) {
    console.error("Failed to start application:", error);
    process.exit(1);
  }
}

start();

function startCleanupJob() {
  schedule.scheduleJob("*/60 * * * * *", async () => {
    try {
      await scanTables();
    } catch (error) {
      console.error("Cleanup job error:", error);
    }
  });
}
