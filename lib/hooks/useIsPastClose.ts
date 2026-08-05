"use client";
import { useEffect, useState } from "react";

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

// 마감 카운트다운이 0에 닿으면(브라우저 시계 기준) 서버의 상태 갱신(14:00 크론)을 기다리지 않고
// 화면에서 바로 "마감"으로 취급한다 — 실제 저장은 항상 서버(setPassStatus)가 다시 검증한다.
export function useIsPastClose(closeTime: string): boolean {
  const [isPast, setIsPast] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes() >= toMinutes(closeTime);
  });

  useEffect(() => {
    const check = () => {
      const now = new Date();
      setIsPast(now.getHours() * 60 + now.getMinutes() >= toMinutes(closeTime));
    };
    check();
    const timer = setInterval(check, 30_000);
    return () => clearInterval(timer);
  }, [closeTime]);

  return isPast;
}
