"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, BarChart2, Bookmark, Eye, Map as MapIcon, MousePointerClick, Plus, Video } from "lucide-react";

import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { useCreatorStatsForVideos } from "@/hooks/useCreatorStats";
import { useVideos } from "@/hooks/useVideos";
import { PLACE_TYPE_BADGE_CLASS, toPlaceType } from "@/lib/placeType";
import { youtubeThumbnailUrl } from "@/lib/youtube";

export default function CreatorDashboardPage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const { data: myVideos = [] } = useVideos();
  const statsResults = useCreatorStatsForVideos(myVideos.map((v) => v.id));

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

  const completedVideos = myVideos.filter((v) => v.status === "completed");
  const statsByVideoId = new Map(myVideos.map((v, i) => [v.id, statsResults[i]?.data]));

  const totals = completedVideos.reduce(
    (acc, v) => {
      const s = statsByVideoId.get(v.id);
      if (!s) return acc;
      return {
        impressions: acc.impressions + s.total_impressions,
        clicks: acc.clicks + s.total_clicks,
        saves: acc.saves + s.total_saves,
        actions: acc.actions + s.total_actions,
      };
    },
    { impressions: 0, clicks: 0, saves: 0, actions: 0 },
  );

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar user={user} isCreator onLogout={() => signOut()} />
      <main className="flex-1 max-w-5xl mx-auto px-5 py-6 w-full space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/")} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-base font-bold text-foreground">크리에이터 대시보드</h1>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => router.push("/analyze")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> 새 영상 분석
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "노출", value: totals.impressions.toLocaleString(), icon: Eye, color: "#94a3b8" },
            { label: "클릭", value: totals.clicks.toLocaleString(), icon: MousePointerClick, color: "#2563eb" },
            { label: "저장", value: totals.saves.toLocaleString(), icon: Bookmark, color: "#e11d48" },
            { label: "행동", value: totals.actions.toLocaleString(), icon: BarChart2, color: "#059669" },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-card border border-border rounded-xl p-4">
              <kpi.icon className="w-4 h-4 mb-3" style={{ color: kpi.color }} />
              <div className="text-xl font-bold font-mono text-foreground">{kpi.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{kpi.label}</div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground">분석된 영상 · 핀 퍼널</h2>

          {completedVideos.length === 0 && (
            <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center">
              <Video className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">아직 완료된 분석 영상이 없어요</p>
            </div>
          )}

          {completedVideos.map((video) => {
            const stats = statsByVideoId.get(video.id);
            const thumb = video.thumbnail_url ?? youtubeThumbnailUrl(video.url);
            return (
              <div key={video.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="flex items-start gap-4 p-5 border-b border-border">
                  <div className="w-28 aspect-video rounded-lg bg-muted flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt={video.title ?? video.url} className="w-full h-full object-cover" />
                    ) : (
                      <Video className="w-6 h-6 text-muted-foreground/40" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground line-clamp-2 mb-2">
                      {video.title ?? video.url}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {video.region && (
                        <span className="flex items-center gap-1">
                          <MapIcon className="w-3 h-3" /> {video.region}
                        </span>
                      )}
                      {stats && (
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" /> 노출 {stats.total_impressions.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/videos/${video.id}`)}
                    className="px-3 py-1.5 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
                  >
                    지도 보기
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left px-5 py-3 font-medium text-muted-foreground">장소</th>
                        <th className="text-left px-3 py-3 font-medium text-muted-foreground">유형</th>
                        <th className="text-right px-3 py-3 font-medium text-muted-foreground">노출</th>
                        <th className="text-right px-3 py-3 font-medium text-muted-foreground">클릭</th>
                        <th className="text-right px-3 py-3 font-medium text-muted-foreground">저장</th>
                        <th className="text-right px-5 py-3 font-medium text-primary font-semibold">행동 ↑</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {(stats?.places ?? []).map((place) => (
                        <tr key={place.place_id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-5 py-3 font-medium text-foreground">{place.place_name}</td>
                          <td className="px-3 py-3">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${PLACE_TYPE_BADGE_CLASS[toPlaceType(place.category)]}`}
                            >
                              {toPlaceType(place.category)}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right font-mono text-muted-foreground">
                            {place.impressions.toLocaleString()}
                          </td>
                          <td className="px-3 py-3 text-right font-mono text-muted-foreground">
                            {place.clicks.toLocaleString()}
                          </td>
                          <td className="px-3 py-3 text-right font-mono text-muted-foreground">
                            {place.saves.toLocaleString()}
                          </td>
                          <td className="px-5 py-3 text-right font-mono font-semibold text-primary">
                            {place.actions.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                      {(!stats || stats.places.length === 0) && (
                        <tr>
                          <td colSpan={6} className="px-5 py-6 text-center text-muted-foreground">
                            아직 쌓인 데이터가 없어요
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
