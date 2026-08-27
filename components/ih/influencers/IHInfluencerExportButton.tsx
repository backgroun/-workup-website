"use client";
import { useState } from "react";
import type { IHInfluencerListItem } from "@/lib/ih/influencers";
import { STATUS_LABEL, COLLAB_TYPE_LABEL } from "@/lib/ih/influencer-shared";
import { downloadXlsx } from "@/lib/ih/exportXlsx";

/** 전체 인플루언서 DB를 Excel로 다운로드 — 현재 목록 화면의 필터와 무관하게 전체를 받는다. */
export default function IHInfluencerExportButton() {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ih/influencers?pageSize=5000");
      if (!res.ok) return;
      const data: { items: IHInfluencerListItem[] } = await res.json();
      const rows = data.items.map((inf, i) => ({
        NO: i + 1,
        닉네임: inf.nickname,
        채널: inf.channel,
        채널URL: inf.channel_url ?? "",
        팔로워: inf.follower_display ?? "",
        구분: (inf.collab_types ?? []).map((t) => COLLAB_TYPE_LABEL[t]).join("/"),
        콘텐츠: (inf.content_type ?? []).join(", "),
        활동지역: (Array.isArray(inf.activity_area) ? inf.activity_area : []).join(", "),
        상태: STATUS_LABEL[inf.status],
        최근협업: inf.recentCollabLabel ?? "",
        협업횟수: inf.collabCount,
        등록일: inf.created_at?.slice(0, 10) ?? "",
      }));
      downloadXlsx(`workup_influencers_${new Date().toISOString().slice(0, 10)}.xlsx`, "인플루언서", rows);
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
