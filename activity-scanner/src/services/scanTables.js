const { MongoClient } = require("mongodb");
const { Client } = require("pg");
const { insertTables, clearTables } = require("../models/activiyScanner");

async function scanTables() {
    try {
        console.log('scanTables');
        const { databaseMongo, databasePostgres } = parseConnections();

        const mongoPromises = databaseMongo.map((database) =>
            scanMongoDB(getDatabaseConfig(database.type, database.database)));
        const postgresPromises = databasePostgres.map((database) =>
            scanPostgres(getDatabaseConfig(database.type, database.database)));

        const tables = await Promise.all([
            ...mongoPromises,
            ...postgresPromises,
        ]);

        await clearTables();

        await insertTables(tables.flat());
        console.log('done');
    } catch (error) {
        console.error("Error scanning tables:", error);
    }
}

async function scanMongoDB(config) {
    const collections = await getMongoCollections(config);
    let tables = [];
    const client = new MongoClient(config.connectionString);

    try {
        await client.connect();
        const db = client.db(config.databaseName);

        for (const collection of collections) {
            const result = await db.collection(collection).findOne({
                $or: [
                    { createdAt: { $gte: new Date(new Date().getTime() - 8 * 60 * 60 * 1000) } },
                    { updatedAt: { $gte: new Date(new Date().getTime() - 8 * 60 * 60 * 1000) } },
                ]
            });

            if (result) {
                tables.push({
                    table: collection,
                    type: "mongodb",
                    database: config.databaseName,
                });
            }
        }
    } finally {
        await client.close();
    }

    return tables;
}

async function scanPostgres(config) {
	const initPostgresTables = await getPostgresTables(config);
	let tables = [];
	const client = new Client(config);

	try {
			await client.connect();

			for (const table of initPostgresTables) {
					const checkColumnQuery = `
							SELECT EXISTS (
									SELECT 1
									FROM information_schema.columns
									WHERE table_name = '${table}' 
									AND column_name = 'updated_at'
							) as has_updated_at;
					`;

					const columnCheck = await client.query(checkColumnQuery);
					
					if (!columnCheck.rows[0].has_updated_at) {
							continue;
					}

					const query = `
							SELECT EXISTS (
									SELECT 1
									FROM "${table}"
									WHERE updated_at >= NOW() - INTERVAL '8 hours'
									LIMIT 1
							) as has_recent_activity;
					`;

					try {
							const result = await client.query(query);
							if (result.rows[0].has_recent_activity) {
									tables.push({
											table,
											type: "postgres",
											database: config.database,
									});
							}
					} catch (error) {
							console.error(`Error scanning table ${table}:`, error.message);
							continue;
					}
			}
	} catch (error) {
			console.error("Error scanning PostgreSQL tables:", error);
	} finally {
			await client.end();
	}

	return tables;
}

function getDatabaseConfig(databaseType, databaseName) {
    if (databaseType === "mongodb") {
        const mongoConnections = process.env.MONGO_CONNECTIONS?.split(",") || [];
        const connection = mongoConnections.find((conn) => {
            const [, , dbName] = conn.split("|");
            return dbName === databaseName;
        });
        if (!connection) return null;

        const [, connectionString] = connection.split("|");
        return { connectionString, databaseName };
    } else if (databaseType === "postgres") {
        const pgConnections = process.env.POSTGRES_CONNECTIONS?.split(",") || [];
        const connection = pgConnections.find((conn) => {
            const [name, host, port, database, user, password] = conn.split("|");
            return database === databaseName;
        });
        if (!connection) return null;

        const [, host, port, database, user, password] = connection.split("|");
        return { host, port, database, user, password };
    }
    return null;
}

async function getMongoCollections(config) {
    const client = new MongoClient(config.connectionString);
    try {
        await client.connect();
        const db = client.db(config.databaseName);
        const collections = await db.listCollections().toArray();
        return collections.map((collection) => collection.name);
    }   catch (error) {
    } finally {
        await client.close();
    }
}

async function getPostgresTables(config) {
    const client = new Client(config);
    try {
        await client.connect();
        const result = await client.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
        `);
        return result.rows.map((row) => row.table_name);
    } finally {
        await client.end();
    }
}

function parseConnections() {
    const databaseMongo = [];
    const databasePostgres = []

    const pgConnections = process.env.POSTGRES_CONNECTIONS?.split(",") || [];
    for (const conn of pgConnections) {
        const [name, , , database] = conn.split("|");
        if (name && database) {
            databasePostgres.push({
                name: `${name} (PostgreSQL)`,
                type: "postgres",
                database,
            });
        }
    }

    const mongoConnections = process.env.MONGO_CONNECTIONS?.split(",") || [];
    for (const conn of mongoConnections) {
        const [name, , database] = conn.split("|");
        if (name && database) {
            databaseMongo.push({
                name: `${name} (MongoDB)`,
                type: "mongodb",
                database,
            });
        }
    }

    return { databaseMongo, databasePostgres };
}

module.exports = { scanTables };
