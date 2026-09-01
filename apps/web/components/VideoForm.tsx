"use client";

import { useEffect, useState } from "react";

import { Link2, Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useVideoStatus, type VideoStatus } from "@/hooks/useVideoStatus";
import { PIPELINE_LABELS, pipelineStatusColor } from "@/lib/pipelineLabels";
import { supabase } from "@/lib/supabase";
import { useVideoStore } from "@/stores/videoStore";

type SubmitStatus = "idle" | "submitting" | "done" | "error";

interface VideoFormProps {
  /** 파이프라인 상태가 바뀔 때 알림 — 부모가 직접 useVideoStatus를 구독하면
   * 동일 채널을 이중 구독하게 되므로(Realtime subscribe 충돌), 상태가 필요하면 이 콜백으로 받는다. */
  onStatusChange?: (status: VideoStatus | null) => void;
  /** 제출(INSERT) 성공 직후 호출 — 예: 분석 페이지에서 홈으로 돌아가기 */
  onSubmitted?: () => void;
}

export function VideoForm({ onStatusChange, onSubmitted }: VideoFormProps = {}) {
  const { user } = useAuth();
  const [url, setUrl] = useState("");
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const { latestVideoId, setLatestVideo } = useVideoStore();
  const pipelineStatus = useVideoStatus(latestVideoId);

  useEffect(() => {
    onStatusChange?.(pipelineStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pipelineStatus]);

  const isYoutube = url.includes("youtube.com") || url.includes("youtu.be");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("로그인이 필요합니다.");
      return;
    }
    if (!isYoutube) {
      setError("YouTube URL만 지원합니다.");
      return;
    }

    setSubmitStatus("submitting");
    setError(null);

    const { data, error: dbError } = await supabase
      .from("videos")
      .insert({ url, user_id: user.id, status: "pending" })
      .select("id")
      .single();

    if (dbError || !data) {
      setError(dbError?.message ?? "알 수 없는 오류가 발생했습니다.");
      setSubmitStatus("error");
    } else {
      const videoId = (data as { id: string }).id;
      setLatestVideo(videoId, url);
      setSubmitStatus("done");
      setUrl("");
      onSubmitted?.();

      // TODO: 웹훅 설정 후 아래 직접 호출 블록 삭제
      // (Supabase Database Webhook이 videos INSERT 시 자동으로 이 엔드포인트를 호출하게 되면 불필요)
      fetch("http://localhost:8000/api/v1/webhooks/video-created", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "INSERT", record: { id: videoId, url, user_id: user!.id, status: "pending" } }),
      }).catch(() => {
        // 파이프라인 트리거 실패 — UI에는 영향 없음
      });
      // TODO 끝
    }
  };

  const statusColor = pipelineStatus ? pipelineStatusColor(pipelineStatus) : "";

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2">
      <div className="flex items-center gap-2 rounded-full border bg-white px-4 py-2 shadow-lg">
        <Link2 className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste a YouTube URL to get started..."
          className="h-6 flex-1 border-0 bg-transparent text-sm shadow-none outline-none placeholder:text-muted-foreground focus-visible:outline-none"
        />
        <Button
          type="submit"
          disabled={submitStatus === "submitting" || !url || !isYoutube}
          size="icon"
          variant="outline"
          className="h-8 w-8 flex-shrink-0 rounded-full"
        >
          {submitStatus === "submitting" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>

      {error && <p className="px-4 text-sm text-destructive">{error}</p>}

      {latestVideoId && pipelineStatus && (
        <p className={`px-4 text-sm ${statusColor}`}>{PIPELINE_LABELS[pipelineStatus]}</p>
      )}

      {submitStatus === "done" && !pipelineStatus && (
        <p className="px-4 text-sm text-muted-foreground">제출됐습니다. 잠시 후 지도에 장소가 표시됩니다.</p>
      )}
    </form>
  );
}
