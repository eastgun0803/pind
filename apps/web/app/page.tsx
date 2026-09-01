"use client";

import { useMemo, useState } from "react";

import { useRouter } from "next/navigation";
import { Heart, Bookmark, ChevronRight, LogIn, Map as MapIcon, MapPin, Search, Share2, Video, Zap } from "lucide-react";

import { Navbar } from "@/components/Navbar";
import { ShareModal } from "@/components/ShareModal";
import { useAuth } from "@/hooks/useAuth";
import { useFeed } from "@/hooks/useFeed";
import { useVideos } from "@/hooks/useVideos";
import { useSavedVideos } from "@/hooks/useSavedVideos";
import { usePlacesByVideos } from "@/hooks/usePlacesByVideo";
import { useVideoStatus } from "@/hooks/useVideoStatus";
import { PIPELINE_LABELS, pipelineStatusColor } from "@/lib/pipelineLabels";
import { youtubeThumbnailUrl } from "@/lib/youtube";
import { useVideoStore } from "@/stores/videoStore";

export default function FeedPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { data: feed = [] } = useFeed();
  const { data: myVideos = [] } = useVideos();
  const { savedVideoIds, toggle: toggleSaveVideo } = useSavedVideos();
  const { latestVideoId } = useVideoStore();
  const pipelineStatus = useVideoStatus(latestVideoId);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [activeRegion, setActiveRegion] = useState("전체");
  const [activeTheme, setActiveTheme] = useState("전체");
  const [search, setSearch] = useState("");
  const [shareModal, setShareModal] = useState(false);

  const isCreator = myVideos.length > 0;

  const placesResults = usePlacesByVideos(feed.map((v) => v.id));
  const placeCountByVideo = useMemo(() => {
    const map = new Map<string, number>();
    feed.forEach((v, i) => map.set(v.id, placesResults[i]?.data?.length ?? 0));
    return map;
  }, [feed, placesResults]);

  const regions = ["전체", ...Array.from(new Set(feed.map((v) => v.region).filter((r): r is string => !!r)))];
  const themes = ["전체", ...Array.from(new Set(feed.map((v) => v.theme).filter((t): t is string => !!t)))];

  const filtered = feed.filter(
    (v) =>
      (activeRegion === "전체" || v.region === activeRegion) &&
      (activeTheme === "전체" || v.theme === activeTheme) &&
      (search === "" ||
        (v.title ?? "").includes(search) ||
        (v.creator_name ?? "").includes(search)),
  );

  const totalPlaces = Array.from(placeCountByVideo.values()).reduce((a, b) => a + b, 0);

  const toggleLike = (id: string) =>
    setLikedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar user={user} isCreator={isCreator} onLogout={() => signOut()} />
      {latestVideoId && pipelineStatus && (
        <div className="w-full py-1.5 text-center bg-muted/60 border-b border-border">
          <span className={`text-xs font-medium ${pipelineStatusColor(pipelineStatus)}`}>
            {PIPELINE_LABELS[pipelineStatus]}
          </span>
        </div>
      )}
      {shareModal && (
        <ShareModal
          title="Pind — 여행 유튜브 장소 지도"
          url={typeof window !== "undefined" ? window.location.href : ""}
          onClose={() => setShareModal(false)}
        />
      )}

      <main className="flex-1 max-w-6xl mx-auto px-5 py-6 w-full space-y-6">
        {/* Hero */}
        <div className="rounded-2xl bg-foreground text-background px-7 py-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div>
            <p className="text-xs font-medium text-white/40 mb-2 tracking-widest uppercase">
              영상 속 장소를, 지도 위 핀으로
            </p>
            <h1 className="text-xl font-bold leading-tight">
              여행 유튜브 속 장소를
              <br className="hidden sm:block" /> 바로 지도에서 확인하세요
            </h1>
            <div className="flex items-center gap-2 mt-4">
              {user ? (
                <button
                  onClick={() => router.push("/analyze")}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
                >
                  <Zap className="w-3.5 h-3.5" /> 내 영상 분석하기
                </button>
              ) : (
                <button
                  onClick={() => router.push("/login")}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" /> 로그인하고 장소 저장
                </button>
              )}
              <button
                onClick={() => setShareModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-white/10 text-white rounded-xl hover:bg-white/15 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" /> 공유
              </button>
            </div>
          </div>
          <div className="flex items-center gap-5 flex-shrink-0">
            <div className="text-center">
              <div className="text-2xl font-bold font-mono text-primary">{feed.length}</div>
              <div className="text-[11px] text-white/50">분석된 영상</div>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <div className="text-2xl font-bold font-mono text-white">{totalPlaces}</div>
              <div className="text-[11px] text-white/50">추출된 장소</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-2">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {regions.map((r) => (
              <button
                key={r}
                onClick={() => setActiveRegion(r)}
                className={`px-3 py-1.5 text-xs rounded-full font-medium whitespace-nowrap transition-all ${activeRegion === r ? "bg-foreground text-background" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}
              >
                {r}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-2 overflow-x-auto pb-1 flex-1">
              {themes.map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTheme(t)}
                  className={`px-3 py-1.5 text-xs rounded-full font-medium whitespace-nowrap transition-all ${activeTheme === t ? "bg-primary text-white" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="relative flex-shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="검색"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/40 w-36"
              />
            </div>
          </div>
        </div>

        {/* Video Grid */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-4">
            분석된 영상{" "}
            <span className="ml-1 text-xs font-normal text-muted-foreground font-mono">
              ({filtered.length}개)
            </span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((v) => {
              const isLiked = likedIds.includes(v.id);
              const isSaved = savedVideoIds.includes(v.id);
              const placeCount = placeCountByVideo.get(v.id) ?? 0;
              const thumb = v.thumbnail_url ?? youtubeThumbnailUrl(v.url);
              return (
                <div
                  key={v.id}
                  className="group bg-card rounded-2xl overflow-hidden border border-border text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative"
                >
                  <div
                    onClick={() => router.push(`/videos/${v.id}`)}
                    className="w-full text-left cursor-pointer"
                  >
                    <div className="relative aspect-video overflow-hidden bg-muted">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumb}
                          alt={v.title ?? v.url}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Video className="w-8 h-8 text-muted-foreground/40" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                      <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                        <span className="bg-primary text-white text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5" />
                          {placeCount}곳
                        </span>
                        {v.region && (
                          <span className="bg-black/60 text-white text-[11px] px-2 py-0.5 rounded-full">
                            {v.region}
                          </span>
                        )}
                      </div>
                      {v.theme && (
                        <div className="absolute top-2 right-2">
                          <span className="bg-black/60 text-white/90 text-[10px] px-2 py-0.5 rounded-full">
                            {v.theme}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-4 pb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                          {(v.creator_name ?? "?")[0]}
                        </div>
                        <span className="text-xs text-muted-foreground">{v.creator_name ?? "알 수 없음"}</span>
                        <span className="text-xs text-muted-foreground/40">·</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(v.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 mb-3">
                        {v.title ?? v.url}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapIcon className="w-3 h-3" /> 지도 보기
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 pb-4 flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground" />
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!user) {
                            router.push("/login");
                            return;
                          }
                          toggleLike(v.id);
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${isLiked ? "bg-red-50 text-red-500 border border-red-100" : "bg-muted text-muted-foreground hover:text-foreground border border-transparent"}`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-red-500" : ""}`} />
                        좋아요
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!user) {
                            router.push("/login");
                            return;
                          }
                          toggleSaveVideo(v.id);
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${isSaved ? "bg-primary/10 text-primary border border-primary/20" : "bg-muted text-muted-foreground hover:text-foreground border border-transparent"}`}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-primary" : ""}`} />
                        {isSaved ? "저장됨" : "저장"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-20 text-muted-foreground text-sm">
              아직 분석된 영상이 없어요.{" "}
              {user ? (
                <button onClick={() => router.push("/analyze")} className="text-primary underline">
                  첫 영상을 분석해보세요
                </button>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <ChevronRight className="w-3 h-3" /> 로그인하고 시작해보세요
                </span>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
