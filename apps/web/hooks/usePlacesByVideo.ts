import { useQuery, useQueries } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import type { PlaceDTO } from "@/lib/dto";

function placesQueryOptions(videoId?: string) {
  const queryKey = videoId ? ["places", videoId] : ["places"];
  const queryPath = videoId ? `/api/v1/places?video_id=${videoId}` : "/api/v1/places";

  return {
    queryKey,
    queryFn: () => apiFetch<PlaceDTO[]>(queryPath),
    refetchInterval: (query: { state: { data?: PlaceDTO[] } }) => {
      // 결과가 아직 없으면 5초마다 폴링 (파이프라인 처리 중)
      if (videoId && (query.state.data?.length ?? 0) === 0) return 5000;
      return false;
    },
  };
}

export function usePlacesByVideo(videoId?: string) {
  return useQuery<PlaceDTO[]>(placesQueryOptions(videoId));
}

export function usePlacesByVideos(videoIds: string[]) {
  return useQueries({
    queries: videoIds.map((videoId) => placesQueryOptions(videoId)),
  });
}

/** 여러 영상에 걸친 place id 목록으로 조회 (예: 내 지도 컬렉션). */
export function usePlacesByIds(placeIds: string[]) {
  return useQuery<PlaceDTO[]>({
    queryKey: ["places", "by-ids", ...[...placeIds].sort()],
    queryFn: () => {
      const params = placeIds.map((id) => `ids=${id}`).join("&");
      return apiFetch<PlaceDTO[]>(`/api/v1/places?${params}`);
    },
    enabled: placeIds.length > 0,
  });
}
