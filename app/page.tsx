import type { Metadata } from "next";
import Hero from "@/components/Hero";
import HomeNewArrivals from "@/components/HomeNewArrivals";
import HomeCategoryGrid from "@/components/HomeCategoryGrid";
import HomeEditorial from "@/components/HomeEditorial";
import HomePeopleTeaser from "@/components/HomePeopleTeaser";
import HomeInstagramFeed from "@/components/HomeInstagramFeed";
import PopupBanner from "@/components/PopupBanner";

export const dynamic = "force-dynamic";

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

export default function Home() {
  return (
    <main>
      <PopupBanner />
      <Hero />
      <HomeNewArrivals />
      <div className="px-[15px] md:px-[70px]">
        <hr className="border-t border-gray-200" />
      </div>
      <HomeCategoryGrid />
      <HomeEditorial />
      <HomePeopleTeaser />
      <HomeInstagramFeed />
    </main>
  );
}
