"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import type { IHInfluencerListItem } from "@/lib/ih/influencers";
import { STATUS_LABEL, STATUS_DOT } from "@/lib/ih/influencer-shared";
import { KOREA_PROVINCES, SUB_REGIONS } from "@/lib/ih/regions";
import { useIHMobileSelection } from "../IHMobileSelectionContext";
import ChannelIcon from "../ChannelIcon";

const CHANNELS = ["Instagram", "YouTube", "TikTok", "Blog"];
const STATUSES: (keyof typeof STATUS_LABEL)[] = ["ACTIVE", "INACTIVE", "ENDED", "BLOCKED"];
const PAGE_SIZE = 20;

// 1만 단위 팔로워 Dropdown 옵션. value=""는 "제한 없음".
const FOLLOWER_OPTIONS = Array.from({ length: 10 }, (_, i) => {
  const v = (i + 1) * 10000;
  return { value: String(v), label: `${i + 1}만` };
});
const DEFAULT_FOLLOWER_MIN = ""; // 제한 없음
const DEFAULT_FOLLOWER_MAX = ""; // 제한 없음

const FOLLOWER_CUSTOM = "__custom__";

function parseRegionFilter(v: string) {
  const [province, ...rest] = v.split(" ");
  return { province: province ?? "", sub: rest.join(" ") };
}

function fmtRecentDate(iso: string | null) {
  if (!iso) return "";
  const [, m, d] = iso.slice(0, 10).split("-");
  return `${Number(m)}/${Number(d)}`;
}

// 콘텐츠 유형별로 단가가 여러 개여도 목록에는 가장 비싼 값 하나만 보여준다(간결하게).
function fmtCostRange(_min: number | null, max: number | null): string {
  if (max == null) return "-";
  if (max >= 10000) return `${Number((max / 10000).toFixed(1))}만원`;
  return `${max.toLocaleString("ko-KR")}원`;
}

type Filters = {
  q: string;
  channel: string;
  contentType: string;
  region: string;
  followerMin: string;
  followerMax: string;
  costMin: string;
  costMax: string;
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
  costMin: "",
  costMax: "",
  status: "",
  tag: "",
};

const selectCls = "rounded-md border border-slate-200 px-2.5 py-1.5 text-[13.5px] text-slate-700 bg-white";

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
  const costRangeError =
    filters.costMin && filters.costMax && Number(filters.costMin) > Number(filters.costMax)
      ? "최소 비용은 최대 비용보다 작아야 합니다."
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
      if (f.costMin) sp.set("costMin", f.costMin);
      if (f.costMax) sp.set("costMax", f.costMax);
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

  // 검색어/필터 변경 시 디바운스 후 재조회(1페이지부터) — 최소>최대인 잘못된 범위는 실행하지 않는다.
  useEffect(() => {
    if (followerRangeError || costRangeError) return;
    const t = setTimeout(() => {
      setPage(1);
      fetchList(filters, 1);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, followerRangeError, costRangeError]);

  useEffect(() => {
    if (page !== 1) fetchList(filters, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Mobile Viewer가 같은 필터 결과를 그대로 재사용하도록 공유 Context에 반영한다(별도 조회 없음).
  const hasActiveFilters =
    Boolean(filters.q || filters.channel || filters.contentType || filters.region || filters.status || filters.tag || filters.costMin || filters.costMax) ||
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
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-[14.5px] outline-none focus:border-slate-400"
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
            <input value={filters.tag} onChange={setField("tag")} placeholder="태그" className="w-24 rounded-md border border-slate-200 px-2.5 py-1.5 text-[13.5px]" />
          </div>

          <div className="w-px h-5 bg-slate-200" />

          {/* 팔로워 범위(Dropdown, "직접입력" 선택 시 숫자 직접 입력) */}
          <div className="flex items-center gap-1.5">
            <span className="text-[12.5px] text-slate-500">팔로워</span>
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
                min={0}
                autoFocus
                value={filters.followerMin}
                onChange={(e) => setFilters((prev) => ({ ...prev, followerMin: e.target.value.replace(/-/g, "") }))}
                placeholder="(명)이상"
                className="w-24 rounded-md border border-slate-200 px-2 py-1.5 text-[13.5px]"
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
                min={0}
                autoFocus
                value={filters.followerMax}
                onChange={(e) => setFilters((prev) => ({ ...prev, followerMax: e.target.value.replace(/-/g, "") }))}
                placeholder="(명)이하"
                className="w-24 rounded-md border border-slate-200 px-2 py-1.5 text-[13.5px]"
              />
            )}
          </div>

          <div className="w-px h-5 bg-slate-200" />

          {/* 비용(단가) 범위 — 예산에 맞는 인플루언서를 찾을 때 사용(현재 단가 기준). 내부 상태(costMin/Max)는 원 단위 그대로 서버로 보내고, 입력창만 만원 단위로 보여준다. */}
          <div className="flex items-center gap-1.5">
            <span className="text-[12.5px] text-slate-500">비용</span>
            <input
              type="number"
              min={0}
              value={filters.costMin ? String(Number(filters.costMin) / 10000) : ""}
              onChange={(e) => {
                const manwon = e.target.value.replace(/-/g, "");
                setFilters((prev) => ({ ...prev, costMin: manwon ? String(Number(manwon) * 10000) : "" }));
              }}
              placeholder="(만원)이상"
              className="w-24 rounded-md border border-slate-200 px-2 py-1.5 text-[13.5px]"
            />
            <span className="text-slate-300">~</span>
            <input
              type="number"
              min={0}
              value={filters.costMax ? String(Number(filters.costMax) / 10000) : ""}
              onChange={(e) => {
                const manwon = e.target.value.replace(/-/g, "");
                setFilters((prev) => ({ ...prev, costMax: manwon ? String(Number(manwon) * 10000) : "" }));
              }}
              placeholder="(만원)이하"
              className="w-24 rounded-md border border-slate-200 px-2 py-1.5 text-[13.5px]"
            />
          </div>

          <button type="button" onClick={() => setFilters(DEFAULT_FILTERS)} className="text-[13.5px] text-slate-500 hover:text-slate-700 ml-auto">
            필터 초기화
          </button>
        </div>

        {followerRangeError && <p className="text-[13px] text-red-500">{followerRangeError}</p>}
        {costRangeError && <p className="text-[13px] text-red-500">{costRangeError}</p>}
      </div>

      {/* 목록 */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-100 text-[13.5px] text-slate-600">
          전체 {loading ? "-" : total.toLocaleString("ko-KR")}명
        </div>

        {error ? (
          <p className="px-4 py-10 text-center text-[14px] text-red-500">{error}</p>
        ) : loading ? (
          <p className="px-4 py-10 text-center text-[14px] text-slate-500">불러오는 중…</p>
        ) : items.length === 0 ? (
          <p className="px-4 py-10 text-center text-[14px] text-slate-500">{emptyMessage}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1030px] text-[14px] text-center">
              <thead>
                <tr className="text-center text-[12.5px] text-slate-500 border-b border-slate-100">
                  <th className="px-2 py-2 font-semibold">구분</th>
                  <th className="px-4 py-2 font-semibold">인플루언서</th>
                  <th className="px-2 py-2 font-semibold">채널</th>
                  <th className="px-2 py-2 font-semibold">팔로워</th>
                  <th className="px-2 py-2 font-semibold">콘텐츠</th>
                  <th className="px-2 py-2 font-semibold">활동지역</th>
                  <th className="px-2 py-2 font-semibold">단가</th>
                  <th className="px-2 py-2 font-semibold">최근 협업</th>
                  <th className="px-2 py-2 font-semibold">협업 횟수</th>
                  <th className="px-4 py-2 font-semibold">상태</th>
                  <th className="px-4 py-2 font-semibold w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((inf) => (
                  <tr key={inf.id} className="hover:bg-slate-50">
                    <td className="px-2 py-2.5">
                      <div className="flex flex-col items-center gap-1">
                        {(inf.collab_types ?? []).includes("SPONSOR") && (
                          <span className="inline-block rounded bg-blue-50 text-blue-700 text-[11.5px] font-semibold px-1.5 py-0.5">제품협찬</span>
                        )}
                        {(inf.collab_types ?? []).includes("VISIT") && (
                          <span className="inline-block rounded bg-emerald-50 text-emerald-700 text-[11.5px] font-semibold px-1.5 py-0.5">방문인플</span>
                        )}
                        {(inf.collab_types ?? []).length === 0 && <span className="text-slate-300">-</span>}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1">
                        <Link href={`/admin/influencer-hub/influencers/${inf.id}`} className="font-bold underline text-blue-700 hover:text-blue-900">
                          {inf.nickname}
                        </Link>
                        {inf.channel_url && (
                          <a
                            href={inf.channel_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="SNS 사이트 새 창으로 열기"
                            className="flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                      </span>
                      {inf.match_status === "NEEDS_REVIEW" && (
                        <span className="ml-1.5 text-[11.5px] text-amber-600 font-semibold">검수필요</span>
                      )}
                    </td>
                    <td className="px-2 py-2.5"><ChannelIcon channel={inf.channel} /></td>
                    <td className="px-2 py-2.5 text-slate-600 tabular-nums">{inf.follower_display ?? "-"}</td>
                    <td className="px-2 py-2.5 text-slate-600 truncate max-w-[140px]">
                      {inf.content_type[0] ?? "-"}
                    </td>
                    <td className="px-2 py-2.5 text-slate-600">
                      {(Array.isArray(inf.activity_area) ? inf.activity_area[0] : null) ?? "-"}
                    </td>
                    <td className="px-2 py-2.5 text-slate-600 tabular-nums whitespace-nowrap">
                      {fmtCostRange(inf.currentRateMin, inf.currentRateMax)}
                    </td>
                    <td className="px-2 py-2.5 text-slate-600 truncate max-w-[160px]">
                      {inf.recentCollabLabel ? (
                        <>
                          {inf.recentCollabLabel}
                          {inf.recentCollabDate && <span className="text-slate-400">({fmtRecentDate(inf.recentCollabDate)})</span>}
                        </>
                      ) : (
                        <span className="text-slate-300">협업 없음</span>
                      )}
                    </td>
                    <td className="px-2 py-2.5 text-slate-600 tabular-nums">
                      {inf.recentCollabLabel ? `${inf.collabCount}회` : "-"}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[inf.status]}`} />
                        {STATUS_LABEL[inf.status]}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Link
                        href={`/admin/influencer-hub/influencers/${inf.id}/edit`}
                        className="inline-block whitespace-nowrap rounded-md border border-slate-200 text-slate-700 hover:border-slate-400 hover:text-slate-900 text-[13px] font-semibold px-3 py-1"
                      >
                        수정
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 페이지네이션 */}
        {total > PAGE_SIZE && (
          <div className="flex items-center justify-center gap-3 px-4 py-3 border-t border-slate-100 text-[13.5px] text-slate-600">
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
