async function startCommand(ctx) {
  const message = `👋 Welcome to the UrDatabase Notify!

This bot helps you monitor changes in your databases in real-time.

Available commands:
/login - Request access to the system
/help - Show this help message
/listen - Start watching database tables

To get started:
1. Use /login to request access
2. Wait for admin approval
3. Use /listen to select databases and tables to monitor

Need help? Use /help for more information.`;

  await ctx.reply(message);
}

module.exports = {
  startCommand,
};
