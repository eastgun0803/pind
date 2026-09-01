"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

import { usePlacesByVideo, usePlacesByVideos } from "@/hooks/usePlacesByVideo";
import type { PlaceDTO } from "@/lib/dto";
import { googleMapsUrl } from "@/lib/googleMaps";
import { PLACE_TYPE_PIN_COLOR, toPlaceType } from "@/lib/placeType";
import { useVideoStore } from "@/stores/videoStore";

const SEOUL_CENTER: google.maps.LatLngLiteral = { lat: 37.5665, lng: 126.978 };

let mapsLoadPromise: Promise<void> | null = null;

/** Google Maps JS API는 window를 직접 건드리므로 클라이언트에서 한 번만 로드한다. */
function loadGoogleMaps(): Promise<void> {
  if (!mapsLoadPromise) {
    setOptions({ key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "", v: "weekly" });
    mapsLoadPromise = Promise.all([
      importLibrary("maps"),
      importLibrary("marker"),
      importLibrary("places"),
    ]).then(() => undefined);
  }
  return mapsLoadPromise;
}

function pinIcon(color: string, size: number): google.maps.Icon {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="${color}" stroke="white" stroke-width="2"/></svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(size / 2, size / 2),
  };
}

interface PlaceDetails {
  rating?: number;
  userRatingCount?: number;
  photoUrl?: string;
  address?: string;
  openNow?: boolean;
}

async function fetchPlaceDetails(googlePlaceId: string): Promise<PlaceDetails | null> {
  try {
    const { Place } = await importLibrary("places");
    const { place } = await new Place({ id: googlePlaceId }).fetchFields({
      fields: ["rating", "userRatingCount", "photos", "formattedAddress", "regularOpeningHours"],
    });
    const openNow = place.regularOpeningHours ? await place.isOpen() : undefined;
    return {
      rating: place.rating ?? undefined,
      userRatingCount: place.userRatingCount ?? undefined,
      photoUrl: place.photos?.[0]?.getURI({ maxWidth: 320 }),
      address: place.formattedAddress ?? undefined,
      openNow,
    };
  } catch {
    return null;
  }
}

function youtubeEmbedUrl(place: PlaceDTO): string | null {
  if (!place.video_url) return null;
  const match = place.video_url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (!match) return null;
  return `https://www.youtube.com/embed/${match[1]}?start=${place.context_start_sec}`;
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
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<globalThis.Map<string, google.maps.Marker>>(new globalThis.Map());
  const [ready, setReady] = useState(false);

  // 내부 선택 상태 — 부모가 selectedPlaceId를 넘기지 않는 화면(여러 영상 개요 지도)에서
  // 핀을 직접 클릭했을 때도 상세 카드를 띄우기 위한 fallback.
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);
  const [details, setDetails] = useState<PlaceDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

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

  const effectiveSelectedId = selectedPlaceId ?? internalSelectedId;
  const selectedPlace = places.find((p) => p.id === effectiveSelectedId) ?? null;

  // 지도 초기화 (한 번만)
  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    loadGoogleMaps().then(() => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      mapRef.current = new google.maps.Map(containerRef.current, {
        center: SEOUL_CENTER,
        zoom: 12,
        streetViewControl: false,
        fullscreenControl: false,
      });
      setReady(true);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // places/선택 상태 변경 시 마커 갱신
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current.clear();

    const bounds = new google.maps.LatLngBounds();

    places.forEach((place) => {
      const selected = place.id === effectiveSelectedId;
      const marker = new google.maps.Marker({
        position: { lat: place.lat, lng: place.lng },
        map,
        icon: useExplicitPlaces
          ? pinIcon(PLACE_TYPE_PIN_COLOR[toPlaceType(place.category)], selected ? 34 : 28)
          : undefined,
        zIndex: selected ? 999 : undefined,
      });

      marker.addListener("click", () => {
        if (onSelectPlace) onSelectPlace(place);
        else setInternalSelectedId(place.id);
      });

      markersRef.current.set(place.id, marker);
      bounds.extend({ lat: place.lat, lng: place.lng });
    });

    if (!effectiveSelectedId && places.length > 0) {
      map.fitBounds(bounds, 40);
    }
  }, [places, effectiveSelectedId, useExplicitPlaces, onSelectPlace, ready]);

  // 선택된 장소로 카메라를 부드럽게 이동 (핀 클릭이든 외부 목록 클릭이든 동일하게 동작)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !selectedPlace) return;
    map.panTo({ lat: selectedPlace.lat, lng: selectedPlace.lng });
    if ((map.getZoom() ?? 0) < 16) map.setZoom(16);
  }, [selectedPlace, ready]);

  // 선택된 장소의 구글 상세정보(평점·사진·주소·영업 여부) 조회
  useEffect(() => {
    if (!selectedPlace?.google_place_id) {
      setDetails(null);
      return;
    }
    let cancelled = false;
    setDetailsLoading(true);
    fetchPlaceDetails(selectedPlace.google_place_id).then((d) => {
      if (!cancelled) {
        setDetails(d);
        setDetailsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [selectedPlace?.google_place_id]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />

      {selectedPlace && (() => {
        const embedUrl = onSelectPlace ? null : youtubeEmbedUrl(selectedPlace);
        return (
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:w-80 bg-white rounded-xl shadow-xl border border-border overflow-hidden">
          {details?.photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={details.photoUrl} alt={selectedPlace.name} className="w-full h-32 object-cover" />
          )}
          <div className="p-3 space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-foreground leading-tight">{selectedPlace.name}</p>
              {!selectedPlaceId && (
                <button
                  onClick={() => setInternalSelectedId(null)}
                  className="text-muted-foreground hover:text-foreground text-xs flex-shrink-0"
                >
                  ✕
                </button>
              )}
            </div>
            {detailsLoading && <p className="text-xs text-muted-foreground">상세정보 불러오는 중...</p>}
            {details?.rating && (
              <p className="text-xs text-muted-foreground">
                ⭐ {details.rating.toFixed(1)}
                {details.userRatingCount ? ` (${details.userRatingCount.toLocaleString()})` : ""}
                {details.openNow !== undefined && (
                  <span className={details.openNow ? "text-green-600" : "text-destructive"}>
                    {" "}
                    · {details.openNow ? "영업 중" : "영업 종료"}
                  </span>
                )}
              </p>
            )}
            {details?.address && <p className="text-xs text-muted-foreground">{details.address}</p>}
            {embedUrl && (
              <iframe
                width="100%"
                height="135"
                src={embedUrl}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded-lg border-0 mt-1"
              />
            )}
            <a
              href={googleMapsUrl(selectedPlace)}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-xs font-medium text-primary hover:underline pt-1"
            >
              구글맵에서 상세히 보기 →
            </a>
          </div>
        </div>
        );
      })()}
    </div>
  );
}
