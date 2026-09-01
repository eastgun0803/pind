import { useQueries, useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import type { VideoStatsDTO } from "@/lib/dto";

function creatorStatsQueryOptions(videoId: string) {
  return {
    queryKey: ["creator-stats", videoId],
    queryFn: () => apiFetch<VideoStatsDTO>(`/api/v1/creator/videos/${videoId}/stats`),
  };
}

export function useCreatorStats(videoId: string) {
  return useQuery<VideoStatsDTO>(creatorStatsQueryOptions(videoId));
}

export function useCreatorStatsForVideos(videoIds: string[]) {
  return useQueries({ queries: videoIds.map((id) => creatorStatsQueryOptions(id)) });
}
