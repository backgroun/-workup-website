"use client";
import { useState } from "react";
import type { IHBrandedPplListRow } from "@/lib/ih/collabs";
import { BRANDED_PPL_STATUS_LABEL, BRANDED_PPL_CATEGORY_LABEL, formatFollowerDisplay } from "@/lib/ih/influencer-shared";
import { downloadXlsx } from "@/lib/ih/exportXlsx";

/** 전체 브랜디드 PPL 데이터를 Excel로 다운로드 — 현재 목록 화면의 필터와 무관하게 전체를 받는다. */
export default function IHBrandedPplExportButton() {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ih/branded-ppl?pageSize=5000");
      if (!res.ok) return;
      const data: { items: IHBrandedPplListRow[] } = await res.json();
      const rows = data.items.map((r, i) => ({
        NO: i + 1,
        구분: BRANDED_PPL_CATEGORY_LABEL[r.category] ?? r.category,
        이름: r.name,
        키: r.height ?? "",
        의견: r.opinion ?? "",
        "계약 기준(기간)": r.contractPeriod ?? "",
        구독자: r.subscriberCount != null ? formatFollowerDisplay(r.subscriberCount) : "",
        메인패널: r.mainCast ?? "",
        광고상품: r.adProduct ?? "",
        채널링크: r.channelLink ?? "",
        단가: r.cost ?? "",
        상태: BRANDED_PPL_STATUS_LABEL[r.status] ?? r.status,
        특징: r.memo ?? "",
        최근업데이트: r.updatedAt?.slice(0, 10) ?? "",
      }));
      downloadXlsx(`workup_branded_ppl_${new Date().toISOString().slice(0, 10)}.xlsx`, "브랜디드PPL", rows);
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
