"use client";

import { MapPin, Tag, X } from "lucide-react";

import type { PlaceDTO } from "@/lib/dto";
import { toPlaceType } from "@/lib/placeType";

interface EvidenceModalProps {
  place: PlaceDTO;
  onClose: () => void;
}

function formatTimestamp(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function EvidenceModal({ place, onClose }: EvidenceModalProps) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">추출 근거</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {place.frame_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={place.frame_image_url}
              alt={`${place.name} 등장 장면`}
              className="w-full rounded-xl border border-border object-cover aspect-video"
            />
          ) : (
            <div className="w-full aspect-video rounded-xl border border-dashed border-border bg-muted flex items-center justify-center text-center px-4">
              <p className="text-xs text-muted-foreground">
                이 장소는 프레임 근거 이미지가 없어요.
                <br />
                (이 기능 도입 이전에 분석된 영상입니다)
              </p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-sm font-semibold text-foreground">{place.name}</span>
            </div>
            {place.category && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Tag className="w-3.5 h-3.5" />
                <span>
                  {place.category} · {toPlaceType(place.category)}
                </span>
              </div>
            )}
            <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
              <span>신뢰도 {Math.round(place.confidence * 100)}%</span>
              <span>·</span>
              <span>영상 {formatTimestamp(place.context_start_sec)} 지점 등장</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
