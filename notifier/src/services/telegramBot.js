const { Telegraf } = require("telegraf");
const { loginCommand } = require("../commands/loginCommand");
const { listDatabasesCommand } = require("../commands/listDatabasesCommand");
const { listTablesCommand } = require("../commands/listTablesCommand");
const { startCommand } = require("../commands/startCommand");
const { helpCommand } = require("../commands/helpCommand");
const { isUserApproved } = require("../models/user");
const { createWatchRequest } = require("../models/watchRequest");
const {
  getUserSelections,
  setUserSelections,
  clearUserSelections,
} = require("./userSelections");
const {
  watchesCommand,
  deactivateWatch,
} = require("../commands/watchesCommand");
const {
  templateCommand,
  handleTemplateSelection,
} = require("../commands/templateCommand");

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.command("start", startCommand);
bot.command("help", helpCommand);
bot.command("login", loginCommand);

bot.use(async (ctx, next) => {
  if (ctx.message?.text?.startsWith("/")) {
    const publicCommands = ["/start", "/help", "/login"];
    if (publicCommands.includes(ctx.message.text.split(" ")[0])) {
      return next();
    }

    const isApproved = await isUserApproved(ctx.chat.id);
    if (!isApproved) {
      return ctx.reply(
        "You need to be approved by an admin to use this command. Use /login first."
      );
    }
  }
  return next();
});
bot.command("listen", listDatabasesCommand);
bot.command("watches", watchesCommand);
bot.action(/unwatch:(.+):(.+)/, async (ctx) => {
  try {
    const database = ctx.match[1];
    const table = ctx.match[2];
    const userId = ctx.from.id;

    await deactivateWatch(userId, database, table);
    await ctx.deleteMessage();
    await watchesCommand(ctx);
    await ctx.answerCbQuery(`Stopped watching ${database}-${table}`);
  } catch (error) {
    console.error("Unwatch error:", error);
    await ctx.answerCbQuery("Error stopping watch");
  }
});

bot.action(/database:(.+)/, async (ctx) => {
  try {
    const database = ctx.match[1];
    const databaseType = database.split(":")[0];
    const databaseName = database.split(":")[1];
    const messageId = ctx.callbackQuery.message.message_id;

    await clearUserSelections(ctx.from.id, databaseType, databaseName);
    await listTablesCommand(ctx, databaseType, databaseName, 1, messageId);
    await ctx.answerCbQuery();
  } catch (error) {
    console.error("Database selection error:", error);
    await ctx.answerCbQuery("Error loading tables");
  }
});

bot.action(/select:(.):(.+):(.+)/, async (ctx) => {
  try {
    const databaseType = ctx.match[1] === "m" ? "mongodb" : "postgres";
    const database = ctx.match[2];
    const table = ctx.match[3];
    const messageId = ctx.callbackQuery.message.message_id;

    let selections = await getUserSelections(
      ctx.from.id,
      databaseType,
      database
    );

    if (selections.includes(table)) {
      selections = selections.filter((t) => t !== table);
    } else {
      selections.push(table);
    }

    await setUserSelections(ctx.from.id, databaseType, database, selections);
    await listTablesCommand(
      ctx,
      databaseType,
      database,
      1,
      messageId,
      selections
    );
    await ctx.answerCbQuery(
      selections.includes(table) ? "Selected" : "Unselected"
    );
  } catch (error) {
    console.error("Selection error:", error);
    await ctx.answerCbQuery("Error updating selection");
  }
});

bot.action(/confirm:(.+):(.+)/, async (ctx) => {
  try {
    const databaseType = ctx.match[1];
    const database = ctx.match[2];
    const messageId = ctx.callbackQuery.message.message_id;

    const selections = await getUserSelections(
      ctx.from.id,
      databaseType,
      database
    );
    if (!selections.length) {
      return ctx.answerCbQuery("Please select at least one table");
    }

    const watchPromises = selections.map((table) =>
      createWatchRequest(ctx.from.id, database, table)
    );

    await Promise.all(watchPromises);
    const expiresIn = 240; // 4 hours

    await ctx.telegram.editMessageText(
      ctx.chat.id,
      messageId,
      null,
      `✅ Now watching ${selections.length} tables in ${database}:\n` +
        `${selections.join("\n")}\n\n` +
        `Watch will expire in ${expiresIn} minutes.\n\n` +
        `Use /listen to watch more tables.`
    );

    await clearUserSelections(ctx.from.id, databaseType, database);
    await ctx.answerCbQuery(`Started watching ${selections.length} tables`);
  } catch (error) {
    console.error("Confirmation error:", error);
    await ctx.answerCbQuery("Error setting up watch");
  }
});

bot.action(/page:(.+):(.+):(\d+)/, async (ctx) => {
  try {
    const messageId = ctx.callbackQuery.message.message_id;
    const databaseType = ctx.match[1];
    const databaseName = ctx.match[2];
    const page = parseInt(ctx.match[3]);

    const selections = await getUserSelections(
      ctx.from.id,
      databaseType,
      databaseName
    );
    await listTablesCommand(
      ctx,
      databaseType,
      databaseName,
      page,
      messageId,
      selections
    );
    await ctx.answerCbQuery();
  } catch (error) {
    console.error("Navigation error:", error);
    await ctx.answerCbQuery("Error navigating pages");
  }
});

bot.command("template", templateCommand);

bot.action(/template:(.+)/, async (ctx) => {
  try {
    const templateId = ctx.match[1];
    await handleTemplateSelection(ctx, templateId);
    await ctx.answerCbQuery("Template applied");
  } catch (error) {
    console.error("Template selection error:", error);
    await ctx.answerCbQuery("Error applying template");
  }
});

module.exports = {
  telegramBot: bot,
};
