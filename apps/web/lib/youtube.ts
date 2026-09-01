const YOUTUBE_ID_PATTERN = /(?:v=|youtu\.be\/|shorts\/|embed\/)([A-Za-z0-9_-]{11})/;

export function extractYoutubeId(url: string): string | null {
  const match = url.match(YOUTUBE_ID_PATTERN);
  return match ? match[1] : null;
}

/**
 * 저장된 thumbnail_url이 없어도(옛날 영상 등) YouTube 영상 ID만 있으면
 * 항상 예측 가능한 공개 썸네일 URL을 바로 구성할 수 있다 (API 키 불필요).
 */
export function youtubeThumbnailUrl(url: string): string | null {
  const id = extractYoutubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}
