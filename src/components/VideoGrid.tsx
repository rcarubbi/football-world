"use client";

import { useState } from "react";
import { Video } from "@/lib/db/videos";
import { Card, CardContent } from "./ui/Card";
import { Modal } from "./ui/Modal";
import { Play } from "lucide-react";
import Image from "next/image";

interface VideoGridProps {
  videos: Video[];
}

export function VideoGrid({ videos }: VideoGridProps) {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  if (videos.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Highlights
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((video) => (
          <Card
            key={video.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedVideo(video)}
          >
            <CardContent className="p-0">
              <div className="relative aspect-video">
                {video.thumbnail_url ? (
                  <Image
                    src={video.thumbnail_url}
                    alt={video.title || ""}
                    fill
                    className="object-cover rounded-t-xl"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 dark:bg-gray-800 rounded-t-xl flex items-center justify-center">
                    <Play className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
                    <Play className="w-6 h-6 text-white ml-1" />
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2">
                  {video.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {video.channel_name}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={!!selectedVideo}
        onClose={() => setSelectedVideo(null)}
        className="aspect-video"
      >
        {selectedVideo && (
          <iframe
            src={`https://www.youtube.com/embed/${selectedVideo.video_id}`}
            title={selectedVideo.title || ""}
            className="w-full h-full rounded-xl"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </Modal>
    </div>
  );
}
