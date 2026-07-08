// 가맹·창업 / 입점·제휴 문의 페이지 안내 문구 + 디자인(크기·색상) + 문의 폼
// 관리자가 site_settings("partnership_page")에서 수정. 미설정 시 DEFAULT_PARTNERSHIP 사용.
// 공개 페이지/미리보기는 반드시 normalizePartnership()을 거쳐 하위호환 기본값을 채운다.

// 텍스트 스타일 — 글자 크기(px) + 색상(hex). 요소별로 개별 조절.
export type TextStyle = { size: number; color: string };

export type PartnerStyles = {
  eyebrow: TextStyle;
  panel_title: TextStyle;
  panel_desc: TextStyle;
  benefits: TextStyle;
  bullet_color: string; // 혜택 불릿(점) 색상
  phone_label: TextStyle;
  phone: TextStyle;
  hours: TextStyle;
  form_title: TextStyle;
  form_desc: TextStyle;
};

// 문의 폼 — 필드 텍스트(라벨/플레이스홀더)와 버튼·안내 문구, 스타일.
// 필드의 key(백엔드 컬럼)·필수여부·입력 타입은 코드에 고정. 여기선 표시 텍스트/스타일만 편집한다.
export type FormFieldText = { key: string; label: string; placeholder: string };

export type FormConfig = {
  fields: FormFieldText[];
  label_style: TextStyle;   // 필드 라벨 크기·색
  input_size: number;       // 입력 글자 크기(px)
  input_color: string;      // 입력 글자색
  submit_text: string;      // 제출 버튼 문구
  button_bg: string;        // 버튼 배경색
  button_color: string;     // 버튼 글자색
  footer_text: string;      // 폼 하단 안내
  footer_style: TextStyle;  // 하단 안내 크기·색
  success_title: string;    // 접수 완료 제목
  success_desc: string;     // 접수 완료 설명
  consent_text: string;     // 동의 문구(가맹 전용)
  consent_note: string;     // 동의 보조 문구(가맹 전용)
};

export type PartnerInfo = {
  eyebrow: string;      // 패널 상단 소제목 (예: Partnership)
  panel_title: string;  // 소개 패널 제목
  panel_desc: string;   // 소개 패널 설명
  benefits: string[];   // 혜택 리스트
  phone_label: string;  // 직통 전화 라벨
  phone: string;        // 직통 전화 번호
  hours: string;        // 운영 시간
  form_title: string;   // 폼 영역 제목
  form_desc: string;    // 폼 영역 안내 문구(선택)
  panel_bg: string;     // 패널 배경색
  seo_title: string;    // 검색/브라우저 탭 제목
  seo_desc: string;     // 검색 결과 설명(meta description)
  styles: PartnerStyles;
  form: FormConfig;     // 문의 폼 설정
};

export type PartnershipConfig = {
  franchise: PartnerInfo;
  wholesale: PartnerInfo;
};

// 기본 스타일(현재 하드코딩된 Tailwind 값을 px/hex로 옮긴 것)
const s = (size: number, color: string): TextStyle => ({ size, color });

const BASE_STYLES: PartnerStyles = {
  eyebrow: s(12, "#ff550c"),
  panel_title: s(24, "#ffffff"),
  panel_desc: s(14, "#d1d5db"),
  benefits: s(12, "#d1d5db"),
  bullet_color: "#ff550c",
  phone_label: s(12, "#9ca3af"),
  phone: s(14, "#ffffff"),
  hours: s(12, "#6b7280"),
  form_title: s(16, "#1A2B4A"),
  form_desc: s(12, "#9ca3af"),
};

// 폼 공통 기본 스타일/문구
const FORM_BASE = {
  label_style: s(12, "#6b7280"),
  input_size: 14,
  input_color: "#1A2B4A",
  button_bg: "#1A2B4A",
  button_color: "#ffffff",
  footer_style: s(12, "#9ca3af"),
  success_title: "문의가 접수되었습니다",
  success_desc: "영업일 기준 2일 이내에 담당자가 연락드립니다.",
  footer_text: "영업일 기준 2일 이내 연락드립니다.",
  consent_text: "개인정보 수집·이용에 동의합니다.",
  consent_note: "이름·연락처는 문의 접수 및 상담 안내 목적으로만 사용됩니다.",
};

const FRANCHISE_FORM: FormConfig = {
  ...FORM_BASE,
  submit_text: "가맹 문의 접수하기 →",
  fields: [
    { key: "name", label: "이름", placeholder: "홍길동" },
    { key: "phone", label: "연락처", placeholder: "010-0000-0000" },
    { key: "region", label: "창업 희망 지역", placeholder: "예) 서울 강남, 경기 수원 등" },
    { key: "message", label: "문의 내용", placeholder: "창업 예산, 희망 규모, 궁금한 점을 자유롭게 적어주세요." },
  ],
};

const WHOLESALE_FORM: FormConfig = {
  ...FORM_BASE,
  submit_text: "입점 문의 접수하기 →",
  fields: [
    { key: "brand", label: "브랜드명", placeholder: "브랜드 이름" },
    { key: "manager", label: "담당자명", placeholder: "홍길동" },
    { key: "phone", label: "연락처", placeholder: "010-0000-0000" },
    { key: "category", label: "취급 품목", placeholder: "예) 작업복, 안전용품, 잡화 등" },
    { key: "link", label: "브랜드 소개 링크", placeholder: "홈페이지, 인스타그램, 카탈로그 URL 등" },
    { key: "message", label: "문의 내용", placeholder: "입점을 원하는 이유, 제품 특장점, 희망 조건 등을 자유롭게 적어주세요." },
  ],
};

export const DEFAULT_PARTNERSHIP: PartnershipConfig = {
  franchise: {
    eyebrow: "Partnership",
    panel_title: "가맹 창업 문의",
    panel_desc:
      "WORKUP 브랜드로 독립 매장을 창업하고 싶으신 분을 위한 안내입니다. 현장에서 검증된 제품 라인업과 본사의 운영 지원을 바탕으로 시작하세요.",
    benefits: [
      "본사 MD·운영 가이드 제공",
      "전용 POS·재고 관리 시스템",
      "오픈 전 현장 교육 1주",
      "마케팅 소재 무상 지원",
    ],
    phone_label: "직통 전화",
    phone: "02-0000-0000",
    hours: "평일 09:00 – 18:00",
    form_title: "가맹 창업 문의하기",
    form_desc: "",
    panel_bg: "#1A2B4A",
    seo_title: "가맹·창업 문의 | WORKUP",
    seo_desc: "WORKUP 브랜드로 독립 매장을 창업하고 싶으신 분을 위한 가맹·창업 문의 안내.",
    styles: BASE_STYLES,
    form: FRANCHISE_FORM,
  },
  wholesale: {
    eyebrow: "Partnership",
    panel_title: "제휴 문의",
    panel_desc:
      "의류 브랜드를 운영 중이신가요? 내 브랜드 제품을 WORKUP 매장에 납품하고 싶다면 아래 폼을 통해 문의해 주세요. 작업복·캐주얼·안전용품·잡화 카테고리의 브랜드를 환영합니다.",
    benefits: [
      "전국 WORKUP 매장 입점 기회",
      "현장 특화 고객층과의 직접 접점",
      "공동 프로모션·시즌 기획전 참여",
      "브랜드 전담 입점 매니저 배정",
    ],
    phone_label: "직통 전화",
    phone: "02-0000-0001",
    hours: "평일 09:00 – 18:00",
    form_title: "제휴 문의하기",
    form_desc: "",
    panel_bg: "#2d4f72",
    seo_title: "브랜드 입점·제휴 문의 | WORKUP",
    seo_desc: "내 브랜드 제품을 WORKUP 매장에 납품하고 싶은 분을 위한 입점·제휴 문의 안내.",
    styles: BASE_STYLES,
    form: WHOLESALE_FORM,
  },
};

// ── 정규화(하위호환) — 저장된 config에 빠진 필드/스타일을 기본값으로 채운다 ──
const str = (v: unknown, d: string): string => (typeof v === "string" ? v : d);

function normStyle(raw: unknown, def: TextStyle): TextStyle {
  const r = (raw ?? {}) as Partial<TextStyle>;
  return {
    size: typeof r.size === "number" && r.size > 0 ? r.size : def.size,
    color: typeof r.color === "string" && r.color ? r.color : def.color,
  };
}

// 폼 정규화 — 필드 key/순서는 기본값에 고정하고, 라벨·플레이스홀더만 저장값으로 덮어쓴다.
function normForm(raw: unknown, def: FormConfig): FormConfig {
  const r = (raw ?? {}) as Record<string, unknown>;
  const rawFields = Array.isArray(r.fields) ? (r.fields as Record<string, unknown>[]) : [];
  const byKey: Record<string, Record<string, unknown>> = {};
  for (const f of rawFields) {
    if (f && typeof f.key === "string") byKey[f.key] = f;
  }
  const fields: FormFieldText[] = def.fields.map((df) => {
    const rf = byKey[df.key] ?? {};
    return {
      key: df.key,
      label: str(rf.label, df.label),
      placeholder: str(rf.placeholder, df.placeholder),
    };
  });
  return {
    fields,
    label_style: normStyle(r.label_style, def.label_style),
    input_size: typeof r.input_size === "number" && r.input_size > 0 ? r.input_size : def.input_size,
    input_color: str(r.input_color, def.input_color) || def.input_color,
    submit_text: str(r.submit_text, def.submit_text),
    button_bg: str(r.button_bg, def.button_bg) || def.button_bg,
    button_color: str(r.button_color, def.button_color) || def.button_color,
    footer_text: str(r.footer_text, def.footer_text),
    footer_style: normStyle(r.footer_style, def.footer_style),
    success_title: str(r.success_title, def.success_title),
    success_desc: str(r.success_desc, def.success_desc),
    consent_text: str(r.consent_text, def.consent_text),
    consent_note: str(r.consent_note, def.consent_note),
  };
}

function normInfo(raw: unknown, def: PartnerInfo): PartnerInfo {
  const r = (raw ?? {}) as Record<string, unknown>;
  const rs = (r.styles ?? {}) as Record<string, unknown>;
  return {
    eyebrow: str(r.eyebrow, def.eyebrow),
    panel_title: str(r.panel_title, def.panel_title),
    panel_desc: str(r.panel_desc, def.panel_desc),
    benefits: Array.isArray(r.benefits) ? (r.benefits as unknown[]).map((b) => String(b)) : def.benefits,
    phone_label: str(r.phone_label, def.phone_label),
    phone: str(r.phone, def.phone),
    hours: str(r.hours, def.hours),
    form_title: str(r.form_title, def.form_title),
    form_desc: str(r.form_desc, def.form_desc),
    panel_bg: str(r.panel_bg, def.panel_bg) || def.panel_bg,
    seo_title: str(r.seo_title, def.seo_title),
    seo_desc: str(r.seo_desc, def.seo_desc),
    styles: {
      eyebrow: normStyle(rs.eyebrow, def.styles.eyebrow),
      panel_title: normStyle(rs.panel_title, def.styles.panel_title),
      panel_desc: normStyle(rs.panel_desc, def.styles.panel_desc),
      benefits: normStyle(rs.benefits, def.styles.benefits),
      bullet_color: str(rs.bullet_color, def.styles.bullet_color) || def.styles.bullet_color,
      phone_label: normStyle(rs.phone_label, def.styles.phone_label),
      phone: normStyle(rs.phone, def.styles.phone),
      hours: normStyle(rs.hours, def.styles.hours),
      form_title: normStyle(rs.form_title, def.styles.form_title),
      form_desc: normStyle(rs.form_desc, def.styles.form_desc),
    },
    form: normForm(r.form, def.form),
  };
}

export function normalizePartnership(raw: Partial<PartnershipConfig> | null | undefined): PartnershipConfig {
  return {
    franchise: normInfo(raw?.franchise, DEFAULT_PARTNERSHIP.franchise),
    wholesale: normInfo(raw?.wholesale, DEFAULT_PARTNERSHIP.wholesale),
  };
}

// 문의 유형
export type InquiryType = "franchise" | "wholesale";
export type InquiryStatus = "new" | "processing" | "done";

export type Inquiry = {
  id: string;
  type: InquiryType;
  payload: Record<string, string>;
  status: InquiryStatus;
  created_at: string;
};

export const INQUIRY_STATUS_LABEL: Record<InquiryStatus, string> = {
  new: "신규",
  processing: "처리중",
  done: "완료",
};
