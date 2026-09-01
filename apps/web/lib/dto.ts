// TEMP — make gen-types 실행 전까지 사용하는 브리지 타입.
// FastAPI 서버 기동 후 `make gen-types` 실행 시 packages/shared-types/api.ts로 교체.

export type PlaceDTO = {
  id: string;
  video_id: string;
  name: string;
  category: string | null;
  lat: number;
  lng: number;
  context_start_sec: number;
  context_end_sec: number;
  confidence: number;
  google_place_id: string | null;
  frame_image_url: string | null;
  video_url: string | null;
  created_at: string;
  updated_at: string;
};

export type VideoDTO = {
  id: string;
  user_id: string;
  url: string;
  status: "pending" | "processing" | "completed" | "failed";
  title: string | null;
  duration_sec: number | null;
  region: string | null;
  theme: string | null;
  creator_name: string | null;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
};

export type MyMapDTO = {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  created_at: string;
};

export type SavedPlaceDTO = {
  user_id: string;
  place_id: string;
  created_at: string;
};

export type SavedVideoDTO = {
  user_id: string;
  video_id: string;
  created_at: string;
};

export type PlaceEventType = "impression" | "click" | "save" | "action";

export type VideoStatsDTO = {
  video_id: string;
  total_impressions: number;
  total_clicks: number;
  total_saves: number;
  total_actions: number;
  places: {
    place_id: string;
    place_name: string;
    category: string | null;
    impressions: number;
    clicks: number;
    saves: number;
    actions: number;
  }[];
};
