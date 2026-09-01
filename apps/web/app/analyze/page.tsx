"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Video } from "lucide-react";

import { Navbar } from "@/components/Navbar";
import { VideoForm } from "@/components/VideoForm";
import { useAuth } from "@/hooks/useAuth";
import { useVideos } from "@/hooks/useVideos";

export default function AnalyzePage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const { data: myVideos = [] } = useVideos();
  const isCreator = myVideos.length > 0;

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
      <Navbar user={user} isCreator={isCreator} onLogout={() => signOut()} />
      <main className="flex-1 max-w-3xl mx-auto px-5 py-10 w-full">
        <div className="max-w-xl mx-auto space-y-8">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => router.push("/")} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-foreground">영상 분석하기</span>
          </div>

          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
              <Video className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground">유튜브 영상 분석</h1>
            <p className="text-sm text-muted-foreground">
              여행 영상 링크를 붙여넣으면 AI가 장소를 추출해 지도를 만들어드립니다
            </p>
          </div>

          <VideoForm onSubmitted={() => router.push("/")} />

          <div className="grid grid-cols-3 gap-3">
            {[
              { step: "01", label: "음성/영상 추출", desc: "yt-dlp 다운로드", icon: "🎬" },
              { step: "02", label: "장소 인식", desc: "Gemini 장소 추출", icon: "🤖" },
              { step: "03", label: "지도 핀", desc: "좌표 매핑 완료", icon: "📍" },
            ].map((s) => (
              <div key={s.step} className="bg-card border border-border rounded-xl p-3 text-center">
                <div className="text-xl mb-1">{s.icon}</div>
                <div className="text-[10px] font-mono text-muted-foreground">{s.step}</div>
                <div className="text-xs font-semibold text-foreground mt-0.5">{s.label}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
