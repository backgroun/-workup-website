// 헤더 검색 설정 — 타입 / 기본값 / 정규화.
// ⚠️ 클라이언트(관리자)와 서버(헤더) 양쪽에서 import 되므로 서버 전용 코드 금지.

// 검색창에 순환 노출할 문구를 어느 목록에서 가져올지 — 두 목록은 독립적으로 관리하고, 이 값으로 하나만 활성화한다.
export type SearchRotationSource = "display" | "keywords";

export type SearchConfig = {
  enabled: boolean;              // 헤더 검색 아이콘/기능 노출
  placeholder: string;           // 두 순환 목록이 모두 비어있을 때만 쓰이는 고정 안내문구
  rotationSource: SearchRotationSource; // 검색창에 순환 노출할 목록 선택
  displayPhrases: string[];      // 프로모션성 순환 문구 목록 (예: "이번주 신상품을 만나보세요")
  popularTerms: string[];        // 검색 키워드 순환 문구 목록 (예: "안전조끼")
};

export const DEFAULT_SEARCH: SearchConfig = {
  enabled: true,
  placeholder: "검색어를 입력하세요",
  rotationSource: "keywords",
  displayPhrases: ["이번주 신상품을 만나보세요", "가까운 매장에서 직접 체험해보세요"],
  popularTerms: ["카고 팬츠", "방풍 자켓", "쿨링 티셔츠", "안전조끼", "롤업 셔츠", "멀티포켓"],
};

const MAX_TERMS = 20;

function normalizePhraseList(raw: unknown, fallback: string[]): string[] {
  const list = Array.isArray(raw)
    ? raw
        .filter((t): t is string => typeof t === "string" && t.trim() !== "")
        .map((t) => t.trim())
        .slice(0, MAX_TERMS)
    : [];
  return list.length ? list : fallback;
}

export function normalizeSearch(raw: Partial<SearchConfig> | null | undefined): SearchConfig {
  const c = raw ?? {};
  return {
    enabled: typeof c.enabled === "boolean" ? c.enabled : DEFAULT_SEARCH.enabled,
    placeholder: typeof c.placeholder === "string" && c.placeholder.trim() ? c.placeholder.trim() : DEFAULT_SEARCH.placeholder,
    rotationSource: c.rotationSource === "display" || c.rotationSource === "keywords" ? c.rotationSource : DEFAULT_SEARCH.rotationSource,
    displayPhrases: normalizePhraseList(c.displayPhrases, []),
    popularTerms: normalizePhraseList(c.popularTerms, []),
  };
}
