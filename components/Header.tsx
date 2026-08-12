"use client";
import { useState, useEffect, useRef, Fragment } from "react";
import Link from "next/link";
import Image from "next/image";
import { Oxanium } from "next/font/google";
import { useRouter, usePathname } from "next/navigation";
import { DEFAULT_HEADER_NAV, type NavMenuItem } from "@/lib/header-nav";
import { DEFAULT_LOGO, type LogoConfig } from "@/lib/logo";
import { DEFAULT_SEARCH, type SearchConfig } from "@/lib/header-search";
import { DEFAULT_TOPBAR, safeHref, type TopbarItem } from "@/lib/topbar";
import { FITTING_LIST_KEY } from "@/contexts/CartContext";


const oxanium = Oxanium({ subsets: ["latin"], weight: ["600"] });

type MemberSession = { name: string; grade: string } | null;

export default function Header({
  navItems = DEFAULT_HEADER_NAV.items,
  logo = DEFAULT_LOGO,
  search = DEFAULT_SEARCH,
  topbarItems = DEFAULT_TOPBAR.items,
  studioEnabled = true,
}: {
  navItems?: NavMenuItem[];
  logo?: LogoConfig;
  search?: SearchConfig;
  topbarItems?: TopbarItem[];
  studioEnabled?: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  // 검색창 안내문구를 관리자가 등록한 여러 문구로 순환 노출 — 목록이 없으면 고정 placeholder를 그대로 쓴다.
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [memberSession, setMemberSession] = useState<MemberSession>(undefined as unknown as MemberSession);
  const headerRef = useRef<HTMLElement>(null);
  // 검색 행은 헤더 밖(고정되지 않는 형제 요소)에 놓이므로 전체 높이 실측 시 헤더와 별도로 관찰한다.
  const searchRowRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  // 모바일 상품 상세 페이지에서는 MobileProductNav가 대신 담당
  const hideOnMobile = /^\/products\/[^/]+$/.test(pathname ?? "");
  // 스토리 페이지에서만 히어로 위 투명 오버레이 헤더(탑바는 다른 페이지와 동일하게 항상 노출 — 헤더만 탑바 바로 아래에서 겹친다).
  // 클라이언트 경로 기준이라 soft navigation 시에도 정확히 갱신된다.
  const overlay = pathname === "/story";

  useEffect(() => {
    fetch("/api/member/me")
      .then(r => r.json())
      .then(data => setMemberSession(data ?? null))
      .catch(() => setMemberSession(null));
  }, [pathname]);

  useEffect(() => {
    setSearchQuery("");
  }, [pathname]);

  // overlay 모드: 히어로를 지나 스크롤하면 투명 → 흰 헤더로 전환.
  // 데스크톱은 window, 모바일은 #scroll-root 가 스크롤되므로 둘 다 감지한다.
  useEffect(() => {
    if (!overlay) return;
    const root = document.getElementById("scroll-root");
    const onScroll = () => {
      const y = window.scrollY || root?.scrollTop || 0;
      setScrolled(y > 40);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    root?.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      root?.removeEventListener("scroll", onScroll);
    };
  }, [overlay]);

  // 흰 글자(히어로 위 투명 상태). overlay 이면서 아직 스크롤 전.
  const white = overlay && !scrolled;

  // 검색창은 메인·상품 목록 페이지에서만 노출한다 (다른 페이지에서는 검색 맥락이 없어 굳이 자리 차지하지 않게).
  const showSearchRow = search.enabled && (pathname === "/" || pathname === "/products");

  // 관리자가 고른 목록(프로모션 문구 vs 검색 키워드)만 순환 대상으로 삼는다.
  const rotationList = search.rotationSource === "display" ? search.displayPhrases : search.popularTerms;

  useEffect(() => {
    if (rotationList.length === 0) return;
    const id = setInterval(() => {
      setPhraseIdx((i) => (i + 1) % rotationList.length);
    }, 3000);
    return () => clearInterval(id);
  }, [rotationList]);

  const rotatingPlaceholder = rotationList.length > 0
    ? rotationList[phraseIdx % rotationList.length]
    : search.placeholder;

  // 카탈로그 뷰어처럼 "화면 - 헤더 높이"를 계산하는 곳에서 쓸 수 있게 헤더 전체(로고 행 + 검색 행) 실측 높이를
  // CSS 변수로 공개한다. overlay 모드는 검색 행이 헤더 안에 있어 headerRef만으로 충분하지만,
  // 일반 모드는 검색 행이 헤더 밖 형제 요소이므로 두 요소의 높이를 더한다.
  useEffect(() => {
    const publish = () => {
      const headerH = headerRef.current?.getBoundingClientRect().height ?? 0;
      const searchH = overlay ? 0 : (searchRowRef.current?.getBoundingClientRect().height ?? 0);
      document.documentElement.style.setProperty("--wu-header-h", `${headerH + searchH}px`);
    };
    publish();
    const ro = new ResizeObserver(publish);
    if (headerRef.current) ro.observe(headerRef.current);
    if (!overlay && searchRowRef.current) ro.observe(searchRowRef.current);
    return () => ro.disconnect();
    // showSearchRow는 페이지 이동에 따라 검색 행이 DOM에 나타나거나 사라지므로,
    // 그때마다 새 searchRowRef.current를 다시 관찰하도록 의존성에 포함한다.
  }, [overlay, showSearchRow]);

  const handleSearch = (query: string) => {
    const q = query.trim();
    if (!q) return;
    router.push(`/products?q=${encodeURIComponent(q)}`);
    setSearchQuery("");
  };

  const handleLogout = async () => {
    await fetch("/api/member/logout", { method: "POST" });
    // 찜은 계정에 저장되므로, 이 기기의 캐시는 지워 다음 사용자에게 노출되지 않게 한다.
    try { localStorage.removeItem(FITTING_LIST_KEY); } catch {}
    setMemberSession(null);
    router.push("/");
    router.refresh();
  };

  // ── 로고 / 내비게이션 / 가맹·제휴문의 / 로그인 행 ──
  const topRow = (
    <div className="px-[15px] md:px-[70px]">
      <div className="flex items-center gap-3 h-12 md:h-16">

        {/* 로고 */}
        <Link href="/" className="flex-shrink-0 py-2 active:opacity-50 active:scale-95 transition-[opacity,transform] duration-150">
          <Image src={logo.src} alt={logo.alt} width={130} height={18} className={`h-[14px] w-[100px] md:h-[18px] md:w-[130px] transition-[filter] ${white ? "brightness-0 invert" : ""}`} priority />
        </Link>

        {/* 데스크탑 내비게이션 */}
        <nav className="hidden md:flex items-center gap-7 flex-1 justify-start ml-[60px]">
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              target={item.newTab ? "_blank" : undefined}
              rel={item.newTab ? "noopener noreferrer" : undefined}
              className={`group grid place-items-center whitespace-nowrap transition-colors ${white ? "text-white" : "text-[#303236]"}`}
              style={{ fontWeight: 650 }}
            >
              {/* 기본은 영문, 마우스 오버 시 한글로 크로스페이드.
                  두 텍스트를 같은 그리드 셀(1/1)에 겹쳐 폭 밀림 없이 자연스럽게 전환한다.
                  영문·한글의 font-size와 leading을 동일하게 맞춰 겹칠 때 위치가 어긋나지 않게 한다. */}
              <span
                style={{ gridArea: "1 / 1" }}
                className={`${oxanium.className} text-[17px] leading-none tracking-wide transition-opacity duration-200 ${item.labelKo ? "group-hover:opacity-0" : ""}`}
              >
                {item.label}
              </span>
              {item.labelKo && (
                <span
                  style={{ gridArea: "1 / 1", fontWeight: 700 }}
                  className={`text-[14px] leading-none tracking-tighter opacity-0 transition-opacity duration-200 group-hover:opacity-100 ${white ? "text-white/80" : "text-gray-500"}`}
                >
                  {item.labelKo}
                </span>
              )}
            </Link>
          ))}

          {/* 티셔츠 꾸미기 스튜디오 — 관리자에서 활성화 시 노출 */}
          {studioEnabled && (
            <Link
              href="/studio"
              className={`${oxanium.className} flex items-center gap-1.5 text-[15px] text-white bg-[#E5541B] hover:brightness-95 px-3.5 py-1.5 rounded-full transition tracking-wide whitespace-nowrap shadow-sm`}
              style={{ fontWeight: 650 }}
            >
              STUDIO
              <span className="text-[9px] font-bold leading-none bg-white text-[#E5541B] rounded-full px-1 py-[3px]">NEW</span>
            </Link>
          )}
        </nav>

        {/* 가맹/제휴문의 — 기존 상단 탑배너를 없애고 로고 행에 통합 (모바일도 노출, nav가 없을 때는 ml-auto로 우측 정렬) */}
        {topbarItems.length > 0 && (
          <div className={`flex items-center gap-1.5 flex-shrink-0 ml-auto md:ml-0 text-[10px] md:text-[12px] font-semibold whitespace-nowrap ${white ? "text-white/90" : "text-gray-500"}`}>
            {topbarItems.map((it, idx) => {
              const href = safeHref(it.href) || "/";
              const external = !href.startsWith("/") && !href.startsWith("#");
              return (
                <Fragment key={it.id}>
                  {idx > 0 && <span className="opacity-40 select-none">|</span>}
                  {external ? (
                    <a
                      href={href}
                      target={it.newTab ? "_blank" : undefined}
                      rel={it.newTab ? "noopener noreferrer" : undefined}
                      className="hover:text-[#E5541B] transition-colors"
                    >
                      {it.label}
                    </a>
                  ) : (
                    <Link href={href} className="hover:text-[#E5541B] transition-colors">
                      {it.label}
                    </Link>
                  )}
                </Fragment>
              );
            })}
          </div>
        )}

        {/* 회원 버튼: 로그인 여부에 따라 로그인/회원가입 · 로그아웃 텍스트 박스 — 데스크탑 전용(모바일은 하단 '마이' 탭으로 이동) */}
        <button
          onClick={() => (memberSession ? handleLogout() : router.push("/member/login"))}
          className="hidden md:inline-flex items-center justify-center flex-shrink-0 px-3 py-1.5 rounded-md bg-[#303236] text-white text-[11px] font-semibold tracking-wide whitespace-nowrap hover:bg-[#243d5e] transition-colors"
        >
          {memberSession ? "로그아웃" : "로그인 / 회원가입"}
        </button>

      </div>
    </div>
  );

  // ── 검색 행 내용물 — 전체 폭, 클릭 없이 항상 노출. PC에서도 스크롤 시 고정되지 않고 페이지와 함께 흘러간다 ──
  const searchInner = (
    <div className="px-[15px] md:px-[70px]">
      <div className="flex items-center h-10">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={rotatingPlaceholder}
          aria-label="검색어 입력"
          className="flex-1 min-w-0 h-full text-[13px] leading-none text-[#303236] placeholder-gray-500 bg-transparent outline-none"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch(searchQuery);
            if (e.key === "Escape") { setSearchQuery(""); e.currentTarget.blur(); }
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="text-gray-400 hover:text-gray-600 text-sm px-2.5 flex-shrink-0"
            aria-label="검색어 지우기"
          >✕</button>
        )}
        <button
          onClick={() => handleSearch(searchQuery)}
          className="text-gray-500 hover:text-[#E5541B] transition-colors flex-shrink-0"
          aria-label="검색 실행"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
        </button>
      </div>
    </div>
  );

  // 스토리 페이지의 히어로 오버레이 헤더는 로고 행·검색 행을 하나로 묶어 함께 고정한다(기존 동작 유지).
  // position:fixed는 sticky와 달리 부모 박스 크기에 갇히지 않으므로 검색 행을 안에 둬도 문제없다.
  if (overlay) {
    return (
      <header
        ref={headerRef}
        className={`fixed left-0 right-0 z-50 transition-colors duration-300 ${
          scrolled ? "bg-white border-b border-gray-200 shadow-sm" : "bg-transparent border-b border-transparent"
        }${hideOnMobile ? " hidden md:block" : ""}`}
        style={{ top: "var(--wu-topbar-h, 36px)" }}
      >
        {topRow}
        {showSearchRow && (
          <div className="bg-gray-100">{searchInner}</div>
        )}
      </header>
    );
  }

  // 일반 페이지: 로고 행만 스크롤 시 상단에 고정하고, 검색 행은 페이지와 함께 흘러가게 분리한다(PC 기준 — 모바일은 원래도 고정되지 않음).
  // 검색 행을 헤더 안에 두면 헤더의 sticky 포함 블록이 좁아져(로고 행+검색 행 높이) 조금만 스크롤해도
  // 통째로 떨어져 나가 버리므로, 반드시 헤더 밖의 독립된 형제 요소로 둔다.
  return (
    <>
      <header
        ref={headerRef}
        className={`md:sticky z-50 bg-white${showSearchRow ? "" : " border-b border-gray-200"}${hideOnMobile ? " hidden md:block" : ""}`}
        style={{ top: "var(--wu-topbar-h, 36px)" }}
      >
        {topRow}
      </header>
      {showSearchRow && (
        <div ref={searchRowRef} className={`bg-gray-100${hideOnMobile ? " hidden md:block" : ""}`}>
          {searchInner}
        </div>
      )}
    </>
  );
}
