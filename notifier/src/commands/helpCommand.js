async function helpCommand(ctx) {
  const message = `📚 UrDatabase Notify Help

Main Commands:
• /start - Show welcome message
• /login - Request access to the system
• /listen_normal - Select databases and tables to monitor (normal mode)
• /listen_smart - Select databases and tables to monitor (smart mode)
• /template - Apply predefined table groups
• /watches - View and manage your active watches
• /help - Show this help message

How to use:
1. First Time Setup:
   • Use /login to request access
   • Wait for admin approval
   • Once approved, you can start monitoring

2. Monitoring Tables:
   • Use /listen_normal or /listen_smart to select individual tables
   • Or use /template for predefined groups
   • Choose what you want to monitor
   • Confirm your selection
   • Use /watches to manage active watches

Notes:
• Watch requests expire after 4 hours
• Real-time change notifications
• Messages formatted in Markdown
• Use /template for quick setup

❓ Need help? Contact @dongtranthien for support.`;

  await ctx.reply(message);
}

module.exports = {
  helpCommand,
};
