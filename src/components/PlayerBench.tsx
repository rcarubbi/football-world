import type { Lineup } from "@/lib/db/lineups";

interface PlayerBenchProps {
  players: Lineup[];
}

export function PlayerBench({ players }: PlayerBenchProps) {
  if (players.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        Substitutes
      </p>
      <div className="flex flex-wrap gap-2">
        {players.map((player) => (
          <div
            key={player.id}
            className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs"
          >
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {player.player_number}
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              {player.player_name?.split(" ").pop()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
