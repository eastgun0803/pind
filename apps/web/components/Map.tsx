"use client";

import "leaflet/dist/leaflet.css";

import { useEffect, useMemo, useRef } from "react";

import L from "leaflet";

import { usePlacesByVideo, usePlacesByVideos } from "@/hooks/usePlacesByVideo";
import type { PlaceDTO } from "@/lib/dto";
import { PLACE_TYPE_PIN_COLOR, toPlaceType } from "@/lib/placeType";
import { useVideoStore } from "@/stores/videoStore";

// Leaflet 기본 마커 아이콘 CDN 고정 (Next.js webpack 빌드에서 경로 깨짐 방지)
const DEFAULT_ICON = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DEFAULT_ICON;

const SEOUL_CENTER: [number, number] = [37.5665, 126.978];

function coloredDivIcon(place: PlaceDTO, selected: boolean): L.DivIcon {
  const color = PLACE_TYPE_PIN_COLOR[toPlaceType(place.category)];
  const size = selected ? 34 : 28;
  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${color};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;transform:translate(-50%,-50%);"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function buildPopupHtml(place: PlaceDTO): string {
  let youtubeEmbed = "";
  if (place.video_url) {
    const match = place.video_url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if (match) {
      const ytId = match[1];
      const startSec = place.context_start_sec;
      youtubeEmbed = `
        <div style="margin-top:8px">
          <iframe
            width="240" height="135"
            src="https://www.youtube.com/embed/${ytId}?start=${startSec}"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            style="border-radius:6px"
          ></iframe>
        </div>`;
    }
  }
  return `
    <div style="min-width:160px">
      <strong style="font-size:14px">${place.name}</strong>
      ${place.category ? `<span style="font-size:12px;color:#666;margin-left:6px">${place.category}</span>` : ""}
      ${youtubeEmbed}
    </div>`;
}

interface MapProps {
  videoId?: string;
  /** 여러 영상을 동시에 필터링할 때 사용 (체크된 영상 목록 등). 지정 시 videoId보다 우선. */
  videoIds?: string[];
  /** 직접 장소 목록을 넘길 때 사용 (영상/체크박스 기반 자동 조회를 건너뜀). */
  places?: PlaceDTO[];
  /** places를 직접 넘길 때만 유효: 타입별 색상 핀 + 선택 상태 하이라이트. */
  selectedPlaceId?: string;
  onSelectPlace?: (place: PlaceDTO) => void;
}

export function Map({ videoId, videoIds, places: placesProp, selectedPlaceId, onSelectPlace }: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  const { latestVideoId } = useVideoStore();
  const filterVideoId = videoId ?? latestVideoId ?? undefined;

  const useExplicitPlaces = !!placesProp;
  const useMulti = !useExplicitPlaces && !!videoIds && videoIds.length > 0;

  const multiResults = usePlacesByVideos(!useExplicitPlaces && useMulti ? videoIds! : []);
  const singleResult = usePlacesByVideo(!useExplicitPlaces && !useMulti ? filterVideoId : undefined);

  const places: PlaceDTO[] = useMemo(() => {
    if (useExplicitPlaces) return placesProp!;
    return useMulti ? multiResults.flatMap((r) => r.data ?? []) : (singleResult.data ?? []);
  }, [useExplicitPlaces, placesProp, useMulti, multiResults, singleResult.data]);

  // 지도 초기화 (한 번만)
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView(SEOUL_CENTER, 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // places/선택 상태 변경 시 마커 갱신
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    places.forEach((place) => {
      const marker = L.marker([place.lat, place.lng], {
        icon: useExplicitPlaces ? coloredDivIcon(place, place.id === selectedPlaceId) : undefined,
      }).addTo(map);

      if (onSelectPlace) {
        marker.on("click", () => onSelectPlace(place));
      } else {
        marker.bindPopup(buildPopupHtml(place), { maxWidth: 280 });
      }
      markersRef.current.push(marker);
    });

    if (places.length > 0) {
      const group = L.featureGroup(markersRef.current);
      map.fitBounds(group.getBounds(), { padding: [40, 40] });
    }
  }, [places, selectedPlaceId, useExplicitPlaces, onSelectPlace]);

  return <div ref={containerRef} className="h-full w-full" />;
}
