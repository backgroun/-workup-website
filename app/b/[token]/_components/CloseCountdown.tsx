"use client";
import { useEffect, useState } from "react";

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

// 지점 화면에서 눈에 띄게 강조된 마감 카운트다운 — 페이지를 오래 켜둬도 정확하도록 30초마다 갱신.
// compact: 텍스트 목록 보기의 한 줄 안에 넣는 축약형(배경 없이 작은 글자).
// noMargin: 옆에 다른 박스(출고/패스 뱃지)와 나란히 놓을 때 자체 하단 여백을 뺀다.
export default function CloseCountdown({
  closeTime,
  compact = false,
  noMargin = false,
}: {
  closeTime: string;
  compact?: boolean;
  noMargin?: boolean;
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const closeMinutes = toMinutes(closeTime);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const remaining = Math.max(0, closeMinutes - nowMinutes);
  const h = Math.floor(remaining / 60);
  const m = remaining % 60;

  if (compact) {
    return (
      <span className="flex-shrink-0 text-[11px] font-semibold text-amber-600 tabular-nums whitespace-nowrap">
        마감 {h}:{String(m).padStart(2, "0")}
      </span>
    );
  }

  return (
    <div className={`h-full flex items-center justify-center px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-center ${noMargin ? "" : "mb-3"}`}>
      <span className="text-[15px] font-bold text-amber-700">
        마감까지 <span className="tabular-nums">{h}시간 {m}분</span> 남았어요
      </span>
    </div>
  );
}
