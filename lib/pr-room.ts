// PR룸(뉴스·홍보 소식) 게시판 — 타입 · 기본값 · 정규화.
// ⚠️ 클라이언트(관리자)와 서버(공개 페이지) 양쪽에서 import 되므로 서버 전용 코드 금지.
//    서버 캐시 조회는 lib/pr-room-server.ts.
//
// 데이터는 기존 패턴(site_settings 테이블, section="pr_room")에 JSON 으로 저장한다.
// 별도 테이블·마이그레이션 없이 footer/editorial 등과 동일하게 동작한다.

export type PrPost = {
  id: string;
  title: string;
  date: string;         // 표시용 날짜 문자열 (예: "2026.06.26")
  image_url: string;    // 대표 이미지 (이미지 안에는 텍스트를 넣지 않음 — 프로젝트 규칙)
  summary: string;      // 카드/목록용 짧은 설명
  body: string;         // 상세 본문 (줄바꿈 유지)
  link: string;         // 외부 링크 — 있으면 카드 클릭 시 외부로 이동(하이브리드), 없으면 상세 페이지
  is_visible: boolean;  // 공개 노출 여부
  sort_order: number;   // 정렬 순서(오름차순)
};

export type PrRoomConfig = {
  title: string;        // 공개 페이지 헤더 제목
  subtitle: string;     // 공개 페이지 헤더 부제
  posts: PrPost[];
};

export const DEFAULT_PR_ROOM: PrRoomConfig = {
  title: "PR룸",
  subtitle: "워크업의 새로운 소식과 이야기를 전해드립니다.",
  posts: [],
};

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}
function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}

// 외부 링크는 http(s)만 허용(javascript:/data: 등 XSS 스킴 차단). 빈 값은 그대로 허용.
const HTTP_URL_RE = /^https?:\/\//i;
function safeLink(v: unknown): string {
  if (typeof v !== "string") return "";
  const u = v.trim();
  if (!u) return "";
  return HTTP_URL_RE.test(u) ? u : "";
}

function normalizePost(raw: unknown, idx: number): PrPost | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  return {
    id: str(p.id) || `pr-${idx}`,
    title: str(p.title),
    date: str(p.date),
    image_url: str(p.image_url),
    summary: str(p.summary),
    body: str(p.body),
    link: safeLink(p.link),
    is_visible: bool(p.is_visible, true),
    sort_order: typeof p.sort_order === "number" ? p.sort_order : idx,
  };
}

// 저장 데이터가 일부 누락/구버전이어도 안전하게 동작하도록 항상 정규화한다.
export function normalizePrRoom(raw: unknown): PrRoomConfig {
  const c = (raw ?? {}) as Record<string, unknown>;
  const posts = Array.isArray(c.posts)
    ? c.posts
        .map((p, i) => normalizePost(p, i))
        .filter((p): p is PrPost => p !== null)
        .sort((a, b) => a.sort_order - b.sort_order)
    : [];
  return {
    title: str(c.title, DEFAULT_PR_ROOM.title),
    subtitle: str(c.subtitle, DEFAULT_PR_ROOM.subtitle),
    posts,
  };
}

// 공개 노출용 게시글만 추린다(관리자 미리보기 제외).
export function visiblePosts(config: PrRoomConfig): PrPost[] {
  return config.posts.filter((p) => p.is_visible && p.image_url);
}
