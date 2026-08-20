export type BrandEntry = {
  index: string;
  id: string;
  name: string;
  positioning: string;
  descriptionKo: string;
  description: string;
  href: string;
  accentColor: string;
  imageBg: string;
};

export const BRANDS: BrandEntry[] = [
  {
    index: "01",
    id: "kenta",
    name: "KENTA",
    positioning: "EVERYDAY BASIC",
    descriptionKo: "매일 입는 데일리 베이직",
    description: "일과 일상 어디에서든 자연스럽게 어울리는 베이직웨어",
    href: "/brands/kenta",
    accentColor: "#E5541B",
    imageBg:
      "radial-gradient(ellipse at 40% 30%, #ede7dc 0%, #d9d2c6 45%, #c5beb2 75%, #b5ada1 100%)",
  },
  {
    index: "02",
    id: "dewalt",
    name: "DEWALT",
    positioning: "PERFORMANCE WORKWEAR",
    descriptionKo: "현장에서 증명된 퍼포먼스",
    description: "강한 퍼포먼스와 내구성을 갖춘 워크웨어",
    href: "/brands/dewalt",
    accentColor: "#FFCD11",
    imageBg:
      "radial-gradient(ellipse at 45% 35%, #241d0c 0%, #140e04 50%, #0c0a04 75%, #1a1408 100%)",
  },
  {
    index: "03",
    id: "volcom",
    name: "VOLCOM",
    positioning: "WORKWEAR & STREET",
    descriptionKo: "스트리트 감성을 담은 워크웨어",
    description: "자유로운 움직임과 스타일을 모두 만족시키는 워크웨어",
    href: "/brands/volcom",
    accentColor: "#E8E8E8",
    imageBg:
      "radial-gradient(ellipse at 50% 30%, #272727 0%, #131313 55%, #1c1c1c 100%)",
  },
  {
    index: "04",
    id: "grbd",
    name: "GRBD",
    positioning: "SAFETY WORKWEAR",
    descriptionKo: "안전을 최우선으로 생각하는 워크웨어",
    description: "높은 시인성과 보호 기능을 갖춘 현장 중심 워크웨어",
    href: "/brands/grbd",
    accentColor: "#4aab4a",
    imageBg:
      "radial-gradient(ellipse at 40% 30%, #162818 0%, #0a140a 55%, #0f1d10 100%)",
  },
  {
    index: "05",
    id: "denver",
    name: "DENVER",
    positioning: "PERFORMANCE OUTDOOR",
    descriptionKo: "어떤 환경에서도 최상의 퍼포먼스",
    description: "워크와 아웃도어를 연결하는 퍼포먼스웨어",
    href: "/brands/denver",
    accentColor: "#4a8fd4",
    imageBg:
      "radial-gradient(ellipse at 40% 25%, #163050 0%, #0a1828 55%, #0e1f38 100%)",
  },
  {
    index: "06",
    id: "detroit",
    name: "DETRO.IT",
    positioning: "EUROPEAN WORKWEAR",
    descriptionKo: "유러피안 감성의 워크웨어",
    description: "유럽 워크웨어의 디자인과 실용성을 담은 브랜드",
    href: "/brands/detroit",
    accentColor: "#9e9ea8",
    imageBg:
      "radial-gradient(ellipse at 45% 32%, #222228 0%, #111116 55%, #18181e 100%)",
  },
  {
    index: "07",
    id: "maddog",
    name: "MAD DOG",
    positioning: "DURABLE WORKWEAR",
    descriptionKo: "강한 내구성의 실용 워크웨어",
    description: "거친 환경에서도 오래 입을 수 있는 실용적인 워크웨어",
    href: "/brands/maddog",
    accentColor: "#8b3a22",
    imageBg:
      "radial-gradient(ellipse at 42% 30%, #201008 0%, #0f0804 55%, #180c08 100%)",
  },
];
