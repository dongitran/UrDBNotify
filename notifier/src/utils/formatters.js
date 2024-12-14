function formatChangeMessage(change) {
  const action = change.action.toUpperCase();
  const location = `${change.database}.${change.table || change.collection}`;

  let message = `🔔 ${action} in ${location}\n\n`;

  if (change.data) {
    message += `Data: \`\`\`json\n${JSON.stringify(
      change.data,
      null,
      2
    )}\n\`\`\`\n`;
  }

  if (change.oldData) {
    message += `Old Data: \`\`\`json\n${JSON.stringify(
      change.oldData,
      null,
      2
    )}\n\`\`\``;
  }

  return message;
}

module.exports = {
  formatChangeMessage,
};
