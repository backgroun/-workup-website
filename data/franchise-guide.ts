// 창업안내(/franchise) 페이지 편집 콘텐츠 + 디자인(크기·자간·행간·색상·배경·이미지).
// 관리자가 site_settings("franchise_guide")에서 수정. 계약 가맹수는 실제 매장 수로 실시간 반영.
// 아이콘/그래픽(5km·無/0원)과 4/3/4 구조는 고정 — 텍스트/스타일/색/이미지만 편집.
import type { CSSProperties } from "react";

export type TextStyle = { size: number; color: string; tracking: number; leading: number };

export type ReqGroup = { title: string; items: string[] };
export type GuidePoint = { title: string; desc: string };
export type GuideBenefit = { line1: string; line2: string };

export const STYLE_KEYS = [
  "wordmark", "title", "subtitle", "eyebrow", "section_title",
  "req_title", "req_item", "point_no", "point_title", "point_desc",
  "benefit", "cta_label", "cta_number",
] as const;
export type GuideStyleKey = (typeof STYLE_KEYS)[number];
export type GuideStyles = Record<GuideStyleKey, TextStyle>;

export type GuideColors = {
  page_bg: string; header_bg: string; card_bg: string; cta_bg: string; accent: string;
};

export type FranchiseGuideConfig = {
  wordmark: string;
  title: string;        // 여러 줄(\n)
  subtitle: string;
  eyebrow: string;      // "WORKUP'S STRENGTH POINT"
  section_title: string;// "워크업 창업 포인트"
  requirements: ReqGroup[];
  points: GuidePoint[];
  benefits: GuideBenefit[];
  cta_prefix: string;
  cta_suffix: string;
  count_fallback: number;
  hero_img: string;
  team_img: string;
  colors: GuideColors;
  styles: GuideStyles;
};

const ts = (size: number, color: string, tracking = 0, leading = 1.4): TextStyle => ({ size, color, tracking, leading });

export const DEFAULT_FRANCHISE_GUIDE: FranchiseGuideConfig = {
  wordmark: "WORKUP",
  title: "워크업\n창업안내",
  subtitle: "국내 최초 워크웨어 아울렛",
  eyebrow: "WORKUP'S STRENGTH POINT",
  section_title: "워크업 창업 포인트",
  requirements: [
    { title: "필요조건", items: ["매장 70평 이상", "초기 투자 최소화", "사업자 등록"] },
    { title: "매출액", items: ["연매출 15억 + @", "마진율 31.5% ~ 35%"] },
    { title: "가맹비", items: ["가맹보증금 · 교육비 無", "월 가맹비 50만원"] },
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
  hero_img: "/images/franchise/hero.jpg",
  team_img: "/images/franchise/team.jpg",
  colors: { page_bg: "#0d0d0d", header_bg: "#f5f2ed", card_bg: "#171717", cta_bg: "#1a1a1a", accent: "#ff550c" },
  styles: {
    wordmark: ts(16, "#111111", -0.01, 1.1),
    title: ts(24, "#111111", -0.01, 1.2),
    subtitle: ts(13, "#6b7280", 0, 1.5),
    eyebrow: ts(11, "#ff550c", 0.25, 1.4),
    section_title: ts(28, "#ffffff", -0.01, 1.2),
    req_title: ts(18, "#ffffff", 0, 1.3),
    req_item: ts(14, "#d1d5db", 0, 1.6),
    point_no: ts(34, "#ff550c", 0, 1),
    point_title: ts(20, "#ffffff", 0, 1.3),
    point_desc: ts(13, "#9ca3af", 0, 1.6),
    benefit: ts(13, "#d1d5db", 0, 1.5),
    cta_label: ts(26, "#ffffff", 0, 1.2),
    cta_number: ts(52, "#ff550c", 0, 1),
  },
};

// ── 정규화 ──
const str = (v: unknown, d: string): string => (typeof v === "string" ? v : d);
const nz = (v: unknown, d: string): string => (typeof v === "string" && v.trim() ? v : d);
const arrStr = (v: unknown, d: string[]): string[] => (Array.isArray(v) ? v.map((x) => String(x)) : d);
const num = (v: unknown, d: number): number => (typeof v === "number" && !Number.isNaN(v) ? v : d);

function normStyle(raw: unknown, d: TextStyle): TextStyle {
  const r = (raw ?? {}) as Partial<TextStyle>;
  return {
    size: num(r.size, d.size),
    color: nz(r.color, d.color),
    tracking: num(r.tracking, d.tracking),
    leading: num(r.leading, d.leading),
  };
}

export function normalizeFranchiseGuide(raw: Partial<FranchiseGuideConfig> | null | undefined): FranchiseGuideConfig {
  const c = (raw ?? {}) as Record<string, unknown>;
  const d = DEFAULT_FRANCHISE_GUIDE;
  const reqs = Array.isArray(c.requirements) ? (c.requirements as Record<string, unknown>[]) : [];
  const pts = Array.isArray(c.points) ? (c.points as Record<string, unknown>[]) : [];
  const bens = Array.isArray(c.benefits) ? (c.benefits as Record<string, unknown>[]) : [];
  const rc = (c.colors ?? {}) as Record<string, unknown>;
  const rs = (c.styles ?? {}) as Record<string, unknown>;
  const styles = {} as GuideStyles;
  for (const k of STYLE_KEYS) styles[k] = normStyle(rs[k], d.styles[k]);
  return {
    wordmark: str(c.wordmark, d.wordmark),
    title: str(c.title, d.title),
    subtitle: str(c.subtitle, d.subtitle),
    eyebrow: str(c.eyebrow, d.eyebrow),
    section_title: str(c.section_title, d.section_title),
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
    count_fallback: typeof c.count_fallback === "number" && c.count_fallback >= 0 ? c.count_fallback : d.count_fallback,
    hero_img: str(c.hero_img, d.hero_img),
    team_img: str(c.team_img, d.team_img),
    colors: {
      page_bg: nz(rc.page_bg, d.colors.page_bg),
      header_bg: nz(rc.header_bg, d.colors.header_bg),
      card_bg: nz(rc.card_bg, d.colors.card_bg),
      cta_bg: nz(rc.cta_bg, d.colors.cta_bg),
      accent: nz(rc.accent, d.colors.accent),
    },
    styles,
  };
}

// TextStyle → 인라인 CSS
export function styleCss(s: TextStyle): CSSProperties {
  return { fontSize: s.size, color: s.color, letterSpacing: `${s.tracking}em`, lineHeight: s.leading };
}
