import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import SideBanner from "@/components/SideBanner";
import BottomNav from "@/components/BottomNav";
import { CartProvider } from "@/contexts/CartContext";
import PixelManager from "@/components/PixelManager";
import { getTopbarConfig } from "@/lib/topbar-server";
import { getFooterConfig } from "@/lib/footer-server";
import { getHeaderNavConfig } from "@/lib/header-nav-server";
import { getLogoConfig } from "@/lib/logo-server";
import { getSearchConfig } from "@/lib/header-search-server";
import { getStudioSettings } from "@/lib/studio-server";
import { headers } from "next/headers";
import ScrollToTop from "@/components/ScrollToTop";

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
  const isAdmin = pathname.startsWith("/admin");

  const [topbar, footer, headerNav, logo, search, studio] = isAdmin
    ? [null, null, null, null, null, null]
    : await Promise.all([
        getTopbarConfig(), getFooterConfig(), getHeaderNavConfig(), getLogoConfig(), getSearchConfig(),
        getStudioSettings(),
      ]);

  // PC/모바일 탑바 높이를 CSS 변수로 주입 — 헤더 sticky 오프셋·카탈로그 뷰어 높이가 참조.
  const tbMobile = topbar?.enabled ? topbar.mobile_height : 0;
  const tbPc     = topbar?.enabled ? topbar.height : 0;

  return (
    <html lang="ko">
      <body className="min-h-full flex flex-col">
        <style>{`:root{--wu-topbar-h:${tbMobile}px}@media(min-width:768px){:root{--wu-topbar-h:${tbPc}px}}`}</style>
        {/* 웹폰트 라이브러리 (한글+영문) — 슬라이딩 메뉴 텍스트 캔버스용 · 실제 사용 시에만 폰트 파일 다운로드 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Black+Han+Sans&family=Do+Hyeon&family=Jua&family=Montserrat:wght@400;600;700;900&family=Nanum+Pen+Script&family=Noto+Sans+KR:wght@400;700;900&family=Noto+Serif+KR:wght@400;600;700&family=Oswald:wght@400;500;700&family=Oxanium:wght@400;500;600;700;800&family=Playfair+Display:wght@400;700;900&display=swap"
        />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
        <ScrollToTop />
        {!isAdmin && <PixelManager />}
        <CartProvider>
            {/* BottomNav는 position:fixed 로 화면 최하단 고정. scroll-root는 스크롤 컨테이너 */}
            <div
              id={isAdmin ? undefined : "scroll-root"}
              className={isAdmin ? "flex-1 min-h-0 overflow-y-auto" : "flex-1 min-h-0 flex flex-col"}
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
        </CartProvider>
      </body>
    </html>
  );
}
