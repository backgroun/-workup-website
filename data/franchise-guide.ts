// 창업안내(/franchise) 페이지 편집 콘텐츠.
// 관리자가 site_settings("franchise_guide")에서 수정. 계약 가맹수는 실제 매장 수로 실시간 반영(편집 대상 아님).
// 아이콘/그래픽(매장·차트·핀 아이콘, 5km·無/0원 그래픽)은 코드 고정 — 구조(3/3/4)는 유지하고 텍스트만 편집.

export type ReqGroup = { title: string; items: string[] };
export type GuidePoint = { title: string; desc: string };
export type GuideBenefit = { line1: string; line2: string };

export type FranchiseGuideConfig = {
  wordmark: string;
  title: string;        // 여러 줄(\n)
  subtitle: string;
  requirements: ReqGroup[];   // 3 (아이콘 고정)
  points: GuidePoint[];       // 3 (미디어 고정)
  benefits: GuideBenefit[];   // 4 (아이콘 고정)
  cta_prefix: string;         // "계약 가맹수"
  cta_suffix: string;         // "호점 돌파!"
  count_fallback: number;     // 매장 수를 못 읽을 때 표시값
};

export const DEFAULT_FRANCHISE_GUIDE: FranchiseGuideConfig = {
  wordmark: "WORKUP",
  title: "워크업\n창업안내",
  subtitle: "국내 최초 워크웨어 아울렛",
  requirements: [
    { title: "필요조건", items: ["매장 70평 이상", "초기 투자 최소화", "사업자 등록"] },
    { title: "매출액", items: ["연매출 15억 + @", "마진율 31.5% ~ 35%"] },
    { title: "지역별 지점관리", items: ["지정 제한 5km", "(이동상거리 기준)"] },
  ],
  points: [
    { title: "국내 최초\n워크웨어 아울렛", desc: "워크웨어 시장을 선도하는\n독보적 비즈니스 모델" },
    { title: "안정적인 상권 보호", desc: "지점 간 균형을 통해\n지속 가능한 매출 환경 구축" },
    { title: "초기 비용 부담 감소", desc: "교육비 및 보증금 無\n월 가맹비 50만원" },
  ],
  benefits: [
    { line1: "검증된", line2: "비즈니스 모델" },
    { line1: "체계적인", line2: "운영 지원" },
    { line1: "다양한 상품과", line2: "안정적 공급" },
    { line1: "전국 단위", line2: "마케팅 지원" },
  ],
  cta_prefix: "계약 가맹수",
  cta_suffix: "호점 돌파!",
  count_fallback: 130,
};

const str = (v: unknown, d: string): string => (typeof v === "string" ? v : d);
const arrStr = (v: unknown, d: string[]): string[] =>
  Array.isArray(v) ? v.map((x) => String(x)) : d;

// 저장값을 기본 구조(3/3/4)에 맞춰 정규화 — 아이콘/그래픽과 인덱스가 어긋나지 않게 한다.
export function normalizeFranchiseGuide(raw: Partial<FranchiseGuideConfig> | null | undefined): FranchiseGuideConfig {
  const c = (raw ?? {}) as Record<string, unknown>;
  const d = DEFAULT_FRANCHISE_GUIDE;
  const reqs = Array.isArray(c.requirements) ? (c.requirements as Record<string, unknown>[]) : [];
  const pts = Array.isArray(c.points) ? (c.points as Record<string, unknown>[]) : [];
  const bens = Array.isArray(c.benefits) ? (c.benefits as Record<string, unknown>[]) : [];
  const n = typeof c.count_fallback === "number" && c.count_fallback >= 0 ? c.count_fallback : d.count_fallback;
  return {
    wordmark: str(c.wordmark, d.wordmark),
    title: str(c.title, d.title),
    subtitle: str(c.subtitle, d.subtitle),
    requirements: d.requirements.map((dr, i) => {
      const r = reqs[i] ?? {};
      return { title: str(r.title, dr.title), items: arrStr(r.items, dr.items) };
    }),
    points: d.points.map((dp, i) => {
      const p = pts[i] ?? {};
      return { title: str(p.title, dp.title), desc: str(p.desc, dp.desc) };
    }),
    benefits: d.benefits.map((db, i) => {
      const b = bens[i] ?? {};
      return { line1: str(b.line1, db.line1), line2: str(b.line2, db.line2) };
    }),
    cta_prefix: str(c.cta_prefix, d.cta_prefix),
    cta_suffix: str(c.cta_suffix, d.cta_suffix),
    count_fallback: n,
  };
}
