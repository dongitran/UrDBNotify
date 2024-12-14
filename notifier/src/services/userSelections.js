const { getDb } = require("../config/database");

async function getUserSelections(userId, dbType, database) {
  const userSelections = getDb().collection("user_selections");
  const now = new Date();

  const selection = await userSelections.findOne({
    userId,
    databaseType: dbType,
    database,
    expiresAt: { $gt: now },
  });

  return selection?.selectedTables || [];
}

async function setUserSelections(userId, dbType, database, selections) {
  const userSelections = getDb().collection("user_selections");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 60 * 1000);

  await userSelections.updateOne(
    {
      userId,
      databaseType: dbType,
      database,
    },
    {
      $set: {
        selectedTables: selections,
        updatedAt: now,
        expiresAt,
      },
    },
    { upsert: true }
  );
}

async function clearUserSelections(userId, dbType, database) {
  const userSelections = getDb().collection("user_selections");

  await userSelections.deleteOne({
    userId,
    databaseType: dbType,
    database,
  });
}

async function cleanupExpiredSelections() {
  const userSelections = getDb().collection("user_selections");
  const now = new Date();

  await userSelections.deleteMany({
    expiresAt: { $lte: now },
  });
}

module.exports = {
  getUserSelections,
  setUserSelections,
  clearUserSelections,
  cleanupExpiredSelections,
};
