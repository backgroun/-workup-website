import type { IHSponsorAttentionItem } from "@/lib/ih/dashboard";
import { fmtDDay, SPONSOR_STAGE_LABEL } from "./format";

function DDayBadge({ daysRemaining }: { daysRemaining: number | null }) {
  const text = fmtDDay(daysRemaining);
  const overdue = daysRemaining != null && daysRemaining < 0;
  const soon = daysRemaining != null && daysRemaining >= 0 && daysRemaining <= 1;
  return (
    <span
      className={`text-[12px] font-semibold tabular-nums ${
        overdue ? "text-red-600" : soon ? "text-amber-600" : "text-slate-500"
      }`}
    >
      {text}
    </span>
  );
}

const COLS = "grid-cols-[120px_150px_90px_70px_70px_90px_80px]";

/**
 * "이번 주 확인해야 할 협찬" — 업무 리스트 형태(인플루언서/제품/채널/팔로워/D-day/상태/확인필요).
 * 지연(D+)·임박(D-1/D-day) 항목은 배경색으로 시각적으로 구분한다.
 */
export default function IHSponsorAttentionTable({ items }: { items: IHSponsorAttentionItem[] }) {
  if (items.length === 0) {
    return <p className="px-4 py-6 text-center text-[13px] text-slate-400">이번 주 확인이 필요한 협찬이 없습니다</p>;
  }

  return (
    <div className="overflow-x-auto">
      <div className={`grid ${COLS} gap-2 px-4 py-2 min-w-[670px] text-[11px] font-semibold text-slate-400 border-b border-slate-100`}>
        <span>인플루언서</span>
        <span>제품명</span>
        <span>채널</span>
        <span>팔로워</span>
        <span>D-day</span>
        <span>상태</span>
        <span>확인</span>
      </div>
      <div className="divide-y divide-slate-100 min-w-[670px]">
        {items.map((item) => (
          <div
            key={item.id}
            className={`grid ${COLS} gap-2 px-4 py-2.5 items-center text-[13px] ${
              item.needsAttention ? "bg-red-50/60" : ""
            }`}
          >
            <span className="font-medium text-slate-800 truncate">{item.influencerNickname ?? "-"}</span>
            <span className="text-slate-600 truncate">{item.product}</span>
            <span className="text-slate-500 truncate">{item.channel ?? "-"}</span>
            <span className="text-slate-500 truncate">{item.followerDisplay ?? "-"}</span>
            <DDayBadge daysRemaining={item.daysRemaining} />
            <span className="text-slate-500 truncate">{SPONSOR_STAGE_LABEL[item.status] ?? item.status}</span>
            {item.needsAttention ? (
              <span className="text-[11px] font-bold text-red-600">확인 필요</span>
            ) : (
              <span className="text-[11px] text-slate-300">-</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
