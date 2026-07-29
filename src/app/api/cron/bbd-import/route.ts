import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "../auth";

export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  const league = request.nextUrl.searchParams.get("league") || undefined;

  console.log(
    `Starting Big Balls Data import${league ? ` for ${league}` : " (all leagues)"}...`
  );

  try {
    const { runImporter } = await import("../../../../../scripts/bigballsdata-importer/index");
    const results = await runImporter(league, new Set([1]));

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Big Balls Data import failed:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
