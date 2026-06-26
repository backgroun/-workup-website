// 영업시간 변환 유틸 — 평일/주말 시작·종료(4칸)와 표준 문자열 사이를 오간다.
//
// 표준 형식:
//   매일 동일:  "10:00 - 20:00 (매일)"
//   평일/주말:  "10:00 - 20:00 (평일) / 10:00 - 19:00 (주말)"

// 느슨한 시간 입력을 "HH:MM"으로 정규화.
//   "10" → "10:00", "9" → "09:00", "1030" → "10:30", "10:5" → "10:05"
export function normalizeTime(raw: string): string {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  if (s.includes(":")) {
    const [h, m] = s.split(":");
    const hh = (h.replace(/\D/g, "") || "0").padStart(2, "0").slice(-2);
    const mm = (m.replace(/\D/g, "") || "00").padEnd(2, "0").slice(0, 2);
    return `${hh}:${mm}`;
  }
  const digits = s.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length <= 2) return `${digits.padStart(2, "0")}:00`;
  const padded = digits.padStart(4, "0").slice(-4);
  return `${padded.slice(0, 2)}:${padded.slice(2)}`;
}

function buildRange(start: string, end: string): string {
  const s = normalizeTime(start);
  const e = normalizeTime(end);
  if (s && e) return `${s} - ${e}`;
  return s || e || "";
}

// 평일/주말 시작·종료 → 표준 hours 문자열. 주말이 비면 평일 시간으로 채운다.
export function hoursFromParts(
  wdStart: string,
  wdEnd: string,
  weStart: string,
  weEnd: string,
): string {
  const wd = buildRange(wdStart, wdEnd);
  let we = buildRange(weStart, weEnd);
  if (!we) we = wd; // 주말 비면 평일과 동일하게
  if (!wd && !we) return "";
  if (wd === we) return wd ? `${wd} (매일)` : "";
  return `${wd} (평일) / ${we} (주말)`;
}

export type HoursParts = { wdStart: string; wdEnd: string; weStart: string; weEnd: string };

// 표준 hours 문자열 → 평일/주말 시작·종료 (다운로드 엑셀용 역변환).
// "매일"이면 주말 칸은 비워 둔다(재업로드 시 평일로 자동 복제됨).
export function partsFromHours(hours: string): HoursParts {
  const empty: HoursParts = { wdStart: "", wdEnd: "", weStart: "", weEnd: "" };
  const h = String(hours ?? "").trim();
  if (!h) return empty;
  const parseRange = (seg: string) => {
    const m = seg.match(/(\d{1,2}:\d{2})\s*[-~]\s*(\d{1,2}:\d{2})/);
    return m ? { start: m[1], end: m[2] } : { start: "", end: "" };
  };
  if (h.includes("(평일)") && h.includes("(주말)")) {
    const [wdPart, wePart] = h.split("/");
    const wd = parseRange(wdPart);
    const we = parseRange(wePart);
    return { wdStart: wd.start, wdEnd: wd.end, weStart: we.start, weEnd: we.end };
  }
  const wd = parseRange(h);
  return { wdStart: wd.start, wdEnd: wd.end, weStart: "", weEnd: "" };
}
