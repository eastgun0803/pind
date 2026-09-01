"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { MapWrapper } from "@/components/MapWrapper";
import { MobileOverlay } from "@/components/MobileOverlay";
import { HistorySidebar } from "@/components/HistorySidebar";
import { CheckedVideosPanel } from "@/components/CheckedVideosPanel";
import { VideoForm } from "@/components/VideoForm";
import { useVideos } from "@/hooks/useVideos";

export function PindDashboard() {
  const { data: videos = [] } = useVideos();
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [showMobileOverlay, setShowMobileOverlay] = useState(false);

  const handleVideoToggle = (videoId: string) => {
    setSelectedVideos((prev) =>
      prev.includes(videoId) ? prev.filter((id) => id !== videoId) : [...prev, videoId],
    );
  };

  return (
    <div className="h-screen flex bg-gray-50 relative">
      {/* 검색바는 데스크톱/모바일 공용으로 단 하나만 마운트 (VideoForm이 Supabase Realtime 채널을 구독하므로 중복 마운트 시 구독 충돌 발생) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 md:left-[calc(50%+10rem)] z-[1000] w-[calc(100%-5rem)] md:w-full max-w-xl md:px-4">
        <VideoForm />
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex w-full">
        <div className="w-80 flex-shrink-0">
          <HistorySidebar
            videos={videos}
            selectedVideos={selectedVideos}
            onVideoToggle={handleVideoToggle}
          />
        </div>

        {selectedVideos.length > 0 && (
          <div className="w-80 flex-shrink-0">
            <CheckedVideosPanel
              videos={videos}
              selectedVideos={selectedVideos}
              onClose={() => setSelectedVideos([])}
            />
          </div>
        )}

        <div className="flex-1">
          <MapWrapper videoIds={selectedVideos} />
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden w-full relative">
        <MapWrapper videoIds={selectedVideos} />

        <Button
          onClick={() => setShowMobileOverlay(true)}
          className="absolute top-4 left-4 z-[1000] w-12 h-12 rounded-full shadow-lg"
          size="icon"
        >
          <Menu className="w-5 h-5" />
        </Button>

        <MobileOverlay
          isOpen={showMobileOverlay}
          videos={videos}
          selectedVideos={selectedVideos}
          onClose={() => setShowMobileOverlay(false)}
          onVideoToggle={handleVideoToggle}
        />
      </div>
    </div>
  );
}
