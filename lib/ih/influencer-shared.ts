// 클라이언트 컴포넌트에서도 안전하게 import할 수 있는 순수 상수/타입 전용 파일.
// lib/ih/influencers.ts, lib/ih/memos.ts 등은 next/headers(admin-auth)를 타고 들어가는 서버 전용 모듈이라,
// "use client" 컴포넌트가 거기서 값(STATUS_LABEL 등)을 import하면 서버 전용 코드까지 브라우저 번들에 딸려 들어가
// 빌드 에러가 난다. 이 파일은 그런 의존성이 전혀 없다 — 여기서만 값을 가져오도록 한다.

/** 지점 마케팅의 "지점"은 stores 테이블(고객용 매장) 이름을 그대로 쓰는데, 전부 "워크업"으로 시작해
 *  목록/최근 협업처럼 좁은 영역에 표시할 때 불필요하게 길어진다 — 앞의 "워크업" 표기만 잘라서 보여준다. */
export function stripBranchPrefix(name: string): string {
  return name.replace(/^워크업\s*/, "");
}

/** 좁은 목록 화면(Mobile Viewer 등)에서 비용을 짧게 — 1만원 이상이면 "n.n만원", 미만이면 그대로 "n원". */
export function fmtCostCompact(n: number | null): string {
  if (n == null) return "-";
  if (n >= 10000) return `${Number((n / 10000).toFixed(1))}만원`;
  return `${n.toLocaleString("ko-KR")}원`;
}

/** 단가(게런티)를 만원 단위로 — 브랜디드 PPL처럼 항상 큰 금액을 다루는 화면에서 사용.
 *  1억원 이상이면 억 단위로("4억원", "3.5억원"), 미만이면 만원 단위로("7,000만원") 표기한다. */
export function fmtCostManwon(n: number | null): string {
  if (n == null) return "-";
  if (n >= 100000000) return `${Number((n / 100000000).toFixed(1)).toLocaleString("ko-KR")}억원`;
  return `${Math.round(n / 10000).toLocaleString("ko-KR")}만원`;
}

export type IHInfluencerStatus = "ACTIVE" | "INACTIVE" | "ENDED" | "BLOCKED";

export const STATUS_LABEL: Record<IHInfluencerStatus, string> = {
  ACTIVE: "활동",
  INACTIVE: "휴면",
  ENDED: "종료",
  BLOCKED: "차단",
};

export const STATUS_DOT: Record<IHInfluencerStatus, string> = {
  ACTIVE: "bg-emerald-500",
  INACTIVE: "bg-amber-500",
  ENDED: "bg-slate-400",
  BLOCKED: "bg-red-500",
};

/** 인플루언서 등록/수정 화면에서 관리자가 직접 지정하는 고정 구분값(Phase 5 보완) —
 *  협찬/방문 이력 유무와 무관하게 목록 "구분" 배지가 이 값을 그대로 따른다. 배열이라 둘 다 선택 가능. */
export const COLLAB_TYPE_LABEL = {
  SPONSOR: "제품 협찬 메이트",
  VISIT: "방문 인플루언서",
} as const;
export type IHCollabType = keyof typeof COLLAB_TYPE_LABEL;
export const COLLAB_TYPE_ORDER: IHCollabType[] = ["SPONSOR", "VISIT"];

export type IHBranchActivityType = "GENERAL" | "INFLUENCER_VISIT";

export const ACTIVITY_TYPE_LABEL: Record<IHBranchActivityType, string> = {
  GENERAL: "일반 활동",
  INFLUENCER_VISIT: "방문 인플루언서",
};

/** 제품 협찬(ih_sponsors) 진행 단계 — Phase 5 확정 순서(제품 수령/콘텐츠 제작중 단계는 삭제됨).
 *  대시보드/목록/상세/Mobile Viewer가 전부 이 상수 하나만 참조한다. */
export const SPONSOR_STAGE_ORDER = [
  "PLANNED",
  "SHIP_SCHEDULED",
  "SENT",
  "UPLOAD_SCHEDULED",
  "UPLOADED",
  "ENDED",
] as const;
export type IHSponsorStage = (typeof SPONSOR_STAGE_ORDER)[number];

/** 신규 등록/수정 시 실제로 고를 수 있는 상태만 — "종료"는 더 이상 선택지로 두지 않는다(업로드 완료로 갈음).
 *  기존에 이미 "종료"로 저장된 데이터는 목록/그룹 표시에 여전히 SPONSOR_STAGE_ORDER(위)를 쓰므로 사라지지 않는다. */
export const SPONSOR_STAGE_SELECTABLE_ORDER = SPONSOR_STAGE_ORDER.filter((s) => s !== "ENDED");

export const SPONSOR_STAGE_LABEL: Record<string, string> = {
  PLANNED: "협찬 예정",
  SHIP_SCHEDULED: "제품 발송 예정",
  SENT: "제품 발송",
  UPLOAD_SCHEDULED: "업로드 예정",
  UPLOADED: "업로드 완료",
  ENDED: "종료",
};

/** 진행 단계별 상태 칩 색상 — 진행될수록(예정→발송예정→발송→업로드예정→완료) 색이 단계적으로 바뀌고, 종료는 회색으로 가라앉는다. */
export const SPONSOR_STAGE_COLOR: Record<string, string> = {
  PLANNED: "bg-slate-100 text-slate-600",
  SHIP_SCHEDULED: "bg-indigo-100 text-indigo-700",
  SENT: "bg-sky-100 text-sky-700",
  UPLOAD_SCHEDULED: "bg-amber-100 text-amber-700",
  UPLOADED: "bg-emerald-100 text-emerald-700",
  ENDED: "bg-slate-200 text-slate-500",
};

/** 지점 마케팅(ih_branch_marketing) 진행 상태 — 방문 후 마케팅 등록, 정산까지 6단계.
 *  목록/상세/Mobile Viewer가 전부 이 상수 하나만 참조한다.
 *  정산예정/정산완료(SETTLEMENT_SCHEDULED/COMPLETED)는 Phase 9 보완 — 유형별 현황의 비용 집계 기준
 *  (정산완료 건만 집계)으로 쓰인다. */
export const BRANCH_MKT_STATUS_ORDER = [
  "VISIT_SCHEDULED",
  "VISIT_COMPLETED",
  "REGISTRATION_SCHEDULED",
  "REGISTRATION_COMPLETED",
  "SETTLEMENT_SCHEDULED",
  "SETTLEMENT_COMPLETED",
] as const;
export type IHBranchMktStatus = (typeof BRANCH_MKT_STATUS_ORDER)[number];

export const BRANCH_MKT_STATUS_LABEL: Record<string, string> = {
  VISIT_SCHEDULED: "방문예정",
  VISIT_COMPLETED: "방문완료",
  REGISTRATION_SCHEDULED: "등록예정",
  REGISTRATION_COMPLETED: "등록완료",
  SETTLEMENT_SCHEDULED: "정산예정",
  SETTLEMENT_COMPLETED: "정산완료",
};

/** 지점 마케팅 비용주체 — 이 마케팅 비용을 누가 부담하는지(operation_type 컬럼 재사용, 기존엔 미사용 컬럼이었음). */
export const BRANCH_MKT_COST_BEARER_OPTIONS = ["본사", "지점", "본사+지점"] as const;

export const BRANCH_MKT_STATUS_COLOR: Record<string, string> = {
  VISIT_SCHEDULED: "bg-indigo-100 text-indigo-700",
  VISIT_COMPLETED: "bg-sky-100 text-sky-700",
  REGISTRATION_SCHEDULED: "bg-amber-100 text-amber-700",
  REGISTRATION_COMPLETED: "bg-emerald-100 text-emerald-700",
  SETTLEMENT_SCHEDULED: "bg-orange-100 text-orange-700",
  SETTLEMENT_COMPLETED: "bg-violet-100 text-violet-700",
};

/** 배지 배경 없이 글자색만 필요한 곳(예: Mobile Viewer 카드의 상태 날짜 줄)에서 쓰는 텍스트 전용 색상 — 위 배지와 같은 색 계열. */
export const BRANCH_MKT_STATUS_TEXT_COLOR: Record<string, string> = {
  VISIT_SCHEDULED: "text-indigo-600",
  VISIT_COMPLETED: "text-sky-700",
  REGISTRATION_SCHEDULED: "text-amber-700",
  REGISTRATION_COMPLETED: "text-emerald-700",
  SETTLEMENT_SCHEDULED: "text-orange-700",
  SETTLEMENT_COMPLETED: "text-violet-700",
};

/** 브랜디드 PPL(ih_branded_ppl) 거래 상태 — Phase 7. 하이레벨 인플루언서/업체/연예인 단가(게런티) 정리용이라
 *  콘텐츠 제작 진행이 아니라 거래 협의 단계만 다룬다. 목록/상세/Mobile Viewer가 전부 이 상수 하나만 참조한다. */
export const BRANDED_PPL_STATUS_ORDER = ["NEGOTIATING", "CONFIRMED", "ENDED"] as const;
export type IHBrandedPplStatus = (typeof BRANDED_PPL_STATUS_ORDER)[number];

export const BRANDED_PPL_STATUS_LABEL: Record<string, string> = {
  NEGOTIATING: "협의중",
  CONFIRMED: "확정",
  ENDED: "종료",
};

export const BRANDED_PPL_STATUS_COLOR: Record<string, string> = {
  NEGOTIATING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-emerald-100 text-emerald-700",
  ENDED: "bg-slate-200 text-slate-500",
};

/** 브랜디드 PPL 구분 — 인플루언서/연예인/PPL. */
export const BRANDED_PPL_CATEGORY_ORDER = ["CELEBRITY", "PPL", "INFLUENCER"] as const;
export type IHBrandedPplCategory = (typeof BRANDED_PPL_CATEGORY_ORDER)[number];

export const BRANDED_PPL_CATEGORY_LABEL: Record<string, string> = {
  INFLUENCER: "인플루언서",
  CELEBRITY: "연예인",
  PPL: "PPL",
};

export const BRANDED_PPL_CATEGORY_COLOR: Record<string, string> = {
  INFLUENCER: "bg-blue-50 text-blue-700",
  CELEBRITY: "bg-purple-50 text-purple-700",
  PPL: "bg-teal-50 text-teal-700",
};

/** 채널 선택 Dropdown 우선 옵션 — "기타"는 직접 입력용. */
export const CHANNEL_OPTIONS = ["Instagram", "TikTok", "YouTube", "Blog"] as const;

/** 세금(공제) Dropdown 옵션 — 단가/방문 인플루언서 등록에서 공용으로 사용. */
export const TAX_TYPE_OPTIONS = ["VAT 별도", "3.3% 공제", "협업시 재문의"] as const;

/** 협찬 콘텐츠 형태 Dropdown 우선 옵션 — "기타"는 직접 입력용(CHANNEL_OPTIONS와 동일 패턴). */
export const CONTENT_FORMAT_OPTIONS = ["릴스", "피드", "스토리", "쇼츠", "유튜브 영상", "블로그"] as const;

/** follower_count(숫자) → follower_display(뷰어 표시용) 자동 변환. 예: 56000 → "5.6만" */
export function formatFollowerDisplay(count: number): string {
  if (count >= 10000) return `${Number((count / 10000).toFixed(1))}만`;
  if (count >= 1000) return `${Number((count / 1000).toFixed(1))}천`;
  return String(count);
}
