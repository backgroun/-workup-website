"use client";
import { useState } from "react";
import type { IHInfluencerDetail } from "@/lib/ih/influencers";
import IHTagBadges from "./IHTagBadges";

const SPONSOR_STAGE_LABEL: Record<string, string> = {
  PLANNED: "협찬 예정",
  SENT: "발송",
  RECEIVED: "수령",
  PRODUCING: "제작 중",
  UPLOAD_SCHEDULED: "업로드 예정",
  UPLOADED: "업로드 완료",
  ENDED: "종료",
};
const BRANCH_STATUS_LABEL: Record<string, string> = { IN_PROGRESS: "진행 중", COMPLETED: "완료" };

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
    <div className="flex items-start py-1.5 text-[13px]">
      <span className="w-20 flex-shrink-0 text-slate-400">{label}</span>
      <span className="text-slate-800">{value}</span>
    </div>
  );
}
function InfoCard({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[13px] font-bold text-slate-900">{title}</h3>
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
      <p className="text-[13.5px] font-medium text-slate-600">{title}</p>
      {hint && <p className="mt-1 text-[12.5px] text-slate-400">{hint}</p>}
      {actionLabel && onAction && (
        <button type="button" onClick={onAction} className="mt-3 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[12.5px] font-semibold px-4 py-2">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function BasicInfoTab({ influencer }: { influencer: IHInfluencerDetail["influencer"] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
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
        <InfoRow label="콘텐츠" value={influencer.content_type.length ? influencer.content_type.join(" · ") : "-"} />
        <InfoRow label="활동지역" value={Array.isArray(influencer.activity_area) && influencer.activity_area.length > 0 ? influencer.activity_area.join(" · ") : "-"} />
        <InfoRow label="태그" value={<IHTagBadges tags={influencer.tags} />} />
      </InfoCard>

      <div className="space-y-3">
        <InfoCard title="연락처">
          <InfoRow label="이름" value={influencer.name ?? "-"} />
          <InfoRow label="연락처" value={influencer.phone ?? "-"} />
          <InfoRow label="주소" value={influencer.address ?? "-"} />
        </InfoCard>
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
    </div>
  );
}

// ── 협찬 이력: 제품 협찬 메이트(ih_sponsors) + 방문 인플루언서(ih_branch_marketing, INFLUENCER_VISIT) 통합 ──

type CollabCard =
  | { kind: "SPONSOR"; id: number; sortDate: string | null; data: IHInfluencerDetail["sponsors"][number] }
  | { kind: "VISIT"; id: number; sortDate: string | null; data: IHInfluencerDetail["branchActivities"][number] };

function SponsorCardBody({ s }: { s: IHInfluencerDetail["sponsors"][number] }) {
  return (
    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[12.5px] text-slate-500">
      <span>지원유형 {s.support_type ?? "-"}</span>
      <span>발송일 {fmtDate(s.send_date)}</span>
      <span>업로드예정 {fmtDate(s.upload_due_date)}</span>
      <span>업로드일 {fmtDate(s.upload_date)}</span>
      {s.content_url && (
        <a href={s.content_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline col-span-2">
          콘텐츠 링크
        </a>
      )}
      {s.memo && <p className="col-span-2 text-slate-600 whitespace-pre-wrap">{s.memo}</p>}
    </div>
  );
}
function VisitCardBody({ v }: { v: IHInfluencerDetail["branchActivities"][number] }) {
  return (
    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[12.5px] text-slate-500">
      <span>단가 {fmtWon(v.cost)}</span>
      <span>세금 {v.taxType ?? "-"}</span>
      <span>콘텐츠 {v.operationType ?? "-"}</span>
      <span>조회/반응 {fmtNum(v.views)} / {fmtNum(v.reactions)}</span>
      {v.contentUrl && (
        <a href={v.contentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline col-span-2">
          콘텐츠 링크
        </a>
      )}
      {v.memo && <p className="col-span-2 text-slate-600 whitespace-pre-wrap">{v.memo}</p>}
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
        const status = isSponsor ? SPONSOR_STAGE_LABEL[c.data.status] ?? c.data.status : BRANCH_STATUS_LABEL[c.data.status] ?? c.data.status;
        const round = isSponsor ? c.data.round : c.data.round;
        return (
          <div key={key} className="px-4 py-3 cursor-pointer" onClick={() => setOpenId(isOpen ? null : key)}>
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <span
                  className={`inline-block text-[10.5px] font-bold px-1.5 py-0.5 rounded mr-1.5 ${
                    isSponsor ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {isSponsor ? "제품 협찬 메이트" : "방문 인플루언서"}
                </span>
                <span className="text-[13.5px] font-medium text-slate-800">{title}</span>
                {round != null && <span className="ml-1.5 text-[12px] text-slate-400">{round}회차</span>}
              </div>
              <div className="flex-shrink-0 flex items-center gap-3 text-[12.5px] text-slate-500">
                <span>{fmtDate(c.sortDate)}</span>
                <span className="font-medium text-slate-700">{status}</span>
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
                <span className="text-[13.5px] font-medium text-slate-800">{a.branchName ?? "-"}</span>
                {a.round != null && <span className="ml-1.5 text-[12px] text-slate-400">{a.round}회차</span>}
              </div>
              <div className="flex-shrink-0 flex items-center gap-3 text-[12.5px] text-slate-500">
                <span>{fmtDate(a.marketingDate)}</span>
                <span className="tabular-nums">{fmtWon(a.cost)}</span>
                <span className="font-medium text-slate-700">{BRANCH_STATUS_LABEL[a.status] ?? a.status}</span>
              </div>
            </div>
            {isOpen && (
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[12.5px] text-slate-500">
                <span>운영구분 {a.operationType ?? "-"}</span>
                <span>조회 {fmtNum(a.views)} · 반응 {fmtNum(a.reactions)}</span>
                {a.contentUrl && (
                  <a href={a.contentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline col-span-2">
                    콘텐츠 링크
                  </a>
                )}
                {a.memo && <p className="col-span-2 text-slate-600 whitespace-pre-wrap">{a.memo}</p>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function PerformanceTab({ performance }: { performance: IHInfluencerDetail["performance"] }) {
  const stats: { label: string; value: string }[] = [
    { label: "총 협업 횟수", value: fmtNum(performance.totalCollabs) },
    { label: "총 조회수", value: fmtNum(performance.totalViews) },
    { label: "평균 조회수", value: performance.avgViews != null ? fmtNum(performance.avgViews) : "데이터 없음" },
    { label: "평균 반응수", value: performance.avgReactions != null ? fmtNum(performance.avgReactions) : "데이터 없음" },
    { label: "총 집행비", value: fmtWon(performance.totalCost) },
    { label: "CPV", value: performance.cpv != null ? fmtWon(performance.cpv) : "-" },
    { label: "CPE", value: performance.cpe != null ? fmtWon(performance.cpe) : "-" },
  ];

  if (performance.totalCollabs === 0) {
    return <TabEmptyState title="성과 데이터가 없습니다." hint="협업이 등록되면 자동으로 집계됩니다." />;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
          <p className="text-[11.5px] text-slate-400">{s.label}</p>
          <p className="mt-1 text-[16px] font-bold text-slate-900 tabular-nums">{s.value}</p>
        </div>
      ))}
    </div>
  );
}

export function RatesTab({
  currentRates,
  rateHistory,
  onRegisterClick,
}: {
  currentRates: IHInfluencerDetail["currentRates"];
  rateHistory: IHInfluencerDetail["rateHistory"];
  onRegisterClick: () => void;
}) {
  if (currentRates.length === 0 && rateHistory.length === 0) {
    return <TabEmptyState title="등록된 단가가 없습니다." hint="첫 번째 단가를 등록해보세요." actionLabel="+ 단가 등록" onAction={onRegisterClick} />;
  }

  return (
    <div className="space-y-4">
      <InfoCard
        title="현재 단가"
        action={
          <button type="button" onClick={onRegisterClick} className="text-[12px] font-semibold text-slate-500 hover:text-slate-800">
            + 단가 등록
          </button>
        }
      >
        {currentRates.length === 0 ? (
          <p className="text-[13px] text-slate-400 py-2">등록된 단가가 없습니다.</p>
        ) : (
          currentRates.map((r) => (
            <div key={r.id} className="flex items-center justify-between py-1.5 text-[13px]">
              <span className="text-slate-600">{r.contentType ?? "-"}</span>
              <span className="font-semibold text-slate-900 tabular-nums">{fmtWon(r.price)}</span>
            </div>
          ))
        )}
      </InfoCard>
      <InfoCard title="단가 이력">
        {rateHistory.length === 0 ? (
          <p className="text-[13px] text-slate-400 py-2">단가 이력이 없습니다.</p>
        ) : (
          rateHistory.map((r) => (
            <div key={r.id} className="flex items-center justify-between py-1.5 text-[13px]">
              <span className="text-slate-500">
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
