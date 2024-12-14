const { Telegraf } = require("telegraf");
const { loginCommand } = require("../commands/loginCommand");
const { listDatabasesCommand } = require("../commands/listDatabasesCommand");
const { listTablesCommand } = require("../commands/listTablesCommand");
const { isUserApproved } = require("../models/user");

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
  const database = ctx.match[1];
  await listTablesCommand(ctx, database);
});

bot.action(/watch:(.+):(.+)/, async (ctx) => {
  const [database, table] = ctx.match[1].split("|");
  await createWatchRequest(ctx.from.id, database, table);
  await ctx.reply(`You are now watching ${database}.${table}`);
});

module.exports = {
  telegramBot: bot,
};
