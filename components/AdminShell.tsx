"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AdminSidebar, { getNavLeafByHref } from "./AdminSidebar";
import AdminTabBar from "./AdminTabBar";
import { AdminUIContext, type AdminTab, type AdminUIValue } from "./admin-ui-context";

const MAX_TABS = 10;
const LS_TABS = "admin.tabs.v1";
const LS_FAVS = "admin.favorites.v1";
const LS_VISITS = "admin.visits.v1";
// 즐겨찾기는 서버(site_settings)에 저장해 관리자 계정 기준으로 어디서든 동일하게 보이게 한다.
const FAV_API = "/api/admin/site-settings/admin_favorites";

/**
 * 관리자 본문 래퍼.
 * - 좌측 사이드바(아코디언 + 즐겨찾기)
 * - 우측 상단 멀티탭(최대 10개) + 본문
 * 탭·방문기록은 localStorage(기기별), 즐겨찾기는 서버(계정 공유)에 저장한다.
 */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const searchStr = searchParams.toString();
  const currentHref = pathname + (searchStr ? `?${searchStr}` : "");

  // 현재 경로가 "왼쪽 메뉴(사이드바)에 있는 항목"인지 판별.
  // 메뉴에 있으면 그 메뉴의 정규 href를 탭 키로 사용한다.
  // 제품 수정/등록 같은 동적 페이지는 메뉴에 없으므로 routeLeaf === null → 탭 생성 안 함.
  const routeLeaf = getNavLeafByHref(currentHref);
  const activeHref = routeLeaf ? routeLeaf.href : currentHref;

  const [hydrated, setHydrated] = useState(false);
  const [tabs, setTabs] = useState<AdminTab[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  // 최초 로드: localStorage 복원
  useEffect(() => {
    try {
      const t = JSON.parse(localStorage.getItem(LS_TABS) || "[]");
      if (Array.isArray(t)) {
        // 메뉴에 없는 잡탭(이전 버전에서 쌓인 제품 수정 등)은 로드 시 정리
        setTabs(
          t.filter(
            (x) =>
              x && typeof x.href === "string" && typeof x.label === "string" && getNavLeafByHref(x.href)
          )
        );
      }
      const f = JSON.parse(localStorage.getItem(LS_FAVS) || "[]");
      if (Array.isArray(f)) setFavorites(f.filter((x) => typeof x === "string"));
    } catch {
      /* noop */
    }
    setHydrated(true);
  }, []);

  // 변경 시 저장
  useEffect(() => {
    if (hydrated) try { localStorage.setItem(LS_TABS, JSON.stringify(tabs)); } catch { /* noop */ }
  }, [tabs, hydrated]);
  useEffect(() => {
    if (hydrated) try { localStorage.setItem(LS_FAVS, JSON.stringify(favorites)); } catch { /* noop */ }
  }, [favorites, hydrated]);

  // 현재 경로가 메뉴 항목일 때만 탭에 추가 (동적 편집/등록 페이지는 제외)
  useEffect(() => {
    if (!hydrated || !routeLeaf) return;
    const href = routeLeaf.href;
    setTabs((prev) => {
      if (prev.some((t) => t.href === href)) return prev;
      const next = [...prev, { href, label: routeLeaf.label }];
      if (next.length > MAX_TABS) {
        // 현재(활성) 탭이 아닌 가장 오래된 탭 제거
        const idx = next.findIndex((t) => t.href !== href);
        if (idx !== -1) next.splice(idx, 1);
      }
      return next;
    });
  }, [hydrated, routeLeaf]);

  // 메뉴 방문 횟수 집계 (대시보드 "자주 방문" 용). /admin(대시보드 자신)은 제외.
  useEffect(() => {
    if (!hydrated || !pathname.startsWith("/admin") || pathname === "/admin") return;
    try {
      const raw = JSON.parse(localStorage.getItem(LS_VISITS) || "{}");
      raw[pathname] = (Number(raw[pathname]) || 0) + 1;
      localStorage.setItem(LS_VISITS, JSON.stringify(raw));
    } catch {
      /* noop */
    }
  }, [hydrated, pathname]);

  const selectTab = useCallback((href: string) => { router.push(href); }, [router]);

  const closeTab = useCallback(
    (href: string) => {
      const idx = tabs.findIndex((t) => t.href === href);
      if (idx === -1) return;
      const next = tabs.filter((t) => t.href !== href);
      setTabs(next);
      // 활성 탭을 닫으면 인접 탭으로 이동 (setState 업데이터 밖에서 호출해야 함)
      if (href === activeHref) {
        const fallback = next[idx - 1] || next[idx] || next[next.length - 1];
        router.push(fallback ? fallback.href : "/admin");
      }
    },
    [tabs, activeHref, router]
  );

  const isFavorite = useCallback((href: string) => favorites.includes(href), [favorites]);
  const toggleFavorite = useCallback((href: string) => {
    setFavorites((prev) => (prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]));
  }, []);

  const value = useMemo<AdminUIValue>(
    () => ({ tabs, currentHref: activeHref, selectTab, closeTab, favorites, isFavorite, toggleFavorite }),
    [tabs, activeHref, selectTab, closeTab, favorites, isFavorite, toggleFavorite]
  );

  return (
    <AdminUIContext.Provider value={value}>
      <AdminSidebar />
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <AdminTabBar />
        <main className="flex-1 min-w-0 overflow-y-auto bg-[#f1f5f9]">
          <div className="px-4 sm:px-6 lg:px-10 pt-5 pb-10 admin-content">{children}</div>
        </main>
      </div>
    </AdminUIContext.Provider>
  );
}
