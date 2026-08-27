"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { IHInfluencerListItem } from "@/lib/ih/influencers";
import { STATUS_LABEL, STATUS_DOT, CHANNEL_OPTIONS, COLLAB_TYPE_ORDER } from "@/lib/ih/influencer-shared";
import { KOREA_PROVINCES, SUB_REGIONS } from "@/lib/ih/regions";
import ChannelIcon from "../ChannelIcon";
import type { IHListMeta } from "../IHMobileSelectionContext";

const COLLAB_TYPE_SHORT_LABEL: Record<string, string> = { SPONSOR: "제품", VISIT: "방문" };
const DEFAULT_STATUS = "ACTIVE";

// 1만 단위 팔로워 Dropdown 옵션(PC와 동일한 체계). value=""는 "제한 없음".
const FOLLOWER_OPTIONS = Array.from({ length: 10 }, (_, i) => {
  const v = (i + 1) * 10000;
  return { value: String(v), label: `${i + 1}만` };
});
const FOLLOWER_CUSTOM = "__custom__";

function fmtRecentDate(iso: string | null) {
  if (!iso) return "";
  const [, m, d] = iso.slice(0, 10).split("-");
  return `${m}/${d}`;
}
// 콘텐츠 유형별로 단가가 여러 개여도 가장 비싼 값 하나만 보여준다(간결하게).
function fmtCostRange(_min: number | null, max: number | null): string {
  if (max == null) return "-";
  if (max >= 10000) return `${Number((max / 10000).toFixed(1))}만원`;
  return `${max.toLocaleString("ko-KR")}원`;
}

const selectCls = "rounded-md border border-slate-200 px-1.5 py-1 text-[12px] text-slate-700 bg-white flex-1 min-w-0";
const numInputCls = "flex-1 min-w-0 rounded-md border border-slate-200 px-2 py-1 text-[12px] text-slate-700";
const filterLabelCls = "text-[11.5px] text-slate-500 flex-shrink-0 w-9";

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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [channel, setChannel] = useState("");
  // 기본으로는 활동 중인 인플루언서만 보여준다 — 휴면/종료/차단은 상태 필터에서 선택해야 보인다.
  const [status, setStatus] = useState(DEFAULT_STATUS);
  const [collabType, setCollabType] = useState("");
  const [contentType, setContentType] = useState("");
  const [regionProvince, setRegionProvince] = useState("");
  const [regionSub, setRegionSub] = useState("");
  const [followerMin, setFollowerMin] = useState("");
  const [followerMax, setFollowerMax] = useState("");
  const [costMin, setCostMin] = useState("");
  const [costMax, setCostMax] = useState("");

  // 콘텐츠 옵션은 하드코딩하지 않고, 이미 내려온 목록(items)에 실제 등장한 값만 뽑아 쓴다.
  const contentOptions = useMemo(() => Array.from(new Set(items.flatMap((i) => i.content_type))).sort(), [items]);
  // 지역은 PC 목록/등록 Form과 동일한 시/도 + 하위지역 체계(lib/ih/regions.ts)를 그대로 재사용한다.
  const regionSubOptions = regionProvince ? SUB_REGIONS[regionProvince] : undefined;

  const matchesRegion = (activityArea: string[]) => {
    if (!regionProvince) return true;
    if (regionSub) return activityArea.includes(`${regionProvince} ${regionSub}`);
    return activityArea.some((a) => a === regionProvince || a.startsWith(`${regionProvince} `));
  };

  // PC와 동일하게 이미 내려온 목록 안에서만 필터링한다(추가 DB 조회 없음 — "동일 데이터 소스" 원칙 유지).
  const filtered = items.filter((inf) => {
    if (q.trim() && !inf.nickname.toLowerCase().includes(q.trim().toLowerCase())) return false;
    if (channel && inf.channel !== channel) return false;
    if (status && inf.status !== status) return false;
    if (collabType && !(inf.collab_types ?? []).includes(collabType as "SPONSOR" | "VISIT")) return false;
    if (contentType && !inf.content_type.includes(contentType)) return false;
    if (!matchesRegion(Array.isArray(inf.activity_area) ? inf.activity_area : [])) return false;
    if (followerMin && (inf.follower_count ?? 0) < Number(followerMin)) return false;
    if (followerMax && (inf.follower_count ?? 0) > Number(followerMax)) return false;
    if (costMin && (inf.currentRateMax ?? -Infinity) < Number(costMin)) return false;
    if (costMax && (inf.currentRateMin ?? Infinity) > Number(costMax)) return false;
    return true;
  });
  const hasLocalFilters = Boolean(
    q.trim() ||
      channel ||
      status !== DEFAULT_STATUS ||
      collabType ||
      contentType ||
      regionProvince ||
      regionSub ||
      followerMin ||
      followerMax ||
      costMin ||
      costMax
  );
  const resetLocalFilters = () => {
    setQ("");
    setChannel("");
    setStatus(DEFAULT_STATUS);
    setCollabType("");
    setContentType("");
    setRegionProvince("");
    setRegionSub("");
    setFollowerMin("");
    setFollowerMax("");
    setCostMin("");
    setCostMax("");
  };

  return (
    <div className="flex flex-col h-full bg-white text-slate-900">
      <header className="flex-shrink-0 h-12 flex items-center justify-between px-4 border-b border-slate-100">
        <span className="font-bold text-[14px] tracking-tight">WORKUP</span>
        <span className="text-[12px] text-slate-500">Influencer Hub</span>
      </header>

      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-100 space-y-2">
        <p className="text-[15px] font-bold text-slate-900">인플루언서</p>
        <div className="flex items-center gap-1.5">
          {/* 구분(제품협찬/방문마케팅 등)은 데이터를 크게 가르는 축이라 검색창보다 앞에 고정 배치한다. */}
          <select
            value={collabType}
            onChange={(e) => setCollabType(e.target.value)}
            className="flex-shrink-0 rounded-md border border-indigo-200 bg-indigo-50 text-indigo-700 font-semibold px-1.5 py-1.5 text-[13px]"
          >
            <option value="">구분</option>
            {COLLAB_TYPE_ORDER.map((t) => (
              <option key={t} value={t}>{COLLAB_TYPE_SHORT_LABEL[t]}</option>
            ))}
          </select>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="닉네임 검색"
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
            {/* 우선순위 필터: 팔로워/콘텐츠/지역/비용 — 팔로워는 PC와 동일하게 1만 단위 Dropdown(직접입력 가능). */}
            <div className="flex items-center gap-1.5">
              <span className={filterLabelCls}>팔로워</span>
              {FOLLOWER_OPTIONS.some((o) => o.value === followerMin) || followerMin === "" ? (
                <select
                  value={followerMin}
                  onChange={(e) => setFollowerMin(e.target.value === FOLLOWER_CUSTOM ? "0" : e.target.value)}
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
                  value={followerMin}
                  onChange={(e) => setFollowerMin(e.target.value.replace(/-/g, ""))}
                  placeholder="(명)이상"
                  className={numInputCls}
                />
              )}
              <span className="text-slate-300">~</span>
              {FOLLOWER_OPTIONS.some((o) => o.value === followerMax) || followerMax === "" ? (
                <select
                  value={followerMax}
                  onChange={(e) => setFollowerMax(e.target.value === FOLLOWER_CUSTOM ? "1" : e.target.value)}
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
                  value={followerMax}
                  onChange={(e) => setFollowerMax(e.target.value.replace(/-/g, ""))}
                  placeholder="(명)이하"
                  className={numInputCls}
                />
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className={filterLabelCls}>콘텐츠</span>
              <select value={contentType} onChange={(e) => setContentType(e.target.value)} className={selectCls}>
                <option value="">전체</option>
                {contentOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={filterLabelCls}>지역</span>
              <select
                value={regionProvince}
                onChange={(e) => {
                  setRegionProvince(e.target.value);
                  setRegionSub("");
                }}
                className={selectCls}
              >
                <option value="">시/도 전체</option>
                {KOREA_PROVINCES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              {regionSubOptions && (
                <select value={regionSub} onChange={(e) => setRegionSub(e.target.value)} className={selectCls}>
                  <option value="">전체</option>
                  {regionSubOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              )}
            </div>
            {/* 비용은 원 단위로 필터링하되(currentRateMin/Max 원본이 원 단위), 입력창은 만원 단위로 받는다. */}
            <div className="flex items-center gap-1.5">
              <span className={filterLabelCls}>비용</span>
              <input
                type="number"
                min={0}
                value={costMin ? String(Number(costMin) / 10000) : ""}
                onChange={(e) => {
                  const manwon = e.target.value.replace(/-/g, "");
                  setCostMin(manwon ? String(Number(manwon) * 10000) : "");
                }}
                placeholder="(만원)이상"
                className={numInputCls}
              />
              <span className="text-slate-300">~</span>
              <input
                type="number"
                min={0}
                value={costMax ? String(Number(costMax) / 10000) : ""}
                onChange={(e) => {
                  const manwon = e.target.value.replace(/-/g, "");
                  setCostMax(manwon ? String(Number(manwon) * 10000) : "");
                }}
                placeholder="(만원)이하"
                className={numInputCls}
              />
            </div>

            <div className="h-px bg-slate-200" />

            <div className="flex items-center gap-1.5">
              <select value={channel} onChange={(e) => setChannel(e.target.value)} className={selectCls}>
                <option value="">채널 전체</option>
                {CHANNEL_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectCls}>
                <option value="">상태 전체</option>
                {Object.entries(STATUS_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-[12.5px] text-slate-500">
            {hasLocalFilters ? `검색 결과 ${filtered.length}명` : `활동 중 ${filtered.length}명 (전체 ${meta.total.toLocaleString("ko-KR")}명)`}
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
            <p className="text-[14px] text-slate-500">
              {hasLocalFilters
                ? "검색 결과가 없습니다."
                : items.length > 0
                ? "활동 중인 인플루언서가 없습니다. 필터에서 다른 상태를 선택해보세요."
                : meta.hasActiveFilters
                ? "조건에 맞는 인플루언서가 없습니다."
                : "등록된 인플루언서가 없습니다."}
            </p>
            {!hasLocalFilters && items.length === 0 && !meta.hasActiveFilters && (
              <button
                type="button"
                onClick={() => router.push("/admin/influencer-hub/influencers/new")}
                className="mt-3 rounded-md bg-slate-900 text-white text-[13.5px] font-semibold px-4 py-2"
              >
                + 인플루언서 등록
              </button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((inf) => (
              <li key={inf.id}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/admin/influencer-hub/influencers/${inf.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") router.push(`/admin/influencer-hub/influencers/${inf.id}`);
                  }}
                  className="w-full text-left px-4 py-3 active:bg-slate-50 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[14px] font-bold text-slate-900 flex items-center gap-1">
                      {(inf.collab_types ?? []).includes("SPONSOR") && (
                        <span className="inline-block rounded bg-blue-50 text-blue-700 text-[11px] font-semibold px-1 py-0.5">제품</span>
                      )}
                      {(inf.collab_types ?? []).includes("VISIT") && (
                        <span className="inline-block rounded bg-emerald-50 text-emerald-700 text-[11px] font-semibold px-1 py-0.5">방문</span>
                      )}
                      {inf.nickname}
                      {inf.channel_url && (
                        <a
                          href={inf.channel_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="SNS 사이트 새 창으로 열기"
                          onClick={(e) => e.stopPropagation()}
                          className="flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-50 text-blue-600"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                    </p>
                    <span className="flex items-center gap-1.5 text-[12px] text-slate-600">
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[inf.status]}`} />
                      {STATUS_LABEL[inf.status]}
                    </span>
                  </div>
                  <p className="text-[13.5px] text-slate-600 flex items-center gap-1">
                    <ChannelIcon channel={inf.channel} className="w-4 h-4" />
                    {inf.follower_display ?? "-"}
                    {(inf.currentRateMin != null || inf.currentRateMax != null) && (
                      <> · {fmtCostRange(inf.currentRateMin, inf.currentRateMax)}</>
                    )}
                  </p>
                  <p className="text-[13px] text-slate-500 mt-0.5">
                    {inf.content_type[0] ?? "-"}
                    {Array.isArray(inf.activity_area) && inf.activity_area[0] ? ` · ${inf.activity_area[0]}` : ""}
                  </p>
                  <p className="text-[12.5px] text-slate-500 mt-1">
                    {inf.recentCollabLabel ? (
                      <>최근 협업 {inf.recentCollabLabel} · {fmtRecentDate(inf.recentCollabDate)} · 총 {inf.collabCount}회</>
                    ) : (
                      "최근 협업 없음"
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
