async function startCommand(ctx) {
  const message = `👋 Welcome to the UrDatabase Notify!

This bot helps you monitor changes in your databases in real-time.

Available commands:
/login - Request access to the system
/help - Show this help message
/listen - Start watching database tables
/watches - View and manage your active watches

To get started:
1. Use /login to request access
2. Wait for admin approval
3. Use /listen to select databases and tables to monitor

❓ Need help? Contact @dongtranthien for support.`;

  await ctx.reply(message);
}

module.exports = {
  startCommand,
};
