"use client";
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useAdminUI } from "./admin-ui-context";
import { getNavLeafByHref, getRouteLabel } from "./AdminSidebar";

const LS_VISITS = "admin.visits.v1";

// 즐겨찾기·방문 기록이 전혀 없을 때 보여줄 기본 바로가기
const DEFAULT_HREFS = [
  "/admin/products",
  "/admin/stores",
  "/admin/inquiries",
  "/admin/members",
  "/admin/main/sections",
  "/admin/analytics/pixels",
];

const FALLBACK_ICON = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

function resolve(href: string): { label: string; icon: ReactNode } {
  const leaf = getNavLeafByHref(href) || getNavLeafByHref(href.split("?")[0]);
  if (leaf) return { label: leaf.label, icon: leaf.icon };
  const [path, query = ""] = href.split("?");
  return { label: getRouteLabel(path, query), icon: FALLBACK_ICON };
}

function StarIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.36 4.18a1 1 0 00.95.69h4.4c.97 0 1.37 1.24.59 1.81l-3.56 2.59a1 1 0 00-.36 1.12l1.36 4.18c.3.92-.76 1.69-1.54 1.12l-3.56-2.59a1 1 0 00-1.18 0l-3.56 2.59c-.78.57-1.84-.2-1.54-1.12l1.36-4.18a1 1 0 00-.36-1.12L2.1 9.61c-.78-.57-.38-1.81.59-1.81h4.4a1 1 0 00.95-.69z" />
    </svg>
  );
}

export default function AdminDashboard() {
  const { favorites, tabs, selectTab } = useAdminUI();
  const [visits, setVisits] = useState<Record<string, number>>({});

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(LS_VISITS) || "{}");
      if (raw && typeof raw === "object") setVisits(raw as Record<string, number>);
    } catch {
      /* noop */
    }
  }, []);

  const favSet = new Set(favorites);

  // 방문 많은 순 (즐겨찾기/대시보드 제외, 메뉴로 해석 가능한 것만)
  const topVisited = Object.entries(visits)
    .filter(([href]) => !favSet.has(href) && href !== "/admin" && getNavLeafByHref(href.split("?")[0]))
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .map(([href]) => href);

  // 자주 쓰는 메뉴 = 즐겨찾기 우선 + 방문 많은 순으로 최대 8개
  const primaryHrefs = [...favorites, ...topVisited].slice(0, 8);
  const usingDefaults = primaryHrefs.length === 0;
  const cards = (usingDefaults ? DEFAULT_HREFS : primaryHrefs).map((href) => ({
    href,
    ...resolve(href),
    favorite: favSet.has(href),
    count: Number(visits[href.split("?")[0]]) || Number(visits[href]) || 0,
  }));

  const recent = [...tabs].reverse().slice(0, 10);

  return (
    <div className="max-w-6xl">
      {/* 헤더 */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-slate-800">대시보드</h1>
        <p className="text-slate-500 mt-1 text-sm">자주 쓰는 메뉴를 한 곳에 모았습니다.</p>
      </div>

      {/* 안내 (즐겨찾기 없을 때) */}
      {usingDefaults && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <span className="text-amber-500 mt-0.5"><StarIcon /></span>
          <p className="text-[13px] text-amber-800 leading-relaxed">
            왼쪽 메뉴에 마우스를 올리면 나타나는 <b>별표(⭐)</b>를 누르면, 그 메뉴가 여기 <b>자주 쓰는 메뉴</b>로 고정됩니다.
            지금은 기본 바로가기를 보여드립니다.
          </p>
        </div>
      )}

      {/* 자주 쓰는 메뉴 */}
      <section className="mb-8">
        <h2 className="text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-3">
          {usingDefaults ? "바로가기" : "자주 쓰는 메뉴"}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {cards.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="group relative flex flex-col gap-3 bg-white rounded-2xl border border-slate-200 p-5 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                {c.icon}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-800 text-[15px] truncate">{c.label}</p>
                <p className="text-[12px] mt-0.5 text-slate-400">
                  {c.count > 0 ? `${c.count}회 방문` : c.favorite ? "즐겨찾기" : "바로가기"}
                </p>
              </div>
              {c.favorite && (
                <span className="absolute top-4 right-4 text-amber-400">
                  <StarIcon />
                </span>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* 최근 본 페이지 */}
      {recent.length > 0 && (
        <section>
          <h2 className="text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-3">최근 본 페이지</h2>
          <div className="flex flex-wrap gap-2">
            {recent.map((t) => (
              <button
                key={t.href}
                type="button"
                onClick={() => selectTab(t.href)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[13px] font-medium text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
              >
                {t.label}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
