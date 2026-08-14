"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { IHInfluencerListItem } from "@/lib/ih/influencers";
import { STATUS_LABEL } from "@/lib/ih/influencer-shared";
import type { IHListMeta } from "../IHMobileSelectionContext";

const STATUS_DOT: Record<string, string> = { ACTIVE: "bg-emerald-500", INACTIVE: "bg-amber-500", ENDED: "bg-slate-400" };

function fmtRecentDate(iso: string | null) {
  if (!iso) return "";
  const [, m, d] = iso.slice(0, 10).split("-");
  return `${m}/${d}`;
}

/**
 * Mobile Viewer의 인플루언서 목록 — PC가 이미 조회한 결과를 그대로 재사용한다(별도 DB 조회 없음).
 * 검색창은 이미 내려온 목록 안에서만 닉네임 부분일치로 필터링한다(추가 API 호출 없음 — "동일 데이터 소스" 원칙 유지).
 * 카드를 누르면 PC와 동일한 상세 페이지로 이동한다(단일 source of truth — influencer_id 하나만 존재).
 */
export default function IHMobileInfluencerListPanel({
  items,
  meta,
}: {
  items: IHInfluencerListItem[];
  meta: IHListMeta;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const filtered = q.trim() ? items.filter((inf) => inf.nickname.toLowerCase().includes(q.trim().toLowerCase())) : items;

  return (
    <div className="flex flex-col h-full bg-white text-slate-900">
      <header className="flex-shrink-0 h-12 flex items-center justify-between px-4 border-b border-slate-100">
        <span className="font-bold text-[14px] tracking-tight">WORKUP</span>
        <span className="text-[11px] text-slate-400">Influencer Hub</span>
      </header>

      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-100 space-y-2">
        <p className="text-[15px] font-bold text-slate-900">인플루언서</p>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="닉네임 검색"
          className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-[12.5px] outline-none focus:border-slate-400"
        />
        <p className="text-[11.5px] text-slate-400">전체 {meta.total.toLocaleString("ko-KR")}명</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-[13px] text-slate-400">
              {q.trim()
                ? "검색 결과가 없습니다."
                : meta.hasActiveFilters
                ? "조건에 맞는 인플루언서가 없습니다."
                : "등록된 인플루언서가 없습니다."}
            </p>
            {!q.trim() && !meta.hasActiveFilters && (
              <button
                type="button"
                onClick={() => router.push("/admin/influencer-hub/influencers/new")}
                className="mt-3 rounded-md bg-slate-900 text-white text-[12.5px] font-semibold px-4 py-2"
              >
                + 인플루언서 등록
              </button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((inf) => (
              <li key={inf.id}>
                <button
                  type="button"
                  onClick={() => router.push(`/admin/influencer-hub/influencers/${inf.id}`)}
                  className="w-full text-left px-4 py-3 active:bg-slate-50"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[14px] font-bold text-slate-900">{inf.nickname}</p>
                    <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[inf.status]}`} />
                      {STATUS_LABEL[inf.status]}
                    </span>
                  </div>
                  <p className="text-[12.5px] text-slate-500">
                    {inf.channel} · {inf.follower_display ?? "-"}
                  </p>
                  <p className="text-[12px] text-slate-400 mt-0.5">
                    {inf.content_type.length > 0 ? inf.content_type.join(" · ") : "-"}
                    {Array.isArray(inf.activity_area) && inf.activity_area.length > 0 ? ` · ${inf.activity_area.join(" · ")}` : ""}
                  </p>
                  <p className="text-[11.5px] text-slate-400 mt-1">
                    {inf.recentCollabLabel ? (
                      <>최근 협업 {inf.recentCollabLabel} · {fmtRecentDate(inf.recentCollabDate)}</>
                    ) : (
                      "최근 협업 없음"
                    )}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
