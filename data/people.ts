// MATE(/people) 페이지 인물 데이터
// 관리자가 site_settings("people_page")에서 수정. 미설정 시 아래 DEFAULT_PEOPLE을 사용.

export type PersonProduct = { name: string; href: string; image_url?: string };
export type PersonQnA = { q: string; a: string };
export type PersonInstagram = {
  handle: string;       // 예: "@ko_car_in" (@ 포함)
  description: string;  // 소개 문구
  link: string;         // 인스타그램 프로필 링크
  reels: string[];      // 릴스 썸네일/영상 URL (최대 3개 노출)
  photos: string[];     // 사진 그리드 URL (최대 6개 노출)
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
    qna: [
      { q: "지금 어떤 일을 하고 계세요?", a: "" },
      { q: "처음 이 일을 시작하게 된 계기가 있으셨나요?", a: "" },
      { q: "하루 중 가장 '나 일하고 있다' 싶은 순간은 언제예요?", a: "" },
      { q: "이 일을 하면서 가장 중요하게 생각하는 것은 무엇인가요?", a: "" },
      { q: "같은 일을 시작하는 후배에게 딱 한마디 해주신다면?", a: "" },
      { q: "이번에 착용한 워크업 제품은 실제 현장에서 어떠셨나요?", a: "" },
    ],
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
