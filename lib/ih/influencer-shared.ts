// 클라이언트 컴포넌트에서도 안전하게 import할 수 있는 순수 상수/타입 전용 파일.
// lib/ih/influencers.ts, lib/ih/memos.ts 등은 next/headers(admin-auth)를 타고 들어가는 서버 전용 모듈이라,
// "use client" 컴포넌트가 거기서 값(STATUS_LABEL 등)을 import하면 서버 전용 코드까지 브라우저 번들에 딸려 들어가
// 빌드 에러가 난다. 이 파일은 그런 의존성이 전혀 없다 — 여기서만 값을 가져오도록 한다.

export type IHInfluencerStatus = "ACTIVE" | "INACTIVE" | "ENDED";

export const STATUS_LABEL: Record<IHInfluencerStatus, string> = {
  ACTIVE: "활동",
  INACTIVE: "휴면",
  ENDED: "종료",
};

export type IHBranchActivityType = "GENERAL" | "INFLUENCER_VISIT";

export const ACTIVITY_TYPE_LABEL: Record<IHBranchActivityType, string> = {
  GENERAL: "일반 활동",
  INFLUENCER_VISIT: "방문 인플루언서",
};

/** 채널 선택 Dropdown 우선 옵션 — "기타"는 직접 입력용. */
export const CHANNEL_OPTIONS = ["Instagram", "TikTok", "YouTube", "Blog"] as const;

/** 세금(공제) Dropdown 옵션 — 단가/방문 인플루언서 등록에서 공용으로 사용. */
export const TAX_TYPE_OPTIONS = ["VAT 별도", "3.3% 공제", "협업시 재문의"] as const;

/** follower_count(숫자) → follower_display(뷰어 표시용) 자동 변환. 예: 56000 → "5.6만" */
export function formatFollowerDisplay(count: number): string {
  if (count >= 10000) return `${Number((count / 10000).toFixed(1))}만`;
  if (count >= 1000) return `${Number((count / 1000).toFixed(1))}천`;
  return String(count);
}
