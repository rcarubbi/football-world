import { getTursoClient } from "./client";
import { SCHEMA, INDICES } from "./schema";

export async function seedDatabase() {
  const client = getTursoClient();

  const statements = SCHEMA.split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    await client.execute(statement);
  }

  const indexStatements = INDICES.split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of indexStatements) {
    await client.execute(statement);
  }

  // Migrations: add columns that may be missing from older tables
  const migrations = [
    "ALTER TABLE players ADD COLUMN career_summary TEXT",
    "ALTER TABLE players ADD COLUMN photo_url TEXT",
    "ALTER TABLE players ADD COLUMN apifootball_id TEXT",
    "ALTER TABLE teams ADD COLUMN thesportsdb_id TEXT",
    "ALTER TABLE teams ADD COLUMN football_data_id TEXT",
    "ALTER TABLE teams ADD COLUMN apifootball_id TEXT",
  ];

  for (const sql of migrations) {
    try {
      await client.execute(sql);
    } catch {
      // Column already exists — ignore
    }
  }

  console.log("Database schema initialized successfully");
}
