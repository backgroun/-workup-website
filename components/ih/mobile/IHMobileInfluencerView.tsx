import type { IHInfluencerMobileSummary } from "@/lib/ih/influencers";
import { ACTIVITY_TYPE_LABEL } from "@/lib/ih/influencer-shared";

const STATUS_DOT: Record<string, string> = { ACTIVE: "bg-emerald-500", INACTIVE: "bg-amber-500", ENDED: "bg-slate-400" };
const STATUS_LABEL: Record<string, string> = { ACTIVE: "활동", INACTIVE: "휴면", ENDED: "종료" };

function fmtDate(iso: string | null) {
  if (!iso) return "";
  const [, m, d] = iso.slice(0, 10).split("-");
  return `${m}/${d}`;
}

/**
 * Mobile Viewer의 인플루언서 상세 화면 — PC 우측 Preview와 실제 모바일 페이지가 공유하는 컴포넌트.
 * Phase 4.3: 연락처/주소/실명/단가/세금/실지급액/내부메모는 절대 표시하지 않는다.
 * 우선순위: 닉네임→채널→팔로워→콘텐츠→활동지역→태그→WORKUP 협업횟수→평균조회수→평균반응수
 *          →최근협업(협업유형·대상·일정·상태만).
 */
export default function IHMobileInfluencerView({ summary }: { summary: IHInfluencerMobileSummary }) {
  return (
    <div className="flex flex-col h-full bg-white text-slate-900">
      <header className="flex-shrink-0 h-12 flex items-center justify-between px-4 border-b border-slate-100">
        <span className="font-bold text-[14px] tracking-tight">WORKUP</span>
        <span className="text-[11px] text-slate-400">Influencer Hub</span>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* 프로필 요약 */}
        <section>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[summary.status]}`} />
            <span className="text-[11px] text-slate-400">{STATUS_LABEL[summary.status]}</span>
          </div>
          <h1 className="mt-1 text-[19px] font-bold text-slate-900">{summary.nickname}</h1>
          <p className="text-[12.5px] text-slate-500">
            {summary.channel} · {summary.followerDisplay ?? "-"} Followers
          </p>
          <p className="text-[12.5px] text-slate-500">
            {summary.contentType.length > 0 ? summary.contentType.join(" · ") : "-"}
            {Array.isArray(summary.activityArea) && summary.activityArea.length > 0 ? ` · ${summary.activityArea.join(" · ")}` : ""}
          </p>
          {summary.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {summary.tags.map((t) => (
                <span key={t} className="rounded-full bg-slate-100 text-slate-600 text-[11px] px-2 py-0.5">
                  #{t}
                </span>
              ))}
            </div>
          )}
          {summary.channelUrl && (
            <a
              href={summary.channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block rounded-md border border-slate-200 px-3 py-1.5 text-[12px] font-semibold text-slate-700"
            >
              채널 방문
            </a>
          )}
        </section>

        {/* WORKUP 협업 요약 */}
        <section className="rounded-lg border border-slate-200 px-3 py-3">
          <p className="text-[12px] font-semibold text-slate-600 mb-2">WORKUP 협업</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[16px] font-bold text-slate-900 tabular-nums">{summary.sponsors.length}</p>
              <p className="text-[10.5px] text-slate-400">총 협업</p>
            </div>
            <div>
              <p className="text-[16px] font-bold text-slate-900 tabular-nums">
                {summary.performance.totalViews > 0 ? summary.performance.totalViews.toLocaleString() : "-"}
              </p>
              <p className="text-[10.5px] text-slate-400">총 조회수</p>
            </div>
            <div>
              <p className="text-[16px] font-bold text-slate-900 tabular-nums">
                {summary.performance.totalReactions > 0 ? summary.performance.totalReactions.toLocaleString() : "-"}
              </p>
              <p className="text-[10.5px] text-slate-400">총 반응수</p>
            </div>
          </div>
        </section>

        {/* 최근 지점 활동(최대 3건) — 협업유형/대상/일정만, 비용·메모 없음 */}
        <section>
          <p className="text-[12px] font-semibold text-slate-600 mb-2">최근 활동</p>
          {summary.branchActivities.length > 0 ? (
            <ul className="rounded-lg border border-slate-200 divide-y divide-slate-100">
              {summary.branchActivities.slice(0, 3).map((a) => (
                <li key={a.id} className="px-3 py-2 text-[13px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 truncate">{a.branchName ?? "-"}</span>
                    <span className="flex-shrink-0 text-slate-400 tabular-nums">{fmtDate(a.marketingDate)}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {ACTIVITY_TYPE_LABEL[a.activityType]}
                    {a.description ? ` · ${a.description}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-4 text-center">
              <p className="text-[12px] text-slate-400">등록된 활동이 없습니다</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
