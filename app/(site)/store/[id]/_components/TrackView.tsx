"use client";
import { useEffect, useRef } from "react";
import { trackStoreEvent } from "@/lib/track";

// 지점 상세페이지 조회 1회 기록
export default function TrackView({ storeId, storeName }: { storeId: number; storeName: string }) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    trackStoreEvent("view", { id: storeId, name: storeName });
  }, [storeId, storeName]);
  return null;
}
