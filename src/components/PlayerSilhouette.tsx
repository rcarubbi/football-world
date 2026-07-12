export function PlayerSilhouette({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="50" cy="50" r="50" className="fill-muted" />
      <circle cx="50" cy="35" r="14" className="fill-muted-foreground/30" />
      <path
        d="M25 85c0-13.8 11.2-25 25-25s25 11.2 25 25"
        className="fill-muted-foreground/30"
      />
    </svg>
  );
}
