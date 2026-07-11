import { Match } from "@/lib/db/matches";
import { Card, CardContent } from "./ui/Card";
import { formatDate } from "@/lib/date-format";

interface LeagueFixturesProps {
  fixtures: Match[];
}

export function LeagueFixtures({ fixtures }: LeagueFixturesProps) {
  if (fixtures.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600 dark:text-gray-400">
        No upcoming fixtures
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Upcoming Fixtures
      </h2>
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {fixtures.map((match) => (
              <div
                key={match.id}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {match.match_date ? formatDate(match.match_date) : ""}
                  </span>
                  {match.matchday && (
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      Matchday {match.matchday}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {match.home_team_name}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400 mx-4">
                    vs
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {match.away_team_name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
