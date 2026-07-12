"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface Video {
  id: number;
  video_id: string;
  title: string;
  thumbnail_url: string | null;
  channel_name: string | null;
}

interface VideoSectionProps {
  videos: Video[];
  limit?: number;
}

export function VideoSection({ videos, limit }: VideoSectionProps) {
  const [selected, setSelected] = useState<Video | null>(null);
  const [animState, setAnimState] = useState<"closed" | "opening" | "open" | "closing">("closed");
  const [mounted, setMounted] = useState(false);
  const display = limit ? videos.slice(0, limit) : videos;

  useEffect(() => setMounted(true), []);

  const open = (video: Video) => {
    setSelected(video);
    setAnimState("opening");
  };

  const close = () => {
    setAnimState("closing");
    setTimeout(() => {
      setSelected(null);
      setAnimState("closed");
    }, 250);
  };

  useEffect(() => {
    if (animState !== "opening") return;
    requestAnimationFrame(() => setAnimState("open"));
  }, [animState]);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [selected]);

  const isOpen = animState === "open";
  const isClosing = animState === "closing";

  return (
    <>
      <div className="space-y-3">
        {display.map((video) => (
          <button
            key={video.id}
            onClick={() => open(video)}
            className="w-full flex gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors text-left cursor-pointer"
          >
            {video.thumbnail_url ? (
              <img
                src={video.thumbnail_url}
                alt={video.title}
                className="w-20 h-12 object-cover rounded-lg shrink-0"
              />
            ) : null}
            <div className="min-w-0">
              <div className="text-sm font-medium line-clamp-2">{video.title}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {video.channel_name}
              </div>
            </div>
          </button>
        ))}
      </div>

      {mounted && selected && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 md:p-8"
          onClick={close}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80"
            style={{
              opacity: isOpen ? 1 : 0,
              transition: "opacity 250ms ease-out",
            }}
          />

          {/* Modal — flex centered */}
          <div
            className="relative z-10 w-full max-w-4xl"
            style={{
              transform: isOpen ? "scale(1)" : "scale(0.85)",
              opacity: isOpen || isClosing ? 1 : 0,
              transition: "transform 250ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={close}
              className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white/20 transition-colors z-20"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
              <iframe
                src={`https://www.youtube.com/embed/${selected.video_id}?autoplay=1&rel=0`}
                title={selected.title}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
