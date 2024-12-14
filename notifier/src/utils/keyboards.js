const { Markup } = require("telegraf");

function createDatabasesKeyboard(databases) {
  const buttons = databases.map((db) =>
    Markup.button.callback(db.database, `database:${db.type}:${db.database}`)
  );

  return Markup.inlineKeyboard(buttons, { columns: 1 });
}

function createTablesKeyboard(dbType, database, tables) {
  const buttons = tables.map((table) =>
    Markup.button.callback(table, `watch:${dbType}:${database}|${table}`)
  );

  return Markup.inlineKeyboard(buttons, { columns: 1 });
}

module.exports = {
  createDatabasesKeyboard,
  createTablesKeyboard,
};
