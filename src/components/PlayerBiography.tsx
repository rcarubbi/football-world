import { Player } from "@/lib/db/players";

interface PlayerBiographyProps {
  player: Player;
}

export function PlayerBiography({ player }: PlayerBiographyProps) {
  if (!player.career_summary) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
        Biography
      </h2>
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
          {player.career_summary}
        </p>
      </div>
    </div>
  );
}
