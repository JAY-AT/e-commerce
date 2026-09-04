import dotenv from "dotenv";
import database from "../config/db.const.js";
import { initializeDb } from "./init.db.js";
import { initPool } from "../config/pool.js";
import runMigrations from "./migrate.js";
import runSeeds from "./seed.js";

dotenv.config();

// Trace point: createMigrationsTable()
async function createMigrationsTable(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// Trace point: createSeedsTable()
async function createSeedsTable(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS seeds (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// Trace point: init()
async function init() {
  try {
    await initializeDb(database);

    const pool = initPool(database);

    await createMigrationsTable(pool);
    await createSeedsTable(pool);

    await runMigrations(pool);
    await runSeeds(pool);

    console.log("🚀 Initialization complete");
  } catch (err) {
    console.error("Initialization failed:", err.message);
    throw err;
  }
}

export default init;