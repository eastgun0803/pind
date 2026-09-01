import { useAuth } from "@/hooks/useAuth";
import type { PlaceEventType } from "@/lib/dto";
import { supabase } from "@/lib/supabase";

/** 핀별 참여 이벤트(impression/click/save/action) 로깅. fire-and-forget, 실패해도 UI에 영향 없음. */
export function usePlaceEvents() {
  const { user } = useAuth();

  const logEvent = (placeId: string, videoId: string, eventType: PlaceEventType) => {
    supabase
      .from("place_events")
      .insert({
        place_id: placeId,
        video_id: videoId,
        event_type: eventType,
        user_id: user?.id ?? null,
      })
      .then(() => {
        // best-effort — 실패해도 조용히 무시
      });
  };

  return { logEvent };
}
