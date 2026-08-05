"use client";
import { usePassStatus, STATUS_PILL } from "./usePassStatus";

type Props = {
  token: string;
  noticeId: string;
  noticeStatus: "대기" | "진행중" | "마감";
  initialStatus: "출고" | "패스";
  initialUpdatedAt: string | null;
};

// 텍스트 목록 보기 전용 — 뱃지 + 토글 버튼 하나를 한 줄에.
export default function PassToggle({ token, noticeId, noticeStatus, initialStatus, initialUpdatedAt }: Props) {
  const { status, saving, error, toggle } = usePassStatus(token, noticeId, initialStatus, initialUpdatedAt);
  const closed = noticeStatus !== "진행중";

  return (
    <div className="flex items-center gap-2">
      <span className={`flex-shrink-0 px-2 py-0.5 text-[11px] font-semibold rounded-full ${STATUS_PILL[status]}`}>
        {status}
        {closed ? " (최종)" : ""}
      </span>
      {error && <span className="text-[11px] text-red-500 truncate">{error}</span>}
      {!closed && (
        <button
          onClick={toggle}
          disabled={saving}
          className={`ml-auto flex-shrink-0 px-3 py-1.5 text-[12px] font-bold rounded-lg disabled:opacity-50 ${
            status === "출고"
              ? "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
              : "bg-[#303236] text-white hover:bg-[#1f2124]"
          }`}
        >
          {saving ? "처리 중..." : status === "출고" ? "패스" : "패스 취소"}
        </button>
      )}
    </div>
  );
}
