const userSelections = new Map();

function getUserSelections(userId, dbType, database) {
  const key = `${userId}:${dbType}:${database}`;
  return userSelections.get(key) || [];
}

function setUserSelections(userId, dbType, database, selections) {
  const key = `${userId}:${dbType}:${database}`;
  userSelections.set(key, selections);
}

function clearUserSelections(userId, dbType, database) {
  const key = `${userId}:${dbType}:${database}`;
  userSelections.delete(key);
}

module.exports = {
  getUserSelections,
  setUserSelections,
  clearUserSelections,
};
