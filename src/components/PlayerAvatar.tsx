"use client";

import { useState } from "react";

const FALLBACK_SRC = "/images/players/placeholder.png";

interface PlayerAvatarProps {
  photoUrl: string | null | undefined;
  name: string;
  className?: string;
}

export function PlayerAvatar({ photoUrl, name, className = "w-12 h-12" }: PlayerAvatarProps) {
  const [src, setSrc] = useState(photoUrl || FALLBACK_SRC);

  return (
    <img
      src={src}
      alt={name}
      className={className}
      onError={() => setSrc(FALLBACK_SRC)}
    />
  );
}
