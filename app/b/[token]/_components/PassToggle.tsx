"use client";
import { useState } from "react";

type Props = {
  token: string;
  noticeId: string;
  noticeStatus: "대기" | "진행중" | "마감";
  initialStatus: "출고" | "패스";
  initialUpdatedAt: string | null;
};

const STATUS_PILL: Record<string, string> = {
  출고: "bg-emerald-100 text-emerald-700",
  패스: "bg-amber-100 text-amber-700",
};

function fmtTime(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

export default function PassToggle({ token, noticeId, noticeStatus, initialStatus, initialUpdatedAt }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const closed = noticeStatus !== "진행중";

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

  if (closed) {
    return (
      <div>
        <div className="mb-3 px-3.5 py-2.5 bg-gray-100 text-gray-600 text-[13px] rounded-lg text-center">
          {noticeStatus === "대기" ? "아직 공지가 열리지 않았습니다." : "마감되었습니다 · 다음 공지를 기다려주세요"}
        </div>
        <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${STATUS_PILL[status]}`}>
          {status} (최종)
        </span>
      </div>
    );
  }

  return (
    <div>
      <span className={`inline-block mb-2.5 px-3 py-1 text-sm font-semibold rounded-full ${STATUS_PILL[status]}`}>
        {status}
      </span>
      <p className="text-[12.5px] text-gray-500 mb-3">
        {status === "출고"
          ? "패스하지 않으면 자동으로 출고됩니다."
          : updatedAt
          ? `${fmtTime(updatedAt)} 변경됨`
          : "패스 처리되었습니다."}
      </p>
      {error && (
        <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 text-red-600 text-[12.5px] rounded-lg">{error}</div>
      )}
      <button
        onClick={toggle}
        disabled={saving}
        className={`w-full py-3 text-sm font-bold rounded-xl disabled:opacity-50 ${
          status === "출고"
            ? "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
            : "bg-[#303236] text-white hover:bg-[#1f2124]"
        }`}
      >
        {saving ? "처리 중..." : status === "출고" ? "패스 신청하기" : "패스 취소하기"}
      </button>
      <p className="mt-2.5 text-center text-[11.5px] text-gray-400">마감 전까지 자유롭게 변경 가능합니다.</p>
    </div>
  );
}
