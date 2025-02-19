async function startCommand(ctx) {
  const message = `👋 Welcome to the UrDatabase Notify!

This bot helps you monitor changes in your databases in real-time.

Available commands:
/login - Request access to the system
/help - Show this help message
/listen_normal - Start watching database tables (normal mode)
/listen_smart - Start watching database tables (smart mode)
/watches - View and manage your active watches
/template - Quick setup with predefined table groups

To get started:
1. Use /login to request access
2. Wait for admin approval
3. Use /listen_normal, /listen_smart or /template to start monitoring

❓ Need help? Contact @dongtranthien for support.`;

  await ctx.reply(message);
}

module.exports = {
  startCommand,
};
