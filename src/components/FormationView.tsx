import type { Lineup } from "@/lib/db/lineups";

interface FormationViewProps {
  players: Lineup[];
}

const positionGroups: Record<string, string[]> = {
  GK: ["GK"],
  DEF: ["CB", "LB", "RB", "LWB", "RWB"],
  MID: ["CDM", "CM", "CAM", "LM", "RM"],
  FWD: ["ST", "CF", "LW", "RW"],
};

function getPositionGroup(position: string): string {
  for (const [group, positions] of Object.entries(positionGroups)) {
    if (positions.includes(position)) return group;
  }
  return "MID";
}

export function FormationView({ players }: FormationViewProps) {
  const grouped = {
    FWD: players.filter((p) => getPositionGroup(p.position || "") === "FWD"),
    MID: players.filter((p) => getPositionGroup(p.position || "") === "MID"),
    DEF: players.filter((p) => getPositionGroup(p.position || "") === "DEF"),
    GK: players.filter((p) => getPositionGroup(p.position || "") === "GK"),
  };

  return (
    <div className="relative w-full h-48 bg-green-100 dark:bg-green-900 rounded-lg overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/2 left-0 right-0 h-px bg-white" />
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white" />
        <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 border border-white rounded-full" />
      </div>

      <div className="relative h-full flex flex-col justify-between py-4 px-2">
        {grouped.FWD.length > 0 && (
          <div className="flex justify-around">
            {grouped.FWD.map((player) => (
              <div
                key={player.id}
                className="flex flex-col items-center"
              >
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {player.player_number}
                </div>
                <span className="text-xs mt-1 text-gray-700 dark:text-gray-300 text-center max-w-[60px] truncate">
                  {player.player_name?.split(" ").pop()}
                </span>
              </div>
            ))}
          </div>
        )}

        {grouped.MID.length > 0 && (
          <div className="flex justify-around">
            {grouped.MID.map((player) => (
              <div
                key={player.id}
                className="flex flex-col items-center"
              >
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {player.player_number}
                </div>
                <span className="text-xs mt-1 text-gray-700 dark:text-gray-300 text-center max-w-[60px] truncate">
                  {player.player_name?.split(" ").pop()}
                </span>
              </div>
            ))}
          </div>
        )}

        {grouped.DEF.length > 0 && (
          <div className="flex justify-around">
            {grouped.DEF.map((player) => (
              <div
                key={player.id}
                className="flex flex-col items-center"
              >
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {player.player_number}
                </div>
                <span className="text-xs mt-1 text-gray-700 dark:text-gray-300 text-center max-w-[60px] truncate">
                  {player.player_name?.split(" ").pop()}
                </span>
              </div>
            ))}
          </div>
        )}

        {grouped.GK.length > 0 && (
          <div className="flex justify-center">
            {grouped.GK.map((player) => (
              <div
                key={player.id}
                className="flex flex-col items-center"
              >
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {player.player_number}
                </div>
                <span className="text-xs mt-1 text-gray-700 dark:text-gray-300 text-center max-w-[60px] truncate">
                  {player.player_name?.split(" ").pop()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
