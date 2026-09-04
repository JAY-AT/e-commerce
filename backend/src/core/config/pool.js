import mysql from 'mysql2/promise';

let pool;

// Trace point: initPool()
export function initPool(config) {
  pool = mysql.createPool({
    ...config,
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0,
  });

  return pool;
}

// Trace point: getPool()
export function getPool() {
  if (!pool) throw new Error("Pool not initialized");
  return pool;
}