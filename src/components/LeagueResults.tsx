import { Match } from "@/lib/db/matches";
import { Card, CardContent } from "./ui/Card";
import { formatDate } from "@/lib/date-format";

interface LeagueResultsProps {
  results: Match[];
}

export function LeagueResults({ results }: LeagueResultsProps) {
  if (results.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600 dark:text-gray-400">
        No recent results
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Recent Results
      </h2>
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {results.map((match) => (
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
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400 mx-4">
                    {match.home_score} - {match.away_score}
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
