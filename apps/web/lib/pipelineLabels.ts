import type { VideoStatus } from "@/hooks/useVideoStatus";

export const PIPELINE_LABELS: Record<VideoStatus, string> = {
  pending: "대기 중...",
  processing: "장소 추출 중...",
  completed: "완료! 지도에서 장소를 확인하세요.",
  failed: "처리에 실패했습니다. 다시 시도해주세요.",
};

export function pipelineStatusColor(status: VideoStatus): string {
  if (status === "failed") return "text-destructive";
  if (status === "completed") return "text-green-600";
  return "text-muted-foreground";
}
