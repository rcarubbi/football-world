import { notFound } from "next/navigation";
import { findTeamBySlug } from "@/lib/db/teams";
import { findPlayersByTeam } from "@/lib/db/players";
import { findMatchesByTeam } from "@/lib/db/matches";
import { findVideosByTeam } from "@/lib/db/videos";
import { findRecentByTeam } from "@/lib/db/transfers";
import { findRecentByTeam as findLineupsByTeam } from "@/lib/db/lineups";
import { TeamHero } from "@/components/TeamHero";
import { TeamDescription } from "@/components/TeamDescription";
import { SquadTable } from "@/components/SquadTable";
import { RecentResults } from "@/components/RecentResults";
import { UpcomingFixtures } from "@/components/UpcomingFixtures";
import { KitDisplay } from "@/components/KitDisplay";
import { VideoGrid } from "@/components/VideoGrid";
import { TransferHistory } from "@/components/TransferHistory";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const team = await findTeamBySlug(slug);
  if (!team) return { title: "Team Not Found" };

  return {
    title: `${team.name} - Football Wiki`,
    description: `Wiki page for ${team.name}`,
  };
}

export default async function TeamPage({ params }: PageProps) {
  const { slug } = await params;
  const team = await findTeamBySlug(slug);

  if (!team) {
    notFound();
  }

  const [players, matches, videos, transfers, lineups] = await Promise.all([
    findPlayersByTeam(team.id),
    findMatchesByTeam(team.id, 10),
    findVideosByTeam(team.id),
    findRecentByTeam(team.name, 10),
    findLineupsByTeam(team.id, 10),
  ]);

  const recentResults = matches.filter((m) => m.status === "FINISHED");
  const upcomingFixtures = matches.filter(
    (m) => m.status === "SCHEDULED" || m.status === "TIMED"
  );

  const lineupsByMatch: Record<string, typeof lineups> = {};
  for (const lineup of lineups) {
    if (lineup.match_id) {
      if (!lineupsByMatch[lineup.match_id]) {
        lineupsByMatch[lineup.match_id] = [];
      }
      lineupsByMatch[lineup.match_id].push(lineup);
    }
  }

  return (
    <div className="space-y-8">
      <TeamHero team={team} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {team.wikipedia_content && (
            <TeamDescription content={team.wikipedia_content} />
          )}
          <SquadTable players={players} teamSlug={slug} />
        </div>

        <div className="space-y-8">
          <KitDisplay
            homeUrl={team.kit_home_url}
            awayUrl={team.kit_away_url}
            thirdUrl={team.kit_third_url}
          />
          <RecentResults results={recentResults} lineups={lineupsByMatch} />
          <UpcomingFixtures fixtures={upcomingFixtures} />
        </div>
      </div>

      {videos.length > 0 && <VideoGrid videos={videos} />}

      {transfers.length > 0 && (
        <TransferHistory transfers={transfers} />
      )}
    </div>
  );
}
