import { getTursoClient } from "../../src/lib/turso/client";
import { getTeamDetail } from "../../src/lib/api/football-data";

interface FdTeamDetail {
  id: number;
  name: string;
  crest: string;
  venue: string;
  clubColors: string;
  founded: number;
  address: string;
  website: string;
  coach: { name: string } | null;
  squad: unknown[];
}

export async function fetchTeamDetail(
  teamId: number,
  alreadyFetched: Set<number>
): Promise<boolean> {
  if (alreadyFetched.has(teamId)) return false;

  const client = getTursoClient();

  try {
    const team = (await getTeamDetail(teamId)) as FdTeamDetail;
    if (!team || !team.id) return false;

    await client.execute({
      sql: `INSERT OR REPLACE INTO fbdo_team_detail (fd_id, name, crest_url, venue, club_colors, founded, coach_name, address, website, squad_json, raw_json, fetched_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      args: [
        team.id,
        team.name || "",
        team.crest || "",
        team.venue || "",
        team.clubColors || "",
        team.founded || null,
        team.coach?.name || null,
        team.address || "",
        team.website || "",
        JSON.stringify(team.squad || []),
        JSON.stringify(team),
      ],
    });
    alreadyFetched.add(teamId);
    return true;
  } catch (e: any) {
    console.error(`      Error fetching team ${teamId}: ${e.message}`);
    return false;
  }
}
