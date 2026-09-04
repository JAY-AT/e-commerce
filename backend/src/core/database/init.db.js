import mysql from 'mysql2/promise';

// Trace point: initializeDb()
export async function initializeDb(config) {
  const connection = await mysql.createConnection({
    host: config.host,
    port: Number(config.port),
    user: config.user,
    password: config.password,
  });

  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${config.database}\``
  );

  console.log(`✅ Database "${config.database}" ensured`);

  await connection.end();
}
