import { NextRequest, NextResponse } from "next/server";
import { getTursoClient } from "@/lib/turso/client";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q")?.trim();
  const type = searchParams.get("type") || "all";

  if (!q || q.length < 2) {
    return NextResponse.json({ teams: [], players: [] });
  }

  const client = getTursoClient();
  const pattern = `%${q}%`;

  const results: { teams: Array<{ name: string; slug: string; badge_url: string | null; league_slug: string; type: string }>; players: Array<{ name: string; slug: string; photo_url: string | null; position: string | null; team_name: string | null; type: string }> } = {
    teams: [],
    players: [],
  };

  if (type === "all" || type === "teams") {
    const teamsResult = await client.execute({
      sql: `SELECT name, slug, badge_url, league_slug FROM teams WHERE name LIKE ? ORDER BY name LIMIT 10`,
      args: [pattern],
    });
    results.teams = teamsResult.rows.map((row) => ({
      name: row.name as string,
      slug: row.slug as string,
      badge_url: row.badge_url as string | null,
      league_slug: row.league_slug as string,
      type: "team",
    }));
  }

  if (type === "all" || type === "players") {
    const playersResult = await client.execute({
      sql: `SELECT p.name, p.slug, p.photo_url, p.position, t.name as team_name
            FROM players p
            LEFT JOIN teams t ON p.team_id = t.id
            WHERE p.name LIKE ?
            ORDER BY p.name LIMIT 10`,
      args: [pattern],
    });
    results.players = playersResult.rows.map((row) => ({
      name: row.name as string,
      slug: row.slug as string,
      photo_url: row.photo_url as string | null,
      position: row.position as string | null,
      team_name: row.team_name as string | null,
      type: "player",
    }));
  }

  return NextResponse.json(results);
}
