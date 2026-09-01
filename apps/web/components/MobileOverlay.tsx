"use client";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { VideoDTO } from "@/lib/dto";
import { HistorySidebar } from "@/components/HistorySidebar";

interface MobileOverlayProps {
  isOpen: boolean;
  videos: VideoDTO[];
  selectedVideos: string[];
  onClose: () => void;
  onVideoToggle: (videoId: string) => void;
}

export function MobileOverlay({
  isOpen,
  videos,
  selectedVideos,
  onClose,
  onVideoToggle,
}: MobileOverlayProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-black/50">
      <div
        className={`absolute inset-y-0 left-0 w-[90%] bg-white transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-end p-2 border-b border-gray-200">
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex-1 min-h-0">
            <HistorySidebar
              videos={videos}
              selectedVideos={selectedVideos}
              onVideoToggle={onVideoToggle}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
