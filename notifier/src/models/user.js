const { getDb } = require("../config/database");

const UserStatus = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

async function createUser(chatId, username) {
  const users = getDb().collection("users");

  return await users.insertOne({
    chatId,
    username,
    status: UserStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

async function findUserByChatId(chatId) {
  const users = getDb().collection("users");
  return await users.findOne({ chatId });
}

async function isUserApproved(chatId) {
  const user = await findUserByChatId(chatId);
  return user?.status === UserStatus.APPROVED;
}

async function getApprovedUsers() {
  const users = getDb().collection("users");
  return await users.find({ status: UserStatus.APPROVED }).toArray();
}

module.exports = {
  UserStatus,
  createUser,
  findUserByChatId,
  isUserApproved,
  getApprovedUsers,
};
