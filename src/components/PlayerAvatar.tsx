"use client";

import { useState } from "react";
import { PlayerSilhouette } from "./PlayerSilhouette";

interface PlayerAvatarProps {
  photoUrl: string | null | undefined;
  name: string;
  className?: string;
}

export function PlayerAvatar({ photoUrl, name, className = "w-12 h-12" }: PlayerAvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);

  if (!photoUrl || imgFailed) {
    return <PlayerSilhouette className={className} />;
  }

  return (
    <img
      src={photoUrl}
      alt={name}
      className={className}
      onError={() => setImgFailed(true)}
    />
  );
}
