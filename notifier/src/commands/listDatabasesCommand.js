const { createDatabasesKeyboard } = require("../utils/keyboards");

function parseConnections() {
  const databases = [];

  const pgConnections = process.env.POSTGRES_CONNECTIONS?.split(",") || [];
  for (const conn of pgConnections) {
    const [name, , , database] = conn.split("|");
    if (name && database) {
      databases.push({
        name: `${name} (PostgreSQL)`,
        type: "postgres",
        database,
      });
    }
  }

  const mongoConnections = process.env.MONGO_CONNECTIONS?.split(",") || [];
  for (const conn of mongoConnections) {
    const [name, , database] = conn.split("|");
    if (name && database) {
      databases.push({
        name: `${name} (MongoDB)`,
        type: "mongodb",
        database,
      });
    }
  }

  return databases;
}

async function listDatabasesCommand(ctx) {
  try {
    const databases = parseConnections();

    if (databases.length === 0) {
      return ctx.reply("No databases are configured for monitoring.");
    }

    const keyboard = createDatabasesKeyboard(databases);
    await ctx.reply("Select a database to watch:", keyboard);
  } catch (error) {
    console.error("List databases error:", error);
    ctx.reply("Error fetching databases. Please try again later.");
  }
}

module.exports = { listDatabasesCommand };
