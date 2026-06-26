"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AdminSidebar, { getRouteLabel } from "./AdminSidebar";
import AdminTabBar from "./AdminTabBar";
import { AdminUIContext, type AdminTab, type AdminUIValue } from "./admin-ui-context";

const MAX_TABS = 10;
const LS_TABS = "admin.tabs.v1";
const LS_FAVS = "admin.favorites.v1";

/**
 * 관리자 본문 래퍼.
 * - 좌측 사이드바(아코디언 + 즐겨찾기)
 * - 우측 상단 멀티탭(최대 10개) + 본문
 * 탭/즐겨찾기 상태는 localStorage에 저장한다 (서버/DB 변경 없음).
 */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const searchStr = searchParams.toString();
  const currentHref = pathname + (searchStr ? `?${searchStr}` : "");

  const [hydrated, setHydrated] = useState(false);
  const [tabs, setTabs] = useState<AdminTab[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  // 최초 로드: localStorage 복원
  useEffect(() => {
    try {
      const t = JSON.parse(localStorage.getItem(LS_TABS) || "[]");
      if (Array.isArray(t)) {
        setTabs(t.filter((x) => x && typeof x.href === "string" && typeof x.label === "string"));
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

  // 현재 경로를 탭에 추가
  useEffect(() => {
    if (!hydrated || !pathname.startsWith("/admin")) return;
    setTabs((prev) => {
      if (prev.some((t) => t.href === currentHref)) return prev;
      const next = [...prev, { href: currentHref, label: getRouteLabel(pathname, searchStr) }];
      if (next.length > MAX_TABS) {
        // 현재(활성) 탭이 아닌 가장 오래된 탭 제거
        const idx = next.findIndex((t) => t.href !== currentHref);
        if (idx !== -1) next.splice(idx, 1);
      }
      return next;
    });
  }, [hydrated, currentHref, pathname, searchStr]);

  const selectTab = useCallback((href: string) => { router.push(href); }, [router]);

  const closeTab = useCallback(
    (href: string) => {
      setTabs((prev) => {
        const idx = prev.findIndex((t) => t.href === href);
        if (idx === -1) return prev;
        const next = prev.filter((t) => t.href !== href);
        // 활성 탭을 닫으면 인접 탭으로 이동
        if (href === currentHref) {
          const fallback = next[idx - 1] || next[idx] || next[next.length - 1];
          router.push(fallback ? fallback.href : "/admin");
        }
        return next;
      });
    },
    [currentHref, router]
  );

  const isFavorite = useCallback((href: string) => favorites.includes(href), [favorites]);
  const toggleFavorite = useCallback((href: string) => {
    setFavorites((prev) => (prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]));
  }, []);

  const value = useMemo<AdminUIValue>(
    () => ({ tabs, currentHref, selectTab, closeTab, favorites, isFavorite, toggleFavorite }),
    [tabs, currentHref, selectTab, closeTab, favorites, isFavorite, toggleFavorite]
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
