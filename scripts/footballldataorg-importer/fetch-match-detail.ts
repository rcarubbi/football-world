import { getTursoClient } from "../../src/lib/turso/client";
import { getMatchDetail } from "../../src/lib/api/football-data";

interface FdMatchDetail {
  id: number;
  competition: { code: string };
  season: { id: number };
  matchday: number;
  status: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
  score: {
    fullTime: { home: number | null; away: number | null };
  };
  utcDate: string;
  venue: string;
  attendance: number | null;
  lineups: unknown[];
}

export async function fetchMatchDetail(
  matchId: number,
  alreadyFetched: Set<number>
): Promise<boolean> {
  if (alreadyFetched.has(matchId)) return false;

  const client = getTursoClient();

  try {
    const match = (await getMatchDetail(matchId)) as FdMatchDetail;
    if (!match || !match.id) return false;

    const utcDate = match.utcDate || "";
    const matchDate = utcDate.split("T")[0] || "";
    const matchTime = utcDate.split("T")[1]?.replace("Z", "") || "";

    await client.execute({
      sql: `INSERT OR REPLACE INTO fbdo_match_detail (fd_id, competition_code, season, matchday, status, home_team_name, away_team_name, home_score, away_score, match_date, match_time, venue, attendance, lineups_json, raw_json, fetched_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      args: [
        match.id,
        match.competition?.code || "",
        match.season?.id || null,
        match.matchday || null,
        match.status || "",
        match.homeTeam?.name || "",
        match.awayTeam?.name || "",
        match.score?.fullTime?.home ?? null,
        match.score?.fullTime?.away ?? null,
        matchDate,
        matchTime,
        match.venue || "",
        match.attendance || null,
        JSON.stringify(match.lineups || []),
        JSON.stringify(match),
      ],
    });
    alreadyFetched.add(matchId);
    return true;
  } catch (e: any) {
    console.error(`      Error fetching match ${matchId}: ${e.message}`);
    return false;
  }
}
