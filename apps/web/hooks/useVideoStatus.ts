"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

export type VideoStatus = "pending" | "processing" | "completed" | "failed";

export function useVideoStatus(videoId: string | null): VideoStatus | null {
  const [status, setStatus] = useState<VideoStatus | null>(null);

  useEffect(() => {
    if (!videoId) return;
    setStatus(null);

    // Realtime 구독은 "이후" 변경만 잡는다 — 구독(채널 join)이 끝나기 전에
    // 상태가 바뀌면(파이프라인이 빨리 끝나는 등) 이벤트를 영영 놓친다.
    // 마운트 시 현재 상태를 먼저 조회해 이 race를 없앤다.
    let cancelled = false;
    supabase
      .from("videos")
      .select("status")
      .eq("id", videoId)
      .single()
      .then(({ data }) => {
        if (!cancelled && data) setStatus(data.status as VideoStatus);
      });

    const channel = supabase
      .channel(`video-status-${videoId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "videos",
          filter: `id=eq.${videoId}`,
        },
        (payload) => {
          const newStatus = (payload.new as Record<string, unknown>)?.status as VideoStatus;
          if (newStatus) setStatus(newStatus);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [videoId]);

  return status;
}
