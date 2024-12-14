const { MongoClient } = require("mongodb");
const { Client } = require("pg");
const { createPaginatedTablesKeyboard } = require("../utils/keyboards");
const { getUserSelections } = require("../services/userSelections");

async function listTablesCommand(
  ctx,
  databaseType,
  databaseName,
  page = 1,
  messageToEdit = null,
  selections = null
) {
  try {
    const config = getDatabaseConfig(databaseType, databaseName);
    if (!config) {
      return ctx.reply(`Database configuration not found for ${databaseName}`);
    }

    let tables;
    if (databaseType === "mongodb") {
      tables = await getMongoCollections(config);
    } else if (databaseType === "postgres") {
      tables = await getPostgresTables(config);
    } else {
      return ctx.reply("Unsupported database type");
    }

    if (!tables || tables.length === 0) {
      return ctx.reply(`No tables/collections found in ${databaseName}`);
    }

    const currentSelections =
      selections ||
      (await getUserSelections(ctx.from.id, databaseType, databaseName));
    const { keyboard, totalPages, itemsPerPage } =
      createPaginatedTablesKeyboard(
        databaseType,
        databaseName,
        tables,
        currentSelections,
        page
      );

    const text = "Select tables to watch:";

    if (messageToEdit) {
      return ctx.telegram.editMessageText(
        ctx.chat.id,
        messageToEdit,
        null,
        text,
        keyboard
      );
    } else {
      return ctx.reply(text, keyboard);
    }
  } catch (error) {
    console.error("List tables error:", error);
    ctx.reply(`Error fetching tables from ${databaseName}: ${error.message}`);
  }
}

function getDatabaseConfig(databaseType, databaseName) {
  if (databaseType === "mongodb") {
    const mongoConnections = process.env.MONGO_CONNECTIONS?.split(",") || [];
    const connection = mongoConnections.find((conn) => {
      const [, , dbName] = conn.split("|");
      return dbName === databaseName;
    });
    if (!connection) return null;

    const [, connectionString] = connection.split("|");
    return { connectionString, databaseName };
  } else if (databaseType === "postgres") {
    const pgConnections = process.env.POSTGRES_CONNECTIONS?.split(",") || [];
    const connection = pgConnections.find((conn) => {
      const [name, host, port, database, user, password] = conn.split("|");
      return database === databaseName;
    });
    if (!connection) return null;

    const [, host, port, database, user, password] = connection.split("|");
    return { host, port, database, user, password };
  }
  return null;
}

async function getMongoCollections(config) {
  const client = new MongoClient(config.connectionString);
  try {
    await client.connect();
    const db = client.db(config.databaseName);
    const collections = await db.listCollections().toArray();
    return collections.map((collection) => collection.name);
  } finally {
    await client.close();
  }
}

async function getPostgresTables(config) {
  const client = new Client({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
  });

  try {
    await client.connect();
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    `);
    return result.rows.map((row) => row.table_name);
  } finally {
    await client.end();
  }
}

module.exports = { listTablesCommand };
