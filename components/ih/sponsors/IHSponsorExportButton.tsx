"use client";
import { useState } from "react";
import type { IHSponsorListRow } from "@/lib/ih/collabs";
import { SPONSOR_STAGE_LABEL } from "@/lib/ih/influencer-shared";
import { downloadXlsx } from "@/lib/ih/exportXlsx";

/** 전체 제품 협찬 데이터를 Excel로 다운로드 — 현재 목록 화면의 필터와 무관하게 전체를 받는다. */
export default function IHSponsorExportButton() {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ih/sponsors?pageSize=5000");
      if (!res.ok) return;
      const data: { items: IHSponsorListRow[] } = await res.json();
      const rows = data.items.map((s, i) => ({
        NO: i + 1,
        인플루언서: s.influencerNickname,
        채널: s.influencerChannel,
        제품: s.product,
        회차: s.round ?? "",
        "제공 제품/사이즈": s.supportType ?? "",
        발송일: s.sendDate ?? "",
        콘텐츠형태: s.contentFormat ?? "",
        비용: s.cost ?? "",
        조회수: s.views ?? "",
        상태: SPONSOR_STAGE_LABEL[s.status] ?? s.status,
        최근업데이트: s.updatedAt?.slice(0, 10) ?? "",
      }));
      downloadXlsx(`workup_sponsors_${new Date().toISOString().slice(0, 10)}.xlsx`, "제품협찬", rows);
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
