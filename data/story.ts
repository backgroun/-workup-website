// ─────────────────────────────────────────────────────────────
// data/story.ts — /story 페이지 구조 타입 + DEFAULT_STORY + 팩토리
// 관리자(/admin/main/story)는 site_settings("story_page").config(= StoryConfig)를 편집한다.
// 공개 페이지는 row가 없으면 DEFAULT_STORY로 폴백한다. (data/people.ts 와 동일 패턴)
// ─────────────────────────────────────────────────────────────

export type SectionBg = "white" | "beige"; // white = bg-white, beige = bg-[#f2f1ed]
// 네이비 섹션 배경은 의도적으로 제외(본문 대비 문제 + 현재 페이지도 섹션엔 안 씀). 히어로 기본색으로만 사용.

export type StorySectionType =
  | "declaration" | "category" | "values" | "founding" | "cta" | "richtext" | "photos";

export type SectionBase = {
  id: string;
  type: StorySectionType;
  visible: boolean;
  bg: SectionBg;
};

export type DeclarationSection = SectionBase & {
  type: "declaration";
  eyebrow: string;
  heading: string;        // 줄바꿈 \n (whitespace-pre-line)
  lead: string;
  emphasis: string;       // 줄바꿈 \n
  emphasisStrong: string; // 마지막 굵은 문구
};

export type CategorySection = SectionBase & {
  type: "category";
  eyebrow: string;
  heading: string;
  lead: string;
  tags: string[];         // '+' 로 연결되는 칩
  body: string;           // 줄바꿈 \n
};

export type ValueItem = { num: string; en: string; title: string; desc: string }; // desc 줄바꿈 \n
export type ValuesSection = SectionBase & {
  type: "values";
  eyebrow: string;
  heading: string;
  items: ValueItem[];
};

export type FoundingSection = SectionBase & {
  type: "founding";
  eyebrow: string;
  heading: string;        // 줄바꿈 \n
  paragraphs: string[];   // 본문 문단
  emphasis: string;       // 인용구(semibold)
  closing: string;        // 마무리(줄바꿈 \n)
  image_url?: string;     // 비우면 "사진을 교체해 주세요" 플레이스홀더
  imageSide: "left" | "right";
};

export type CtaSection = SectionBase & {
  type: "cta";
  eyebrow: string;
  heading: string;
  body: string;           // 줄바꿈 \n
  ctaLabel: string;
  ctaHref: string;        // "/store" | "/products" | "tel:..." | 카카오톡 URL
};

export type RichTextSection = SectionBase & {
  type: "richtext";
  eyebrow: string;
  heading: string;        // 줄바꿈 \n
  body: string;           // 줄바꿈 \n
};

export type PhotoItem = { url?: string; alt?: string };
export type PhotosSection = SectionBase & {
  type: "photos";
  columns: 2 | 3 | 4;   // 열 수 (모바일은 2열 고정)
  images: PhotoItem[];
};

export type StorySection =
  | DeclarationSection | CategorySection | ValuesSection
  | FoundingSection | CtaSection | RichTextSection | PhotosSection;

export type StoryHero = {
  image_url?: string;     // 설정 시 배경 이미지, 없으면 네이비 + WU 워터마크
  bg: string;             // 기본 "#1A2B4A"
  showWatermark: boolean; // 기본 true
  heading: string;        // 줄바꿈 \n
  sub: string;
  height: number;         // 기본 580 (px)
};

export type StoryConfig = { hero: StoryHero; sections: StorySection[] };

// 한글 타입 라벨 (관리자 목록/팔레트용)
export const SECTION_TYPE_LABEL: Record<StorySectionType, string> = {
  declaration: "선언문",
  category: "카테고리",
  values: "핵심가치",
  founding: "창업스토리",
  cta: "CTA",
  richtext: "자유텍스트",
  photos: "사진갤러리",
};

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// 새 섹션 기본값 (관리자 "섹션 추가")
export function emptySection(type: StorySectionType): StorySection {
  const base = { id: uid(), visible: true, bg: "white" as SectionBg };
  switch (type) {
    case "declaration":
      return { ...base, type, eyebrow: "", heading: "", lead: "", emphasis: "", emphasisStrong: "" };
    case "category":
      return { ...base, type, eyebrow: "", heading: "", lead: "", tags: [""], body: "" };
    case "values":
      return { ...base, type, eyebrow: "", heading: "", items: [{ num: "01", en: "", title: "", desc: "" }] };
    case "founding":
      return { ...base, type, eyebrow: "", heading: "", paragraphs: [""], emphasis: "", closing: "", image_url: undefined, imageSide: "right" };
    case "cta":
      return { ...base, type, eyebrow: "", heading: "", body: "", ctaLabel: "가까운 매장 찾기 →", ctaHref: "/store" };
    case "richtext":
      return { ...base, type, eyebrow: "", heading: "", body: "" };
    case "photos":
      return { ...base, type, columns: 3, images: [{ url: undefined, alt: "" }, { url: undefined, alt: "" }, { url: undefined, alt: "" }] };
  }
}

// 현재 app/story/page.tsx 를 1:1로 옮긴 기본값. \n 위치는 기존 <br/> 와 정확히 일치해야 한다.
export const DEFAULT_STORY: StoryConfig = {
  hero: {
    image_url: undefined,
    bg: "#1A2B4A",
    showWatermark: true,
    heading: "일하는 사람 편에서\n만든 브랜드",
    sub: "워크업이 왜 존재하는가",
    height: 580,
  },
  sections: [
    {
      id: "declaration", type: "declaration", visible: true, bg: "white",
      eyebrow: "Brand Declaration",
      heading: "대한민국에는\n수많은 사람이 일합니다.",
      lead: "건설현장, 공장, 물류센터, 농장, 매장, 사무실까지.",
      emphasis: "그들이 더 편하게, 더 안전하게, 더 합리적으로\n일할 수 있도록 —",
      emphasisStrong: "워크업이 존재합니다.",
    },
    {
      id: "category", type: "category", visible: true, bg: "beige",
      eyebrow: "Our Category",
      heading: "Work Life Wear",
      lead: "우리는 작업복 브랜드가 아닙니다.",
      tags: ["Workwear", "Dailywear", "Functionalwear"],
      body: "일하는 삶 전체를 함께하는 브랜드.\n현장의 기능과 일상의 스타일을 동시에 담습니다.",
    },
    {
      id: "values", type: "values", visible: true, bg: "white",
      eyebrow: "Core Values",
      heading: "워크업이 지키는 네 가지",
      items: [
        { num: "01", en: "Function", title: "기능성", desc: "현장에서 검증된 설계.\n사무실이 아니라 실제 작업 환경에서 만들어집니다." },
        { num: "02", en: "Durability", title: "내구성", desc: "오래 입을수록 가치 있는 옷.\n한 철 입고 버리는 옷이 아닙니다." },
        { num: "03", en: "Value", title: "합리성", desc: "품질 대비 납득 가능한 가격.\n일하는 사람이 부담 없이 살 수 있어야 합니다." },
        { num: "04", en: "Versatility", title: "범용성", desc: "현장에도, 퇴근 후에도.\n옷을 갈아입을 시간이 없어도 됩니다." },
      ],
    },
    {
      id: "founding", type: "founding", visible: true, bg: "beige",
      eyebrow: "Founding Story",
      heading: "왜 작업복인가",
      paragraphs: [
        "워크업은 하나의 질문에서 시작했습니다.",
        "기능이 좋으면 비싸고, 가격이 싸면 금방 망가지고, 디자인이 좋으면 현장에서 쓸 수 없었습니다.",
        "워크업은 그 셋을 같이 잡기로 했습니다. 현장에서 쓸 수 있고, 퇴근 후에도 입을 수 있고, 지갑이 부담스럽지 않은 옷.",
      ],
      emphasis: "\"왜 일하는 사람은 좋은 옷을 포기해야 할까?\"",
      closing: "일하는 사람 편에서 만든 옷,\n그게 워크업입니다.",
      image_url: undefined,
      imageSide: "right",
    },
    {
      id: "cta", type: "cta", visible: true, bg: "white",
      eyebrow: "Experience WORKUP",
      heading: "워크업을 직접 경험하세요.",
      body: "화면으로는 전할 수 없는 것들이 있습니다.\n가까운 매장에서 직접 확인해 보세요.",
      ctaLabel: "가까운 매장 찾기 →",
      ctaHref: "/store",
    },
  ],
};
