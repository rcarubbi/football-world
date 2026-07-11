import Image from "next/image";

interface TeamBadgeProps {
  badgeUrl: string | null;
  teamName: string;
  size?: "sm" | "md" | "lg";
}

export function TeamBadge({ badgeUrl, teamName, size = "md" }: TeamBadgeProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  if (!badgeUrl) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center`}
      >
        <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">
          {teamName.charAt(0)}
        </span>
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} relative`}>
      <Image
        src={badgeUrl}
        alt={`${teamName} badge`}
        fill
        className="object-contain"
        sizes="(max-width: 768px) 32px, (max-width: 1024px) 48px, 64px"
      />
    </div>
  );
}
