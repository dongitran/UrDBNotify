const { getActiveWatchRequests } = require("../models/watchRequest");
const { Markup } = require("telegraf");
const { getDb } = require("../config/database");

async function watchesCommand(ctx) {
  try {
    const userId = ctx.from.id;
    const activeWatches = await getActiveWatchRequests(userId);

    if (!activeWatches || activeWatches.length === 0) {
      return ctx.reply("You are not watching any tables at the moment.");
    }

    const buttons = activeWatches.map((watch) => {
      const label = `${watch.database}-${watch.table}`;
      return [
        Markup.button.callback(
          `❌ ${label}`,
          `unwatch:${watch.database}:${watch.table}`
        ),
      ];
    });

    const keyboard = Markup.inlineKeyboard(buttons);
    await ctx.reply("📊 Your active watches (click to unwatch):", keyboard);
  } catch (error) {
    console.error("Watches command error:", error);
    ctx.reply("Error fetching your watched tables. Please try again later.");
  }
}

async function deactivateWatch(userId, database, table) {
  const watchRequests = getDb().collection("watch_requests");
  await watchRequests.updateOne(
    {
      userId,
      database,
      table,
      status: "active",
      expiresAt: { $gt: new Date() },
    },
    {
      $set: {
        status: "inactive",
        deactivatedAt: new Date(),
      },
    }
  );
}

module.exports = { watchesCommand, deactivateWatch };
