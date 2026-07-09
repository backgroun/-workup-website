// ─────────────────────────────────────────────────────────────
// data/story.ts — /story 페이지 구조 타입 + DEFAULT_STORY + 팩토리
// 관리자(/admin/main/story)는 site_settings("story_page").config(= StoryConfig)를 편집한다.
// 공개 페이지는 row가 없으면 DEFAULT_STORY로 폴백한다. (data/people.ts 와 동일 패턴)
// ─────────────────────────────────────────────────────────────
import type { IconKey } from "@/components/story-edit/StoryIcons";

export type SectionBg = "white" | "beige"; // white = bg-white, beige = bg-[#f2f1ed]
// 네이비 섹션 배경은 의도적으로 제외(본문 대비 문제 + 현재 페이지도 섹션엔 안 씀). 히어로 기본색으로만 사용.

export type StorySectionType =
  | "declaration" | "category" | "values" | "founding" | "cta" | "richtext" | "photos"
  | "problem" | "features3" | "storeCta";

// 요소별(텍스트) 개별 서식 — 선택한 한 요소에만 적용되는 오버라이드. 비우면 기본(테마) 사용.
export type TextAlign = "left" | "center" | "right";
export type TextFx = {
  size?: number;    // px (설정 시 기본 크기 대체)
  color?: string;   // 글자색
  align?: TextAlign;
  weight?: number;  // 400 | 700
};

export type SectionBase = {
  id: string;
  type: StorySectionType;
  visible: boolean;
  bg: SectionBg;
  fx?: Record<string, TextFx>; // 필드명 → 개별 서식 (예: "heading", "lead")
};

export type DeclarationSection = SectionBase & {
  type: "declaration";
  eyebrow: string;
  heading: string;        // 줄바꿈 \n (whitespace-pre-line)
  lead: string;
  emphasis: string;       // 줄바꿈 \n
  emphasisStrong: string; // 마지막 굵은 문구
  image_url?: string;     // 우측 대형 이미지(비우면 네이비 플레이스홀더)
};

export type CategorySection = SectionBase & {
  type: "category";
  eyebrow: string;
  heading: string;
  lead: string;
  tags: string[];         // '+' 로 연결되는 칩
  body: string;           // 줄바꿈 \n
  image_url?: string;     // 좌측 대형 이미지(비우면 네이비 플레이스홀더)
};

export type ValueItem = { num: string; en: string; title: string; desc: string; icon?: IconKey }; // desc 줄바꿈 \n
export type ValuesSection = SectionBase & {
  type: "values";
  eyebrow: string;
  heading: string;
  items: ValueItem[];
  layout: "number" | "icon"; // number = 큰 흐린 숫자(기존), icon = 원형 아이콘 + "01. 제목"
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

// ── 문제제기 (흑백 인물사진 + 짧은 공감 문구) ──
export type ProblemSection = SectionBase & {
  type: "problem";
  eyebrow: string;
  heading: string;        // 줄바꿈 \n
  body: string;           // 줄바꿈 \n — 짧은 문제 나열
  image_url?: string;     // 이미지 없으면 네이비 플레이스홀더, 있으면 흑백 처리
  imageSide: "left" | "right";
};

// ── Work·Life·Wear 3아이콘 특징 ──
// iconImage: 업로드/커스텀 아이콘 이미지 URL. 있으면 프리셋 아이콘(icon) 대신 이 이미지를 사용.
export type FeatureItem = { icon: IconKey; label: string; desc: string; iconImage?: string };
export type Features3Section = SectionBase & {
  type: "features3";
  eyebrow: string;
  heading: string;        // 줄바꿈 \n
  lead: string;
  items: FeatureItem[];   // 보통 3개
};

// ── 매장체험 CTA (사진 콜라주 배경 + 중앙 텍스트/버튼) ──
export type StoreCtaSection = SectionBase & {
  type: "storeCta";
  eyebrow: string;
  heading: string;        // 줄바꿈 \n
  body: string;           // 줄바꿈 \n
  ctaLabel: string;
  ctaHref: string;
  images: PhotoItem[];    // 배경 콜라주(없으면 네이비 플레이스홀더)
};

export type StorySection =
  | DeclarationSection | CategorySection | ValuesSection
  | FoundingSection | CtaSection | RichTextSection | PhotosSection
  | ProblemSection | Features3Section | StoreCtaSection;

export type StoryHero = {
  image_url?: string;     // 설정 시 배경 이미지, 없으면 네이비 + WU 워터마크
  bg: string;             // 기본 "#1A2B4A"
  showWatermark: boolean; // 기본 true
  heading: string;        // 줄바꿈 \n
  sub: string;
  height: number;         // 기본 580 (px)
  fx?: Record<string, TextFx>; // 요소별 개별 서식 ("heading", "sub")
};

// ── 전체 디자인 토큰 (스토리 페이지 공통 스타일) ──
// CSS 변수로 공개 페이지·관리자 미리보기에 주입해 모든 섹션에 일괄 적용한다.
export type StoryImageRatio = "4 / 3" | "3 / 2" | "16 / 9" | "1 / 1" | "4 / 5";
export const STORY_IMAGE_RATIOS: { value: StoryImageRatio; label: string }[] = [
  { value: "16 / 9", label: "16:9 (가장 낮음)" },
  { value: "3 / 2", label: "3:2" },
  { value: "4 / 3", label: "4:3" },
  { value: "1 / 1", label: "1:1 (정사각)" },
  { value: "4 / 5", label: "4:5 (세로 김)" },
];

export type StoryStyle = {
  fontScale: number;           // 폰트 전체 배율 (0.8 ~ 1.4), 기본 1
  lineHeight: number;          // 본문 줄간격 (1.4 ~ 2.2), 기본 1.8
  sectionSpacing: number;      // 섹션 상하 여백 배율 (0.6 ~ 1.6), 기본 1
  imageRatio: StoryImageRatio; // 이미지 비율, 기본 4:3
  imageWidth: number;          // 이미지 영역 너비 % (35 ~ 60), 기본 50
};

export const DEFAULT_STORY_STYLE: StoryStyle = {
  fontScale: 1,
  lineHeight: 1.8,
  sectionSpacing: 1,
  imageRatio: "4 / 3",
  imageWidth: 50,
};

// StoryStyle → CSS 변수 객체(래퍼 style 로 주입). React.CSSProperties 로 캐스팅해 사용.
export function storyStyleVars(s: StoryStyle): Record<string, string> {
  const imgw = Math.max(20, Math.min(70, s.imageWidth));
  return {
    "--st-fs": String(s.fontScale),
    "--st-lh": String(s.lineHeight),
    "--st-sp": String(s.sectionSpacing),
    "--st-ratio": s.imageRatio,
    "--st-imgcol": `${imgw}fr`,
    "--st-textcol": `${100 - imgw}fr`,
  };
}

export type StoryConfig = { hero: StoryHero; sections: StorySection[]; style?: StoryStyle };

// ── 위지윅(WYSIWYG) 편집 API ──
// 공개 컴포넌트(StorySectionView/StoryHeroView)에 optional 로 주입한다.
// 없으면(공개 페이지) 순수 렌더, 있으면(관리자 편집기) 클릭 인라인 편집이 활성화된다.
// 섹션 타입마다 같은 필드명(예: items)이 서로 다른 배열 타입을 가져 교집합 타입이 성립하지 않으므로
// 느슨한 인덱스 시그니처로 정의한다 — patch() 는 항상 "이 섹션에만 있는 필드"를 부분 갱신하는 내부 API.
export type PartialSection = { [field: string]: unknown };
export type SectionEditApi = {
  patch: (p: PartialSection) => void;                 // 이 섹션 필드 갱신
  pickImage: (onPicked: (url: string) => void) => void; // 파일 선택창 → 업로드 → url 반환
  // 요소 선택 → 서식 툴바 대상 지정. computedPx 는 그 요소의 실제 렌더 폰트 크기(override 없을 때 툴바 초기값용).
  activate: (field: string, computedPx?: number) => void;
  activeField?: string; // 현재 이 섹션에서 선택된 필드 키(없으면 선택 없음) — 요소에 선택 표시(테두리)용
};
export type HeroEditApi = {
  patch: (p: Partial<StoryHero>) => void;
  pickImage: (onPicked: (url: string) => void) => void;
  activate: (field: string, computedPx?: number) => void;
  activeField?: string;
};

// 한글 타입 라벨 (관리자 목록/팔레트용)
export const SECTION_TYPE_LABEL: Record<StorySectionType, string> = {
  declaration: "선언문",
  category: "카테고리",
  values: "핵심가치",
  founding: "창업스토리",
  cta: "CTA",
  richtext: "자유텍스트",
  photos: "사진갤러리",
  problem: "문제제기",
  features3: "특징 3아이콘",
  storeCta: "매장체험 CTA",
};

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// 새 섹션 기본값 (관리자 "섹션 추가")
export function emptySection(type: StorySectionType): StorySection {
  const base = { id: uid(), visible: true, bg: "white" as SectionBg };
  switch (type) {
    case "declaration":
      return { ...base, type, eyebrow: "", heading: "", lead: "", emphasis: "", emphasisStrong: "", image_url: undefined };
    case "category":
      return { ...base, type, eyebrow: "", heading: "", lead: "", tags: [""], body: "", image_url: undefined };
    case "values":
      return { ...base, type, eyebrow: "", heading: "", layout: "number", items: [{ num: "01", en: "", title: "", desc: "" }] };
    case "founding":
      return { ...base, type, eyebrow: "", heading: "", paragraphs: [""], emphasis: "", closing: "", image_url: undefined, imageSide: "right" };
    case "cta":
      return { ...base, type, eyebrow: "", heading: "", body: "", ctaLabel: "가까운 매장 찾기 →", ctaHref: "/store" };
    case "richtext":
      return { ...base, type, eyebrow: "", heading: "", body: "" };
    case "photos":
      return { ...base, type, columns: 3, images: [{ url: undefined, alt: "" }, { url: undefined, alt: "" }, { url: undefined, alt: "" }] };
    case "problem":
      return { ...base, type, eyebrow: "THE PROBLEM", heading: "", body: "", image_url: undefined, imageSide: "left" };
    case "features3":
      return {
        ...base, type, eyebrow: "WORK LIFE WEAR", heading: "", lead: "",
        items: [
          { icon: "hardhat", label: "WORK", desc: "" },
          { icon: "clock", label: "LIFE", desc: "" },
          { icon: "hanger", label: "WEAR", desc: "" },
        ],
      };
    case "storeCta":
      return {
        ...base, type, bg: "beige", eyebrow: "STORE EXPERIENCE", heading: "", body: "",
        ctaLabel: "가까운 매장 찾기 →", ctaHref: "/store", images: [],
      };
  }
}

// 사용자 제공 참고 레이아웃(히어로 → 선언문 → 문제제기 → 3아이콘 → 핵심가치(아이콘형) → 창업스토리 → 매장체험 CTA)을
// 기본값으로 삼는다. \n 은 whitespace-pre-line 줄바꿈.
export const DEFAULT_STORY: StoryConfig = {
  hero: {
    image_url: "/images/story-hero.jpg",
    bg: "#1A2B4A",
    showWatermark: false,
    heading: "일하는 사람 편에서\n만든 브랜드",
    sub: "워크업은 현장에서 시작해 일상까지 이어지는 Work Life Wear 브랜드입니다.",
    height: 640,
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
      id: "features3", type: "features3", visible: true, bg: "beige",
      eyebrow: "WORK LIFE WEAR",
      heading: "일할 때는 작업복처럼.\n일상에서는 평상복처럼.",
      lead: "현장의 기능과 일상의 스타일을 함께 담아\n어떤 순간에도 자연스럽게 어울리는 옷을 만듭니다.",
      items: [
        { icon: "hardhat", iconImage: "/images/wlw01.png", label: "WORK", desc: "현장에서 버티는 기능" },
        { icon: "clock", iconImage: "/images/wlw02.png", label: "LIFE", desc: "퇴근 후에도 자연스러운 스타일" },
        { icon: "hanger", iconImage: "/images/wlw03.png", label: "WEAR", desc: "오래 입을 수 있는 품질" },
      ],
    },
    {
      id: "values", type: "values", visible: true, bg: "white",
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
  // 참고 UI의 조밀한 에디토리얼 비율에 맞춘 기본값: 이미지 가로형(3:2)·폭 축소(42%)·여백 소폭 축소(0.85).
  style: { fontScale: 1, lineHeight: 1.75, sectionSpacing: 0.85, imageRatio: "3 / 2", imageWidth: 42 },
};
