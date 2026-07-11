"use client";

import { useState } from "react";
import { Video } from "@/lib/db/videos";
import { Modal } from "./ui/Modal";
import { X } from "lucide-react";

interface VideoModalProps {
  video: Video | null;
  onClose: () => void;
}

export function VideoModal({ video, onClose }: VideoModalProps) {
  if (!video) return null;

  return (
    <Modal isOpen={!!video} onClose={onClose} className="aspect-video">
      <iframe
        src={`https://www.youtube.com/embed/${video.video_id}`}
        title={video.title || ""}
        className="w-full h-full rounded-xl"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </Modal>
  );
}
