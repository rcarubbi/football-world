import { Player } from "@/lib/db/players";
import Image from "next/image";

interface PlayerHeroProps {
  player: Player;
}

export function PlayerHero({ player }: PlayerHeroProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
      {player.photo_url ? (
        <div className="w-32 h-32 relative">
          <Image
            src={player.photo_url}
            alt={player.name}
            fill
            className="rounded-full object-cover"
            sizes="128px"
          />
        </div>
      ) : (
        <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          <span className="text-gray-500 dark:text-gray-400 text-4xl">
            {player.name.charAt(0)}
          </span>
        </div>
      )}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {player.name}
        </h1>
        <div className="flex flex-wrap items-center gap-3 mt-2">
          {player.position && (
            <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium">
              {player.position}
            </span>
          )}
          {player.nationality && (
            <span className="text-gray-600 dark:text-gray-400">
              {player.nationality}
            </span>
          )}
          {player.date_of_birth && (
            <span className="text-gray-600 dark:text-gray-400">
              Born {new Date(player.date_of_birth).toLocaleDateString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
          {player.height && <span>Height: {player.height}</span>}
          {player.weight && <span>Weight: {player.weight}</span>}
        </div>
      </div>
    </div>
  );
}
