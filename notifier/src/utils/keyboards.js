const { Markup } = require("telegraf");

function createMethodsKeyboard(methods) {
    const buttons = methods.map((method) =>
        Markup.button.callback(method.name, `method:${method.key}`)
    );

    return Markup.inlineKeyboard(buttons, { columns: 1 });
}

function createDatabasesKeyboard(databases) {
  const buttons = databases.map((db) =>
    Markup.button.callback(db.database, `database:${db.type}:${db.database}`)
  );

  return Markup.inlineKeyboard(buttons, { columns: 1 });
}

function padString(str, length) {
  const visibleLength = [...str].length;
  const padding = length - visibleLength;
  if (padding <= 0) return str;
  return str;
}

function createPaginatedTablesKeyboard(
  dbType,
  database,
  tables,
  selectedTables = [],
  page = 1
) {
  const BUTTONS_PER_ROW = 2;
  const MAX_ROWS = 19;
  const PAGE_SIZE = BUTTONS_PER_ROW * MAX_ROWS;
  const MAX_TABLE_LENGTH = 25;
  const TOTAL_BUTTON_WIDTH = MAX_TABLE_LENGTH + 2;

  const start = (page - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const currentTables = tables.slice(start, end);

  const buttonRows = [];

  for (let i = 0; i < currentTables.length; i += BUTTONS_PER_ROW) {
    const rowButtons = [];

    for (let j = 0; j < BUTTONS_PER_ROW && i + j < currentTables.length; j++) {
      const table = currentTables[i + j];
      const isSelected = selectedTables.includes(table);
      const checkMark = isSelected ? "✅ " : "";
      const shortDbType = dbType === "mongodb" ? "m" : "p";

      const truncatedName =
        table.length > MAX_TABLE_LENGTH
          ? table.slice(0, MAX_TABLE_LENGTH - 2) + ".."
          : table;
      const paddedName = padString(truncatedName, MAX_TABLE_LENGTH);
      const displayName = `${paddedName}${checkMark}`;

      rowButtons.push(
        Markup.button.callback(
          displayName,
          `select:${shortDbType}:${database}:${table}`.slice(0, 64)
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

  if (selectedTables.length > 0) {
    buttonRows.push([
      Markup.button.callback(
        `✅ Confirm (${selectedTables.length} selected)`,
        `confirm:${dbType}:${database}`
      ),
    ]);
  }

  return {
    keyboard: Markup.inlineKeyboard(buttonRows),
    totalPages,
    itemsPerPage: PAGE_SIZE,
  };
}

module.exports = {
  createDatabasesKeyboard,
  createPaginatedTablesKeyboard,
  createMethodsKeyboard,
};
