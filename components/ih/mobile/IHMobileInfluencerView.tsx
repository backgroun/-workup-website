import Link from "next/link";
import type { IHInfluencerMobileSummary } from "@/lib/ih/influencers";
import { ACTIVITY_TYPE_LABEL, SPONSOR_STAGE_LABEL, STATUS_LABEL, STATUS_DOT } from "@/lib/ih/influencer-shared";

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
  // 활동 유형(collab_types) 기준으로 섹션을 가른다 — 아직 유형이 지정 안 된 기존 데이터는
  // 실제 이력이 있으면 그대로 보여준다(유형 지정 여부와 무관하게 데이터 누락 방지).
  const showSponsors = summary.collabTypes.includes("SPONSOR") || summary.sponsors.length > 0;
  const visitActivities = summary.branchActivities.filter((a) => a.activityType === "INFLUENCER_VISIT");
  const showVisits = summary.collabTypes.includes("VISIT") || visitActivities.length > 0;

  return (
    <div className="flex flex-col h-full bg-white text-slate-900">
      <header className="flex-shrink-0 h-12 flex items-center justify-between px-4 border-b border-slate-100">
        <span className="font-bold text-[14px] tracking-tight">WORKUP</span>
        <span className="text-[12px] text-slate-500">Influencer Hub</span>
      </header>

      <div className="flex-shrink-0 px-4 py-2 border-b border-slate-100">
        <Link href="/admin/influencer-hub/influencers" className="inline-flex items-center gap-1 text-[13px] text-slate-500 hover:text-slate-700">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          인플루언서 목록
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* 프로필 요약 */}
        <section>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[summary.status]}`} />
            <span className="text-[12px] text-slate-500">{STATUS_LABEL[summary.status]}</span>
          </div>
          <h1 className="mt-1 text-[19px] font-bold text-slate-900">{summary.nickname}</h1>
          <p className="text-[13.5px] text-slate-600">
            {summary.channel} · {summary.followerDisplay ?? "-"} Followers
          </p>
          <p className="text-[13.5px] text-slate-600">
            {summary.contentType.length > 0 ? summary.contentType.join(" · ") : "-"}
            {Array.isArray(summary.activityArea) && summary.activityArea.length > 0 ? ` · ${summary.activityArea.join(" · ")}` : ""}
          </p>
          {summary.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {summary.tags.map((t) => (
                <span key={t} className="rounded-full bg-slate-100 text-slate-700 text-[12px] px-2 py-0.5">
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
              className="mt-2 inline-block rounded-md border border-slate-200 px-3 py-1.5 text-[13px] font-semibold text-slate-700"
            >
              채널 방문
            </a>
          )}
        </section>

        {/* WORKUP 협찬 요약 — 총 협찬 횟수/최근 협찬/현재 진행 상태(Phase 5) */}
        <section className="rounded-lg border border-slate-200 px-3 py-3">
          <p className="text-[13px] font-semibold text-slate-700 mb-2">WORKUP 협찬</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[16px] font-bold text-slate-900 tabular-nums">{summary.sponsors.length}</p>
              <p className="text-[11.5px] text-slate-500">총 협찬 횟수</p>
            </div>
            <div>
              <p className="text-[16px] font-bold text-slate-900 tabular-nums">
                {summary.performance.totalViews > 0 ? summary.performance.totalViews.toLocaleString() : "-"}
              </p>
              <p className="text-[11.5px] text-slate-500">총 조회수</p>
            </div>
            <div>
              <p className="text-[16px] font-bold text-slate-900 tabular-nums">
                {summary.performance.totalReactions > 0 ? summary.performance.totalReactions.toLocaleString() : "-"}
              </p>
              <p className="text-[11.5px] text-slate-500">총 반응수</p>
            </div>
          </div>
        </section>

        {/* 성과(조회수/좋아요/댓글/최근 성과) — 제품 협찬·지점 마케팅을 합친 콘텐츠 성과(Phase 8) */}
        <section>
          <p className="text-[13px] font-semibold text-slate-700 mb-2">성과</p>
          {summary.recentPerformance.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-6 text-center">
              <p className="text-[13px] text-slate-500">등록된 성과 데이터가 없습니다</p>
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-slate-200 px-3 py-3 mb-2">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[16px] font-bold text-slate-900 tabular-nums">
                      {summary.performance.totalViews > 0 ? summary.performance.totalViews.toLocaleString() : "-"}
                    </p>
                    <p className="text-[11.5px] text-slate-500">조회수</p>
                  </div>
                  <div>
                    <p className="text-[16px] font-bold text-slate-900 tabular-nums">
                      {summary.performance.totalLikes > 0 ? summary.performance.totalLikes.toLocaleString() : "-"}
                    </p>
                    <p className="text-[11.5px] text-slate-500">좋아요</p>
                  </div>
                  <div>
                    <p className="text-[16px] font-bold text-slate-900 tabular-nums">
                      {summary.performance.totalComments > 0 ? summary.performance.totalComments.toLocaleString() : "-"}
                    </p>
                    <p className="text-[11.5px] text-slate-500">댓글</p>
                  </div>
                </div>
              </div>
              <p className="text-[12px] text-slate-500 mb-1.5">최근 성과</p>
              <ul className="rounded-lg border border-slate-200 divide-y divide-slate-100">
                {summary.recentPerformance.map((p) => (
                  <li key={`${p.source}-${p.id}`} className="px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[14px] text-slate-700 truncate">{p.label}</span>
                      <span className="flex-shrink-0 text-[12px] text-slate-500 tabular-nums">{fmtDate(p.date)}</span>
                    </div>
                    <span className="text-[12px] text-slate-500">
                      조회 {p.views?.toLocaleString() ?? "-"} · 좋아요 {p.likes?.toLocaleString() ?? "-"} · 댓글 {p.comments?.toLocaleString() ?? "-"}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        {/* 최근 협찬(최대 3건) — 제품 협찬 메이트 전용, ih_sponsors 기준(Phase 5) */}
        {showSponsors && (
          <section>
            <p className="text-[13px] font-semibold text-slate-700 mb-2">최근 협찬</p>
            {summary.sponsors.length > 0 ? (
              <ul className="rounded-lg border border-slate-200 divide-y divide-slate-100">
                {summary.sponsors.slice(0, 3).map((s) => (
                  <li key={s.id}>
                    <Link href={`/admin/influencer-hub/sponsors/${s.id}/edit`} className="block px-3 py-2 text-[14px] active:bg-slate-50">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-700 truncate">
                          {s.product}
                          {s.round != null && <span className="ml-1 text-slate-500 text-[12px]">{s.round}회차</span>}
                        </span>
                        <span className="flex-shrink-0 text-slate-500">
                          {SPONSOR_STAGE_LABEL[s.status as keyof typeof SPONSOR_STAGE_LABEL] ?? s.status}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-4 text-center">
                <p className="text-[13px] text-slate-500">등록된 협찬이 없습니다</p>
              </div>
            )}
          </section>
        )}

        {/* 최근 방문 활동(최대 3건) — 방문 인플루언서 전용, ih_branch_marketing(INFLUENCER_VISIT)에서만 가져온다(Phase 5) */}
        {showVisits && (
          <section>
            <p className="text-[13px] font-semibold text-slate-700 mb-2">최근 방문 활동</p>
            {visitActivities.length > 0 ? (
              <ul className="rounded-lg border border-slate-200 divide-y divide-slate-100">
                {visitActivities.slice(0, 3).map((a) => (
                  <li key={a.id} className="px-3 py-2 text-[14px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-700 truncate">{a.branchName ?? "-"}</span>
                      <span className="flex-shrink-0 text-slate-500 tabular-nums">{fmtDate(a.marketingDate)}</span>
                    </div>
                    <span className="text-[12px] text-slate-500">
                      {ACTIVITY_TYPE_LABEL[a.activityType]}
                      {a.description ? ` · ${a.description}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-4 text-center">
                <p className="text-[13px] text-slate-500">등록된 방문 활동이 없습니다</p>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
