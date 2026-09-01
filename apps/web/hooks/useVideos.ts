import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import type { VideoDTO } from "@/lib/dto";
import { supabase } from "@/lib/supabase";

export function useVideos() {
  const { user } = useAuth();

  return useQuery<VideoDTO[]>({
    queryKey: ["videos", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as VideoDTO[];
    },
    enabled: !!user,
  });
}
