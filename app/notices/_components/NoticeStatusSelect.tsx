"use client";
import { useState } from "react";

export type NoticeStatus = "대기" | "진행중" | "마감";

const STATUS_PILL: Record<NoticeStatus, string> = {
  대기: "bg-gray-100 text-gray-500",
  진행중: "bg-emerald-100 text-emerald-700",
  마감: "bg-amber-100 text-amber-700",
};

const OPTIONS: NoticeStatus[] = ["대기", "진행중", "마감"];

// 공지 상태를 직접 바꿀 수 있는 셀렉트 — 실수로 잘못 만든/오픈한 공지를 바로잡을 때 쓴다.
export default function NoticeStatusSelect({
  noticeId,
  status,
  onChanged,
}: {
  noticeId: string;
  status: NoticeStatus;
  onChanged: (status: NoticeStatus, data: { opened_at: string | null; closed_at: string | null }) => void;
}) {
  const [saving, setSaving] = useState(false);

  const handleChange = async (next: NoticeStatus) => {
    if (next === status || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/notices/${noticeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "상태 변경에 실패했습니다.");
        return;
      }
      onChanged(next, { opened_at: data.opened_at, closed_at: data.closed_at });
    } catch {
      alert("네트워크 오류로 상태 변경에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      <select
        value={status}
        disabled={saving}
        onChange={(e) => handleChange(e.target.value as NoticeStatus)}
        className={`appearance-none cursor-pointer pl-3 pr-7 py-1 text-[13px] font-semibold rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-300 disabled:opacity-50 ${STATUS_PILL[status]}`}
      >
        {OPTIONS.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 opacity-60"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}
