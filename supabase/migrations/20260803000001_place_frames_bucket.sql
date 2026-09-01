-- Migration: 장소 추출 근거 프레임 이미지를 저장할 공개 Storage 버킷
--
-- 파이프라인이 Gemini가 장소를 인식한 시점(context_start_sec)의 영상 프레임을
-- ffmpeg로 캡처해 이 버킷에 업로드한다. service_role 키로만 업로드(쓰기)하고,
-- public=true라 다운로드(읽기)는 누구나 가능.

INSERT INTO storage.buckets (id, name, public)
VALUES ('place-frames', 'place-frames', true)
ON CONFLICT (id) DO NOTHING;
