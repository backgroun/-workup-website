"use client";
import { useState } from "react";

export const STATUS_PILL: Record<string, string> = {
  출고: "bg-emerald-100 text-emerald-700",
  패스: "bg-red-100 text-red-700",
};

// 출고/패스 토글 상태 + API 호출을 한 곳에 모아, 카드형(PassToggle)과 텍스트 목록형에서 공유한다.
export function usePassStatus(token: string, noticeId: string, initialStatus: "출고" | "패스", initialUpdatedAt: string | null) {
  const [status, setStatus] = useState(initialStatus);
  const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggle = async () => {
    const next = status === "출고" ? "패스" : "출고";
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/pass/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noticeId, status: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "처리에 실패했습니다.");
        return;
      }
      setStatus(next);
      setUpdatedAt(data.updated_at ?? new Date().toISOString());
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return { status, updatedAt, saving, error, toggle };
}
