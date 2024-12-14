const { MongoClient } = require("mongodb");
const { sanitizeJson } = require("../utils/sanitizeJson");
const { logDatabaseChange } = require("./mongoLogger");

exports.mongoListener = async (mongoConnection) => {
  const sourceClient = new MongoClient(mongoConnection.url);
  let changeStream;

  async function startListening() {
    try {
      await sourceClient.connect();
      console.log(`Connected to MongoDB: ${mongoConnection.name}`);

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
              return;
          }

          await logDatabaseChange(sanitizeJson(dbChange));
        } catch (error) {
          console.error(
            `Error handling change for ${mongoConnection.name}:`,
            error
          );
        }
      });

      changeStream.on("error", async (error) => {
        console.error(
          `MongoDB change stream error for ${mongoConnection.name}:`,
          error
        );
        await handleReconnection();
      });

      changeStream.on("end", async () => {
        console.log(`Change stream ended for ${mongoConnection.name}`);
        await handleReconnection();
      });
    } catch (error) {
      console.error(
        `Failed to set up MongoDB listener for ${mongoConnection.name}:`,
        error
      );
      await handleReconnection();
    }
  }

  async function handleReconnection() {
    console.log(`Attempting to reconnect to ${mongoConnection.name}...`);
    try {
      if (changeStream) {
        await changeStream.close();
      }
      if (sourceClient) {
        await sourceClient.close();
      }
    } catch (error) {
      console.error(
        `Error closing connections for ${mongoConnection.name}:`,
        error
      );
    }

    setTimeout(async () => {
      try {
        await startListening();
      } catch (error) {
        console.error(
          `Reconnection attempt failed for ${mongoConnection.name}:`,
          error
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
      console.error(`Error during cleanup for ${mongoConnection.name}:`, error);
    }
  };
};
