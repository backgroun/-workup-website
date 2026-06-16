import Hero from "@/components/Hero";

export const dynamic = "force-dynamic";
import HomeNewArrivals from "@/components/HomeNewArrivals";
import HomeCategoryGrid from "@/components/HomeCategoryGrid";
import HomeEditorial from "@/components/HomeEditorial";
import HomePeopleTeaser from "@/components/HomePeopleTeaser";
import HomeInstagramFeed from "@/components/HomeInstagramFeed";
import PopupBanner from "@/components/PopupBanner";

export default function Home() {
  return (
    <main>
      <PopupBanner />
      <Hero />
      <HomeNewArrivals />
      <HomeCategoryGrid />
      <HomeEditorial />
      <HomePeopleTeaser />
      <HomeInstagramFeed />
    </main>
  );
}
