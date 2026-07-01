"use client";
import { useState, useEffect } from "react";
import { stores as staticStores, type Store } from "@/data/stores";

// 클라이언트 컴포넌트용 매장 목록 훅.
// 정적 데이터로 즉시 렌더 후, /api/stores(DB) 결과로 교체(빈 배열이면 빈 목록).
// fetch 실패(장애) 시에만 정적 데이터 유지.
export function useStores(): Store[] {
  const [list, setList] = useState<Store[]>(staticStores);
  useEffect(() => {
    let alive = true;
    fetch("/api/stores")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("fetch failed"))))
      .then((d) => {
        if (alive && Array.isArray(d)) setList(d as Store[]);
      })
      .catch(() => {}); // 실패 시 정적 데이터 유지
    return () => {
      alive = false;
    };
  }, []);
  return list;
}
