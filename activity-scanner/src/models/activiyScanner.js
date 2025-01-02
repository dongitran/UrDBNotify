const { getDb } = require("../config/database");

async function insertTables(tables) {
    const activityScanners = getDb().collection(process.env.MONGO_ACTIVITY_SCANNER_COLLECTION);

    return await activityScanners.insertMany(tables);
}

async function clearTables() {
    const activityScanners = getDb().collection(process.env.MONGO_ACTIVITY_SCANNER_COLLECTION);
    return await activityScanners.deleteMany({});
}

module.exports = {
    insertTables,
    clearTables,
};
