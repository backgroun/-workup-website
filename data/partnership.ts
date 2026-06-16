// 가맹·창업 / 입점·제휴 문의 페이지 안내 문구
// 관리자가 site_settings("partnership_page")에서 수정. 미설정 시 DEFAULT_PARTNERSHIP 사용.

export type PartnerInfo = {
  hero_title: string;   // 페이지 상단 큰 제목
  hero_desc: string;    // 상단 설명
  panel_title: string;  // 좌측 소개 패널 제목
  panel_desc: string;   // 좌측 소개 패널 설명
  benefits: string[];   // 혜택 리스트
  phone: string;        // 직통 전화
  hours: string;        // 운영 시간
  form_title: string;   // 폼 영역 제목
};

export type PartnershipConfig = {
  franchise: PartnerInfo;
  wholesale: PartnerInfo;
};

export const DEFAULT_PARTNERSHIP: PartnershipConfig = {
  franchise: {
    hero_title: "WORKUP 가맹·창업",
    hero_desc: "WORKUP 브랜드로 독립 매장을 창업하고 싶으신 분을 위한 안내입니다. 현장에서 검증된 제품 라인업과 본사 운영 지원으로 시작하세요.",
    panel_title: "가맹 창업 문의",
    panel_desc: "WORKUP 브랜드로 독립 매장을 창업하고 싶으신 분을 위한 안내입니다. 현장에서 검증된 제품 라인업과 본사의 운영 지원을 바탕으로 시작하세요.",
    benefits: [
      "본사 MD·운영 가이드 제공",
      "전용 POS·재고 관리 시스템",
      "오픈 전 현장 교육 1주",
      "마케팅 소재 무상 지원",
    ],
    phone: "02-0000-0000",
    hours: "평일 09:00 – 18:00",
    form_title: "가맹 창업 문의하기",
  },
  wholesale: {
    hero_title: "브랜드 입점·제휴",
    hero_desc: "의류 브랜드를 운영 중이신가요? 내 브랜드 제품을 WORKUP 매장에 납품하고 싶다면 문의해 주세요.",
    panel_title: "제휴 문의",
    panel_desc: "의류 브랜드를 운영 중이신가요? 내 브랜드 제품을 WORKUP 매장에 납품하고 싶다면 아래 폼을 통해 문의해 주세요. 작업복·캐주얼·안전용품·잡화 카테고리의 브랜드를 환영합니다.",
    benefits: [
      "전국 WORKUP 매장 입점 기회",
      "현장 특화 고객층과의 직접 접점",
      "공동 프로모션·시즌 기획전 참여",
      "브랜드 전담 입점 매니저 배정",
    ],
    phone: "02-0000-0001",
    hours: "평일 09:00 – 18:00",
    form_title: "제휴 문의하기",
  },
};

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
