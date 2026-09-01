"use client";

import type { ReactNode } from "react";

import { Download, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePlacesByVideos } from "@/hooks/usePlacesByVideo";
import type { VideoDTO } from "@/lib/dto";

interface HistorySidebarProps {
  videos: VideoDTO[];
  selectedVideos: string[];
  onVideoToggle: (videoId: string) => void;
}

const STATUS_ICON: Record<VideoDTO["status"], ReactNode> = {
  pending: <Clock className="w-5 h-5 text-gray-400" />,
  processing: <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />,
  completed: <CheckCircle2 className="w-5 h-5 text-green-600" />,
  failed: <XCircle className="w-5 h-5 text-destructive" />,
};

function VideoThumbnailPlaceholder({ status }: { status: VideoDTO["status"] }) {
  return (
    <div className="flex h-[60px] w-[80px] flex-shrink-0 items-center justify-center rounded bg-gray-100">
      {STATUS_ICON[status]}
    </div>
  );
}

export function HistorySidebar({ videos, selectedVideos, onVideoToggle }: HistorySidebarProps) {
  const placesResults = usePlacesByVideos(videos.map((v) => v.id));

  return (
    <div className="h-full bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Pind</h1>
        <p className="text-sm text-gray-600 mt-1">History</p>
      </div>

      {videos.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <Download className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-gray-600 mb-6 text-sm leading-relaxed">
            PIND 익스텐션을 사용해
            <br />첫 장소들을 찾아보세요!
          </p>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Download className="w-4 h-4 mr-2" />
            Download Extension
          </Button>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="space-y-2 p-4">
            {videos.map((video, index) => {
              const locationCount = placesResults[index]?.data?.length ?? 0;
              return (
                <div
                  key={video.id}
                  className="flex p-3 rounded-lg hover:bg-gray-50 transition-colors items-center space-x-3"
                >
                  <Checkbox
                    checked={selectedVideos.includes(video.id)}
                    onCheckedChange={() => onVideoToggle(video.id)}
                    className="mt-1"
                  />
                  <div className="flex-shrink-0">
                    <VideoThumbnailPlaceholder status={video.status} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                      {video.title ?? video.url}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {new Date(video.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {locationCount} location{locationCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
