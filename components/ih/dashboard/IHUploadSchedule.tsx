import Link from "next/link";
import type { IHSponsorAttentionItem } from "@/lib/ih/dashboard";
import { fmtMonthDay, fmtDDay } from "./format";

/** 일정 중심 컴팩트 리스트: 08/14 김OO 켄타 쿨기어 D-1 — 날짜/D-day를 앞에 눈에 띄게 보여주고, 클릭하면 수정 화면으로 이동한다. */
export default function IHUploadSchedule({
  items,
  emptyMessage = "예정된 항목이 없습니다",
}: {
  items: IHSponsorAttentionItem[];
  emptyMessage?: string;
}) {
  if (items.length === 0) {
    return <p className="px-4 py-6 text-center text-[14px] text-slate-500">{emptyMessage}</p>;
  }

  return (
    <ul className="divide-y divide-slate-100">
      {items.map((item) => {
        const overdue = item.daysRemaining != null && item.daysRemaining < 0;
        return (
          <li key={item.id}>
            <Link
              href={`/admin/influencer-hub/sponsors/${item.id}/edit`}
              className="flex items-center gap-3 px-4 py-2.5 text-[14px] hover:bg-slate-50 transition-colors"
            >
              <div className="flex-shrink-0 w-14 text-center">
                <p className="text-[15px] font-bold text-slate-900 tabular-nums leading-none">{fmtMonthDay(item.uploadDueDate)}</p>
                <p className={`mt-0.5 text-[11.5px] font-semibold tabular-nums ${overdue ? "text-red-600" : "text-slate-500"}`}>
                  {fmtDDay(item.daysRemaining)}
                </p>
              </div>
              <span className="flex-1 min-w-0 truncate text-slate-700">
                {item.influencerNickname ?? "-"} · {item.product}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
