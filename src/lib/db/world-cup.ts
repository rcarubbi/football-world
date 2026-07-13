import { getTursoClient } from "../turso/client";

export interface WorldCup {
  id: number;
  year: number;
  winner: string | null;
  runner_up: string | null;
  third_place: string | null;
  fourth_place: string | null;
}

export interface WorldCupMatch {
  id: number;
  world_cup_id: number;
  stage: string | null;
  group_name: string | null;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  venue: string | null;
  match_date: string | null;
}

export interface WorldCupTeam {
  id: number;
  world_cup_id: number;
  team_name: string;
  badge_url: string | null;
  group_name: string | null;
}

export async function findAllWorldCups(): Promise<WorldCup[]> {
  const client = getTursoClient();
  const result = await client.execute("SELECT * FROM world_cups ORDER BY year DESC");
  return result.rows as unknown as WorldCup[];
}

export async function findWorldCupByYear(year: number): Promise<WorldCup | null> {
  const client = getTursoClient();
  const result = await client.execute({
    sql: "SELECT * FROM world_cups WHERE year = ?",
    args: [year],
  });
  return (result.rows[0] as unknown as WorldCup) ?? null;
}

export async function findWorldCupMatches(worldCupId: number): Promise<WorldCupMatch[]> {
  const client = getTursoClient();
  const result = await client.execute({
    sql: "SELECT * FROM world_cup_matches WHERE world_cup_id = ? ORDER BY match_date",
    args: [worldCupId],
  });
  return result.rows as unknown as WorldCupMatch[];
}

export async function findWorldCupTeams(worldCupId: number): Promise<WorldCupTeam[]> {
  const client = getTursoClient();
  const result = await client.execute({
    sql: "SELECT * FROM world_cup_teams WHERE world_cup_id = ? ORDER BY team_name",
    args: [worldCupId],
  });
  return result.rows as unknown as WorldCupTeam[];
}
