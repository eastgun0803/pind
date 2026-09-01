-- Migration: 공개 피드 RLS 전환 + 저장/컬렉션/이벤트 테이블
--
-- 배경: pind-frontend-brief.md — 로그인 없이도 누구나 완료된 분석 영상을 볼 수 있어야 함.
-- 기존엔 videos/places가 본인만(private) 조회 가능했음.

-- ─────────────────────────────────────────────────────────────────────────────
-- videos: SELECT 정책을 "본인 것 전부 + 완료된 건 누구나"로 교체
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "videos_owner_select" ON videos;

CREATE POLICY "videos_select_own_or_public" ON videos
  FOR SELECT USING (
    auth.uid() = user_id OR status = 'completed'
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- places: SELECT 정책을 "본인 video 소유 + 완료된 video의 place는 누구나"로 교체
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "places_owner_select" ON places;

CREATE POLICY "places_select_own_or_public" ON places
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM videos
       WHERE videos.id = places.video_id
         AND (videos.user_id = auth.uid() OR videos.status = 'completed')
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- saved_places: 사용자가 저장(북마크)한 장소
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE saved_places (
  user_id    uuid NOT NULL,
  place_id   uuid NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, place_id)
);

ALTER TABLE saved_places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_places_owner_all" ON saved_places
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- saved_videos: 사용자가 저장(북마크)한 영상
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE saved_videos (
  user_id    uuid NOT NULL,
  video_id   uuid NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, video_id)
);

ALTER TABLE saved_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_videos_owner_all" ON saved_videos
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- collections: 사용자가 만든 장소 모음(폴더)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE collections (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL,
  name       text NOT NULL,
  emoji      text NOT NULL DEFAULT '🗺️',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "collections_owner_all" ON collections
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- collection_places: 컬렉션에 속한 장소 + 순서(경로용)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE collection_places (
  collection_id uuid NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  place_id      uuid NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  position      integer NOT NULL DEFAULT 0,
  PRIMARY KEY (collection_id, place_id)
);

ALTER TABLE collection_places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "collection_places_owner_all" ON collection_places
  FOR ALL USING (
    EXISTS (SELECT 1 FROM collections WHERE collections.id = collection_places.collection_id AND collections.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM collections WHERE collections.id = collection_places.collection_id AND collections.user_id = auth.uid())
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- place_events: 핀별 참여 이벤트 로그 (크리에이터 대시보드 퍼널용)
--   INSERT는 누구나(비로그인 포함, 조회자의 impression/click 기록) 가능.
--   SELECT는 클라이언트에 열지 않음 — 집계는 FastAPI(service_role)에서만 수행.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TYPE place_event_type AS ENUM ('impression', 'click', 'save', 'action');

CREATE TABLE place_events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id   uuid NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  video_id   uuid NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  event_type place_event_type NOT NULL,
  user_id    uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX place_events_place_id_idx ON place_events (place_id);
CREATE INDEX place_events_video_id_idx ON place_events (video_id);

ALTER TABLE place_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "place_events_insert_any" ON place_events
  FOR INSERT WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- Realtime publication에 신규 테이블 추가 (선택적, 향후 실시간 갱신 대비)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE saved_places, saved_videos, collections, collection_places;
