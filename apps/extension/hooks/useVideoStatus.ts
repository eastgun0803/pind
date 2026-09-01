import { useEffect, useState } from "react"

import { supabase } from "../lib/supabase"

export type VideoStatus = "pending" | "processing" | "completed" | "failed"

export function useVideoStatus(videoId: string | null): VideoStatus | null {
  const [status, setStatus] = useState<VideoStatus | null>(null)

  useEffect(() => {
    if (!videoId) return

    const channel = supabase
      .channel(`ext-video-${videoId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "videos",
          filter: `id=eq.${videoId}`,
        },
        (payload) => {
          const newStatus = (payload.new as Record<string, unknown>)?.status as VideoStatus
          if (newStatus) setStatus(newStatus)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [videoId])

  return status
}
