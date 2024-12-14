const { MongoClient } = require("mongodb");
const { sanitizeJson } = require("../utils/sanitizeJson");
const { logDatabaseChange } = require("./mongoLogger");
const logger = require("./logger");

exports.mongoListener = async (mongoConnection) => {
  const sourceClient = new MongoClient(mongoConnection.url);
  let changeStream;

  async function startListening() {
    try {
      await sourceClient.connect();
      logger.info(
        "mongoListener",
        `Connected to MongoDB: ${mongoConnection.name}`
      );

      const database = sourceClient.db(mongoConnection.database);
      changeStream = database.watch();

      changeStream.on("change", async (change) => {
        try {
          const dbChange = {
            source: mongoConnection.name,
            databaseType: "mongodb",
            database: mongoConnection.database,
            collection: change.ns.coll,
            action: change.operationType,
            data: null,
            oldData: null,
            metadata: {
              databaseName: mongoConnection.database,
              collectionName: change.ns.coll,
              documentId: change.documentKey._id,
            },
          };

          switch (change.operationType) {
            case "insert":
              dbChange.data = change.fullDocument;
              break;

            case "update":
              dbChange.data = {
                _id: change.documentKey._id,
                ...change.updateDescription.updatedFields,
              };
              dbChange.oldData = change.updateDescription.removedFields
                ? { removedFields: change.updateDescription.removedFields }
                : null;
              break;

            case "replace":
              dbChange.data = change.fullDocument;
              break;

            case "delete":
              dbChange.data = change.documentKey;
              break;

            default:
              logger.warn(
                "mongoListener",
                `Unhandled operation type: ${change.operationType}`,
                { change }
              );
              return;
          }

          await logDatabaseChange(sanitizeJson(dbChange));
        } catch (error) {
          logger.error(
            "mongoListener",
            `Error handling change for ${mongoConnection.name}`,
            { error: error.message, stack: error.stack },
            { source: mongoConnection.name, database: mongoConnection.database }
          );
        }
      });

      changeStream.on("error", async (error) => {
        logger.error(
          "mongoListener",
          `Change stream error for ${mongoConnection.name}`,
          { error: error.message, stack: error.stack },
          { source: mongoConnection.name, database: mongoConnection.database }
        );
        await handleReconnection();
      });

      changeStream.on("end", async () => {
        logger.info(
          "mongoListener",
          `Change stream ended for ${mongoConnection.name}`
        );
        await handleReconnection();
      });
    } catch (error) {
      logger.error(
        "mongoListener",
        `Failed to set up MongoDB listener for ${mongoConnection.name}`,
        { error: error.message, stack: error.stack },
        { source: mongoConnection.name }
      );
      await handleReconnection();
    }
  }

  async function handleReconnection() {
    logger.info(
      "mongoListener",
      `Attempting to reconnect to ${mongoConnection.name}`
    );
    try {
      if (changeStream) {
        await changeStream.close();
      }
      if (sourceClient) {
        await sourceClient.close();
      }
    } catch (error) {
      logger.error(
        "mongoListener",
        `Error closing connections for ${mongoConnection.name}`,
        { error: error.message, stack: error.stack },
        { source: mongoConnection.name }
      );
    }

    setTimeout(async () => {
      try {
        await startListening();
      } catch (error) {
        logger.error(
          "mongoListener",
          `Reconnection attempt failed for ${mongoConnection.name}`,
          { error: error.message, stack: error.stack },
          { source: mongoConnection.name }
        );
        await handleReconnection();
      }
    }, 5000);
  }

  await startListening();

  return async () => {
    try {
      if (changeStream) {
        await changeStream.close();
      }
      if (sourceClient) {
        await sourceClient.close();
      }
    } catch (error) {
      logger.error(
        "mongoListener",
        `Error during cleanup for ${mongoConnection.name}`,
        { error: error.message, stack: error.stack },
        { source: mongoConnection.name }
      );
    }
  };
};
