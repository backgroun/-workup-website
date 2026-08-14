// Dashboard 표시용 포맷 헬퍼 — 0/null 값은 억지로 숫자를 만들지 않고 "-" 로 표시한다.
export function fmtNumber(n: number | null | undefined): string {
  if (n == null) return "-";
  return n.toLocaleString("ko-KR");
}

export function fmtWon(n: number | null | undefined): string {
  if (n == null || n === 0) return "0원";
  return `${n.toLocaleString("ko-KR")}원`;
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${y.slice(2)}.${m}.${d}`;
}

/** "08/14" 형태 — 업로드 예정 일정 리스트용 */
export function fmtMonthDay(iso: string | null | undefined): string {
  if (!iso) return "-";
  const [, m, d] = iso.slice(0, 10).split("-");
  return `${m}/${d}`;
}

/** D-day 배지 텍스트 — 지연은 "D+n 지연", 당일은 "D-day", 이후는 "D-n" */
export function fmtDDay(daysRemaining: number | null): string {
  if (daysRemaining == null) return "-";
  if (daysRemaining < 0) return `D+${Math.abs(daysRemaining)} 지연`;
  if (daysRemaining === 0) return "D-day";
  return `D-${daysRemaining}`;
}

export const SPONSOR_STAGE_LABEL: Record<string, string> = {
  PLANNED: "협찬 예정",
  SENT: "발송",
  RECEIVED: "수령",
  PRODUCING: "제작 중",
  UPLOAD_SCHEDULED: "업로드 예정",
  UPLOADED: "업로드 완료",
  ENDED: "종료",
};
