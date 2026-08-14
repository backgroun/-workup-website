import type { IHSponsorAttentionItem } from "@/lib/ih/dashboard";
import { fmtMonthDay, fmtDDay } from "./format";

/** "업로드 예정" — 일정 중심 컴팩트 리스트: 08/14 김OO 켄타 쿨기어 D-1 */
export default function IHUploadSchedule({ items }: { items: IHSponsorAttentionItem[] }) {
  if (items.length === 0) {
    return <p className="px-4 py-6 text-center text-[13px] text-slate-400">예정된 업로드가 없습니다</p>;
  }

  return (
    <ul className="divide-y divide-slate-100">
      {items.map((item) => (
        <li key={item.id} className="flex items-center gap-3 px-4 py-2.5 text-[13px]">
          <span className="w-11 flex-shrink-0 text-slate-400 tabular-nums">{fmtMonthDay(item.uploadDueDate)}</span>
          <span className="flex-1 min-w-0 truncate text-slate-700">
            {item.influencerNickname ?? "-"} · {item.product}
          </span>
          <span
            className={`flex-shrink-0 text-[12px] font-semibold tabular-nums ${
              item.needsAttention ? "text-amber-600" : "text-slate-500"
            }`}
          >
            {fmtDDay(item.daysRemaining)}
          </span>
        </li>
      ))}
    </ul>
  );
}
