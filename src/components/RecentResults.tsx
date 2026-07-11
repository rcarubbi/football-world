import { Match } from "@/lib/db/matches";
import { Card, CardContent } from "./ui/Card";
import { formatDate } from "@/lib/date-format";

interface RecentResultsProps {
  results: Match[];
}

export function RecentResults({ results }: RecentResultsProps) {
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
            {results.slice(0, 5).map((match) => (
              <div
                key={match.id}
                className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <div className="text-xs text-gray-500 dark:text-gray-500 mb-1">
                  {match.match_date ? formatDate(match.match_date) : ""}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-white flex-1 truncate">
                    {match.home_team_name}
                  </span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400 mx-2">
                    {match.home_score} - {match.away_score}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white flex-1 truncate text-right">
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
