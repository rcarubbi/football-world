import Link from "next/link";
import { getTursoClient } from "@/lib/turso/client";
import { Card } from "@/components/ui/Card";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { LeagueIcon } from "@/components/LeagueIcon";
import { Users, Search } from "lucide-react";
import { stripAccents } from "@/lib/utils";
import { LEAGUES } from "@/lib/leagues";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Teams | Football World",
  description: "Explore all football teams",
};

async function getAllTeams() {
  const client = getTursoClient();
  const result = await client.execute(`
    SELECT t.id, t.name, t.slug, t.badge_url, t.league_slug, t.stadium,
           COUNT(p.id) as player_count
    FROM teams t
    LEFT JOIN players p ON p.team_id = t.id
    GROUP BY t.id
    ORDER BY t.name
  `);
  return result.rows;
}

export default async function TimesPage({
  searchParams,
}: {
  searchParams: Promise<{ league?: string; q?: string }>;
}) {
  const params = await searchParams;
  const leagueFilter = params.league;
  const searchQuery = params.q;

  let teams = await getAllTeams();

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
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">
          <Users className="w-8 h-8 inline-block mr-2 text-primary" />
          Teams
        </h1>
        <p className="text-muted-foreground">
          {teams.length} teams available
        </p>
      </GlassPanel>

      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/teams"
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            !leagueFilter ? "bg-primary text-primary-foreground" : "bg-muted/80 backdrop-blur-md text-muted-foreground hover:bg-muted/60 border border-white/10"
          }`}
        >
          All
        </Link>
        {LEAGUES.filter((l) => leagueCounts[l.slug]).map((league) => (
          <Link
            key={league.slug}
            href={`/teams?league=${league.slug}`}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              leagueFilter === league.slug ? "bg-primary text-primary-foreground" : "bg-muted/80 backdrop-blur-md text-muted-foreground hover:bg-muted/60 border border-white/10"
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
                  <Users className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              <div className="font-medium text-sm leading-tight">{team.name as string}</div>
              <div className="text-xs text-muted-foreground mt-1">
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
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No teams found</p>
        </div>
      )}
    </div>
  );
}
