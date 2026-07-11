import { notFound } from "next/navigation";
import { LEAGUES } from "@/lib/leagues";
import { findStandingsByLeague } from "@/lib/db/standings";
import { findTopScorersByLeague } from "@/lib/db/top-scorers";
import { findUpcomingMatches, findRecentMatches } from "@/lib/db/matches";
import { findVideosByLeague } from "@/lib/db/videos";
import { findRecentByLeague } from "@/lib/db/transfers";
import { StandingsTable } from "@/components/StandingsTable";
import { TopScorers } from "@/components/TopScorers";
import { LeagueFixtures } from "@/components/LeagueFixtures";
import { LeagueResults } from "@/components/LeagueResults";
import { LeagueHighlights } from "@/components/LeagueHighlights";
import { LeagueIcon } from "@/components/LeagueIcon";
import { TransferHistory } from "@/components/TransferHistory";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const league = LEAGUES.find((l) => l.slug === slug);
  if (!league) return { title: "League Not Found" };

  return {
    title: `${league.name} - Football Wiki`,
    description: `Overview of ${league.name}`,
  };
}

export default async function LeaguePage({ params }: PageProps) {
  const { slug } = await params;
  const league = LEAGUES.find((l) => l.slug === slug);

  if (!league) {
    notFound();
  }

  const [standings, topScorers, upcomingMatches, recentMatches, videos, transfers] =
    await Promise.all([
      findStandingsByLeague(slug),
      findTopScorersByLeague(slug),
      findUpcomingMatches(slug, 10),
      findRecentMatches(slug, 10),
      findVideosByLeague(slug),
      findRecentByLeague(slug, 20),
    ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4">
        <LeagueIcon slug={slug} size="lg" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {league.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{league.country}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <StandingsTable standings={standings} />
          <TopScorers scorers={topScorers} />
        </div>

        <div className="space-y-8">
          <LeagueFixtures fixtures={upcomingMatches} />
          <LeagueResults results={recentMatches} />
        </div>
      </div>

      {videos.length > 0 && <LeagueHighlights videos={videos} />}

      {transfers.length > 0 && (
        <TransferHistory transfers={transfers} showTeamFilter />
      )}
    </div>
  );
}
