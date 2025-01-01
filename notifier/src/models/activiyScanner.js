const { getDb } = require("../config/database");

async function getActivatedDatabases() {
    const activityScanners = getDb().collection("activity_scanners");
    const databases = await activityScanners.aggregate([
        { $group: { _id: "$database", type: { $first: "$type" } } },
        { $project: { _id: 0, database: "$_id", type: 1 } }
    ]).toArray();

    console.log(databases);

    return databases;
}

async function getActivatedTables (database) {
    const activityScanners = getDb().collection("activity_scanners");
    const tables = await activityScanners.find({ database }).toArray();

    return tables.map(t => t.table);
}

module.exports = {
    getActivatedDatabases,
    getActivatedTables,
};
