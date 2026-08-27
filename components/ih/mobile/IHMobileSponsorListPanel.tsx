"use client";
import { useMemo, useState } from "react";
import type { IHSponsorListRow } from "@/lib/ih/collabs";
import { SPONSOR_STAGE_ORDER, SPONSOR_STAGE_LABEL, SPONSOR_STAGE_COLOR, fmtCostCompact } from "@/lib/ih/influencer-shared";

function fmtDate(iso: string | null) {
  if (!iso) return "-";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${y.slice(2)}.${m}.${d}`;
}
/** 목록의 "상태 날짜" — 업로드일이 입력돼 있으면 그걸(더 최근 단계 기준), 없으면 발송일을 보여준다. */
function statusDateOf(s: IHSponsorListRow): string | null {
  return s.uploadDate ?? s.sendDate;
}

/**
 * 목록 항목 탭 시 세부내역 — Mobile Viewer 안에서만 상태로 전환한다(실제 PC 페이지로 이동시키지 않음).
 * 예전에는 sponsors/{id}(/edit) 페이지로 router.push했는데, 그 페이지들이 Mobile Viewer를 해당
 * 인플루언서 화면으로 다시 동기화(IHMobileSelectSync)해버려 "세부내역 대신 인플루언서 화면으로 이동"하는
 * 것처럼 보이는 문제가 있었다. 목록 화면 안에서 그대로 세부내역을 펼치면 이 충돌이 생기지 않는다.
 */
function SponsorDetailView({ s, onBack }: { s: IHSponsorListRow; onBack: () => void }) {
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
        <span className={`inline-block rounded-full text-[12px] font-medium px-2 py-0.5 mb-2 ${SPONSOR_STAGE_COLOR[s.status] ?? "bg-slate-100 text-slate-700"}`}>
          {SPONSOR_STAGE_LABEL[s.status as keyof typeof SPONSOR_STAGE_LABEL] ?? s.status}
        </span>
        <h2 className="text-[17px] font-bold text-slate-900">{s.product}</h2>
        <p className="text-[13.5px] text-slate-600 mt-0.5">
          {s.influencerNickname} · {s.influencerChannel} · {s.influencerFollowerDisplay ?? "-"}
        </p>
        <div className="mt-3 rounded-lg border border-slate-200 divide-y divide-slate-50">
          {[
            ["회차", s.round != null ? `${s.round}회차` : "-"],
            ["제공 제품/사이즈", s.supportType ?? "-"],
            ["콘텐츠 형태", s.contentFormat ?? "-"],
            ["발송일", fmtDate(s.sendDate)],
            ["비용", fmtCostCompact(s.cost)],
            ["조회수", s.views != null ? s.views.toLocaleString("ko-KR") : "-"],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between px-3 py-2 text-[13.5px]">
              <span className="text-slate-500">{label}</span>
              <span className="text-slate-800">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const selectCls = "rounded-md border border-slate-200 px-1.5 py-1 text-[12px] text-slate-700 bg-white flex-1 min-w-0";
const dateInputCls = "flex-1 min-w-0 rounded-md border border-slate-200 px-1.5 py-1 text-[12px] text-slate-700";
const filterLabelCls = "text-[11.5px] text-slate-500 flex-shrink-0 w-9";

/**
 * Mobile Viewer의 제품 협찬 목록 — PC "제품 협찬" 목록이 이미 조회한 결과를 그대로 재사용한다(별도 DB 조회 없음).
 * 상태(진행 단계) 기준으로 묶어서 보여준다. 검색/필터는 이미 내려온 목록 안에서만 동작한다.
 */
export default function IHMobileSponsorListPanel({ items }: { items: IHSponsorListRow[] }) {
  const [selected, setSelected] = useState<IHSponsorListRow | null>(null);
  const [q, setQ] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = items.filter((s) => {
    if (q.trim() && !s.product.toLowerCase().includes(q.trim().toLowerCase())) return false;
    if (status && s.status !== status) return false;
    if (dateFrom && (!s.sendDate || s.sendDate < dateFrom)) return false;
    if (dateTo && (!s.sendDate || s.sendDate > dateTo)) return false;
    return true;
  });
  const hasLocalFilters = Boolean(q.trim() || status || dateFrom || dateTo);
  const resetLocalFilters = () => {
    setQ("");
    setStatus("");
    setDateFrom("");
    setDateTo("");
  };

  // 상태(진행 단계) 순서대로 묶는다 — SPONSOR_STAGE_ORDER 기준, 데이터가 있는 상태만 표시.
  const groups = useMemo(() => {
    const map = new Map<string, IHSponsorListRow[]>();
    for (const s of filtered) {
      if (!map.has(s.status)) map.set(s.status, []);
      map.get(s.status)!.push(s);
    }
    return SPONSOR_STAGE_ORDER.filter((st) => map.has(st)).map((st) => [st, map.get(st)!] as const);
  }, [filtered]);

  if (selected) {
    return <SponsorDetailView s={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="flex flex-col h-full bg-white text-slate-900">
      <header className="flex-shrink-0 h-12 flex items-center justify-between px-4 border-b border-slate-100">
        <span className="font-bold text-[14px] tracking-tight">WORKUP</span>
        <span className="text-[12px] text-slate-500">Influencer Hub</span>
      </header>

      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-100 space-y-2">
        <p className="text-[15px] font-bold text-slate-900">제품 협찬</p>
        <div className="flex items-center gap-1.5">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="제품명 검색"
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
              <span className={filterLabelCls}>상태</span>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectCls}>
                <option value="">전체</option>
                {SPONSOR_STAGE_ORDER.map((s) => (
                  <option key={s} value={s}>{SPONSOR_STAGE_LABEL[s]}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={filterLabelCls}>발송일</span>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={dateInputCls} />
              <span className="text-slate-300">~</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={dateInputCls} />
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
            <p className="text-[14px] text-slate-500">{hasLocalFilters ? "검색 결과가 없습니다." : "등록된 협찬이 없습니다."}</p>
          </div>
        ) : (
          groups.map(([st, rows]) => (
            <div key={st}>
              <div className="sticky top-0 bg-slate-50 px-4 py-1.5 border-y border-slate-100 flex items-center gap-1.5">
                <span className={`inline-block rounded-full text-[11.5px] font-medium px-2 py-0.5 ${SPONSOR_STAGE_COLOR[st] ?? "bg-slate-100 text-slate-700"}`}>
                  {SPONSOR_STAGE_LABEL[st] ?? st}
                </span>
                <span className="text-[12px] text-slate-500">{rows.length}건</span>
              </div>
              <ul className="divide-y divide-slate-100">
                {rows.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(s)}
                      className="w-full text-left px-4 py-3 active:bg-slate-50"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-[14px] font-bold text-slate-900 truncate">
                          {s.influencerNickname}
                          {s.round != null && <span className="ml-1 text-slate-500 text-[12px] font-normal">{s.round}회차</span>}
                        </p>
                        <span className="flex-shrink-0 text-slate-500 text-[12px] font-bold tabular-nums">{fmtDate(statusDateOf(s))}</span>
                      </div>
                      <p className="text-[13.5px] text-slate-600 mt-0.5">{s.product}</p>
                      <p className="text-[12.5px] text-slate-500 mt-0.5">
                        {s.influencerChannel} · {s.influencerFollowerDisplay ?? "-"} · {fmtCostCompact(s.cost)}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
