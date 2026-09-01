import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

export function useSavedVideos() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery<string[]>({
    queryKey: ["saved-videos", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_videos")
        .select("video_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data as { video_id: string }[]).map((row) => row.video_id);
    },
    enabled: !!user,
  });

  const toggle = async (videoId: string) => {
    if (!user) return;
    const saved = query.data?.includes(videoId) ?? false;
    if (saved) {
      await supabase
        .from("saved_videos")
        .delete()
        .eq("user_id", user.id)
        .eq("video_id", videoId);
    } else {
      await supabase.from("saved_videos").insert({ user_id: user.id, video_id: videoId });
    }
    await queryClient.invalidateQueries({ queryKey: ["saved-videos", user.id] });
  };

  return { savedVideoIds: query.data ?? [], toggle, isLoading: query.isLoading };
}
