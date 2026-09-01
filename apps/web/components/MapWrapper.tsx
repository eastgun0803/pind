"use client";

import dynamic from "next/dynamic";

import type { PlaceDTO } from "@/lib/dto";

// Leaflet은 window 객체를 직접 참조하므로 SSR 비활성화 필수
const Map = dynamic(() => import("./Map").then((m) => m.Map), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-muted">
      <p className="text-sm text-muted-foreground">지도 로딩 중...</p>
    </div>
  ),
});

interface MapWrapperProps {
  videoId?: string;
  videoIds?: string[];
  places?: PlaceDTO[];
  selectedPlaceId?: string;
  onSelectPlace?: (place: PlaceDTO) => void;
}

export function MapWrapper({
  videoId,
  videoIds,
  places,
  selectedPlaceId,
  onSelectPlace,
}: MapWrapperProps) {
  return (
    <Map
      videoId={videoId}
      videoIds={videoIds}
      places={places}
      selectedPlaceId={selectedPlaceId}
      onSelectPlace={onSelectPlace}
    />
  );
}
