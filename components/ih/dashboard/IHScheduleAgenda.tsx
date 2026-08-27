import Link from "next/link";
import type { IHDashboardData } from "@/lib/ih/dashboard";
import { SPONSOR_STAGE_LABEL, SPONSOR_STAGE_COLOR, BRANCH_MKT_STATUS_LABEL, BRANCH_MKT_STATUS_COLOR } from "@/lib/ih/influencer-shared";

const WEEKDAY_LABEL = ["일", "월", "화", "수", "목", "금", "토"];

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

type AgendaEntry = {
  kind: "BRANCH" | "SPONSOR";
  id: number;
  label: string;
  sub: string | null;
  status: string;
  href: string;
};

/**
 * 업로드완료/등록완료 이전의 모든 진행 단계(제품 협찬: 협찬예정~업로드예정, 지점 마케팅: 방문예정~등록예정)를
 * 오늘부터 14일간 날짜별로 묶어 일정표 형태로 보여준다. 별도 조회 없이 page.tsx가 이미 가져온
 * data.schedule을 그대로 재사용한다. 기존 "제품 협찬 현황/지점 방문 현황/성과" 패널을 대체한다.
 */
export default function IHScheduleAgenda({
  branchMarketing,
  sponsors,
  startDate,
  dayCount = 14,
  title = "2주 일정",
  bare = false,
  hideEmptyDays = false,
}: {
  branchMarketing: IHDashboardData["schedule"]["branchMarketing"];
  sponsors: IHDashboardData["schedule"]["sponsors"];
  /** 목록의 시작일 — 기본은 오늘. 기간 선택 보기에서는 사용자가 고른 시작일이 들어온다. */
  startDate?: Date;
  /** 몇 일치를 보여줄지 — 기본 14일(2주). */
  dayCount?: number;
  title?: string;
  /** true면 바깥 테두리/타이틀 없이 목록만 그린다(모달 안에서 재사용할 때). */
  bare?: boolean;
  /** 일정 없는 날은 아예 건너뛴다 — 기간이 긴 보기에서 빈 줄이 잔뜩 뜨는 걸 막는다. */
  hideEmptyDays?: boolean;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const rangeStart = startDate ? new Date(startDate) : today;
  rangeStart.setHours(0, 0, 0, 0);

  const days = Array.from({ length: dayCount }, (_, i) => {
    const d = new Date(rangeStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const byDate = new Map<string, AgendaEntry[]>();
  for (const b of branchMarketing) {
    if (!b.date) continue;
    const key = b.date.slice(0, 10);
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push({
      kind: "BRANCH",
      id: b.id,
      label: b.branchName ?? "-",
      sub: b.influencerNickname,
      status: b.status,
      href: `/admin/influencer-hub/branch-marketing/${b.id}`,
    });
  }
  for (const s of sponsors) {
    if (!s.date) continue;
    const key = s.date.slice(0, 10);
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push({
      kind: "SPONSOR",
      id: s.id,
      label: s.product,
      sub: s.influencerNickname,
      status: s.status,
      href: `/admin/influencer-hub/sponsors/${s.id}/edit`,
    });
  }

  const rows = days.filter((d) => !hideEmptyDays || (byDate.get(toIsoDate(d)) ?? []).length > 0);

  const list = (
    <div className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto">
      {rows.length === 0 ? (
        <p className="px-4 py-10 text-center text-[13px] text-slate-400">해당 기간에 예정된 일정이 없습니다.</p>
      ) : (
        rows.map((d) => {
          const key = toIsoDate(d);
          const isToday = key === toIsoDate(today);
          const entries = byDate.get(key) ?? [];
          return (
            <div key={key} className={`flex gap-3 px-4 py-2.5 ${isToday ? "bg-slate-50" : ""}`}>
              <div className="flex-shrink-0 w-11 text-center">
                <p className={`text-[13px] font-bold tabular-nums leading-none ${isToday ? "text-slate-900" : "text-slate-700"}`}>
                  {d.getMonth() + 1}/{d.getDate()}
                </p>
                <p className={`mt-0.5 text-[11px] ${isToday ? "text-slate-600 font-semibold" : "text-slate-400"}`}>
                  {isToday ? "오늘" : WEEKDAY_LABEL[d.getDay()]}
                </p>
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                {entries.length === 0 ? (
                  <p className="text-[12.5px] text-slate-300 leading-6">-</p>
                ) : (
                  entries.map((e) => {
                    const label = e.kind === "BRANCH" ? BRANCH_MKT_STATUS_LABEL[e.status] ?? e.status : SPONSOR_STAGE_LABEL[e.status] ?? e.status;
                    const color = e.kind === "BRANCH" ? BRANCH_MKT_STATUS_COLOR[e.status] : SPONSOR_STAGE_COLOR[e.status];
                    return (
                      <Link key={`${e.kind}-${e.id}`} href={e.href} className="flex items-start gap-1.5 text-[12.5px] hover:underline">
                        <span className={`flex-shrink-0 inline-block rounded px-1.5 py-0.5 text-[10.5px] font-semibold ${color ?? "bg-slate-100 text-slate-600"}`}>
                          {label}
                        </span>
                        <span className="min-w-0 whitespace-normal break-words text-slate-700">
                          {e.label}
                          {e.sub && ` · ${e.sub}`}
                        </span>
                      </Link>
                        );
                  })
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  if (bare) return list;

  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="px-4 py-3 border-b border-slate-100">
        <h2 className="text-[14.5px] font-bold text-slate-900">{title}</h2>
      </div>
      {list}
    </section>
  );
}
