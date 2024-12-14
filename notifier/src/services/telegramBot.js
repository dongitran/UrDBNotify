const { Telegraf } = require("telegraf");
const { loginCommand } = require("../commands/loginCommand");
const { listDatabasesCommand } = require("../commands/listDatabasesCommand");
const { listTablesCommand } = require("../commands/listTablesCommand");
const { isUserApproved } = require("../models/user");
const { createWatchRequest } = require("../models/watchRequest");

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.command("start", (ctx) => {
  ctx.reply("Welcome! Use /login to request access to the system.");
});

bot.command("login", loginCommand);

bot.use(async (ctx, next) => {
  if (ctx.message?.text?.startsWith("/")) {
    const isApproved = await isUserApproved(ctx.chat.id);
    if (!isApproved) {
      return ctx.reply(
        "You need to be approved by an admin to use this command. Use /login first."
      );
    }
  }
  return next();
});

bot.command("listdatabases", listDatabasesCommand);
bot.command("listtables", listTablesCommand);

bot.action(/database:(.+)/, async (ctx) => {
  try {
    const database = ctx.match[1];
    const databaseType = database.split(":")[0];
    const databaseName = database.split(":")[1];
    const messageId = ctx.callbackQuery.message.message_id;

    await listTablesCommand(ctx, databaseType, databaseName, 1, messageId);
    await ctx.answerCbQuery();
  } catch (error) {
    console.error("Database selection error:", error);
    await ctx.answerCbQuery("Error loading tables");
  }
});

bot.action(/w:(.):(.+):(.+)/, async (ctx) => {
  try {
    const database = ctx.match[2];
    const table = ctx.match[3];
    const messageId = ctx.callbackQuery.message.message_id;

    await createWatchRequest(ctx.from.id, database, table);

    await ctx.telegram.editMessageText(
      ctx.chat.id,
      messageId,
      null,
      `✅ Successfully watching ${database}.${table}\n\nUse /listdatabases to watch more tables.`
    );

    await ctx.answerCbQuery(`Started watching ${database}.${table}`);
  } catch (error) {
    console.error("Watch error:", error);
    await ctx.answerCbQuery("Error setting up watch");
  }
});

bot.action(/page:(.+):(.+):(\d+)/, async (ctx) => {
  try {
    const messageId = ctx.callbackQuery.message.message_id;
    const databaseType = ctx.match[1];
    const databaseName = ctx.match[2];
    const page = parseInt(ctx.match[3]);

    await listTablesCommand(ctx, databaseType, databaseName, page, messageId);
    await ctx.answerCbQuery();
  } catch (error) {
    console.error("Navigation error:", error);
    await ctx.answerCbQuery("Error navigating pages");
  }
});

module.exports = {
  telegramBot: bot,
};
