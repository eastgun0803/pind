export type PlaceType = "카페" | "맛집" | "명소" | "숙소" | "체험";

export const PLACE_TYPE_BADGE_CLASS: Record<PlaceType, string> = {
  카페: "bg-amber-100 text-amber-700",
  맛집: "bg-red-100 text-red-600",
  명소: "bg-blue-100 text-blue-600",
  숙소: "bg-purple-100 text-purple-700",
  체험: "bg-green-100 text-green-700",
};

export const PLACE_TYPE_PIN_COLOR: Record<PlaceType, string> = {
  카페: "#d97706",
  맛집: "#e11d48",
  명소: "#2563eb",
  숙소: "#7c3aed",
  체험: "#059669",
};

const KEYWORDS: [PlaceType, string[]][] = [
  ["카페", ["카페", "커피", "디저트", "베이커리", "빵집"]],
  ["맛집", ["식당", "맛집", "음식", "국밥", "고기", "횟집", "분식", "레스토랑"]],
  ["숙소", ["숙박", "호텔", "펜션", "게스트하우스", "리조트"]],
  ["체험", ["체험", "액티비티", "공방", "클래스", "레저"]],
];

/** 백엔드 자유 텍스트 category를 5종 고정 타입으로 매핑 (백엔드 스키마 변경 없이 UI 배지/핀 색상용). */
export function toPlaceType(category: string | null): PlaceType {
  if (category) {
    for (const [type, words] of KEYWORDS) {
      if (words.some((w) => category.includes(w))) return type;
    }
  }
  return "명소";
}
