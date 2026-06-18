// 티셔츠 꾸미기 스튜디오 — 팔레트/셔츠/폰트 상수 + 레이어 타입 + SVG 빌더.
// 편집 화면(DOM)과 PNG 내보내기(canvas)가 동일한 자산을 공유하도록 한곳에 모은다.

export type LayerKind = "sticker" | "text" | "shape";
export type ShapeId = "circle" | "square" | "star" | "heart" | "ring" | "frame";

// 모든 좌표(x·y)는 스테이지 대비 0~1 정규화 값 → 화면 크기·내보내기 해상도와 무관하게 동일 위치 렌더.
export type Layer = {
  id: string;
  kind: LayerKind;
  x: number;
  y: number;
  scale: number; // 기본 크기에 곱하는 배율
  rotation: number; // 도(deg)
  glyph?: string; // sticker
  text?: string; // text
  font?: string; // text (font-family 문자열)
  weight?: number; // text (font-weight)
  color?: string; // text·shape
  shape?: ShapeId; // shape
};

// ── 셔츠 색상 ─────────────────────────────────────────────
export const SHIRT_COLORS = [
  { id: "white", label: "화이트", value: "#FFFFFF", stroke: "#DCD9D2" },
  { id: "sand", label: "샌드", value: "#E7DECB", stroke: "#D2C7AF" },
  { id: "gray", label: "그레이", value: "#A2A8B0", stroke: "#878E97" },
  { id: "navy", label: "네이비", value: "#1A2B4A", stroke: "#101B30" },
  { id: "black", label: "블랙", value: "#1E1E1E", stroke: "#000000" },
  { id: "orange", label: "오렌지", value: "#ff550c", stroke: "#D9430A" },
] as const;

export const DEFAULT_SHIRT_ID = "navy";

// ── 스티커(이모지) ───────────────────────────────────────
export const STICKER_GROUPS: { label: string; items: string[] }[] = [
  { label: "공구", items: ["🔧", "🔨", "🪛", "⚙️", "🧰", "🔩", "🪚", "⛏️"] },
  { label: "안전·현장", items: ["🦺", "⛑️", "🧤", "🥾", "🚧", "📐", "📏", "🪜"] },
  { label: "아웃도어", items: ["🌿", "🌲", "☀️", "🔥", "⛰️", "🏕️", "🧭", "💧"] },
  { label: "표현", items: ["💪", "👍", "🤙", "😎", "⭐", "✨", "💥", "🏆", "❤️", "🤍"] },
];

// ── 텍스트 폰트(layout.tsx 에서 이미 로드된 패밀리만 사용) ──
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

// ── 텍스트·도형 색상 팔레트 ──────────────────────────────
export const PALETTE_COLORS = [
  "#FFFFFF", "#1A2B4A", "#ff550c", "#000000", "#F5C518", "#2E7D32",
  "#1976D2", "#C62828", "#7B1FA2", "#E91E63", "#00897B", "#8D6E63",
];

// ── 도형 목록 ─────────────────────────────────────────────
export const SHAPES: { id: ShapeId; label: string }[] = [
  { id: "circle", label: "원" },
  { id: "square", label: "사각" },
  { id: "star", label: "별" },
  { id: "heart", label: "하트" },
  { id: "ring", label: "링" },
  { id: "frame", label: "프레임" },
];

// ── 크기 상수(매직넘버 방지) ─────────────────────────────
export const EXPORT_W = 1080;
export const EXPORT_H = 1350; // 4:5
export const STAGE_RATIO = EXPORT_H / EXPORT_W; // 스테이지 세로/가로 비
// 기본 크기 = 스테이지 가로폭 대비 비율(배율 1 기준)
export const BASE_STICKER = 0.16;
export const BASE_TEXT = 0.12;
export const BASE_SHAPE = 0.2;
export const MIN_SCALE = 0.4;
export const MAX_SCALE = 3.5;
// 신규 요소 추가 위치(프린트 영역 중앙 근처)
export const DROP_X = 0.5;
export const DROP_Y = 0.44;
// 캔버스 이모지 폰트 스택(OS별 컬러 이모지)
export const EMOJI_FONT =
  "'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif";

// ── 티셔츠 실루엣 ─────────────────────────────────────────
export const SHIRT_VIEWBOX = "0 0 400 500";
const SHIRT_PATH =
  "M160 72 C120 74 96 82 72 98 L54 178 C52 190 62 198 74 197 L113 187 C120 252 118 360 122 444 C122 453 128 458 138 458 L262 458 C272 458 278 453 278 444 C282 360 280 252 287 187 L326 197 C338 198 348 190 346 178 L328 98 C304 82 280 74 240 72 C232 94 208 100 200 100 C192 100 168 94 160 72 Z";
// 넥라인 리브(살짝 안쪽 곡선) — 입체감용
const SHIRT_COLLAR = "M166 80 C176 95 192 100 200 100 C208 100 224 95 234 80";

/** 티셔츠 SVG 문자열. DOM(인라인)과 내보내기(이미지) 양쪽에서 동일 사용. */
export function shirtSvg(
  fill: string,
  stroke: string,
  w: number | string = "100%",
  h: number | string = "100%"
): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${SHIRT_VIEWBOX}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet">` +
    `<path d="${SHIRT_PATH}" fill="${fill}" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>` +
    `<path d="${SHIRT_COLLAR}" fill="none" stroke="${stroke}" stroke-width="3" stroke-linecap="round" opacity="0.7"/>` +
    `</svg>`
  );
}

const STAR_POINTS =
  "50,3 61.8,33.8 94.7,35.5 69,56.2 77.6,88 50,70 22.4,88 31,56.2 5.3,35.5 38.2,33.8";
const HEART_PATH =
  "M50 86 C16 60 8 36 26 22 C39 12 50 22 50 33 C50 22 61 12 74 22 C92 36 84 60 50 86 Z";

/** 도형 SVG 문자열. viewBox 0 0 100 100, 지정한 px 크기로 출력. */
export function shapeSvg(shape: ShapeId, color: string, size: number): string {
  const open = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">`;
  let body = "";
  switch (shape) {
    case "circle":
      body = `<circle cx="50" cy="50" r="46" fill="${color}"/>`;
      break;
    case "square":
      body = `<rect x="6" y="6" width="88" height="88" rx="10" fill="${color}"/>`;
      break;
    case "star":
      body = `<polygon points="${STAR_POINTS}" fill="${color}"/>`;
      break;
    case "heart":
      body = `<path d="${HEART_PATH}" fill="${color}"/>`;
      break;
    case "ring":
      body = `<circle cx="50" cy="50" r="40" fill="none" stroke="${color}" stroke-width="12"/>`;
      break;
    case "frame":
      body = `<rect x="8" y="8" width="84" height="84" rx="10" fill="none" stroke="${color}" stroke-width="6" stroke-dasharray="11 8"/>`;
      break;
  }
  return open + body + `</svg>`;
}
