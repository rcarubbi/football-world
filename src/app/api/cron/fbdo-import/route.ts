import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "../auth";

export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  const league = request.nextUrl.searchParams.get("league") || undefined;

  console.log(
    `Starting football-data.org import${league ? ` for ${league}` : " (all leagues)"}...`
  );

  try {
    const { runImporter } = await import("../../../../../scripts/footballldataorg-importer/index");
    const results = await runImporter(league);

    const totals = results.reduce(
      (acc, r) => ({
        teams: acc.teams + r.teams,
        teamDetails: acc.teamDetails + r.teamDetails,
        scorers: acc.scorers + r.scorers,
        persons: acc.persons + r.persons,
        matchDetails: acc.matchDetails + r.matchDetails,
      }),
      { teams: 0, teamDetails: 0, scorers: 0, persons: 0, matchDetails: 0 }
    );

    return NextResponse.json({
      success: true,
      ...totals,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("football-data.org import failed:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
