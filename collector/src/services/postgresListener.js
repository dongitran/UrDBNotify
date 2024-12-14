const { Client } = require("pg");
const { sanitizeJson } = require("../utils/sanitizeJson");
const { logDatabaseChange } = require("./mongoLogger");
const logger = require("./logger");

async function handleDatabaseChange(dbName, payload) {
  try {
    const dbChange = {
      source: dbName,
      databaseType: "postgres",
      database: payload.database_name,
      table: payload.table_name,
      action: payload.action,
      data: payload.action === "update" ? payload.new_data : payload.data,
      oldData: payload.old_data,
      metadata: {
        databaseName: payload.database_name,
        tableName: payload.table_name,
        timestamp: new Date(payload.timestamp),
      },
    };

    await logDatabaseChange(sanitizeJson(dbChange));
  } catch (error) {
    logger.error(
      "postgresListener",
      "Error processing database change",
      { error: error.message, stack: error.stack },
      { source: dbName }
    );
    throw error;
  }
}

exports.postgresListener = async (pgConnection) => {
  const client = new Client(pgConnection.config);

  try {
    await client.connect();
    logger.info(
      "postgresListener",
      `Connected to PostgreSQL database: ${pgConnection.name}`
    );

    client.query("LISTEN tbl_changes");

    client.on("notification", async (msg) => {
      try {
        const payload = JSON.parse(msg.payload);
        await handleDatabaseChange(pgConnection.name, payload);
      } catch (error) {
        logger.error(
          "postgresListener",
          `Error handling notification for ${pgConnection.name}`,
          { error: error.message, stack: error.stack },
          { source: pgConnection.name }
        );
      }
    });

    client.on("error", (err) => {
      logger.error(
        "postgresListener",
        `Client error for ${pgConnection.name}`,
        { error: err.message, stack: err.stack },
        { source: pgConnection.name }
      );

      setTimeout(async () => {
        try {
          await client.end();
          await exports.postgresListener(pgConnection);
        } catch (error) {
          logger.error(
            "postgresListener",
            `Failed to reconnect to ${pgConnection.name}`,
            { error: error.message, stack: error.stack },
            { source: pgConnection.name }
          );
        }
      }, 5000);
    });
  } catch (error) {
    logger.error(
      "postgresListener",
      `Failed to set up PostgreSQL listener for ${pgConnection.name}`,
      { error: error.message, stack: error.stack },
      { source: pgConnection.name }
    );
    throw error;
  }
};
