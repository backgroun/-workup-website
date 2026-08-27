import Link from "next/link";
import type { IHBranchMarketingListItem } from "@/lib/ih/dashboard";
import { fmtMonthDay, fmtDDay, fmtNumber, fmtWon } from "./format";
import { BRANCH_MKT_STATUS_LABEL, BRANCH_MKT_STATUS_COLOR } from "@/lib/ih/influencer-shared";

/** 우선순위 섹션 공통 래퍼 — 제목 + (선택)부제 + 리스트/빈 상태를 감싼다. */
export function IHListSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="px-4 py-3 border-b border-slate-100">
        <h2 className="text-[15px] font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="text-[13px] text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function daysRemainingFrom(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const today = new Date().toISOString().slice(0, 10);
  const due = new Date(dateStr + "T00:00:00");
  const now = new Date(today + "T00:00:00");
  return Math.round((due.getTime() - now.getTime()) / 86400000);
}

/** 지점 마케팅 리스트 항목 — 방문예정/방문완료 등 화면 맥락에 맞는 items를 그대로 렌더링한다.
 *  방문예정일/방문완료일과 D-day를 줄 맨 앞에 눈에 띄게 보여주고, 클릭하면 해당 건 수정 화면으로 이동한다. */
function IHBranchMarketingRows({ items, emptyMessage }: { items: IHBranchMarketingListItem[]; emptyMessage: string }) {
  if (items.length === 0) {
    return <p className="px-4 py-6 text-center text-[14px] text-slate-500">{emptyMessage}</p>;
  }
  return (
    <ul className="divide-y divide-slate-100">
      {items.map((item) => {
        const relevantDate = item.statusDate;
        const daysRemaining = daysRemainingFrom(relevantDate);
        const overdue = daysRemaining != null && daysRemaining < 0;
        return (
          <li key={item.id}>
            <Link
              href={`/admin/influencer-hub/branch-marketing/${item.id}`}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors"
            >
              <div className="flex-shrink-0 w-14 text-center">
                <p className="text-[15px] font-bold text-slate-900 tabular-nums leading-none">{fmtMonthDay(relevantDate)}</p>
                <p className={`mt-0.5 text-[11.5px] font-semibold tabular-nums ${overdue ? "text-red-600" : "text-slate-500"}`}>
                  {fmtDDay(daysRemaining)}
                </p>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14.5px] font-medium text-slate-800 truncate">
                  {item.branchName ?? "-"} · {item.influencerNickname ?? "-"}
                </p>
                <p className="text-[13px] text-slate-500">{fmtWon(item.cost)}</p>
              </div>
              <div className="flex-shrink-0 flex flex-col items-end gap-1">
                <span className={`inline-block rounded-full text-[11.5px] font-medium px-2 py-0.5 ${BRANCH_MKT_STATUS_COLOR[item.status] ?? "bg-slate-100 text-slate-700"}`}>
                  {BRANCH_MKT_STATUS_LABEL[item.status] ?? item.status}
                </span>
                <span className="text-[13px] text-slate-600 tabular-nums">
                  {item.views != null ? `조회 ${fmtNumber(item.views)}` : "-"}
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** 지점 마케팅 리스트 — bare=true면 IHListSection 없이 항목만 렌더링한다(다른 리스트와 한 섹션에 묶을 때 사용). */
export function IHBranchMarketingList({
  items,
  bare,
  emptyMessage = "표시할 지점 마케팅이 없습니다",
}: {
  items: IHBranchMarketingListItem[];
  bare?: boolean;
  emptyMessage?: string;
}) {
  if (bare) return <IHBranchMarketingRows items={items} emptyMessage={emptyMessage} />;
  return (
    <IHListSection title="지점 마케팅">
      <IHBranchMarketingRows items={items} emptyMessage={emptyMessage} />
    </IHListSection>
  );
}
