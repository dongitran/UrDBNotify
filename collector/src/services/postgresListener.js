const { Client } = require("pg");
const { sanitizeJson } = require("../utils/sanitizeJson");
const { logDatabaseChange } = require("./mongoLogger");

async function handleDatabaseChange(dbName, payload) {
  console.log(payload, "payloadpayload");
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

  console.log(dbChange, "dbChangedbChange");

  await logDatabaseChange(sanitizeJson(dbChange));
}

exports.postgresListener = async (pgConnection) => {
  const client = new Client(pgConnection.config);

  try {
    await client.connect();
    console.log(`Connected to PostgreSQL database: ${pgConnection.name}`);

    client.query("LISTEN tbl_changes");

    client.on("notification", async (msg) => {
      try {
        const payload = JSON.parse(msg.payload);
        await handleDatabaseChange(pgConnection.name, payload);
      } catch (error) {
        console.error(
          `Error handling notification for ${pgConnection.name}:`,
          error
        );
      }
    });

    client.on("error", (err) => {
      console.error(`PostgreSQL client error for ${pgConnection.name}:`, err);
      setTimeout(async () => {
        try {
          await client.end();
          await exports.postgresListener(pgConnection);
        } catch (error) {
          console.error(`Failed to reconnect to ${pgConnection.name}:`, error);
        }
      }, 5000);
    });
  } catch (error) {
    console.error(
      `Failed to set up PostgreSQL listener for ${pgConnection.name}:`,
      error
    );
    throw error;
  }
};
