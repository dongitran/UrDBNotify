const { Client } = require("pg");
const { sanitizeJson } = require("../utils/sanitizeJson");
const { logDatabaseChange } = require("./mongoLogger");
const logger = require("./logger");

const REMOVED_FIELDS = (
  process.env.REMOVED_FIELDS ||
  "secret_key,public_key,number_details,uuid,alias_number,app_public_key,address,locale,citizen_identity,deleted_at,deleted_by,alias_id,shorten_link_balance,number_details,server_payment_password,app_payment_password"
).split(",");

function removeSensitiveData(data) {
  if (!data || typeof data !== "object") {
    return data;
  }

  const sanitizedData = Array.isArray(data) ? [...data] : { ...data };

  REMOVED_FIELDS.forEach((field) => {
    delete sanitizedData[field.trim()];
  });

  Object.keys(sanitizedData).forEach((key) => {
    if (typeof sanitizedData[key] === "object" && sanitizedData[key] !== null) {
      sanitizedData[key] = removeSensitiveData(sanitizedData[key]);
    }
  });

  return sanitizedData;
}

async function handleDatabaseChange(dbName, payload) {
  try {
    const rawData =
      payload.action === "update" ? payload.new_data : payload.data;
    const sanitizedData = removeSensitiveData(rawData);
    const sanitizedOldData = payload.old_data
      ? removeSensitiveData(payload.old_data)
      : undefined;

    const dbChange = {
      source: dbName,
      databaseType: "postgres",
      database: payload.database_name,
      table: payload.table_name,
      action: payload.action,
      data: sanitizedData,
      oldData: sanitizedOldData,
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
