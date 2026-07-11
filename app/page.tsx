import type { Metadata } from "next";
import { Fragment, type ReactNode } from "react";
import Hero from "@/components/Hero";
import HomeNewArrivals from "@/components/HomeNewArrivals";
import HomeCategoryGrid from "@/components/HomeCategoryGrid";
import HomeEditorial from "@/components/HomeEditorial";
import HomePeopleTeaser from "@/components/HomePeopleTeaser";
import HomeInstagramFeed from "@/components/HomeInstagramFeed";
import PopupBanner from "@/components/PopupBanner";
import { getHomeLayout } from "@/lib/home-layout-server";
import type { HomeSectionKey } from "@/lib/home-layout";

export const metadata: Metadata = {
  title: "WORKUP — 일하는 사람을 위한 옷",
  description: "현장부터 일상까지. 기능성 워크웨어 브랜드 워크업. 전국 매장에서 직접 체험하세요.",
  openGraph: {
    title: "WORKUP — 일하는 사람을 위한 옷",
    description: "현장부터 일상까지. 기능성 워크웨어 브랜드 워크업.",
    type: "website",
    siteName: "WORKUP",
  },
};

// 섹션 키 → 렌더러. 관리자 "메인 배치"에서 정한 순서·노출에 따라 렌더링된다.
const SECTION_RENDERERS: Record<HomeSectionKey, () => ReactNode> = {
  hero: () => <Hero />,
  newArrivals: () => <HomeNewArrivals />,
  category: () => <HomeCategoryGrid />,
  editorial: () => <HomeEditorial />,
  people: () => <HomePeopleTeaser />,
  instagram: () => <HomeInstagramFeed />,
};

export default async function Home() {
  const { sections } = await getHomeLayout();
  return (
    <main>
      {/* 팝업은 오버레이라 배치 대상에서 제외 — 항상 렌더 */}
      <PopupBanner />
      {sections
        .filter((s) => s.visible)
        .map((s) => {
          const render = SECTION_RENDERERS[s.key];
          return render ? <Fragment key={s.key}>{render()}</Fragment> : null;
        })}
    </main>
  );
}
