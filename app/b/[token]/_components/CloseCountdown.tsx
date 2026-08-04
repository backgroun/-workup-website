"use client";
import { useEffect, useState } from "react";

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

// 지점 화면에서 눈에 띄게 강조된 마감 카운트다운 — 페이지를 오래 켜둬도 정확하도록 30초마다 갱신.
export default function CloseCountdown({ closeTime }: { closeTime: string }) {
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

  return (
    <div className="mb-3 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-center">
      <span className="text-[15px] font-bold text-amber-700">
        마감까지 <span className="tabular-nums">{h}시간 {m}분</span> 남았어요
      </span>
    </div>
  );
}
