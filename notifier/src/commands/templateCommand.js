const { ObjectId } = require("mongodb");
const { Markup } = require("telegraf");
const { getDb } = require("../config/database");
const { createWatchRequest } = require("../models/watchRequest");

async function templateCommand(ctx) {
  const templates = await getDb()
    .collection("watch_templates")
    .find()
    .toArray();

  const buttons = templates.map((t) => [
    Markup.button.callback(t.name, `template:${t._id}`),
  ]);

  await ctx.reply("Select a template:", Markup.inlineKeyboard(buttons));
}

async function handleTemplateSelection(ctx, templateId) {
  const template = await getDb()
    .collection("watch_templates")
    .findOne({
      _id: new ObjectId(templateId),
    });

  const watchPromises = template.tables.flatMap((db) =>
    db.tables.map((table) =>
      createWatchRequest(ctx.from.id, db.database, table)
    )
  );

  await Promise.all(watchPromises);

  await ctx.reply(
    `✅ Watching ${template.name} tables:\n` +
      template.tables
        .map((db) => `${db.database}: ${db.tables.join(", ")}`)
        .join("\n")
  );
}

module.exports = { templateCommand, handleTemplateSelection };
