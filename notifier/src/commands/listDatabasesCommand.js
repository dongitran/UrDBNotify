const { createDatabasesKeyboard } = require("../utils/keyboards");
const { getActivatedDatabases } = require("../models/activiyScanner");

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

async function listDatabasesCommand(ctx, messageToEdit = null) {
  const method = ctx.session?.method || "normal";

  let databases = [];
  try {
    switch (method) {
      case "normal":
        databases = parseConnections();
        break;
      case "smart":
        databases = await getActivatedDatabases();
        break;
      default:
        return ctx.reply("Invalid method selected.");
    }

    if (databases.length === 0) {
      return ctx.reply("No databases are configured for monitoring.");
    }

    const keyboard = createDatabasesKeyboard(databases);
    const text = "Select a database to watch:";

    if (messageToEdit) {
      return ctx.telegram.editMessageText(
        ctx.chat.id,
        messageToEdit,
        null,
        text,
        keyboard
      );
    }

    await ctx.reply(text, keyboard);
  } catch (error) {
    console.error("List databases error:", error);
    ctx.reply("Error fetching databases. Please try again later.");
  }
}

module.exports = { listDatabasesCommand };
