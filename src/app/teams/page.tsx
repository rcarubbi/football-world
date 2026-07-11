import { findAllTeams } from "@/lib/db/teams";
import { LEAGUES } from "@/lib/leagues";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { TeamBadge } from "@/components/TeamBadge";
import { LeagueBadge } from "@/components/LeagueBadge";

export const metadata = {
  title: "Teams - Football Wiki",
  description: "Browse all football teams",
};

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ league?: string }>;
}) {
  const { league: leagueFilter } = await searchParams;
  const teams = await findAllTeams();

  const filteredTeams = leagueFilter
    ? teams.filter((t) => t.league_slug === leagueFilter)
    : teams;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Teams
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Browse teams across all leagues
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/teams"
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            !leagueFilter
              ? "bg-blue-600 text-white"
              : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700"
          }`}
        >
          All
        </Link>
        {LEAGUES.map((league) => (
          <Link
            key={league.slug}
            href={`/teams?league=${league.slug}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              leagueFilter === league.slug
                ? "bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            {league.name}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTeams.map((team) => (
          <Link key={team.id} href={`/teams/${team.slug}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="flex items-center space-x-4 p-4">
                <TeamBadge badgeUrl={team.badge_url} teamName={team.name} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                    {team.name}
                  </h3>
                  <LeagueBadge leagueSlug={team.league_slug} size="sm" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
