// [임시] 새 스토리 레이아웃 전체 config를 site_settings.story_page에 덮어쓴다. 실행 후 삭제.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const line of readFileSync("D:/WORK_DATA/2026_workup_website/.env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const config = {
  hero: {
    image_url: undefined,
    bg: "#1A2B4A",
    showWatermark: true,
    heading: "일하는 사람 편에서\n만든 브랜드",
    sub: "워크업은 현장에서 시작해 일상까지 이어지는 Work Life Wear 브랜드입니다.",
    height: 580,
  },
  sections: [
    {
      id: "declaration", type: "declaration", visible: true, bg: "white",
      eyebrow: "Brand Declaration",
      heading: "대한민국에는\n수많은 사람이 일합니다.",
      lead: "건설현장, 공장, 물류센터, 농장, 매장, 사무실까지.",
      emphasis: "우리는 그 사람들이 하루 종일 입을\n옷을 만듭니다.",
      emphasisStrong: "",
      image_url: "/images/story-declaration.jpg",
    },
    {
      id: "problem", type: "problem", visible: true, bg: "beige",
      eyebrow: "THE PROBLEM",
      heading: "왜 작업복은 불편해도\n참고 입어야 했을까요?",
      body: "덥고, 무겁고, 쉽게 낡고.\n퇴근 후에는 입기 애매한 옷.",
      image_url: "/images/story-problem.jpg",
      imageSide: "left",
    },
    {
      id: "features3", type: "features3", visible: true, bg: "white",
      eyebrow: "WORK LIFE WEAR",
      heading: "일할 때는 작업복처럼,\n일상에서는 평상복처럼.",
      lead: "워크업은 현장의 기능과 일상의 스타일을 동시에 담습니다.",
      items: [
        { icon: "hardhat", label: "WORK", desc: "현장에서 검증된\n기능성" },
        { icon: "clock", label: "LIFE", desc: "퇴근 후에도\n자연스러운 스타일" },
        { icon: "hanger", label: "WEAR", desc: "매일 갈아입지 않아도\n되는 옷" },
      ],
    },
    {
      id: "values", type: "values", visible: true, bg: "beige",
      eyebrow: "Core Values",
      heading: "워크업이 지키는 네 가지 기준",
      layout: "icon",
      items: [
        { num: "01", en: "Function", title: "기능성", icon: "check", desc: "하루 종일 착용해도\n불편하지 않음" },
        { num: "02", en: "Durability", title: "내구성", icon: "link", desc: "쉽게 헤지거나\n낡지 않음" },
        { num: "03", en: "Value", title: "합리성", icon: "scale", desc: "가격이 아닌\n품질로 승부합니다" },
        { num: "04", en: "Versatility", title: "범용성", icon: "expand", desc: "일할 때도 일상에서도\n입을 수 있어야" },
      ],
    },
    {
      id: "founding", type: "founding", visible: true, bg: "white",
      eyebrow: "Founding Story",
      heading: "워크업은\n현장에서 시작했습니다.",
      paragraphs: [
        "작업복을 하루 종일 편하게 입을 수 있는 옷.",
        "그래서 다른 옷과도 자연스럽게 어울리게 만들었습니다.",
      ],
      emphasis: "",
      closing: "일하는 사람 곁에서,\n늘 함께합니다.",
      image_url: "/images/story-founding-sewing.jpg",
      imageSide: "right",
    },
    {
      id: "storeCta", type: "storeCta", visible: true, bg: "beige",
      eyebrow: "STORE EXPERIENCE",
      heading: "입어봐야 알 수 있는\n옷이 있습니다.",
      body: "핏, 촉감, 착용감.\n이것들은 사진으로 전달되지 않습니다.",
      ctaLabel: "가까운 매장 찾기 →",
      ctaHref: "/store",
      images: [
        { url: "/images/story-cta-1.jpg", alt: "" },
        { url: "/images/story-cta-2.jpg", alt: "" },
        { url: "/images/story-category.jpg", alt: "" },
      ],
    },
  ],
  style: {
    fontScale: 1, lineHeight: 1.8, sectionSpacing: 1, imageRatio: "4 / 3", imageWidth: 50,
  },
};

const { error } = await supabase
  .from("site_settings")
  .upsert({ section: "story_page", config, updated_at: new Date().toISOString() }, { onConflict: "section" });
if (error) { console.error("저장 실패:", error.message); process.exit(1); }
console.log("저장 완료 — 새 레이아웃(7섹션)으로 story_page 교체됨");
