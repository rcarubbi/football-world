import { Team } from "@/lib/db/teams";
import { Card, CardContent } from "./ui/Card";
import { TeamBadge } from "./TeamBadge";
import Link from "next/link";

interface PlayerCurrentTeamProps {
  team: Team;
}

export function PlayerCurrentTeam({ team }: PlayerCurrentTeamProps) {
  return (
    <Card>
      <CardContent>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Current Team
        </h2>
        <Link
          href={`/teams/${team.slug}`}
          className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <TeamBadge badgeUrl={team.badge_url} teamName={team.name} />
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {team.name}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {team.league_slug.replace(/-/g, " ")}
            </p>
          </div>
        </Link>
      </CardContent>
    </Card>
  );
}
