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
      ? "bg-background/20"
      : intensity === "lg"
        ? "bg-background/40"
        : "bg-background/30";

  return (
    <div
      className={`${bg} backdrop-blur-md rounded-2xl border border-white/10 shadow-lg ${className}`}
    >
      {children}
    </div>
  );
}
