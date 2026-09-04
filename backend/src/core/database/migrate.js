import fs from "fs";
import path from "path";

const MIGRATIONS_DIR = path.join(process.cwd(), "src/core/database/migrations");

// Trace point: runMigrations()
async function runMigrations(pool) {

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const [rows] = await pool.query(
      "SELECT * FROM migrations WHERE name = ?",
      [file]
    );

    if (rows.length > 0) continue;

    const sql = fs.readFileSync(
      path.join(MIGRATIONS_DIR, file),
      "utf-8"
    );

    console.log(`Running migration: ${file}`);

    try {
      await pool.query(sql);

      await pool.query(
        "INSERT INTO migrations (name) VALUES (?)",
        [file]
      );

    } catch (err) {
      console.error(`Error in ${file}:`, err.message);
      throw err;
    }
  }

  console.log("All migrations complete");
}

export default runMigrations;