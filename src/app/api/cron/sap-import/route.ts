import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "../auth";

export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  const league = request.nextUrl.searchParams.get("league") || undefined;

  console.log(
    `Starting SportsAPI Pro import${league ? ` for ${league}` : " (all leagues)"}...`
  );

  try {
    const { runImporter } = await import("../../../../../scripts/sportsapipro-importer/index");
    const results = await runImporter(league, new Set([1, 3]), 5);

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("SportsAPI Pro import failed:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
