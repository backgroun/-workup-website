"use client";
import { useMemo, useState } from "react";
import type { IHBrandedPplListRow } from "@/lib/ih/collabs";
import {
  BRANDED_PPL_STATUS_ORDER,
  BRANDED_PPL_STATUS_LABEL,
  BRANDED_PPL_STATUS_COLOR,
  BRANDED_PPL_CATEGORY_ORDER,
  BRANDED_PPL_CATEGORY_LABEL,
  BRANDED_PPL_CATEGORY_COLOR,
  fmtCostManwon,
  formatFollowerDisplay,
} from "@/lib/ih/influencer-shared";

const selectCls = "rounded-md border border-slate-200 px-1.5 py-1 text-[12px] text-slate-700 bg-white flex-1 min-w-0";
const filterLabelCls = "text-[11.5px] text-slate-500 flex-shrink-0 w-9";

/**
 * 목록 카드 탭 시 세부내역 — Mobile Viewer 안에서 상태로만 전환한다. PC 상세 페이지로 실제 이동시키면 그 페이지가
 * Mobile Viewer를 다른 화면으로 재동기화해버려 세부내역 대신 다른 화면으로 튀는 것처럼 보인다(제품 협찬/지점
 * 마케팅 모바일 패널에서 동일 문제 확인, 동일 방식으로 회피).
 */
function BrandedPplDetailView({ r, onBack }: { r: IHBrandedPplListRow; onBack: () => void }) {
  const isCelebrity = r.category === "CELEBRITY";
  const isPpl = r.category === "PPL";
  const isInfluencer = r.category === "INFLUENCER";

  const rows: [string, string][] = [];
  if (isCelebrity) {
    rows.push(["키", r.height ?? "-"]);
    rows.push(["계약 기준(기간)", r.contractPeriod ?? "-"]);
  }
  if (isPpl) {
    rows.push(["메인패널", r.mainCast ?? "-"]);
  }
  if (isPpl || isInfluencer) {
    rows.push(["구독자", r.subscriberCount != null ? formatFollowerDisplay(r.subscriberCount) : "-"]);
    rows.push(["광고상품", r.adProduct ?? "-"]);
  }
  rows.push(["특징", r.memo ?? "-"]);
  rows.push(["단가", fmtCostManwon(r.cost)]);

  return (
    <div className="flex flex-col h-full bg-white text-slate-900">
      <header className="flex-shrink-0 h-12 flex items-center px-2 border-b border-slate-100">
        <button type="button" onClick={onBack} className="flex items-center gap-1 px-2 py-1.5 text-[13.5px] text-slate-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          목록
        </button>
      </header>
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="flex items-center gap-1.5 mb-2">
          <span className={`inline-block rounded-full text-[12px] font-medium px-2 py-0.5 ${BRANDED_PPL_STATUS_COLOR[r.status] ?? "bg-slate-100 text-slate-700"}`}>
            {BRANDED_PPL_STATUS_LABEL[r.status] ?? r.status}
          </span>
          <span className={`inline-block rounded-full text-[12px] font-medium px-2 py-0.5 ${BRANDED_PPL_CATEGORY_COLOR[r.category] ?? "bg-slate-100 text-slate-700"}`}>
            {BRANDED_PPL_CATEGORY_LABEL[r.category] ?? r.category}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-1">
          <h2 className="text-[17px] font-bold text-slate-900">{r.name}</h2>
          {r.channelLink && (
            <a
              href={r.channelLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 inline-flex items-center gap-1 rounded-md border border-slate-300 text-slate-600 text-[12px] font-semibold px-2.5 py-1"
            >
              채널 바로가기
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
        {isCelebrity && r.opinion && <p className="text-[13px] text-slate-600 mt-1">{r.opinion}</p>}
        <div className="mt-3 rounded-lg border border-slate-200 divide-y divide-slate-50">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between px-3 py-2 text-[13.5px]">
              <span className="text-slate-500">{label}</span>
              <span className="text-slate-800 text-right ml-3 break-words">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Mobile Viewer의 브랜디드 PPL 목록 — PC "브랜디드/PPL" 목록이 이미 조회한 결과를 카드형으로 그대로 재사용한다
 * (별도 DB 조회 없음). PC 테이블을 축소하지 않고 카드 리스트로 재구성한다.
 */
export default function IHMobileBrandedPplListPanel({ items }: { items: IHBrandedPplListRow[] }) {
  const [selected, setSelected] = useState<IHBrandedPplListRow | null>(null);
  const [q, setQ] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");

  const filtered = items.filter((r) => {
    if (q.trim()) {
      const qq = q.trim().toLowerCase();
      if (!r.name.toLowerCase().includes(qq)) return false;
    }
    if (status && r.status !== status) return false;
    if (category && r.category !== category) return false;
    return true;
  });
  const hasLocalFilters = Boolean(q.trim() || status || category);
  const resetLocalFilters = () => {
    setQ("");
    setStatus("");
    setCategory("");
  };

  // 연예인 → PPL → 인플루언서 순으로 구분 그룹핑해서 보여준다(PC 목록과 동일 순서).
  const groups = useMemo(() => {
    const map = new Map<string, IHBrandedPplListRow[]>();
    for (const r of filtered) {
      if (!map.has(r.category)) map.set(r.category, []);
      map.get(r.category)!.push(r);
    }
    return BRANDED_PPL_CATEGORY_ORDER.filter((c) => map.has(c)).map((c) => [c, map.get(c)!] as const);
  }, [filtered]);

  if (selected) {
    return <BrandedPplDetailView r={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="flex flex-col h-full bg-white text-slate-900">
      <header className="flex-shrink-0 h-12 flex items-center justify-between px-4 border-b border-slate-100">
        <span className="font-bold text-[14px] tracking-tight">WORKUP</span>
        <span className="text-[12px] text-slate-500">Influencer Hub</span>
      </header>

      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-100 space-y-2">
        <p className="text-[15px] font-bold text-slate-900">브랜디드/PPL</p>
        <div className="flex items-center gap-1.5">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="이름 검색"
            className="flex-1 min-w-0 rounded-md border border-slate-200 px-3 py-1.5 text-[13.5px] outline-none focus:border-slate-400"
          />
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className={`flex-shrink-0 rounded-md border px-2.5 py-1.5 text-[13px] font-semibold ${
              filtersOpen || hasLocalFilters ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-700"
            }`}
          >
            필터
          </button>
        </div>

        {filtersOpen && (
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 space-y-2">
            <div className="flex items-center gap-1.5">
              <span className={filterLabelCls}>구분</span>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectCls}>
                <option value="">전체</option>
                {BRANDED_PPL_CATEGORY_ORDER.map((c) => (
                  <option key={c} value={c}>{BRANDED_PPL_CATEGORY_LABEL[c]}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={filterLabelCls}>상태</span>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectCls}>
                <option value="">전체</option>
                {BRANDED_PPL_STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>{BRANDED_PPL_STATUS_LABEL[s]}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-[12.5px] text-slate-500">
            {hasLocalFilters ? `검색 결과 ${filtered.length}건` : `전체 ${items.length.toLocaleString("ko-KR")}건`}
          </p>
          {hasLocalFilters && (
            <button type="button" onClick={resetLocalFilters} className="text-[12px] text-slate-500 hover:text-slate-700">
              초기화
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-[14px] text-slate-500">{hasLocalFilters ? "검색 결과가 없습니다." : "등록된 브랜디드 PPL이 없습니다."}</p>
          </div>
        ) : (
          <div className="pb-3">
            {groups.map(([cat, rows]) => (
              <div key={cat}>
                <div className="sticky top-0 z-10 flex items-center gap-1.5 bg-slate-50 px-4 py-1.5 border-y border-slate-100">
                  <span className={`inline-block rounded-full text-[11px] font-medium px-2 py-0.5 ${BRANDED_PPL_CATEGORY_COLOR[cat] ?? "bg-slate-100 text-slate-700"}`}>
                    {BRANDED_PPL_CATEGORY_LABEL[cat] ?? cat}
                  </span>
                  <span className="text-[11.5px] text-slate-500">{rows.length}건</span>
                </div>
                <div className="p-3 grid grid-cols-1 gap-2.5">
                  {rows.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelected(r)}
                      className="w-full text-left rounded-lg border border-slate-200 p-3 active:bg-slate-50"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[14px] font-bold text-slate-900 truncate">{r.name}</p>
                        <span className={`flex-shrink-0 inline-block rounded-full text-[11px] font-medium px-2 py-0.5 ${BRANDED_PPL_STATUS_COLOR[r.status] ?? "bg-slate-100 text-slate-700"}`}>
                          {BRANDED_PPL_STATUS_LABEL[r.status] ?? r.status}
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[12px]">
                        {r.category === "CELEBRITY" ? (
                          r.contractPeriod && (
                            <span className="text-slate-500">
                              계약기간 <span className="text-slate-700 font-medium">{r.contractPeriod}</span>
                            </span>
                          )
                        ) : (
                          <>
                            {r.subscriberCount != null && (
                              <span className="text-slate-500">
                                구독자 <span className="text-slate-700 font-medium">{formatFollowerDisplay(r.subscriberCount)}</span>
                              </span>
                            )}
                            {r.adProduct && (
                              <span className="text-slate-500">
                                광고상품 <span className="text-slate-700 font-medium">{r.adProduct}</span>
                              </span>
                            )}
                          </>
                        )}
                      </div>
                      <p className="text-[12px] text-slate-500 mt-1 truncate">{r.memo ?? "-"}</p>
                      <div className="flex items-center justify-end mt-1.5">
                        <span className="text-[12px] text-slate-500 tabular-nums">{fmtCostManwon(r.cost)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
