"use client";
import { useState } from "react";
import type { IHBranchMarketingListRow } from "@/lib/ih/collabs";
import { BRANCH_MKT_STATUS_LABEL } from "@/lib/ih/influencer-shared";
import { downloadXlsx } from "@/lib/ih/exportXlsx";

/** 전체 지점 마케팅 데이터를 Excel로 다운로드 — 현재 목록 화면의 필터와 무관하게 전체를 받는다. */
export default function IHBranchMarketingExportButton() {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ih/branch-marketing?pageSize=5000");
      if (!res.ok) return;
      const data: { items: IHBranchMarketingListRow[] } = await res.json();
      const rows = data.items.map((r, i) => ({
        NO: i + 1,
        지점: r.branchName,
        인플루언서: r.influencerNickname ?? "",
        채널: r.influencerChannel ?? "",
        진행시작일: r.statusDate ?? "",
        회차: r.round ?? "",
        비용: r.cost ?? "",
        비용주체: r.operationType ?? "",
        조회수: r.views ?? "",
        반응수: r.reactions ?? "",
        콘텐츠형태: r.contentFormat ?? "",
        상태: BRANCH_MKT_STATUS_LABEL[r.status] ?? r.status,
        최근업데이트: r.updatedAt?.slice(0, 10) ?? "",
      }));
      downloadXlsx(`workup_branch_marketing_${new Date().toISOString().slice(0, 10)}.xlsx`, "지점마케팅", rows);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="rounded-md border border-slate-200 text-slate-700 hover:border-slate-400 text-[14px] font-semibold px-4 py-2 transition-colors disabled:opacity-50"
    >
      {loading ? "다운로드 중…" : "Excel 다운로드"}
    </button>
  );
}
