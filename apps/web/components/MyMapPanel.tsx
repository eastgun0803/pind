"use client";

import { useEffect, useState } from "react";

import { ExternalLink, ImageIcon, Lock, Navigation, Share2, Zap } from "lucide-react";

import { EvidenceModal } from "@/components/EvidenceModal";
import { MapWrapper } from "@/components/MapWrapper";
import { useMyMaps } from "@/hooks/useMyMaps";
import { usePlacesByIds } from "@/hooks/usePlacesByVideo";
import type { PlaceDTO } from "@/lib/dto";
import { googleMapsUrl } from "@/lib/googleMaps";
import { PLACE_TYPE_BADGE_CLASS, PLACE_TYPE_PIN_COLOR, toPlaceType } from "@/lib/placeType";

interface MyMapPanelProps {
  mapId: string;
  placeIds: string[];
  onShare: () => void;
  isPro: boolean;
  onUpgrade: () => void;
}

/**
 * "길찾기 시작"의 실제 이동 시간·현지 교통 정보는 데모용 목업이다 (Pro 결제/경로 최적화는 MVP 범위 밖, UI만 유지).
 * 순서 변경(위/아래 버튼)은 실제로 collection_places.position에 저장된다.
 */
export function MyMapPanel({ mapId, placeIds, onShare, isPro, onUpgrade }: MyMapPanelProps) {
  const { data: places = [] } = usePlacesByIds(placeIds);
  const { reorderMap } = useMyMaps();
  const [order, setOrder] = useState<PlaceDTO[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDTO | null>(null);
  const [routeStarted, setRouteStarted] = useState(false);
  const [evidencePlace, setEvidencePlace] = useState<PlaceDTO | null>(null);

  useEffect(() => {
    // placeIds 순서(position)대로 정렬해서 로드
    const byId = new Map(places.map((p) => [p.id, p]));
    setOrder(placeIds.map((id) => byId.get(id)).filter((p): p is PlaceDTO => !!p));
  }, [places, placeIds]);

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...order];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setOrder(next);
    setRouteStarted(false);
    reorderMap(mapId, next.map((p) => p.id)).catch(() => {});
  };

  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-card" style={{ height: 520 }}>
      {evidencePlace && <EvidenceModal place={evidencePlace} onClose={() => setEvidencePlace(null)} />}
      <div className="flex h-full">
        <div className="w-64 flex-shrink-0 border-r border-border flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-xs font-semibold text-foreground">
              저장한 장소 <span className="font-mono text-muted-foreground">{order.length}곳</span>
            </span>
            <button
              onClick={onShare}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {order.map((place, i) => {
              const type = toPlaceType(place.category);
              return (
                <div
                  key={place.id}
                  onClick={() => setSelectedPlace(selectedPlace?.id === place.id ? null : place)}
                  className={`flex items-start gap-2 px-3 py-3 cursor-pointer transition-colors ${selectedPlace?.id === place.id ? "bg-secondary" : "hover:bg-muted/40"}`}
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: PLACE_TYPE_PIN_COLOR[type] }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{place.name}</p>
                    <span
                      className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded font-medium ${PLACE_TYPE_BADGE_CLASS[type]}`}
                    >
                      {type}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEvidencePlace(place);
                    }}
                    className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
                    title="추출 근거 보기"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                  </button>
                  <a
                    href={googleMapsUrl(place)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
                    title="구글맵에서 보기"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <div className="flex flex-col gap-0.5 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        move(i, -1);
                      }}
                      disabled={i === 0}
                      className="p-0.5 rounded hover:bg-muted disabled:opacity-20 transition-colors text-muted-foreground"
                    >
                      <svg className="w-3 h-3" viewBox="0 0 12 12">
                        <path d="M6 2L10 9H2Z" fill="currentColor" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        move(i, 1);
                      }}
                      disabled={i === order.length - 1}
                      className="p-0.5 rounded hover:bg-muted disabled:opacity-20 transition-colors text-muted-foreground"
                    >
                      <svg className="w-3 h-3" viewBox="0 0 12 12">
                        <path d="M6 10L2 3H10Z" fill="currentColor" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 border-t border-border">
            {isPro ? (
              <button
                onClick={() => setRouteStarted(true)}
                className={`w-full py-2.5 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 ${routeStarted ? "bg-green-100 text-green-700 border border-green-200" : "bg-accent text-white hover:bg-accent/90"}`}
              >
                <Navigation className="w-3.5 h-3.5" /> {routeStarted ? "안내 중" : "길찾기 시작"}
              </button>
            ) : (
              <button
                onClick={onUpgrade}
                className="w-full py-2.5 text-xs font-semibold rounded-xl border border-dashed border-border bg-muted/50 text-muted-foreground flex items-center justify-center gap-1.5 hover:bg-muted transition-colors"
              >
                <Lock className="w-3.5 h-3.5" /> 길찾기는 Pro 전용
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 relative min-h-0">
            <MapWrapper places={order} selectedPlaceId={selectedPlace?.id} onSelectPlace={setSelectedPlace} />
          </div>
          {!isPro && (
            <div className="border-t border-border bg-gradient-to-br from-secondary to-muted/40 px-4 py-4 flex-shrink-0">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Lock className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground mb-0.5">길찾기 · 경로 요약 · 맞춤 추천</p>
                  <p className="text-[11px] text-muted-foreground mb-2 leading-relaxed">
                    교통편 선택, 최단 경로 안내, 맞춤 추천을 이용하려면 Pro가 필요합니다.
                  </p>
                  <button
                    onClick={onUpgrade}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-[11px] font-semibold rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Zap className="w-3 h-3" /> Pro 시작하기
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
