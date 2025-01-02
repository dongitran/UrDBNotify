async function helpCommand(ctx) {
  const message = `📚 UrDatabase Notify Help

Main Commands:
• /start - Show welcome message
• /login - Request access to the system
• /listen - Select databases and tables to monitor
• /watches - View and manage your active watches
• /help - Show this help message

How to use:
1. First Time Setup:
   • Use /login to request access
   • Wait for admin approval
   • Once approved, you can start monitoring

2. Monitoring Tables:
   • Use /listen to see available databases
   • Select a database to view its tables
   • Choose tables you want to monitor
   • Confirm your selection
   • Use /watches to manage your active watches

Notes:
• Watch requests expire after 15 minutes
• You'll receive notifications about changes in real-time
• Use /listen to watch more tables
• Messages are formatted in Markdown for better readability

❓ Need help? Contact @dongtranthien for support.`;

  await ctx.reply(message);
}

module.exports = {
  helpCommand,
};
