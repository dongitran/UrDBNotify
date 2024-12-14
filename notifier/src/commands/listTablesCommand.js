const { MongoClient } = require("mongodb");
const { Client } = require("pg");
const { Markup } = require("telegraf");

function createPaginatedTablesKeyboard(dbType, database, tables, page = 1) {
  const BUTTONS_PER_ROW = 2;
  const MAX_ROWS = 20;
  const PAGE_SIZE = BUTTONS_PER_ROW * MAX_ROWS;

  const start = (page - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const currentTables = tables.slice(start, end);

  const buttonRows = [];

  for (let i = 0; i < currentTables.length; i += BUTTONS_PER_ROW) {
    const rowButtons = [];

    if (i < currentTables.length) {
      const table1 = currentTables[i];
      const shortDbType = dbType === "mongodb" ? "m" : "p";
      const displayName = `${table1.slice(0, 40)}`;

      rowButtons.push(
        Markup.button.callback(
          displayName,
          `w:${shortDbType}:${database}:${table1}`.slice(0, 64)
        )
      );
    }

    if (i + 1 < currentTables.length) {
      const table2 = currentTables[i + 1];
      const shortDbType = dbType === "mongodb" ? "m" : "p";
      const displayName = `${table2.slice(0, 40)}`;

      rowButtons.push(
        Markup.button.callback(
          displayName,
          `w:${shortDbType}:${database}:${table2}`.slice(0, 64)
        )
      );
    }

    buttonRows.push(rowButtons);
  }

  const totalPages = Math.ceil(tables.length / PAGE_SIZE);
  const navigationRow = [];

  if (page > 1) {
    navigationRow.push(
      Markup.button.callback("⬅️", `page:${dbType}:${database}:${page - 1}`)
    );
  }

  navigationRow.push(
    Markup.button.callback(`${page}/${totalPages}`, `current:${page}`)
  );

  if (page < totalPages) {
    navigationRow.push(
      Markup.button.callback("➡️", `page:${dbType}:${database}:${page + 1}`)
    );
  }

  buttonRows.push(navigationRow);

  return {
    keyboard: Markup.inlineKeyboard(buttonRows),
    totalPages,
    itemsPerPage: PAGE_SIZE,
  };
}

async function listTablesCommand(
  ctx,
  databaseType,
  databaseName,
  page = 1,
  messageToEdit = null
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

    const { keyboard, totalPages, itemsPerPage } =
      createPaginatedTablesKeyboard(databaseType, databaseName, tables, page);

    const text = 'Select table:';

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
