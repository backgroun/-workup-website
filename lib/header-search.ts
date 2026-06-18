// 헤더 검색 설정 — 타입 / 기본값 / 정규화.
// ⚠️ 클라이언트(관리자)와 서버(헤더) 양쪽에서 import 되므로 서버 전용 코드 금지.

export type SearchConfig = {
  enabled: boolean;       // 헤더 검색 아이콘/기능 노출
  placeholder: string;    // 검색 입력창 placeholder
  popularTerms: string[]; // 인기 검색어(검색 패널 추천어)
};

export const DEFAULT_SEARCH: SearchConfig = {
  enabled: true,
  placeholder: "검색어를 입력하세요",
  popularTerms: ["카고 팬츠", "방풍 자켓", "쿨링 티셔츠", "안전조끼", "롤업 셔츠", "멀티포켓"],
};

const MAX_TERMS = 20;

export function normalizeSearch(raw: Partial<SearchConfig> | null | undefined): SearchConfig {
  const c = raw ?? {};
  const terms = Array.isArray(c.popularTerms)
    ? c.popularTerms
        .filter((t): t is string => typeof t === "string" && t.trim() !== "")
        .map((t) => t.trim())
        .slice(0, MAX_TERMS)
    : DEFAULT_SEARCH.popularTerms;
  return {
    enabled: typeof c.enabled === "boolean" ? c.enabled : DEFAULT_SEARCH.enabled,
    placeholder: typeof c.placeholder === "string" && c.placeholder.trim() ? c.placeholder.trim() : DEFAULT_SEARCH.placeholder,
    popularTerms: terms.length ? terms : DEFAULT_SEARCH.popularTerms,
  };
}
