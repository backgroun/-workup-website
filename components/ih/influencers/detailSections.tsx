"use client";
import { useState } from "react";
import Link from "next/link";
import type { IHInfluencerDetail } from "@/lib/ih/influencers";
import { SPONSOR_STAGE_LABEL, BRANCH_MKT_STATUS_LABEL, COLLAB_TYPE_LABEL } from "@/lib/ih/influencer-shared";
import IHTagBadges from "./IHTagBadges";

function fmtDate(iso: string | null) {
  if (!iso) return "-";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${y.slice(2)}.${m}.${d}`;
}
function fmtWon(n: number | null) {
  if (n == null) return "-";
  return `${n.toLocaleString("ko-KR")}원`;
}
function fmtNum(n: number | null) {
  return n == null ? "-" : n.toLocaleString("ko-KR");
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start py-1.5 text-[14px]">
      <span className="w-20 flex-shrink-0 text-slate-500">{label}</span>
      <span className="text-slate-800">{value}</span>
    </div>
  );
}
function InfoCard({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[14px] font-bold text-slate-900">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

/** 탭 공통 Empty State — 등록 CTA를 함께 제공한다(빈 흰 박스만 보여주지 않음). */
function TabEmptyState({ title, hint, actionLabel, onAction }: { title: string; hint?: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-10 text-center">
      <p className="text-[14.5px] font-medium text-slate-700">{title}</p>
      {hint && <p className="mt-1 text-[13.5px] text-slate-500">{hint}</p>}
      {actionLabel && onAction && (
        <button type="button" onClick={onAction} className="mt-3 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[13.5px] font-semibold px-4 py-2">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function BasicInfoTab({
  influencer,
  sponsors,
  visits,
  currentRates,
  onRegisterCollabClick,
}: {
  influencer: IHInfluencerDetail["influencer"];
  sponsors: IHInfluencerDetail["sponsors"];
  visits: IHInfluencerDetail["branchActivities"];
  currentRates: IHInfluencerDetail["currentRates"];
  onRegisterCollabClick: () => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <div className="space-y-3">
        <InfoCard title="프로필">
          <InfoRow label="닉네임" value={influencer.nickname} />
          <InfoRow label="채널" value={influencer.channel} />
          <InfoRow label="아이디" value={influencer.handle ?? "-"} />
          <InfoRow
            label="채널 URL"
            value={
              influencer.channel_url ? (
                <a href={influencer.channel_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                  {influencer.channel_url}
                </a>
              ) : (
                "-"
              )
            }
          />
          <InfoRow label="팔로워" value={influencer.follower_display ?? "-"} />
          <InfoRow
            label="활동 유형"
            value={
              Array.isArray(influencer.collab_types) && influencer.collab_types.length > 0
                ? influencer.collab_types.map((t) => COLLAB_TYPE_LABEL[t]).join(" · ")
                : "-"
            }
          />
          <InfoRow label="콘텐츠" value={influencer.content_type.length ? influencer.content_type.join(" · ") : "-"} />
          <InfoRow label="활동지역" value={Array.isArray(influencer.activity_area) && influencer.activity_area.length > 0 ? influencer.activity_area.join(" · ") : "-"} />
          <InfoRow label="태그" value={<IHTagBadges tags={influencer.tags} />} />
        </InfoCard>

        <InfoCard title="연락처">
          <InfoRow label="이름" value={influencer.name ?? "-"} />
          <InfoRow label="연락처" value={influencer.phone ?? "-"} />
          <InfoRow label="주소" value={influencer.address ?? "-"} />
        </InfoCard>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[14px] font-bold text-slate-900">협찬/방문 이력</h3>
            <button type="button" onClick={onRegisterCollabClick} className="text-[13px] font-semibold text-slate-600 hover:text-slate-800">
              + 협찬 등록
            </button>
          </div>
          <SponsorsTab sponsors={sponsors} visits={visits} onRegisterClick={onRegisterCollabClick} />
        </div>

        <InfoCard title="단가">
          {currentRates.length === 0 ? (
            <p className="text-[14px] text-slate-500 py-2">등록된 단가가 없습니다. 단가 등록/수정은 기타정보 탭에서 할 수 있습니다.</p>
          ) : (
            currentRates.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-1.5 text-[14px] border-b border-slate-50 last:border-0">
                <div>
                  <p className="text-slate-700">{r.contentType ?? "-"}</p>
                  <p className="text-[12px] text-slate-500">최종 수정 {fmtDate(r.effectiveDate)}</p>
                </div>
                <span className="font-semibold text-slate-900 tabular-nums">{fmtWon(r.price)}</span>
              </div>
            ))
          )}
        </InfoCard>
      </div>
    </div>
  );
}

// ── 협찬 이력: 제품 협찬 메이트(ih_sponsors) + 방문 인플루언서(ih_branch_marketing, INFLUENCER_VISIT) 통합 ──

type CollabCard =
  | { kind: "SPONSOR"; id: number; sortDate: string | null; data: IHInfluencerDetail["sponsors"][number] }
  | { kind: "VISIT"; id: number; sortDate: string | null; data: IHInfluencerDetail["branchActivities"][number] };

function SponsorCardBody({ s }: { s: IHInfluencerDetail["sponsors"][number] }) {
  return (
    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[13.5px] text-slate-600">
      <span>제공 제품/사이즈 {s.support_type ?? "-"}</span>
      <span>콘텐츠 형태 {s.content_format ?? "-"}</span>
      <span>발송일 {fmtDate(s.send_date)}</span>
      <span>업로드일 {fmtDate(s.upload_date)}</span>
      <span>제품+배송비 {fmtWon(s.cost)}</span>
      {s.content_url && (
        <a href={s.content_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline col-span-2">
          콘텐츠 링크
        </a>
      )}
      {s.memo && <p className="col-span-2 text-slate-700 whitespace-pre-wrap">{s.memo}</p>}
      <a href={`/admin/influencer-hub/sponsors/${s.id}`} className="text-blue-600 hover:underline col-span-2">
        협찬 상세 →
      </a>
    </div>
  );
}
function VisitCardBody({ v }: { v: IHInfluencerDetail["branchActivities"][number] }) {
  return (
    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[13.5px] text-slate-600">
      <span>단가 {fmtWon(v.cost)}</span>
      <span>콘텐츠 {v.contentFormat ?? "-"}</span>
      <span>조회/반응 {fmtNum(v.views)} / {fmtNum(v.reactions)}</span>
      {v.contentUrl && (
        <a href={v.contentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline col-span-2">
          콘텐츠 링크
        </a>
      )}
      {v.memo && <p className="col-span-2 text-slate-700 whitespace-pre-wrap">{v.memo}</p>}
      <Link
        href={`/admin/influencer-hub/branch-marketing/${v.id}`}
        className="col-span-2 text-blue-600 hover:underline"
      >
        지점 마케팅 상세 →
      </Link>
    </div>
  );
}

export function SponsorsTab({
  sponsors,
  visits,
  onRegisterClick,
}: {
  sponsors: IHInfluencerDetail["sponsors"];
  visits: IHInfluencerDetail["branchActivities"];
  onRegisterClick: () => void;
}) {
  const cards: CollabCard[] = [
    ...sponsors.map((s): CollabCard => ({ kind: "SPONSOR", id: s.id, sortDate: s.upload_date ?? s.send_date, data: s })),
    ...visits.map((v): CollabCard => ({ kind: "VISIT", id: v.id, sortDate: v.marketingDate, data: v })),
  ].sort((a, b) => (b.sortDate ?? "").localeCompare(a.sortDate ?? ""));

  const [openId, setOpenId] = useState<string | null>(null);

  if (cards.length === 0) {
    return (
      <TabEmptyState
        title="협찬 이력이 없습니다."
        hint="첫 번째 협찬을 등록해보세요."
        actionLabel="+ 협찬 등록"
        onAction={onRegisterClick}
      />
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white divide-y divide-slate-100">
      {cards.map((c) => {
        const key = `${c.kind}-${c.id}`;
        const isOpen = openId === key;
        const isSponsor = c.kind === "SPONSOR";
        const title = isSponsor ? c.data.product : c.data.branchName ?? "-";
        const status = isSponsor ? SPONSOR_STAGE_LABEL[c.data.status] ?? c.data.status : BRANCH_MKT_STATUS_LABEL[c.data.status] ?? c.data.status;
        const round = isSponsor ? c.data.round : c.data.round;
        return (
          <div key={key} className="px-4 py-3 cursor-pointer" onClick={() => setOpenId(isOpen ? null : key)}>
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <span
                  className={`inline-block text-[11.5px] font-bold px-1.5 py-0.5 rounded mr-1.5 ${
                    isSponsor ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {isSponsor ? "제품 협찬 메이트" : "방문 인플루언서"}
                </span>
                <span className="text-[14.5px] font-medium text-slate-800">{title}</span>
                {round != null && <span className="ml-1.5 text-[13px] text-slate-500">{round}회차</span>}
              </div>
              <div className="flex-shrink-0 flex items-center gap-3 text-[13.5px] text-slate-600">
                <span>{fmtDate(c.sortDate)}</span>
                <span className="font-medium text-slate-700">{status}</span>
                {isSponsor && (
                  <a
                    href={`/admin/influencer-hub/sponsors/${c.id}/edit`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-blue-600 hover:underline"
                  >
                    상세 →
                  </a>
                )}
              </div>
            </div>
            {isOpen && (isSponsor ? <SponsorCardBody s={c.data} /> : <VisitCardBody v={c.data} />)}
          </div>
        );
      })}
    </div>
  );
}

// ── 지점 활동: 일반 지점 마케팅(activity_type=GENERAL)만 표시 ──

export function BranchActivityTab({
  activities,
  onRegisterClick,
}: {
  activities: IHInfluencerDetail["branchActivities"];
  onRegisterClick: () => void;
}) {
  const [openId, setOpenId] = useState<number | null>(null);

  if (activities.length === 0) {
    return (
      <TabEmptyState
        title="등록된 지점 활동이 없습니다."
        hint="첫 번째 지점 활동을 등록해보세요."
        actionLabel="+ 지점 활동 등록"
        onAction={onRegisterClick}
      />
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white divide-y divide-slate-100">
      {activities.map((a) => {
        const isOpen = openId === a.id;
        return (
          <div key={a.id} className="px-4 py-3 cursor-pointer" onClick={() => setOpenId(isOpen ? null : a.id)}>
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <span className="text-[14.5px] font-medium text-slate-800">{a.branchName ?? "-"}</span>
                {a.round != null && <span className="ml-1.5 text-[13px] text-slate-500">{a.round}회차</span>}
              </div>
              <div className="flex-shrink-0 flex items-center gap-3 text-[13.5px] text-slate-600">
                <span>{fmtDate(a.marketingDate)}</span>
                <span className="tabular-nums">{fmtWon(a.cost)}</span>
                <span className="font-medium text-slate-700">{BRANCH_MKT_STATUS_LABEL[a.status] ?? a.status}</span>
              </div>
            </div>
            {isOpen && (
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[13.5px] text-slate-600">
                <span>운영구분 {a.operationType ?? "-"}</span>
                <span>조회 {fmtNum(a.views)} · 반응 {fmtNum(a.reactions)}</span>
                {a.contentUrl && (
                  <a href={a.contentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline col-span-2">
                    콘텐츠 링크
                  </a>
                )}
                {a.memo && <p className="col-span-2 text-slate-700 whitespace-pre-wrap">{a.memo}</p>}
                <Link
                  href={`/admin/influencer-hub/branch-marketing/${a.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="col-span-2 text-blue-700 hover:underline font-medium"
                >
                  지점 마케팅 상세로 이동 →
                </Link>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const PERFORMANCE_SOURCE_LABEL: Record<string, string> = {
  SPONSOR: "제품 협찬",
  BRANCH_MARKETING: "지점 마케팅",
};
const PERFORMANCE_SOURCE_COLOR: Record<string, string> = {
  SPONSOR: "bg-blue-50 text-blue-700",
  BRANCH_MARKETING: "bg-emerald-50 text-emerald-700",
};

/**
 * 성과 탭 — Phase 8. 위쪽은 기존 집계 스탯(협업횟수/조회수/반응수/비용 등), 아래쪽은 제품 협찬·지점 마케팅을
 * 합친 협업별 성과 목록(조회수/좋아요/댓글/링크). 브랜디드 PPL은 콘텐츠 성과 개념이 없어 대상에서 제외한다.
 */
export function PerformanceTab({
  performance,
  items,
  onRegisterClick,
}: {
  performance: IHInfluencerDetail["performance"];
  items: IHInfluencerDetail["performanceItems"];
  onRegisterClick: () => void;
}) {
  const stats: { label: string; value: string }[] = [
    { label: "총 협업 횟수", value: fmtNum(performance.totalCollabs) },
    { label: "총 조회수", value: fmtNum(performance.totalViews) },
    { label: "평균 조회수", value: performance.avgViews != null ? fmtNum(performance.avgViews) : "데이터 없음" },
    { label: "총 좋아요", value: fmtNum(performance.totalLikes) },
    { label: "총 댓글", value: fmtNum(performance.totalComments) },
    { label: "평균 반응수", value: performance.avgReactions != null ? fmtNum(performance.avgReactions) : "데이터 없음" },
    { label: "총 집행비", value: fmtWon(performance.totalCost) },
    { label: "조회당 비용", value: performance.cpv != null ? fmtWon(performance.cpv) : "-" },
    { label: "반응당 비용", value: performance.cpe != null ? fmtWon(performance.cpe) : "-" },
  ];

  if (performance.totalCollabs === 0) {
    return (
      <TabEmptyState
        title="성과 데이터가 없습니다."
        hint="협업이 등록되면 자동으로 집계됩니다."
        actionLabel="+ 협업 등록"
        onAction={onRegisterClick}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
            <p className="text-[12.5px] text-slate-500">{s.label}</p>
            <p className="mt-1 text-[16px] font-bold text-slate-900 tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-100">
          <h3 className="text-[14px] font-bold text-slate-900">협업별 성과</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {items.map((it) => (
            <div key={`${it.source}-${it.id}`} className="px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className={`inline-block text-[11px] font-bold px-1.5 py-0.5 rounded mr-1.5 ${PERFORMANCE_SOURCE_COLOR[it.source]}`}>
                    {PERFORMANCE_SOURCE_LABEL[it.source]}
                  </span>
                  <span className="text-[14px] font-medium text-slate-800">{it.label}</span>
                </div>
                <span className="flex-shrink-0 text-[12.5px] text-slate-500 tabular-nums">{fmtDate(it.date)}</span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-slate-600">
                <span>조회 {fmtNum(it.views)}</span>
                <span>좋아요 {fmtNum(it.likes)}</span>
                <span>댓글 {fmtNum(it.comments)}</span>
                {it.contentUrl && (
                  <a href={it.contentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    콘텐츠 링크 →
                  </a>
                )}
                <Link href={it.detailHref} className="ml-auto text-blue-700 hover:underline font-medium">
                  상세 →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** 기타정보 탭 — 사이즈/협업정보/단가(등록+이력)를 모은다. 단가 수정은 여기서만 한다(기본정보 탭은 조회만). */
export function OtherInfoTab({
  influencer,
  currentRates,
  rateHistory,
  onRegisterRateClick,
}: {
  influencer: IHInfluencerDetail["influencer"];
  currentRates: IHInfluencerDetail["currentRates"];
  rateHistory: IHInfluencerDetail["rateHistory"];
  onRegisterRateClick: () => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <div className="space-y-3">
        <InfoCard title="사이즈">
          <InfoRow label="키" value={influencer.height != null ? `${influencer.height}cm` : "-"} />
          <InfoRow label="상의" value={influencer.top_size ?? "-"} />
          <InfoRow label="하의" value={influencer.bottom_size ?? "-"} />
          <InfoRow label="아우터" value={influencer.outer_size ?? "-"} />
        </InfoCard>
        <InfoCard title="협업정보">
          <InfoRow label="업로드주기" value={influencer.upload_cycle ?? "-"} />
          <InfoRow label="메모" value={influencer.memo ?? "-"} />
        </InfoCard>
      </div>

      <InfoCard
        title="단가"
        action={
          <button type="button" onClick={onRegisterRateClick} className="text-[13px] font-semibold text-slate-600 hover:text-slate-800">
            + 단가 등록
          </button>
        }
      >
        <p className="text-[12.5px] font-semibold text-slate-500 mt-1 mb-1.5">현재 단가</p>
        {currentRates.length === 0 ? (
          <p className="text-[14px] text-slate-500 py-2">등록된 단가가 없습니다.</p>
        ) : (
          currentRates.map((r) => (
            <div key={r.id} className="flex items-center justify-between py-1.5 text-[14px] border-b border-slate-50 last:border-0">
              <div>
                <p className="text-slate-700">{r.contentType ?? "-"}</p>
                <p className="text-[12px] text-slate-500">최종 수정 {fmtDate(r.effectiveDate)}</p>
              </div>
              <span className="font-semibold text-slate-900 tabular-nums">{fmtWon(r.price)}</span>
            </div>
          ))
        )}

        <p className="text-[12.5px] font-semibold text-slate-500 mt-4 mb-1.5">단가 이력</p>
        {rateHistory.length === 0 ? (
          <p className="text-[14px] text-slate-500 py-2">단가 이력이 없습니다.</p>
        ) : (
          rateHistory.map((r) => (
            <div key={r.id} className="flex items-center justify-between py-1.5 text-[14px] border-b border-slate-50 last:border-0">
              <span className="text-slate-600">
                {fmtDate(r.effectiveDate)} · {r.contentType ?? "-"}
              </span>
              <span className="text-slate-700 tabular-nums">{fmtWon(r.price)}</span>
            </div>
          ))
        )}
      </InfoCard>
    </div>
  );
}
