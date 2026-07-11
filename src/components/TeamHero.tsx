import { Team } from "@/lib/db/teams";
import { TeamBadge } from "./TeamBadge";
import { LeagueBadge } from "./LeagueBadge";

interface TeamHeroProps {
  team: Team;
}

export function TeamHero({ team }: TeamHeroProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
      <TeamBadge badgeUrl={team.badge_url} teamName={team.name} size="lg" />
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {team.name}
        </h1>
        <div className="flex flex-wrap items-center gap-3 mt-2">
          <LeagueBadge leagueSlug={team.league_slug} />
          {team.founded && (
            <span className="text-gray-600 dark:text-gray-400">
              Founded {team.founded}
            </span>
          )}
          {team.stadium && (
            <span className="text-gray-600 dark:text-gray-400">
              {team.stadium}
            </span>
          )}
          {team.location && (
            <span className="text-gray-600 dark:text-gray-400">
              {team.location}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
