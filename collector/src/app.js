require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const { MongoClient } = require("mongodb");
const { postgresListener } = require("./services/postgresListener");
const { mongoListener } = require("./services/mongoListener");
const { config } = require("./config/database");

const app = express();
app.use(morgan("dev"));
app.use(express.json());

let loggerClient;

async function initializeLogger() {
  loggerClient = new MongoClient(config.logger.url);
  await loggerClient.connect();
  console.log("Connected to Logger MongoDB");
  return loggerClient.db(config.logger.database);
}

async function startListeners() {
  await initializeLogger();

  for (const pgConn of config.postgres) {
    try {
      await postgresListener(pgConn);
      console.log(`PostgreSQL listener started for ${pgConn.name}`);
    } catch (error) {
      console.error(
        `Failed to start PostgreSQL listener for ${pgConn.name}:`,
        error
      );
    }
  }

  for (const mongoConn of config.mongodb) {
    try {
      await mongoListener(mongoConn);
      console.log(`MongoDB listener started for ${mongoConn.name}`);
    } catch (error) {
      console.error(
        `Failed to start MongoDB listener for ${mongoConn.name}:`,
        error
      );
    }
  }
}

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

startListeners().catch(console.error);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on("SIGTERM", async () => {
  if (loggerClient) {
    await loggerClient.close();
  }
  process.exit(0);
});
