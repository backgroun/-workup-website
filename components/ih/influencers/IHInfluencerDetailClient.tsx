"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { IHInfluencerDetail } from "@/lib/ih/influencers";
import { STATUS_LABEL, type IHInfluencerStatus } from "@/lib/ih/influencer-shared";
import IHMobileSelectSync from "./IHMobileSelectSync";
import { BasicInfoTab, SponsorsTab, BranchActivityTab, PerformanceTab, RatesTab } from "./detailSections";
import IHMemoPanel from "./IHMemoPanel";
import IHCollabRegisterModal from "./IHCollabRegisterModal";
import IHBranchActivityRegisterModal from "./IHBranchActivityRegisterModal";
import IHRateRegisterModal from "./IHRateRegisterModal";

const STATUS_DOT: Record<string, string> = { ACTIVE: "bg-emerald-500", INACTIVE: "bg-amber-500", ENDED: "bg-slate-400" };

const TABS = [
  { key: "basic", label: "기본정보" },
  { key: "sponsors", label: "협찬 이력" },
  { key: "branch", label: "지점 활동" },
  { key: "performance", label: "성과" },
  { key: "rates", label: "단가" },
  { key: "memo", label: "메모" },
] as const;
type TabKey = (typeof TABS)[number]["key"];
type ModalKey = "collab" | "branchActivity" | "rate" | null;

export default function IHInfluencerDetailClient({
  detail,
  mobileSummary,
}: {
  detail: IHInfluencerDetail;
  mobileSummary: Parameters<typeof IHMobileSelectSync>[0]["summary"];
}) {
  const router = useRouter();
  const { influencer } = detail;
  const [tab, setTab] = useState<TabKey>("basic");
  const [status, setStatus] = useState<IHInfluencerStatus>(influencer.status);
  const [statusSaving, setStatusSaving] = useState(false);
  const [openModal, setOpenModal] = useState<ModalKey>(null);

  // "협찬 이력" = 제품 협찬 메이트(ih_sponsors) + 방문 인플루언서(ih_branch_marketing, INFLUENCER_VISIT)
  // "지점 활동" = 그 외 일반 지점 마케팅(GENERAL) — Phase 4.3 결정사항
  const visits = useMemo(() => detail.branchActivities.filter((a) => a.activityType === "INFLUENCER_VISIT"), [detail.branchActivities]);
  const generalActivities = useMemo(() => detail.branchActivities.filter((a) => a.activityType !== "INFLUENCER_VISIT"), [detail.branchActivities]);

  const changeStatus = async (next: IHInfluencerStatus) => {
    if (next === status) return;
    setStatusSaving(true);
    try {
      const res = await fetch(`/api/admin/ih/influencers/${influencer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) {
        setStatus(next);
        router.refresh();
      }
    } finally {
      setStatusSaving(false);
    }
  };

  const recentLabel = generalActivities[0]
    ? `최근 지점 마케팅: ${generalActivities[0].branchName ?? "-"} (${generalActivities[0].marketingDate ?? "-"})`
    : visits[0]
    ? `최근 방문: ${visits[0].branchName ?? "-"} (${visits[0].marketingDate ?? "-"})`
    : detail.sponsors[0]
    ? `최근 협찬: ${detail.sponsors[0].product}`
    : null;

  return (
    <div>
      <IHMobileSelectSync summary={mobileSummary} />

      <Link href="/admin/influencer-hub/influencers" className="inline-flex items-center gap-1 text-[12.5px] text-slate-400 hover:text-slate-700 mb-3">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        인플루언서
      </Link>

      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="text-[20px] font-bold text-slate-900">{influencer.nickname}</h1>
          <p className="mt-1 text-[13px] text-slate-500 flex items-center gap-2">
            {influencer.channel} · {influencer.follower_display ?? "-"}
            <span className="inline-flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]}`} />
              {STATUS_LABEL[status]}
            </span>
          </p>
        </div>
        <div className="flex-shrink-0 flex items-center gap-2">
          <select
            value={status}
            disabled={statusSaving}
            onChange={(e) => changeStatus(e.target.value as IHInfluencerStatus)}
            className="rounded-md border border-slate-200 px-2.5 py-1.5 text-[12.5px] text-slate-600 disabled:opacity-50"
          >
            {Object.entries(STATUS_LABEL).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <Link
            href={`/admin/influencer-hub/influencers/${influencer.id}/edit`}
            className="rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold px-4 py-2"
          >
            정보 수정
          </Link>
        </div>
      </div>

      {/* 최근 활동 요약 */}
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 mb-4">
        <p className="text-[11.5px] font-semibold text-slate-400 mb-1">최근 활동</p>
        <p className="text-[13px] text-slate-700">{recentLabel ?? "등록된 협찬/지점 활동이 없습니다."}</p>
      </div>

      {/* 탭 */}
      <div className="flex items-center gap-1 border-b border-slate-200 mb-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-3.5 py-2 text-[13px] font-semibold border-b-2 -mb-px transition-colors ${
              tab === t.key ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "basic" && <BasicInfoTab influencer={influencer} />}
      {tab === "sponsors" && (
        <div>
          <div className="flex justify-end mb-2">
            <button type="button" onClick={() => setOpenModal("collab")} className="rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[12.5px] font-semibold px-3.5 py-2">
              + 협찬 등록
            </button>
          </div>
          <SponsorsTab sponsors={detail.sponsors} visits={visits} onRegisterClick={() => setOpenModal("collab")} />
        </div>
      )}
      {tab === "branch" && (
        <div>
          <div className="flex justify-end mb-2">
            <button type="button" onClick={() => setOpenModal("branchActivity")} className="rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[12.5px] font-semibold px-3.5 py-2">
              + 지점 활동 등록
            </button>
          </div>
          <BranchActivityTab activities={generalActivities} onRegisterClick={() => setOpenModal("branchActivity")} />
        </div>
      )}
      {tab === "performance" && <PerformanceTab performance={detail.performance} />}
      {tab === "rates" && (
        <RatesTab currentRates={detail.currentRates} rateHistory={detail.rateHistory} onRegisterClick={() => setOpenModal("rate")} />
      )}
      {tab === "memo" && <IHMemoPanel influencerId={influencer.id} memos={detail.memos} />}

      {openModal === "collab" && <IHCollabRegisterModal influencerId={influencer.id} onClose={() => setOpenModal(null)} />}
      {openModal === "branchActivity" && <IHBranchActivityRegisterModal influencerId={influencer.id} onClose={() => setOpenModal(null)} />}
      {openModal === "rate" && <IHRateRegisterModal influencerId={influencer.id} onClose={() => setOpenModal(null)} />}
    </div>
  );
}
