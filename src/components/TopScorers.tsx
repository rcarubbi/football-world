import { TopScorer } from "@/lib/db/top-scorers";
import { Card, CardContent } from "./ui/Card";

interface TopScorersProps {
  scorers: TopScorer[];
}

export function TopScorers({ scorers }: TopScorersProps) {
  if (scorers.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600 dark:text-gray-400">
        No top scorers available
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Top Scorers
      </h2>
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {scorers.map((scorer, index) => (
              <div
                key={scorer.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <div className="flex items-center space-x-4">
                  <span className="text-lg font-bold text-gray-900 dark:text-white w-8">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {scorer.player_name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {scorer.team_name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {scorer.goals}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {scorer.assists} assists
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
