import { useQuery } from "@tanstack/react-query";

import type { VideoDTO } from "@/lib/dto";
import { supabase } from "@/lib/supabase";

/** 로그인 여부와 무관하게 완료된 전체 영상을 조회한다 (공개 RLS: status='completed'는 누구나 SELECT 가능). */
export function useFeed() {
  return useQuery<VideoDTO[]>({
    queryKey: ["feed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("status", "completed")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as VideoDTO[];
    },
  });
}
