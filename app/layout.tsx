import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import SideBanner from "@/components/SideBanner";
import BottomNav from "@/components/BottomNav";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import PixelManager from "@/components/PixelManager";
import { getTopbarConfig } from "@/lib/topbar-server";
import { getFooterConfig } from "@/lib/footer-server";
import { getHeaderNavConfig } from "@/lib/header-nav-server";
import { getLogoConfig } from "@/lib/logo-server";
import { getSearchConfig } from "@/lib/header-search-server";
import { getStudioSettings } from "@/lib/studio-server";
import { headers } from "next/headers";
import ScrollToTop from "@/components/ScrollToTop";
import type { CSSProperties } from "react";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "WORKUP — 일하는 사람을 위한 옷",
  description: "현장부터 일상까지. 기능성 워크웨어 브랜드 워크업.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = (await headers()).get("x-pathname") ?? "";
  const isAdmin = pathname.startsWith("/admin") || pathname.startsWith("/login");

  const [topbar, footer, headerNav, logo, search, studio] = isAdmin
    ? [null, null, null, null, null, null]
    : await Promise.all([
        getTopbarConfig(), getFooterConfig(), getHeaderNavConfig(), getLogoConfig(), getSearchConfig(),
        getStudioSettings(),
      ]);

  // 헤더 sticky 오프셋·카탈로그 뷰어 높이가 참조하는 탑바 높이(꺼져 있으면 0).
  const htmlStyle = { "--wu-topbar-h": `${topbar?.enabled ? topbar.height : 0}px` } as CSSProperties;

  return (
    <html lang="ko" style={htmlStyle}>
      <body className="min-h-full flex flex-col">
        {/* 웹폰트 라이브러리 (한글+영문) — 슬라이딩 메뉴 텍스트 캔버스용 · 실제 사용 시에만 폰트 파일 다운로드 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Black+Han+Sans&family=Do+Hyeon&family=Jua&family=Montserrat:wght@400;600;700;900&family=Nanum+Pen+Script&family=Noto+Sans+KR:wght@400;700;900&family=Noto+Serif+KR:wght@400;600;700&family=Oswald:wght@400;500;700&family=Playfair+Display:wght@400;700;900&display=swap"
        />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
        <ScrollToTop />
        {!isAdmin && <PixelManager />}
        <CartProvider>
          <WishlistProvider>
            {/*
              #scroll-root: 모바일에서 body 대신 이 컨테이너가 스크롤.
              globals.css의 @media (max-width:767px)에서 html/body를 overflow:hidden으로 고정하고
              이 div가 flex-1 overflow-y-auto로 스크롤을 담당.
              BottomNav는 이 컨테이너 바깥(body flex 마지막 자식)에 위치해
              position:fixed 없이도 항상 화면 하단에 고정됨.
            */}
            <div
              id={isAdmin ? undefined : "scroll-root"}
              className={isAdmin ? "flex-1 overflow-y-auto" : "flex-1 flex flex-col overflow-y-auto"}
            >
              {!isAdmin && topbar && headerNav && logo && search && (
                <>
                  <AnnouncementBanner config={topbar} />
                  <Header navItems={headerNav.items} logo={logo} search={search} studioEnabled={studio?.enabled ?? true} />
                </>
              )}
              <div className={isAdmin ? "flex-1" : "relative flex-1"}>
                {children}
              </div>
              {!isAdmin && <SideBanner />}
              {!isAdmin && footer && logo && <Footer config={footer} logo={logo} />}
            </div>
            {!isAdmin && headerNav && <BottomNav navItems={headerNav.items} studioEnabled={studio?.enabled ?? true} />}
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
