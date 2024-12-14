function parsePostgresConnections() {
  const connections = process.env.POSTGRES_CONNECTIONS?.split(",") || [];
  return connections.map((conn) => {
    const [name, host, port, database, user, password] = conn.split("|");
    return {
      name,
      config: {
        host,
        port: parseInt(port),
        database,
        user,
        password,
      },
    };
  });
}

function parseMongoConnections() {
  const connections = process.env.MONGO_CONNECTIONS?.split(",") || [];
  return connections.map((conn) => {
    const [name, url, database] = conn.split("|");
    return {
      name,
      url,
      database,
    };
  });
}

exports.config = {
  logger: {
    url: process.env.MONGO_LOGGER_URL,
    database: process.env.MONGO_LOGGER_DB,
    collection: process.env.MONGO_LOGGER_COLLECTION,
  },
  postgres: parsePostgresConnections(),
  mongodb: parseMongoConnections(),
};
