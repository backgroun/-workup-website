import NoticeStatusSelect, { type NoticeStatus } from "./NoticeStatusSelect";

function fmtTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

// 공지 상태 표시 + 직접 변경 — 마감 관리(전체 일괄)와 별개로, 실수를 바로잡을 때 개별 공지 상태를 고칠 수 있다.
export default function NoticeStatusLine({
  noticeId,
  productName,
  status,
  openedAt,
  closedAt,
  onChanged,
  pastCloseHint,
}: {
  noticeId: string;
  productName?: string;
  status: NoticeStatus;
  openedAt: string | null;
  closedAt: string | null;
  onChanged: (status: NoticeStatus, data: { opened_at: string | null; closed_at: string | null }) => void;
  // 마감 관리에서 설정한 마감 시각을 브라우저 시계가 지났는지(자동 마감 크론과 별개, 화면 표시용)
  pastCloseHint?: boolean;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex items-center gap-3 flex-wrap">
      <NoticeStatusSelect noticeId={noticeId} status={status} onChanged={onChanged} />
      {productName && <span className="font-semibold text-gray-900 text-sm">{productName}</span>}
      <span className="text-sm text-gray-500">
        {status === "대기" ? (
          "아직 오픈되지 않았습니다."
        ) : (
          <>
            오픈 {fmtTime(openedAt)} · 마감 {closedAt ? fmtTime(closedAt) : "—"}
          </>
        )}
      </span>
      {status === "진행중" && pastCloseHint && (
        <span className="text-[12px] font-semibold text-amber-600" title="마감 시각이 지났습니다. 자동 마감 처리를 기다리는 중입니다.">
          마감 시각 경과
        </span>
      )}
    </div>
  );
}
