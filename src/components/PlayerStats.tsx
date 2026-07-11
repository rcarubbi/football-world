import { Player } from "@/lib/db/players";
import { Card, CardContent } from "./ui/Card";

interface PlayerStatsProps {
  player: Player;
}

export function PlayerStats({ player }: PlayerStatsProps) {
  return (
    <Card>
      <CardContent>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Career Statistics
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              --
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Appearances
            </p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              --
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Goals</p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              --
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Assists</p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              --
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Clean Sheets
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
