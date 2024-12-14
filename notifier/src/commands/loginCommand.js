const { createUser, findUserByChatId } = require("../models/user");

async function loginCommand(ctx) {
  try {
    const chatId = ctx.chat.id;
    const username = ctx.from.username;

    const existingUser = await findUserByChatId(chatId);
    if (existingUser) {
      return ctx.reply(
        `You have already requested access. Status: ${existingUser.status}`
      );
    }

    await createUser(chatId, username);
    await ctx.reply(
      "Your access request has been submitted. Please wait for admin approval."
    );
  } catch (error) {
    console.error("Login command error:", error);
    ctx.reply("Error processing your request. Please try again later.");
  }
}

module.exports = { loginCommand };
