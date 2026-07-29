import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "../auth";

export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  const league = request.nextUrl.searchParams.get("league") || undefined;

  console.log(
    `Starting TheSportsDB scrape${league ? ` for ${league}` : " (all leagues)"}...`
  );

  try {
    const { runScraper } = await import("../../../../../scripts/thesportsdb-importer/index");
    const results = await runScraper(league);

    const totals = results.reduce(
      (acc, r) => ({
        leagues: acc.leagues + r.leagues.ok,
        teams: acc.teams + r.teams.ok,
        players: acc.players + r.players.ok,
      }),
      { leagues: 0, teams: 0, players: 0 }
    );

    return NextResponse.json({
      success: true,
      ...totals,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("TheSportsDB scrape failed:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
