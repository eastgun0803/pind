"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Bookmark,
  ChevronRight,
  Crown,
  LogOut,
  Map as MapIcon,
  MapPin,
  Plus,
  Search,
  Share2,
  Video,
  Zap,
} from "lucide-react";

import { CancelSubModal } from "@/components/CancelSubModal";
import { MyMapPanel } from "@/components/MyMapPanel";
import { ShareModal } from "@/components/ShareModal";
import { UpgradeModal } from "@/components/UpgradeModal";
import { CreatorVerifyModal } from "@/components/CreatorVerifyModal";
import { useAuth } from "@/hooks/useAuth";
import { useFeed } from "@/hooks/useFeed";
import { useMyMaps } from "@/hooks/useMyMaps";
import { useSavedVideos } from "@/hooks/useSavedVideos";
import { useVideos } from "@/hooks/useVideos";
import { youtubeThumbnailUrl } from "@/lib/youtube";

type ProfileTab = "myMap" | "savedVideos";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const { data: myVideos = [] } = useVideos();
  const { data: feed = [] } = useFeed();
  const { savedVideoIds, toggle: toggleSaveVideo } = useSavedVideos();
  const { myMaps, createMap } = useMyMaps();

  const [activeTab, setActiveTab] = useState<ProfileTab>("myMap");
  const [shareModal, setShareModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showCreatorVerify, setShowCreatorVerify] = useState(false);
  const [channelUrl, setChannelUrl] = useState<string | null>(null);
  const [plan, setPlan] = useState<"free" | "pro">("free"); // 구독 결제는 목업 — 로컬 상태만
  const [videoSearch, setVideoSearch] = useState("");
  const [openMapId, setOpenMapId] = useState<string | null>(null);
  const [addingNewMap, setAddingNewMap] = useState(false);
  const [newMapNameInput, setNewMapNameInput] = useState("");

  const isCreator = myVideos.length > 0;
  const savedVideos = feed.filter((v) => savedVideoIds.includes(v.id));
  const filteredSavedVideos = savedVideos.filter(
    (v) =>
      (v.title ?? "").toLowerCase().includes(videoSearch.toLowerCase()) ||
      (v.region ?? "").toLowerCase().includes(videoSearch.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        불러오는 중...
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {shareModal && (
        <ShareModal
          title="내 지도"
          url={typeof window !== "undefined" ? window.location.href : ""}
          onClose={() => setShareModal(false)}
        />
      )}
      {showCancelConfirm && (
        <CancelSubModal
          onClose={() => setShowCancelConfirm(false)}
          onConfirm={() => {
            setPlan("free");
            setShowCancelConfirm(false);
          }}
        />
      )}
      {showUpgrade && (
        <UpgradeModal
          onClose={() => setShowUpgrade(false)}
          onUpgrade={() => {
            setPlan("pro");
            setShowUpgrade(false);
          }}
        />
      )}
      {showCreatorVerify && (
        <CreatorVerifyModal
          onClose={() => setShowCreatorVerify(false)}
          onVerified={(url) => setChannelUrl(url)}
        />
      )}

      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-5 h-14 flex items-center gap-3">
          <button onClick={() => router.push("/")} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-foreground">내 프로필</span>
          <button
            onClick={() => signOut()}
            className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> 로그아웃
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-5 py-6 w-full space-y-6">
        {/* Profile card */}
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
            {(user.email ?? "U")[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-base font-bold text-foreground">{user.email}</h1>
              {plan === "pro" && (
                <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full font-semibold">
                  <Crown className="w-3 h-3" /> Pro
                </span>
              )}
            </div>
            <div className="mt-2 flex items-center gap-3 flex-wrap">
              {plan === "pro" ? (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 text-[11px] text-yellow-700 font-medium bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full">
                    <Crown className="w-3 h-3" /> Pro · 영상 분석 무제한
                  </span>
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="text-[11px] text-muted-foreground hover:text-red-500 underline transition-colors"
                  >
                    구독 취소
                  </button>
                </div>
              ) : (
                <button onClick={() => setShowUpgrade(true)} className="text-[11px] text-primary font-semibold hover:underline">
                  Pro로 무제한 →
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 flex-shrink-0">
            <button
              onClick={() => router.push("/analyze")}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
            >
              <Zap className="w-3.5 h-3.5" /> 영상 분석
            </button>
            {isCreator && (
              <button
                onClick={() => router.push("/creator/dashboard")}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-secondary border border-border text-foreground rounded-xl hover:bg-muted transition-colors"
              >
                <MapIcon className="w-3.5 h-3.5" /> 대시보드
              </button>
            )}
          </div>
        </div>

        {!channelUrl ? (
          <button
            onClick={() => setShowCreatorVerify(true)}
            className="w-full bg-primary/5 border border-primary/15 rounded-2xl p-5 flex items-center gap-4 hover:bg-primary/8 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <BadgeCheck className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">여행 유튜버라면? 채널을 연결하세요</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                영상을 분석하면 자동으로 크리에이터 대시보드가 열려요
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        ) : (
          <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
            <BadgeCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
            <p className="text-xs text-green-700 font-medium">채널 연결됨 · {channelUrl}</p>
          </div>
        )}

        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {(
            [
              { key: "myMap", label: "내 지도", icon: MapIcon },
              { key: "savedVideos", label: "저장한 영상", icon: Bookmark },
            ] as { key: ProfileTab; label: string; icon: typeof MapIcon }[]
          ).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {activeTab === "myMap" && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">
              내 지도 <span className="font-mono font-normal text-muted-foreground text-xs ml-1">{myMaps.length}개</span>
            </p>

            {myMaps.map((m) => {
              const isOpen = openMapId === m.id;
              return (
                <div
                  key={m.id}
                  className={`bg-card border rounded-2xl overflow-hidden transition-all ${isOpen ? "border-accent/30 shadow-sm" : "border-border"}`}
                >
                  <button
                    onClick={() => setOpenMapId(isOpen ? null : m.id)}
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/20 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl flex-shrink-0">
                      {m.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">{m.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{m.placeIds.length}곳</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShareModal(true);
                        }}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      <ChevronRight
                        className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`}
                      />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-border">
                      <MyMapPanel
                        mapId={m.id}
                        placeIds={m.placeIds}
                        onShare={() => setShareModal(true)}
                        isPro={plan === "pro"}
                        onUpgrade={() => setShowUpgrade(true)}
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {addingNewMap ? (
              <div className="flex items-center gap-2 p-3 bg-card border border-accent/30 rounded-2xl">
                <input
                  type="text"
                  placeholder="지도 이름 입력... (예: 부산 여름 여행)"
                  value={newMapNameInput}
                  onChange={(e) => setNewMapNameInput(e.target.value)}
                  onKeyDown={async (e) => {
                    if (e.key === "Enter" && newMapNameInput.trim()) {
                      await createMap(newMapNameInput.trim());
                      setNewMapNameInput("");
                      setAddingNewMap(false);
                    }
                  }}
                  autoFocus
                  className="flex-1 text-sm bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <button
                  onClick={async () => {
                    if (!newMapNameInput.trim()) return;
                    await createMap(newMapNameInput.trim());
                    setNewMapNameInput("");
                    setAddingNewMap(false);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold bg-accent text-white rounded-lg"
                >
                  만들기
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAddingNewMap(true)}
                className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-medium border border-dashed border-border rounded-2xl text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
              >
                <Plus className="w-4 h-4" /> 새 지도 만들기
              </button>
            )}
          </div>
        )}

        {activeTab === "savedVideos" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-foreground">
                저장한 영상{" "}
                <span className="font-mono font-normal text-muted-foreground text-xs ml-1">{savedVideos.length}개</span>
              </p>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="영상 검색"
                  value={videoSearch}
                  onChange={(e) => setVideoSearch(e.target.value)}
                  className="pl-7 pr-3 py-1.5 text-xs bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/40 w-36"
                />
              </div>
            </div>

            {filteredSavedVideos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Bookmark className="w-8 h-8 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium text-foreground mb-1">저장한 영상이 없어요</p>
                <p className="text-xs text-muted-foreground">피드에서 영상을 저장하면 여기에 모입니다</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredSavedVideos.map((v) => {
                  const thumb = v.thumbnail_url ?? youtubeThumbnailUrl(v.url);
                  return (
                  <div
                    key={v.id}
                    onClick={() => router.push(`/videos/${v.id}`)}
                    className="group flex gap-3 bg-card border border-border rounded-2xl p-3 hover:shadow-sm transition-all cursor-pointer"
                  >
                    <div className="relative flex-shrink-0 w-28 aspect-video rounded-xl overflow-hidden bg-muted flex items-center justify-center">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumb} alt={v.title ?? v.url} className="w-full h-full object-cover" />
                      ) : (
                        <Video className="w-6 h-6 text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div>
                        <p className="text-sm font-semibold text-foreground line-clamp-2 leading-snug mb-1">
                          {v.title ?? v.url}
                        </p>
                        <p className="text-xs text-muted-foreground">{v.creator_name ?? "알 수 없음"}</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {v.region && <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-primary" />{v.region}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 flex-shrink-0 items-center justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSaveVideo(v.id);
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-primary"
                        title="저장 취소"
                      >
                        <Bookmark className="w-3.5 h-3.5 fill-primary" />
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
