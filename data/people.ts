// MATE(/people) 페이지 인물 데이터
// 관리자가 site_settings("people_page")에서 수정. 미설정 시 아래 DEFAULT_PEOPLE을 사용.

export type PersonProduct = { name: string; href: string; image_url?: string };
export type PersonQnA = { q: string; a: string };
export type PersonInstagram = {
  handle: string;       // 예: "@ko_car_in" (@ 포함)
  description: string;  // 소개 문구
  link: string;         // 인스타그램 프로필 링크
  reels: string[];      // 릴스 썸네일/영상 URL (최대 3개 노출) — embed 없을 때만 사용
  photos: string[];     // 사진 그리드 URL (최대 6개 노출) — embed 없을 때만 사용
  embed?: string;       // 외부 위젯 임베드 코드(iframe/script). 있으면 실시간 피드로 대체
};

export type Person = {
  id: string;
  job: string;        // 직종 (배지·서브텍스트)
  years: string;       // 경력 (서브텍스트)
  quote: string;       // 히어로 헤드라인 (예: "처음엔 누구나 서툽니다. 한 달만 버텨보세요.")
  image_url?: string;  // 히어로 배경 사진
  workMoments: {
    photos: string[];  // 현장 순간 사진들
    video?: string;    // 현장 영상 (선택, 재생 카드로 표시)
  };
  qna: PersonQnA[];    // 인터뷰 질문·답변
  products: PersonProduct[]; // WEAR THIS — 착용 제품
  instagram?: PersonInstagram;
};

// MATE 인터뷰 표준 질문 6문항 — 인물 편집 시 질문이 비어 있으면 이 목록으로 자동 채운다.
export const MATE_INTERVIEW_QUESTIONS: string[] = [
  "지금 어떤 일을 하고 계세요?",
  "처음 이 일을 시작하게 된 계기가 있으셨나요?",
  "하루 중 가장 '나 일하고 있다' 싶은 순간은 언제예요?",
  "이 일을 하면서 가장 중요하게 생각하는 것은 무엇인가요?",
  "같은 일을 시작하는 후배에게 딱 한마디 해주신다면?",
  "이번에 착용한 워크업 제품은 실제 현장에서 어떠셨나요?",
];

export const DEFAULT_PEOPLE: Person[] = [
  {
    id: "1",
    job: "내장목수",
    years: "경력 1년",
    quote: "처음엔 누구나 서툽니다.\n한 달만 버텨보세요.",
    image_url: "",
    workMoments: {
      photos: [],
      video: "",
    },
    qna: MATE_INTERVIEW_QUESTIONS.map((q) => ({ q, a: "" })),
    products: [
      { name: "스트레치 카고 팬츠", href: "/products" },
      { name: "에어쿨링 팬베스트", href: "/products" },
      { name: "쿨 터치 반팔 티셔츠", href: "/products" },
    ],
    instagram: {
      handle: "@ko_car_in",
      description: "현장의 기록을\n인스타그램에서\n더 확인해보세요.",
      link: "https://www.instagram.com/ko_car_in",
      reels: [],
      photos: [],
    },
  },
];

// NOTE: 블로그형 MATE 페이지는 글이 쌓이기 전까지 한 편만 노출한다.
// 관리자가 site_settings("people_page")에 글을 추가하면 자동으로 목록/이전·다음이 활성화된다.

// 이전 레이아웃(story/theme/bg/initial 기반)으로 저장된 DB 데이터를 새 구조로 안전하게 보정.
// 필드가 없거나 타입이 어긋나도 페이지가 죽지 않도록 항상 기본값을 채워 반환한다.
export function normalizePerson(raw: unknown, fallbackId: string): Person {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, any>;
  const wm = (r.workMoments && typeof r.workMoments === "object" ? r.workMoments : {}) as Record<string, any>;
  const ig = r.instagram && typeof r.instagram === "object" ? (r.instagram as Record<string, any>) : null;

  return {
    id: typeof r.id === "string" && r.id ? r.id : fallbackId,
    job: typeof r.job === "string" ? r.job : "",
    years: typeof r.years === "string" ? r.years : "",
    quote: typeof r.quote === "string" ? r.quote : "",
    image_url: typeof r.image_url === "string" ? r.image_url : "",
    workMoments: {
      photos: Array.isArray(wm.photos) ? wm.photos.filter((p: unknown) => typeof p === "string") : [],
      video: typeof wm.video === "string" ? wm.video : "",
    },
    qna: Array.isArray(r.qna)
      ? r.qna.map((qa: any) => ({ q: typeof qa?.q === "string" ? qa.q : "", a: typeof qa?.a === "string" ? qa.a : "" }))
      : [],
    products: Array.isArray(r.products)
      ? r.products.map((p: any) => ({
          name: typeof p?.name === "string" ? p.name : "",
          href: typeof p?.href === "string" ? p.href : "/products",
          image_url: typeof p?.image_url === "string" ? p.image_url : undefined,
        }))
      : [],
    instagram: ig
      ? {
          handle: typeof ig.handle === "string" ? ig.handle : "",
          description: typeof ig.description === "string" ? ig.description : "",
          link: typeof ig.link === "string" ? ig.link : "",
          reels: Array.isArray(ig.reels) ? ig.reels.filter((p: unknown) => typeof p === "string") : [],
          photos: Array.isArray(ig.photos) ? ig.photos.filter((p: unknown) => typeof p === "string") : [],
          embed: typeof ig.embed === "string" ? ig.embed : "",
        }
      : undefined,
  };
}

export function normalizePeople(list: unknown): Person[] {
  if (!Array.isArray(list)) return [];
  return list.map((p, i) => normalizePerson(p, typeof (p as any)?.id === "string" ? (p as any).id : `p-${i}`));
}
