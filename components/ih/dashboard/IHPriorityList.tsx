import type { IHBranchMarketingListItem } from "@/lib/ih/dashboard";
import { fmtDate, fmtNumber, fmtWon } from "./format";

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
        {subtitle && <p className="text-[12px] text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

/** 최근 지점 마케팅 */
export function IHBranchMarketingList({ items }: { items: IHBranchMarketingListItem[] }) {
  return (
    <IHListSection title="최근 지점 마케팅">
      {items.length === 0 ? (
        <p className="px-4 py-6 text-center text-[13px] text-slate-400">최근 집행 내역이 없습니다</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="min-w-0">
                <p className="text-[13.5px] font-medium text-slate-800 truncate">
                  {item.branchName ?? "-"} · {item.influencerNickname ?? "-"}
                </p>
                <p className="text-[12px] text-slate-400">
                  {fmtDate(item.marketingDate)} · {fmtWon(item.cost)}
                </p>
              </div>
              <span className="flex-shrink-0 text-[12.5px] text-slate-500 tabular-nums">
                {item.views != null ? `조회 ${fmtNumber(item.views)}` : "-"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </IHListSection>
  );
}
