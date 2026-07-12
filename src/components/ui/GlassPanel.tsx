import { ReactNode } from "react";

export function GlassPanel({
  children,
  className = "",
  intensity = "md",
}: {
  children: ReactNode;
  className?: string;
  intensity?: "sm" | "md" | "lg";
}) {
  const bg =
    intensity === "sm"
      ? "bg-background/10"
      : intensity === "lg"
        ? "bg-background/10"
        : "bg-background/10";

  return (
    <div
      className={`${bg} backdrop-blur-md rounded-2xl border border-white/10 shadow-lg ${className}`}
    >
      {children}
    </div>
  );
}
