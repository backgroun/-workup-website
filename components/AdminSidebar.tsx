"use client";
import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type NavLeaf = { label: string; href: string; exact?: boolean; icon: ReactNode };
type NavDropdown = { label: string; icon: ReactNode; children: NavLeaf[] };
type NavItem = NavLeaf | NavDropdown;
type NavGroup = { label: string; items: NavItem[] };

function isDropdown(item: NavItem): item is NavDropdown {
  return "children" in item;
}

const navGroups: NavGroup[] = [
  {
    label: "메인페이지 관리",
    items: [
      {
        label: "슬라이딩 메뉴",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
          </svg>
        ),
        children: [
          {
            label: "메인 비주얼",
            href: "/admin/main/visual",
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            ),
          },
          {
            label: "상품 비주얼",
            href: "/admin/main/visual?type=product",
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            ),
          },
          // 추후 슬라이딩 메뉴 추가 시 여기에 추가
        ],
      },
      {
        label: "신상품 영역",
        href: "/admin/main/new-arrivals",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l1.88 5.79H20l-4.94 3.59 1.88 5.79L12 14.58l-4.94 3.59 1.88-5.79L4.12 8.79H10.12z" />
          </svg>
        ),
      },
      {
        label: "기획전 영역",
        href: "/admin/main/editorial",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        ),
      },
      {
        label: "팝업 배너",
        href: "/admin/main/popup",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
        ),
      },
      {
        label: "MATE 영역",
        href: "/admin/main/people",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
      },
      {
        label: "FIELD TEST 영역",
        href: "/admin/field-test",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        ),
      },
      {
        label: "STORY 관리",
        href: "/admin/main/story",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "카탈로그",
    items: [
      {
        label: "카탈로그 관리",
        href: "/admin/catalog",
        exact: true,
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "제품 관리",
    items: [
      {
        label: "제품 목록",
        href: "/admin/products",
        exact: true,
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        ),
      },
{
        label: "Excel 업로드",
        href: "/admin/products/import",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
      },
      {
        label: "브랜드/제조사",
        href: "/admin/brands",
        exact: true,
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        ),
      },
      {
        label: "카테고리 관리",
        href: "/admin/main/categories",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "회원 관리",
    items: [
      {
        label: "회원 현황",
        href: "/admin/members",
        exact: true,
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
      },
      {
        label: "회원 조회",
        href: "/admin/members/list",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        ),
      },
      {
        label: "회원 직접등록",
        href: "/admin/members/new",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        ),
      },
      {
        label: "휴면회원 관리",
        href: "/admin/members/dormant",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        ),
      },
      {
        label: "접속 관리",
        href: "/admin/members/access",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
        ),
      },
      {
        label: "탈퇴 관리",
        href: "/admin/members/withdrawn",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "마케팅/분석",
    items: [
      {
        label: "분석 대시보드",
        href: "/admin/analytics",
        exact: true,
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        ),
      },
      {
        label: "픽셀/광고 설정",
        href: "/admin/analytics/pixels",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "고객 문의",
    items: [
      {
        label: "문의 관리",
        href: "/admin/inquiries",
        exact: true,
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        ),
      },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 활성 자식을 가진 드롭다운을 초기에 펼침
  const getInitialOpen = () => {
    const open = new Set<string>();
    for (const group of navGroups) {
      for (const item of group.items) {
        if (isDropdown(item)) {
          const hasActive = item.children.some((c) => isLeafActive(c, pathname, searchParams.toString()));
          if (hasActive) open.add(item.label);
        }
      }
    }
    return open;
  };

  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(() => getInitialOpen());

  useEffect(() => {
    setOpenDropdowns(getInitialOpen());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  const toggleDropdown = (label: string) => {
    setOpenDropdowns((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  };

  return (
    <aside className="w-72 flex-shrink-0 bg-[#0f172a] min-h-full flex flex-col">
      <nav className="flex-1 py-6 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="px-6 pt-4 pb-3 text-[11px] font-bold text-slate-500 uppercase tracking-[0.18em]">
              {group.label}
            </p>
            <div className="space-y-0.5 px-3">
              {group.items.map((item) => {
                if (isDropdown(item)) {
                  const isOpen = openDropdowns.has(item.label);
                  const hasActive = item.children.some((c) =>
                    isLeafActive(c, pathname, searchParams.toString())
                  );
                  return (
                    <div key={item.label}>
                      <button
                        onClick={() => toggleDropdown(item.label)}
                        className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-[15px] font-medium transition-all ${
                          hasActive
                            ? "text-white bg-white/8"
                            : "text-slate-400 hover:text-white hover:bg-white/8"
                        }`}
                      >
                        <span className={`flex-shrink-0 ${hasActive ? "text-blue-400" : "text-slate-500"}`}>
                          {item.icon}
                        </span>
                        <span className="flex-1 text-left">{item.label}</span>
                        <svg
                          className={`w-4 h-4 flex-shrink-0 text-slate-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                          fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {isOpen && (
                        <div className="ml-4 mt-0.5 space-y-0.5 border-l border-white/10 pl-3">
                          {item.children.map((child) => {
                            const active = isLeafActive(child, pathname, searchParams.toString());
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-all ${
                                  active
                                    ? "bg-[#1d4ed8] text-white shadow-md shadow-blue-900/30"
                                    : "text-slate-400 hover:text-white hover:bg-white/8"
                                }`}
                              >
                                <span className={`flex-shrink-0 ${active ? "text-white" : "text-slate-500"}`}>
                                  {child.icon}
                                </span>
                                {child.label}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                // 일반 링크
                const active = isLeafActive(item as NavLeaf, pathname, searchParams.toString());
                return (
                  <Link
                    key={(item as NavLeaf).href}
                    href={(item as NavLeaf).href}
                    className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-[15px] font-medium transition-all ${
                      active
                        ? "bg-[#1d4ed8] text-white shadow-md shadow-blue-900/30"
                        : "text-slate-400 hover:text-white hover:bg-white/8"
                    }`}
                  >
                    <span className={`flex-shrink-0 ${active ? "text-white" : "text-slate-500"}`}>
                      {item.icon}
                    </span>
                    {(item as NavLeaf).label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-6 py-5 border-t border-white/5">
        <p className="text-[12px] text-slate-600 font-medium">WORKUP Admin v1.0</p>
      </div>
    </aside>
  );
}

function isLeafActive(item: NavLeaf, pathname: string, searchParamsStr: string): boolean {
  const [itemPath, itemQuery] = item.href.split("?");
  if (item.exact) {
    if (pathname !== itemPath) return false;
  } else {
    if (pathname !== itemPath && !pathname.startsWith(itemPath + "/")) return false;
  }
  if (!itemQuery) {
    // 쿼리 없는 링크: 쿼리가 없거나 type=main 일 때만 활성
    if (itemPath === "/admin/main/visual") {
      const sp = new URLSearchParams(searchParamsStr);
      return !sp.has("type") || sp.get("type") === "main";
    }
    return true;
  }
  // 쿼리 있는 링크: 모든 파라미터가 일치해야 활성
  const itemParams = new URLSearchParams(itemQuery);
  const currentParams = new URLSearchParams(searchParamsStr);
  for (const [k, v] of itemParams.entries()) {
    if (currentParams.get(k) !== v) return false;
  }
  return true;
}
