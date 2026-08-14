"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import type { IHInfluencerListItem } from "@/lib/ih/influencers";
import { STATUS_LABEL } from "@/lib/ih/influencer-shared";
import { KOREA_PROVINCES, SUB_REGIONS } from "@/lib/ih/regions";
import { useIHMobileSelection } from "../IHMobileSelectionContext";

const CHANNELS = ["Instagram", "YouTube", "TikTok", "Blog"];
const STATUSES: (keyof typeof STATUS_LABEL)[] = ["ACTIVE", "INACTIVE", "ENDED"];
const STATUS_DOT: Record<string, string> = { ACTIVE: "bg-emerald-500", INACTIVE: "bg-amber-500", ENDED: "bg-slate-400" };
const PAGE_SIZE = 20;

// 1만 단위 팔로워 Dropdown 옵션. value=""는 "제한 없음".
const FOLLOWER_OPTIONS = Array.from({ length: 10 }, (_, i) => {
  const v = (i + 1) * 10000;
  return { value: String(v), label: `${i + 1}만` };
});
const DEFAULT_FOLLOWER_MIN = "20000"; // 2만
const DEFAULT_FOLLOWER_MAX = "100000"; // 10만

const FOLLOWER_CUSTOM = "__custom__";

function parseRegionFilter(v: string) {
  const [province, ...rest] = v.split(" ");
  return { province: province ?? "", sub: rest.join(" ") };
}

function fmtRecentDate(iso: string | null) {
  if (!iso) return "";
  const [, m, d] = iso.slice(0, 10).split("-");
  return `${m}/${d}`;
}

type Filters = {
  q: string;
  channel: string;
  contentType: string;
  region: string;
  followerMin: string;
  followerMax: string;
  status: string;
  tag: string;
};

const DEFAULT_FILTERS: Filters = {
  q: "",
  channel: "",
  contentType: "",
  region: "",
  followerMin: DEFAULT_FOLLOWER_MIN,
  followerMax: DEFAULT_FOLLOWER_MAX,
  status: "",
  tag: "",
};

const selectCls = "rounded-md border border-slate-200 px-2.5 py-1.5 text-[12.5px] text-slate-600 bg-white";

export default function IHInfluencerListClient() {
  const { setListState } = useIHMobileSelection();
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<IHInfluencerListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contentTypeOptions, setContentTypeOptions] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/admin/ih/influencers/facets")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setContentTypeOptions(data.contentTypes))
      .catch(() => {});
  }, []);

  const followerRangeError =
    filters.followerMin && filters.followerMax && Number(filters.followerMin) > Number(filters.followerMax)
      ? "최소 팔로워는 최대 팔로워보다 작아야 합니다."
      : null;

  const fetchList = useCallback(async (f: Filters, p: number) => {
    setLoading(true);
    setError(null);
    try {
      const sp = new URLSearchParams();
      if (f.q) sp.set("q", f.q);
      if (f.channel) sp.set("channel", f.channel);
      if (f.contentType) sp.set("contentType", f.contentType);
      if (f.region) sp.set("region", f.region);
      if (f.followerMin) sp.set("followerMin", f.followerMin);
      if (f.followerMax) sp.set("followerMax", f.followerMax);
      if (f.status) sp.set("status", f.status);
      if (f.tag) sp.set("tag", f.tag);
      sp.set("page", String(p));
      sp.set("pageSize", String(PAGE_SIZE));

      const res = await fetch(`/api/admin/ih/influencers?${sp.toString()}`);
      if (!res.ok) throw new Error("목록을 불러오지 못했습니다.");
      const data = await res.json();
      setItems(data.items);
      setTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  // 검색어/필터 변경 시 디바운스 후 재조회(1페이지부터) — 최소>최대인 잘못된 팔로워 범위는 실행하지 않는다.
  useEffect(() => {
    if (followerRangeError) return;
    const t = setTimeout(() => {
      setPage(1);
      fetchList(filters, 1);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, followerRangeError]);

  useEffect(() => {
    if (page !== 1) fetchList(filters, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Mobile Viewer가 같은 필터 결과를 그대로 재사용하도록 공유 Context에 반영한다(별도 조회 없음).
  const hasActiveFilters =
    Boolean(filters.q || filters.channel || filters.contentType || filters.region || filters.status || filters.tag) ||
    filters.followerMin !== DEFAULT_FOLLOWER_MIN ||
    filters.followerMax !== DEFAULT_FOLLOWER_MAX;
  useEffect(() => {
    if (!loading) setListState(items, { total, hasActiveFilters });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, total, loading, hasActiveFilters]);
  useEffect(() => () => setListState(null, null), [setListState]);

  const setField = (k: keyof Filters) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFilters((prev) => ({ ...prev, [k]: e.target.value }));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const emptyMessage = hasActiveFilters ? "조건에 맞는 인플루언서가 없습니다." : "등록된 인플루언서가 없습니다.";

  return (
    <div>
      {/* 검색 + 필터 */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 mb-3 space-y-3">
        <input
          value={filters.q}
          onChange={setField("q")}
          placeholder="닉네임 / 아이디 / 채널 검색"
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-[13.5px] outline-none focus:border-slate-400"
        />

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {/* 분류 필터(선택형) */}
          <div className="flex items-center gap-1.5">
            <select value={filters.channel} onChange={setField("channel")} className={selectCls}>
              <option value="">채널 전체</option>
              {CHANNELS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select value={filters.status} onChange={setField("status")} className={selectCls}>
              <option value="">상태 전체</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
              ))}
            </select>
          </div>

          <div className="w-px h-5 bg-slate-200" />

          {/* 콘텐츠/활동지역 — 실제 등록된 값 기반 Dropdown */}
          <div className="flex items-center gap-1.5">
            <select value={filters.contentType} onChange={setField("contentType")} className={selectCls}>
              <option value="">콘텐츠 전체</option>
              {contentTypeOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={parseRegionFilter(filters.region).province}
              onChange={(e) => setFilters((prev) => ({ ...prev, region: e.target.value }))}
              className={selectCls}
            >
              <option value="">활동지역 전체</option>
              {KOREA_PROVINCES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            {(() => {
              const { province, sub } = parseRegionFilter(filters.region);
              const subOptions = SUB_REGIONS[province];
              if (!subOptions) return null;
              return (
                <select
                  value={sub}
                  onChange={(e) => setFilters((prev) => ({ ...prev, region: e.target.value ? `${province} ${e.target.value}` : province }))}
                  className={selectCls}
                >
                  <option value="">전체(하위지역 무관)</option>
                  {subOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              );
            })()}
            <input value={filters.tag} onChange={setField("tag")} placeholder="태그" className="w-24 rounded-md border border-slate-200 px-2.5 py-1.5 text-[12.5px]" />
          </div>

          <div className="w-px h-5 bg-slate-200" />

          {/* 팔로워 범위(Dropdown, "직접입력" 선택 시 숫자 직접 입력) */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11.5px] text-slate-400">팔로워</span>
            {FOLLOWER_OPTIONS.some((o) => o.value === filters.followerMin) || filters.followerMin === "" ? (
              <select
                value={filters.followerMin}
                onChange={(e) => setFilters((prev) => ({ ...prev, followerMin: e.target.value === FOLLOWER_CUSTOM ? "0" : e.target.value }))}
                className={selectCls}
              >
                <option value="">제한 없음</option>
                {FOLLOWER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
                <option value={FOLLOWER_CUSTOM}>직접입력</option>
              </select>
            ) : (
              <input
                type="number"
                autoFocus
                value={filters.followerMin}
                onChange={(e) => setFilters((prev) => ({ ...prev, followerMin: e.target.value }))}
                placeholder="숫자 입력"
                className="w-24 rounded-md border border-slate-200 px-2 py-1.5 text-[12.5px]"
              />
            )}
            <span className="text-slate-300">~</span>
            {FOLLOWER_OPTIONS.some((o) => o.value === filters.followerMax) || filters.followerMax === "" ? (
              <select
                value={filters.followerMax}
                onChange={(e) => setFilters((prev) => ({ ...prev, followerMax: e.target.value === FOLLOWER_CUSTOM ? "1" : e.target.value }))}
                className={selectCls}
              >
                {FOLLOWER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
                <option value={FOLLOWER_CUSTOM}>직접입력</option>
                <option value="">제한 없음</option>
              </select>
            ) : (
              <input
                type="number"
                autoFocus
                value={filters.followerMax}
                onChange={(e) => setFilters((prev) => ({ ...prev, followerMax: e.target.value }))}
                placeholder="숫자 입력"
                className="w-24 rounded-md border border-slate-200 px-2 py-1.5 text-[12.5px]"
              />
            )}
          </div>

          <button type="button" onClick={() => setFilters(DEFAULT_FILTERS)} className="text-[12.5px] text-slate-400 hover:text-slate-700 ml-auto">
            필터 초기화
          </button>
        </div>

        {followerRangeError && <p className="text-[12px] text-red-500">{followerRangeError}</p>}
      </div>

      {/* 목록 */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-100 text-[12.5px] text-slate-500">
          전체 {loading ? "-" : total.toLocaleString("ko-KR")}명
        </div>

        {error ? (
          <p className="px-4 py-10 text-center text-[13px] text-red-500">{error}</p>
        ) : loading ? (
          <p className="px-4 py-10 text-center text-[13px] text-slate-400">불러오는 중…</p>
        ) : items.length === 0 ? (
          <p className="px-4 py-10 text-center text-[13px] text-slate-400">{emptyMessage}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-[13px]">
              <thead>
                <tr className="text-left text-[11.5px] text-slate-400 border-b border-slate-100">
                  <th className="px-4 py-2 font-semibold">인플루언서</th>
                  <th className="px-2 py-2 font-semibold">채널</th>
                  <th className="px-2 py-2 font-semibold">팔로워</th>
                  <th className="px-2 py-2 font-semibold">콘텐츠</th>
                  <th className="px-2 py-2 font-semibold">활동지역</th>
                  <th className="px-2 py-2 font-semibold">최근 협업</th>
                  <th className="px-4 py-2 font-semibold">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((inf) => (
                  <tr key={inf.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5">
                      <Link href={`/admin/influencer-hub/influencers/${inf.id}`} className="font-medium text-slate-800 hover:text-blue-700">
                        {inf.nickname}
                      </Link>
                      {inf.match_status === "NEEDS_REVIEW" && (
                        <span className="ml-1.5 text-[10.5px] text-amber-600 font-semibold">검수필요</span>
                      )}
                    </td>
                    <td className="px-2 py-2.5 text-slate-500">{inf.channel}</td>
                    <td className="px-2 py-2.5 text-slate-500 tabular-nums">{inf.follower_display ?? "-"}</td>
                    <td className="px-2 py-2.5 text-slate-500 truncate max-w-[140px]">
                      {inf.content_type.length > 0 ? inf.content_type.join(" · ") : "-"}
                    </td>
                    <td className="px-2 py-2.5 text-slate-500">
                      {Array.isArray(inf.activity_area) && inf.activity_area.length > 0 ? inf.activity_area.join(" · ") : "-"}
                    </td>
                    <td className="px-2 py-2.5 text-slate-500 truncate max-w-[160px]">
                      {inf.recentCollabLabel ? (
                        <>
                          {inf.recentCollabLabel}
                          <span className="text-slate-300"> · {fmtRecentDate(inf.recentCollabDate)}</span>
                        </>
                      ) : (
                        <span className="text-slate-300">협업 없음</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[inf.status]}`} />
                        {STATUS_LABEL[inf.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 페이지네이션 */}
        {total > PAGE_SIZE && (
          <div className="flex items-center justify-center gap-3 px-4 py-3 border-t border-slate-100 text-[12.5px] text-slate-500">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="disabled:opacity-30">
              이전
            </button>
            <span>{page} / {totalPages}</span>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="disabled:opacity-30">
              다음
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
