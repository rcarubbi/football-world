import { getTursoClient } from "../../src/lib/turso/client";
import { getCompetition } from "../../src/lib/api/football-data";
import { LeagueConfig } from "../../src/lib/leagues";

interface FdCompetition {
  id: number;
  area: { id: number; name: string };
  name: string;
  code: string;
  type: string;
  emblem: string | null;
  plan: string;
  currentSeason: { id: number; startDate: string; endDate: string; currentMatchday: number } | null;
}

export async function fetchCompetition(league: LeagueConfig): Promise<boolean> {
  const client = getTursoClient();

  try {
    const comp = (await getCompetition(league.footballDataCode)) as FdCompetition;
    if (!comp || !comp.id) return false;

    await client.execute({
      sql: `INSERT OR REPLACE INTO fbdo_competitions (fd_id, area_id, name, code, type, emblem_url, plan, current_season, raw_json, fetched_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      args: [
        comp.id,
        comp.area?.id || null,
        comp.name || "",
        comp.code || "",
        comp.type || "",
        comp.emblem || null,
        comp.plan || "",
        comp.currentSeason?.id || null,
        JSON.stringify(comp),
      ],
    });
    return true;
  } catch (e: any) {
    console.error(`    Error fetching competition ${league.footballDataCode}: ${e.message}`);
    return false;
  }
}
