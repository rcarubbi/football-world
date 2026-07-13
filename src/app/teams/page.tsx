import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { LeagueIcon } from "@/components/LeagueIcon";
import { Users, Search } from "lucide-react";
import { stripAccents } from "@/lib/utils";
import { LEAGUES } from "@/lib/leagues";
import { ShareButton } from "@/components/ShareButton";
import type { Metadata } from "next";
import { findAllTeamsWithPlayerCount } from "@/lib/db/teams";

export const metadata: Metadata = {
  title: "Teams | Football World",
  description: "Explore all football teams",
  openGraph: {
    title: "Teams | Football World",
    description: "Explore all football teams",
  },
};

export default async function TimesPage({
  searchParams,
}: {
  searchParams: Promise<{ league?: string; q?: string }>;
}) {
  const params = await searchParams;
  const leagueFilter = params.league;
  const searchQuery = params.q;

  let teams = await findAllTeamsWithPlayerCount();

  const leagueCounts = teams.reduce((acc, t) => {
    const slug = t.league_slug as string;
    acc[slug] = (acc[slug] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (leagueFilter) {
    teams = teams.filter((t) => t.league_slug === leagueFilter);
  }

  if (searchQuery) {
    const q = stripAccents(searchQuery).toLowerCase();
    teams = teams.filter((t) => stripAccents(t.name as string).toLowerCase().includes(q));
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <GlassPanel className="p-6 mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 flex-1">
            <Users className="w-8 h-8 inline-block mr-2 text-primary" />
            Teams
          </h1>
          <ShareButton title="Teams | Football World" />
        </div>
        <p className="text-red-400 dark:text-red-300">
          {teams.length} teams available
        </p>
      </GlassPanel>

      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/teams"
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            !leagueFilter ? "bg-primary text-primary-foreground" : "bg-background/10 backdrop-blur-md text-red-400 dark:text-red-300 hover:bg-background/20 border border-white/10"
          }`}
        >
          All
        </Link>
        {LEAGUES.filter((l) => leagueCounts[l.slug]).map((league) => (
          <Link
            key={league.slug}
            href={`/teams?league=${league.slug}`}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              leagueFilter === league.slug ? "bg-primary text-primary-foreground" : "bg-background/10 backdrop-blur-md text-red-400 dark:text-red-300 hover:bg-background/20 border border-white/10"
            }`}
          >
            <LeagueIcon slug={league.slug} className="w-5 h-5 text-[10px]" />
            {league.name} ({leagueCounts[league.slug]})
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {teams.map((team) => (
          <Link key={team.slug as string} href={`/teams/${team.slug}`}>
            <Card hover className="p-4 text-center h-full">
              {team.badge_url ? (
                <img
                  src={team.badge_url as string}
                  alt={team.name as string}
                  className="w-16 h-16 object-contain mx-auto mb-3"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
                  <Users className="w-6 h-6 text-red-400 dark:text-red-300" />
                </div>
              )}
              <div className="font-medium text-sm leading-tight">{team.name as string}</div>
              <div className="text-xs text-red-400 dark:text-red-300 mt-1">
                    {team.player_count as number} players
              </div>
              <div className="mt-2">
                <LeagueIcon slug={team.league_slug as string} className="w-5 h-5 text-[8px] mx-auto" />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {teams.length === 0 && (
        <div className="text-center py-16">
          <Search className="w-12 h-12 text-red-400 dark:text-red-300 mx-auto mb-4" />
          <p className="text-red-400 dark:text-red-300">No teams found</p>
        </div>
      )}
    </div>
  );
}
