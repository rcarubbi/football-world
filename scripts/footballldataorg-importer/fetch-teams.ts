import { getTursoClient } from "../../src/lib/turso/client";
import { getTeams } from "../../src/lib/api/football-data";
import { LeagueConfig, getCurrentSeason } from "../../src/lib/leagues";

interface FdTeam {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
  address: string;
  founded: number;
  clubColors: string;
  venue: string;
  coach: { firstName: string; lastName: string; name: string } | null;
}

export async function fetchTeams(league: LeagueConfig): Promise<number> {
  const client = getTursoClient();
  const season = getCurrentSeason();

  try {
    const teams = (await getTeams(league.footballDataCode, season)) as FdTeam[];
    let count = 0;

    for (const team of teams) {
      await client.execute({
        sql: `INSERT OR REPLACE INTO fbdo_teams (fd_id, competition_code, name, short_name, tla, crest_url, address, founded, club_colors, venue, coach_name, raw_json, fetched_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        args: [
          team.id,
          league.footballDataCode,
          team.name || "",
          team.shortName || "",
          team.tla || "",
          team.crest || "",
          team.address || "",
          team.founded || null,
          team.clubColors || "",
          team.venue || "",
          team.coach?.name || null,
          JSON.stringify(team),
        ],
      });
      count++;
    }

    console.log(`    ${count} teams stored`);
    return count;
  } catch (e: any) {
    console.error(`    Error fetching teams for ${league.name}: ${e.message}`);
    return 0;
  }
}
