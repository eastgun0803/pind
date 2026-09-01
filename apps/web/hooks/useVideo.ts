import { useQuery } from "@tanstack/react-query";

import type { VideoDTO } from "@/lib/dto";
import { supabase } from "@/lib/supabase";

/** 완료된 영상은 공개 RLS로 로그인 없이도 조회 가능. */
export function useVideo(videoId: string) {
  return useQuery<VideoDTO | null>({
    queryKey: ["video", videoId],
    queryFn: async () => {
      const { data, error } = await supabase.from("videos").select("*").eq("id", videoId).single();
      if (error) throw error;
      return data as VideoDTO;
    },
    enabled: !!videoId,
  });
}
