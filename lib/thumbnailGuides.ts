// 메인 썸네일 크롭 가이드 (분류별)

export type ProductType = "상의" | "하의" | "세트" | "신발" | "소품";

export interface CropGuide {
  targetSize: number;
  top: number;
  width: number;
  left: number;
  right: number;
  bottom: number;
  tuckInMode?: "tuck-in" | "un-tuck"; // 하의용
}

export const CROP_GUIDES: Record<ProductType, CropGuide | { tuckIn: CropGuide; unTuck: CropGuide }> = {
  상의: {
    targetSize: 1600,
    top: 0.23,      // HEAD&NECK 23%
    width: 0.48,    // 중앙 48%
    left: 0.25,     // 좌측 25%
    right: 0.27,    // 우측 27%
    bottom: 0.18    // 하단 18%
  },
  세트: {
    targetSize: 1600,
    top: 0.03,      // 상단 3%
    width: 0.35,    // 중앙 35%
    left: 0.33,     // 좌측 33%
    right: 0.32,    // 우측 32%
    bottom: 0.02    // 하단 2%
  },
  하의: {
    tuckIn: {
      targetSize: 1600,
      top: 0.08,      // TUCK-IN 상단 8%
      width: 0.89,    // 중앙 89%
      left: 0.28,     // 좌측 28%
      right: 0.27,    // 우측 27%
      bottom: 0.03    // 하단 3%
    },
    unTuck: {
      targetSize: 1600,
      top: 0.28,      // UN-TUCK 상단 8% + 20% = 28%
      width: 0.77,    // 중앙 77% (좁혀짐)
      left: 0.28,     // 좌측 28% (동일)
      right: 0.27,    // 우측 27% (동일)
      bottom: 0.03    // 하단 3% (동일)
    }
  },
  신발: {
    targetSize: 1600,
    top: 0.21,      // 상단 21%
    width: 1.00,    // 중앙 100% (전체 너비)
    left: 0.00,     // 좌측 0%
    right: 0.00,    // 우측 0%
    bottom: 0.23    // 하단 23%
  },
  소품: {
    targetSize: 1600,
    top: 0.21,      // 상단 21% (신발과 동일)
    width: 1.00,    // 중앙 100% (신발과 동일)
    left: 0.00,     // 좌측 0% (신발과 동일)
    right: 0.00,    // 우측 0% (신발과 동일)
    bottom: 0.23    // 하단 23% (신발과 동일)
  }
};

// 분류 감지: subCategory → ProductType
export function detectProductType(subCategory?: string): ProductType {
  if (!subCategory) return "상의";

  const lowerCat = subCategory.toLowerCase();

  // 하의 분류
  if (lowerCat.includes("하의") || lowerCat.includes("팬츠")) return "하의";

  // 신발 분류
  if (lowerCat.includes("신발") || lowerCat.includes("shoes")) return "신발";

  // 세트/상하 분류
  if (lowerCat.includes("세트") || lowerCat.includes("set") || lowerCat.includes("상하")) return "세트";

  // 소품 분류
  if (
    lowerCat.includes("가방") ||
    lowerCat.includes("모자") ||
    lowerCat.includes("장갑") ||
    lowerCat.includes("양말") ||
    lowerCat.includes("벨트") ||
    lowerCat.includes("기타") ||
    lowerCat.includes("accessory")
  ) {
    return "소품";
  }

  // 기본값: 상의
  return "상의";
}

// 가이드 조회 (하의는 tuckInMode 파라미터 필수)
export function getGuide(productType: ProductType, tuckInMode?: "tuck-in" | "un-tuck"): CropGuide {
  const guide = CROP_GUIDES[productType];

  if (productType === "하의" && "tuckIn" in guide) {
    const mode = tuckInMode || "tuck-in";
    const key = mode === "tuck-in" ? "tuckIn" : "unTuck";
    return guide[key];
  }

  return guide as CropGuide;
}
