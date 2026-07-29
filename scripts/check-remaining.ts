import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
import { getTursoClient } from "../src/lib/turso/client";

async function main() {
  const c = getTursoClient();

  // 1. Add missing teams
  const missing = [
    { name: "Burnley", slug: "burnley", league: "premier-league" },
    { name: "West Ham United", slug: "west-ham-united", league: "premier-league" },
    { name: "Wolverhampton Wanderers", slug: "wolverhampton-wanderers", league: "premier-league" },
  ];

  for (const team of missing) {
    const existing = await c.execute({ sql: "SELECT id FROM teams WHERE slug = ?", args: [team.slug] });
    if (existing.rows.length === 0) {
      await c.execute({
        sql: "INSERT INTO teams (name, slug, league_slug, source) VALUES (?, ?, ?, 'etl')",
        args: [team.name, team.slug, team.league],
      });
      console.log(`Added: ${team.name}`);
    } else {
      console.log(`Exists: ${team.name} (id=${existing.rows[0].id})`);
    }
  }

  // 2. Also add mappings for La Liga computed names
  const laligaNames = [
    { name: "Club Atlético de Madrid", slug: "club-atletico-de-madrid", league: "la-liga" },
    { name: "Real Betis Balompié", slug: "real-betis-balompie", league: "la-liga" },
  ];
  for (const team of laligaNames) {
    const existing = await c.execute({ sql: "SELECT id FROM teams WHERE slug = ?", args: [team.slug] });
    if (existing.rows.length === 0) {
      await c.execute({
        sql: "INSERT INTO teams (name, slug, league_slug, source) VALUES (?, ?, ?, 'etl')",
        args: [team.name, team.slug, team.league],
      });
      console.log(`Added: ${team.name}`);
    }
  }

  // 3. Add league team matching mappings in standings.ts for these new names
  // (This is done in code, not DB)

  // 4. Verify standings
  const stats = await c.execute(`
    SELECT league_slug, season, COUNT(*) as n,
      SUM(CASE WHEN played > 0 THEN 1 ELSE 0 END) as ws,
      SUM(CASE WHEN points > 0 THEN 1 ELSE 0 END) as wp
    FROM league_standings GROUP BY league_slug, season ORDER BY league_slug
  `);
  console.log("\n=== Standings ===");
  for (const r of stats.rows) {
    console.log(`  ${r.league_slug} (${r.season}): ${r.n} rows, ${r.ws} with stats, ${r.wp} with points`);
  }

  // 5. Verify top scorers
  const scorers = await c.execute(`
    SELECT league_slug, COUNT(*) as n,
      SUM(CASE WHEN photo_url IS NOT NULL AND photo_url != '' THEN 1 ELSE 0 END) as wp
    FROM top_scorers GROUP BY league_slug ORDER BY league_slug
  `);
  console.log("\n=== Top Scorers ===");
  for (const r of scorers.rows) {
    console.log(`  ${r.league_slug}: ${r.n} scorers, ${r.wp} with photo`);
  }

  // 6. Check UCL scorers
  const uclScorers = await c.execute({
    sql: "SELECT league_slug, COUNT(*) as n FROM top_scorers WHERE league_slug = 'champions-league'",
    args: [],
  });
  console.log(`\nUCL scorers: ${uclScorers.rows[0]?.n || 0}`);

  // Check bbd_scorers for UCL
  const uclBbd = await c.execute({
    sql: "SELECT league_id, season, category, COUNT(*) as n FROM bbd_scorers WHERE league_id = 'champions-league' GROUP BY league_id, season, category",
    args: [],
  });
  console.log("UCL BBD scorers:", JSON.stringify(uclBbd.rows));
}
main().catch((e) => console.error(e.message));
