// 티셔츠 꾸미기 스튜디오 — 셔츠 색상/폰트 상수 + 레이어 타입 + 사실적 티셔츠 SVG 빌더.
// 편집 화면(DOM)과 PNG 내보내기(canvas)가 동일한 자산을 공유한다.

export type LayerKind = "image" | "text";

// 모든 좌표(x·y)는 스테이지 대비 0~1 정규화 값 → 화면 크기·내보내기 해상도와 무관하게 동일 위치.
export type Layer = {
  id: string;
  kind: LayerKind;
  x: number;
  y: number;
  scale: number; // 기본 크기에 곱하는 배율
  rotation: number; // 도(deg)
  opacity: number; // 0~1
  // image
  src?: string; // data URL
  w?: number; // 원본 픽셀 너비(비율 유지용)
  h?: number; // 원본 픽셀 높이
  // text
  text?: string;
  font?: string;
  weight?: number;
  color?: string;
};

// ── 셔츠 색상(실제 의류 색상 팔레트) ─────────────────────
export const SHIRT_COLORS: { id: string; label: string; value: string }[] = [
  { id: "white", label: "화이트", value: "#FFFFFF" },
  { id: "ivory", label: "아이보리", value: "#F3EEE2" },
  { id: "lightgray", label: "라이트그레이", value: "#D9DAD7" },
  { id: "gray", label: "그레이", value: "#9BA0A3" },
  { id: "melange", label: "멜란지그레이", value: "#6E7479" },
  { id: "charcoal", label: "차콜", value: "#3A3D42" },
  { id: "black", label: "블랙", value: "#1A1A1A" },
  { id: "navy", label: "네이비", value: "#1E2A44" },
  { id: "blue", label: "블루", value: "#2D5BA8" },
  { id: "sky", label: "스카이", value: "#9DC3E6" },
  { id: "teal", label: "티어그린", value: "#1C4A41" },
  { id: "green", label: "그린", value: "#2E7D52" },
  { id: "khaki", label: "카키", value: "#5A5A3C" },
  { id: "sand", label: "샌드", value: "#D8C8A8" },
  { id: "mustard", label: "머스타드", value: "#E0A93B" },
  { id: "yellow", label: "옐로우", value: "#F2D44E" },
  { id: "orange", label: "오렌지", value: "#E5541B" },
  { id: "red", label: "레드", value: "#C0392B" },
  { id: "burgundy", label: "버건디", value: "#6E2733" },
  { id: "pink", label: "핑크", value: "#E8A6BE" },
  { id: "lavender", label: "라벤더", value: "#B7A8D6" },
  { id: "brown", label: "브라운", value: "#6B4A36" },
];
export const DEFAULT_SHIRT_ID = "teal";

// ── 텍스트 폰트(layout.tsx 에서 이미 로드된 패밀리만) ─────
export const TEXT_FONTS: { label: string; family: string; weight: number }[] = [
  { label: "블랙한산스", family: "'Black Han Sans', sans-serif", weight: 400 },
  { label: "도현", family: "'Do Hyeon', sans-serif", weight: 400 },
  { label: "주아", family: "'Jua', sans-serif", weight: 400 },
  { label: "나눔손글씨", family: "'Nanum Pen Script', cursive", weight: 400 },
  { label: "고딕", family: "'Noto Sans KR', sans-serif", weight: 900 },
  { label: "명조", family: "'Noto Serif KR', serif", weight: 700 },
  { label: "Bebas", family: "'Bebas Neue', sans-serif", weight: 400 },
  { label: "Oswald", family: "'Oswald', sans-serif", weight: 700 },
  { label: "Playfair", family: "'Playfair Display', serif", weight: 900 },
];

// ── 텍스트 색상 팔레트 ────────────────────────────────────
export const PALETTE_COLORS = [
  "#FFFFFF", "#303236", "#E5541B", "#000000", "#F5C518", "#2E7D32",
  "#1976D2", "#C62828", "#7B1FA2", "#E91E63", "#00897B", "#8D6E63",
];

// ── 크기 상수 ─────────────────────────────────────────────
export const EXPORT_W = 1080;
export const EXPORT_H = 1350; // 4:5
export const STAGE_RATIO = EXPORT_H / EXPORT_W;
export const BASE_TEXT = 0.12; // 스테이지 가로폭 대비(배율 1)
export const BASE_IMAGE = 0.5; // 업로드 이미지 기본 너비(스테이지 가로폭 대비)
export const MIN_SCALE = 0.2;
export const MAX_SCALE = 4;
export const DROP_X = 0.5;
export const DROP_Y = 0.44;
export const IMG_MAX = 1600; // 업로드 이미지 다운스케일 상한(px)

// ── 사실적 티셔츠 실루엣(viewBox 0 0 400 500) ────────────
const TEE_PATH =
  "M168 72 C150 74 132 82 118 92 L56 112 C44 116 38 126 39 138 L44 188 C44 199 53 205 64 203 L102 195 C110 197 114 205 115 216 C118 300 120 380 125 452 C125 463 132 470 143 470 L257 470 C268 470 275 463 275 452 C280 380 282 300 285 216 C286 205 290 197 298 195 L336 203 C347 205 356 199 356 188 L361 138 C362 126 356 116 344 112 L282 92 C268 82 250 74 232 72 C224 92 210 100 200 100 C190 100 176 92 168 72 Z";

/**
 * 사실적 티셔츠 SVG 문자열. 색상은 base fill 만 바뀌고, 음영·솔기·칼라는
 * 검정/흰색 투명도로 그려 어떤 색상에서도 자연스럽게 보인다.
 * DOM(인라인)·내보내기(이미지) 양쪽에서 동일 사용.
 */
export function shirtSvg(color: string, w: number | string = "100%", h: number | string = "100%"): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet">` +
    `<defs>` +
    `<radialGradient id="wuHi" cx="50%" cy="40%" r="56%"><stop offset="0%" stop-color="#fff" stop-opacity="0.12"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="wuShL" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#000" stop-opacity="0.16"/><stop offset="24%" stop-color="#000" stop-opacity="0"/></linearGradient>` +
    `<linearGradient id="wuShR" x1="1" y1="0" x2="0" y2="0"><stop offset="0%" stop-color="#000" stop-opacity="0.16"/><stop offset="24%" stop-color="#000" stop-opacity="0"/></linearGradient>` +
    `<radialGradient id="wuDrop" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#000" stop-opacity="0.18"/><stop offset="100%" stop-color="#000" stop-opacity="0"/></radialGradient>` +
    `<clipPath id="wuTee"><path d="${TEE_PATH}"/></clipPath>` +
    `</defs>` +
    `<ellipse cx="200" cy="478" rx="120" ry="15" fill="url(#wuDrop)"/>` +
    `<path d="${TEE_PATH}" fill="${color}" stroke="#000" stroke-opacity="0.09" stroke-width="1.5" stroke-linejoin="round"/>` +
    `<g clip-path="url(#wuTee)">` +
    `<rect x="0" y="0" width="400" height="500" fill="url(#wuHi)"/>` +
    `<rect x="0" y="0" width="400" height="500" fill="url(#wuShL)"/>` +
    `<rect x="0" y="0" width="400" height="500" fill="url(#wuShR)"/>` +
    `</g>` +
    `<path d="M168 74 C176 92 190 100 200 100 C210 100 224 92 232 74" fill="none" stroke="#000" stroke-opacity="0.16" stroke-width="6" stroke-linecap="round"/>` +
    `<path d="M50 170 Q74 181 98 184" fill="none" stroke="#000" stroke-opacity="0.10" stroke-width="2"/>` +
    `<path d="M350 170 Q326 181 302 184" fill="none" stroke="#000" stroke-opacity="0.10" stroke-width="2"/>` +
    `<path d="M143 462 Q200 470 257 462" fill="none" stroke="#000" stroke-opacity="0.10" stroke-width="2"/>` +
    `</svg>`
  );
}
