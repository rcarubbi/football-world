import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
import { getTursoClient } from "../src/lib/turso/client";

async function main() {
  const c = getTursoClient();

  // Check scorers links
  for (const league of ["premier-league", "la-liga"]) {
    const rows = await c.execute({
      sql: `SELECT ts.player_name, ts.player_slug,
              (SELECT p.slug FROM players p WHERE p.slug = ts.player_slug LIMIT 1) as resolved
            FROM top_scorers ts
            WHERE ts.league_slug = ? AND ts.season = '2025' AND ts.goals > 0
            ORDER BY ts.goals DESC LIMIT 5`,
      args: [league],
    });
    console.log(`\n${league}:`);
    for (const r of rows.rows) {
      const linked = r.resolved ? 'LINKED' : 'NO LINK';
      console.log(`  ${r.player_name} slug=${r.player_slug} → ${linked}`);
    }
  }

  // Check teams with players
  for (const name of ["Burnley", "West Ham United", "Wolverhampton Wanderers", "RCD Mallorca"]) {
    const t = await c.execute({ sql: "SELECT id FROM teams WHERE name = ?", args: [name] });
    if (t.rows.length > 0) {
      const p = await c.execute({ sql: "SELECT COUNT(*) as n FROM players WHERE team_id = ?", args: [t.rows[0].id] });
      console.log(`\n${name}: ${p.rows[0].n} players`);
    }
  }

  // Check PL teams
  const plTeams = await c.execute({
    sql: `SELECT t.name FROM teams t
          JOIN team_leagues tl ON tl.team_id = t.id
          WHERE tl.league_slug = 'premier-league' ORDER BY t.name`,
    args: [],
  });
  console.log(`\nPL teams (${plTeams.rows.length}):`);
  for (const r of plTeams.rows) console.log(`  ${r.name}`);
}
main().catch((e) => console.error(e.message));
