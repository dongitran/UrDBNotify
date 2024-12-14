const { getDb } = require("../config/database");
const { createTablesKeyboard } = require("../utils/keyboards");

async function listTablesCommand(ctx, databaseType, databaseName) {
  try {
    const db = getDb();
    const tables = await db
      .collection("database_changes")
      .distinct("table", { database: databaseName });

    const keyboard = createTablesKeyboard(databaseType, databaseName, tables);
    await ctx.reply(`Select a table from ${databaseName}:`, keyboard);
  } catch (error) {
    console.error("List tables error:", error);
    ctx.reply("Error fetching tables. Please try again later.");
  }
}

module.exports = { listTablesCommand };
