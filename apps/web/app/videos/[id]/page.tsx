"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { ArrowLeft, Bookmark, Check, ChevronRight, ExternalLink, ImageIcon, LogIn, MapPin, Plus, Share2, X } from "lucide-react";

import { EvidenceModal } from "@/components/EvidenceModal";
import { MapWrapper } from "@/components/MapWrapper";
import { ShareModal } from "@/components/ShareModal";
import { useAuth } from "@/hooks/useAuth";
import { useVideo } from "@/hooks/useVideo";
import { usePlacesByVideo } from "@/hooks/usePlacesByVideo";
import { useMyMaps } from "@/hooks/useMyMaps";
import { usePlaceEvents } from "@/hooks/usePlaceEvents";
import type { PlaceDTO } from "@/lib/dto";
import { googleMapsUrl } from "@/lib/googleMaps";
import { PLACE_TYPE_BADGE_CLASS, PLACE_TYPE_PIN_COLOR, toPlaceType } from "@/lib/placeType";

export default function VideoDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const { data: video } = useVideo(params.id);
  const { data: places = [] } = usePlacesByVideo(params.id);
  const { myMaps, createMap, addPlacesToMap } = useMyMaps();
  const { logEvent } = usePlaceEvents();

  const [selectedPlace, setSelectedPlace] = useState<PlaceDTO | null>(null);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [shareModal, setShareModal] = useState(false);
  const [evidencePlace, setEvidencePlace] = useState<PlaceDTO | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [newMapName, setNewMapName] = useState("");
  const [creatingNew, setCreatingNew] = useState(false);

  // 페이지에 장소가 로드되면 노출(impression) 이벤트 기록 (1회)
  useEffect(() => {
    if (!video) return;
    places.forEach((p) => logEvent(p.id, video.id, "impression"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [places.length, video?.id]);

  if (!video) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        불러오는 중...
      </div>
    );
  }

  const toggleCheck = (placeId: string) => {
    if (!user) {
      router.push("/login");
      return;
    }
    setCheckedIds((prev) => (prev.includes(placeId) ? prev.filter((id) => id !== placeId) : [...prev, placeId]));
  };

  const selectPlace = (place: PlaceDTO) => {
    setSelectedPlace(place);
    logEvent(place.id, video.id, "click");
  };

  const handleSaveToMap = async (mapId: string | "new") => {
    let targetId = mapId;
    if (mapId === "new") {
      if (!newMapName.trim()) return;
      targetId = await createMap(newMapName.trim());
    }
    await addPlacesToMap(targetId, checkedIds);
    checkedIds.forEach((placeId) => logEvent(placeId, video.id, "save"));
    setShowMapPicker(false);
    setCheckedIds([]);
    setNewMapName("");
    setCreatingNew(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {shareModal && (
        <ShareModal
          title={video.title ?? video.url}
          url={typeof window !== "undefined" ? window.location.href : ""}
          onClose={() => setShareModal(false)}
        />
      )}
      {evidencePlace && <EvidenceModal place={evidencePlace} onClose={() => setEvidencePlace(null)} />}
      <header className="flex-shrink-0 bg-white border-b border-border z-40">
        <div className="h-14 px-4 flex items-center gap-3">
          <button onClick={() => router.push("/")} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">
              {(video.creator_name ?? "?")[0]}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">{video.creator_name ?? "알 수 없음"}</p>
              <p className="text-sm font-semibold text-foreground truncate leading-tight">
                {video.title ?? video.url}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {places.length}곳
            </span>
            <button
              onClick={() => setShareModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-card hover:bg-muted transition-colors text-muted-foreground"
            >
              <Share2 className="w-3 h-3" /> 공유
            </button>
            {!user && (
              <button
                onClick={() => router.push("/login")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-foreground text-background rounded-lg"
              >
                <LogIn className="w-3.5 h-3.5" /> 로그인
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: place list with checkboxes */}
        <div className="w-72 flex-shrink-0 bg-card border-r border-border flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border flex-shrink-0">
            <p className="text-xs font-semibold text-foreground mb-0.5">담을 장소를 고르세요</p>
            <p className="text-[11px] text-muted-foreground">
              {video.region ?? "지역 미상"} · 추출된 {places.length}곳 · 원하는 것만 체크
            </p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {places.map((place, i) => {
              const checked = checkedIds.includes(place.id);
              const type = toPlaceType(place.category);
              return (
                <div
                  key={place.id}
                  onClick={() => selectPlace(selectedPlace?.id === place.id ? place : place)}
                  className={`w-full text-left p-4 transition-colors cursor-pointer ${selectedPlace?.id === place.id ? "bg-secondary" : "hover:bg-muted/50"}`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCheck(place.id);
                      }}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${checked ? "border-accent bg-accent" : "border-border hover:border-accent/50"}`}
                    >
                      {checked && <Check className="w-3 h-3 text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-foreground">{place.name}</span>
                      <span
                        className={`inline-block mt-1.5 ml-2 text-[10px] px-1.5 py-0.5 rounded font-medium ${PLACE_TYPE_BADGE_CLASS[type]}`}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        logEvent(place.id, video.id, "action");
                      }}
                      className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
                      title="구글맵에서 보기"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: PLACE_TYPE_PIN_COLOR[type] }}
                    >
                      {i + 1}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 border-t border-border flex-shrink-0">
            {savedSuccess ? (
              <div className="flex items-center justify-center gap-2 py-2.5 bg-green-50 border border-green-200 rounded-xl">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-xs font-semibold text-green-700">내 지도에 담겼어요!</span>
              </div>
            ) : user ? (
              <button
                onClick={() => checkedIds.length > 0 && setShowMapPicker(true)}
                disabled={checkedIds.length === 0}
                className={`w-full py-2.5 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${checkedIds.length > 0 ? "bg-accent text-white hover:bg-accent/90" : "bg-muted text-muted-foreground cursor-not-allowed"}`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                {checkedIds.length > 0 ? `${checkedIds.length}곳 내 지도에 담기` : "장소를 선택하세요"}
              </button>
            ) : (
              <button
                onClick={() => router.push("/login")}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold bg-foreground text-background rounded-xl"
              >
                <LogIn className="w-3.5 h-3.5" /> 로그인하고 저장하기
              </button>
            )}
          </div>
        </div>

        {/* Right: map */}
        <div className="flex-1 relative overflow-hidden">
          <MapWrapper places={places} selectedPlaceId={selectedPlace?.id} onSelectPlace={selectPlace} />
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm border border-border rounded-xl px-3 py-2 shadow-sm">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 rounded bg-primary flex items-center justify-center">
                <MapPin className="w-2.5 h-2.5 text-white fill-white" />
              </div>
              <span className="font-semibold text-foreground">Pind</span>
              <span className="text-muted-foreground">by {video.creator_name ?? "알 수 없음"}</span>
            </div>
          </div>

          {showMapPicker && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-end">
              <div className="w-72 h-full bg-card border-l border-border flex flex-col shadow-2xl">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-foreground">어디에 담을까요?</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {checkedIds.length}곳을 담을 지도를 고르세요
                    </p>
                  </div>
                  <button onClick={() => setShowMapPicker(false)} className="p-1.5 rounded-lg hover:bg-muted">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {creatingNew ? (
                    <div className="p-3 bg-accent/5 border border-accent/20 rounded-xl">
                      <p className="text-xs font-semibold text-foreground mb-2">새 지도 이름</p>
                      <input
                        type="text"
                        placeholder="예: 강릉 2박3일"
                        value={newMapName}
                        onChange={(e) => setNewMapName(e.target.value)}
                        autoFocus
                        className="w-full text-sm bg-card border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/40 mb-2"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveToMap("new")}
                          disabled={!newMapName.trim()}
                          className="flex-1 py-2 text-xs font-semibold bg-accent text-white rounded-lg disabled:opacity-50"
                        >
                          담기
                        </button>
                        <button
                          onClick={() => setCreatingNew(false)}
                          className="px-3 py-2 text-xs text-muted-foreground hover:text-foreground rounded-lg bg-muted"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setCreatingNew(true)}
                      className="w-full flex items-center gap-3 p-3 bg-accent text-white rounded-xl font-medium text-sm hover:bg-accent/90 transition-colors"
                    >
                      <Plus className="w-4 h-4" /> 새 지도 만들기
                    </button>
                  )}

                  {myMaps.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => handleSaveToMap(m.id)}
                      className="w-full flex items-center gap-3 p-3 bg-card border border-border rounded-xl text-left hover:border-accent/30 hover:bg-secondary transition-all"
                    >
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-lg flex-shrink-0">
                        {m.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{m.name}</p>
                        <p className="text-[11px] text-muted-foreground">{m.placeIds.length}곳</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
