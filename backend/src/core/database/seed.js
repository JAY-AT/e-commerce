import fs from "fs";
import path from "path";

const SEEDS_DIR = path.join(process.cwd(), "src/core/database/seeds");

// Trace point: runSeeds()
async function runSeeds(pool) {
  const files = fs
    .readdirSync(SEEDS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const [rows] = await pool.query(
      "SELECT * FROM seeds WHERE name = ?",
      [file]
    );

    if (rows.length > 0) {
      console.log(`Skipping ${file} (already seeded)`);
      continue;
    }

    const sql = fs.readFileSync(
      path.join(SEEDS_DIR, file),
      "utf-8"
    );

    console.log(`Running seed: ${file}`);

    try {
      await pool.query(sql);

      await pool.query(
        "INSERT INTO seeds (name) VALUES (?)",
        [file]
      );

    } catch (err) {
      console.error(`Error in ${file}:`, err.message);
      throw err;
    }
  }

  console.log("All seeds complete");
}

export default runSeeds;