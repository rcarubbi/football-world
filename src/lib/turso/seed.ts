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

  console.log("Database schema initialized successfully");
}
