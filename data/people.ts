// MATE(/people) 페이지 인물 데이터
// 관리자가 site_settings("people_page")에서 수정. 미설정 시 아래 DEFAULT_PEOPLE을 사용.

export type PersonProduct = { name: string; href: string };

export type Person = {
  id: string;
  job: string;        // 직종 (배지)
  years: string;      // 경력
  quote: string;      // 핵심 인용구
  story: string[];    // 이야기 문단
  theme: string;      // 중요하게 여기는 것
  products: PersonProduct[];
  bg: string;         // 사진 영역 배경색 (hex, 이미지 없을 때 표시)
  initial: string;    // 아바타 글자 (이미지 없을 때 표시)
  image_url?: string; // 인물 사진 (등록 시 아바타 대신 표시)
};

export const DEFAULT_PEOPLE: Person[] = [
  {
    id: "1",
    job: "건설 현장직",
    years: "경력 15년",
    quote: "현장에서 옷이 불편하면 사고 납니다.",
    story: [
      "15년 동안 현장을 다녔습니다. 그동안 옷 때문에 불편했던 적이 한두 번이 아니에요.",
      "좁은 공간에서 몸을 구부릴 때, 사다리를 오를 때 — 옷이 당기면 순간적으로 균형을 잃습니다.",
      "좋은 작업복은 단순히 편한 게 아닙니다. 안전입니다.",
    ],
    theme: "안전과 움직임",
    products: [
      { name: "스트레치 카고 팬츠", href: "/products" },
      { name: "경량 방풍 자켓", href: "/products" },
    ],
    bg: "#1A2B4A",
    initial: "건",
  },
];

// NOTE: 블로그형 MATE 페이지는 글이 쌓이기 전까지 한 편만 노출한다.
// 관리자가 site_settings("people_page")에 글을 추가하면 자동으로 목록/이전·다음이 활성화된다.
// (과거 샘플 9명은 git 히스토리에 남아 있으니 필요 시 복원 가능)
