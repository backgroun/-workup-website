import fs from "fs";
import path from "path";

export type ArrivalStatus = "입고완료" | "입고예정" | "입고지연" | "일정미정" | "대기" | "일정미표기";

export interface ChangeHistoryEntry {
  changedAt: string;   // ISO datetime
  previousDate: string;
  newDate: string;
  reason: string;
}

export interface ArrivalProduct {
  productCode: string;
  productName: string;
  brand: string;
  category: string;
  productType?: string;    // 상품구분 (사입/직수입 등)
  newArrivalType?: string; // 신상구분 (재진행/신상 등)
  color: string;
  supplyPrice?: number; // 공급가
  price: number;        // 판매가
  quantity?: number;    // 발주 수량
  arrivalDate: string; // "YYYY-MM-DD"
  status: ArrivalStatus;
  description: string;
  note: string;
  image: string | null;
  detailUrl: string | null;
  changeHistory?: ChangeHistoryEntry[];
  marketingUsage?: string; // 마케팅 활용여부 (구글 시트 AD열)
}

export interface ArrivalOverride {
  arrivalDate?: string;
  status?: ArrivalStatus;
  image?: string | null;
  detailUrl?: string | null;
  changeHistory?: ChangeHistoryEntry[];
}

const BASE_JSON = path.join(process.cwd(), "public/data/arrival-products.json");
const OVERRIDES_JSON = path.join(process.cwd(), "data/arrival-overrides.json");

function readBase(): ArrivalProduct[] {
  try {
    const raw = fs.readFileSync(BASE_JSON, "utf-8").replace(/^﻿/, "");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeBase(products: ArrivalProduct[]): void {
  const utf8NoBom = Buffer.from(JSON.stringify(products, null, 2), "utf-8");
  fs.writeFileSync(BASE_JSON, utf8NoBom);
}

function readOverrides(): Record<string, ArrivalOverride> {
  try {
    const raw = fs.readFileSync(OVERRIDES_JSON, "utf-8").replace(/^﻿/, "");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeOverrides(overrides: Record<string, ArrivalOverride>): void {
  const utf8NoBom = Buffer.from(JSON.stringify(overrides, null, 2), "utf-8");
  fs.writeFileSync(OVERRIDES_JSON, utf8NoBom);
}

export function getArrivalProducts(): ArrivalProduct[] {
  const base = readBase();
  const overrides = readOverrides();
  return base.map((p) => {
    // 복합키(productCode::arrivalDate) 우선 → 없으면 productCode 단독키로 fallback
    const compoundKey = p.arrivalDate ? `${p.productCode}::${p.arrivalDate}` : null;
    const ov = (compoundKey && overrides[compoundKey]) || overrides[p.productCode];
    return ov ? { ...p, ...ov } : p;
  });
}

export function saveArrivalOverride(
  productCode: string,
  data: ArrivalOverride,
  reason?: string,
  originalDate?: string,  // 원래 입고일 — 복합키 생성에 사용
  clearHistory?: boolean   // 변경이력 초기화
): void {
  const overrides = readOverrides();
  // 복합키: 같은 productCode지만 입고일이 다른 항목을 독립적으로 관리
  const key = originalDate ? `${productCode}::${originalDate}` : productCode;
  const prev = overrides[key] ?? overrides[productCode] ?? {};

  let changeHistory: ChangeHistoryEntry[] = clearHistory ? [] : (prev.changeHistory ?? []);
  if (
    !clearHistory &&
    reason !== undefined &&
    data.arrivalDate !== undefined &&
    data.arrivalDate !== prev.arrivalDate
  ) {
    const base = readBase();
    const baseProduct = base.find((p) => p.productCode === productCode);
    const previousDate = prev.arrivalDate ?? baseProduct?.arrivalDate ?? "";

    changeHistory = [
      ...changeHistory,
      {
        changedAt: new Date().toISOString(),
        previousDate,
        newDate: data.arrivalDate,
        reason: reason || "사유 없음",
      },
    ];
  }

  overrides[key] = {
    ...prev,
    ...data,
    changeHistory,
  };
  writeOverrides(overrides);
}

export function bulkSaveArrivalOverride(
  productCodes: string[],
  data: ArrivalOverride,
  reason?: string
): void {
  const overrides = readOverrides();
  const base = readBase();

  for (const code of productCodes) {
    const prev = overrides[code] ?? {};
    let changeHistory = prev.changeHistory ?? [];

    if (
      reason !== undefined &&
      data.arrivalDate !== undefined &&
      data.arrivalDate !== prev.arrivalDate
    ) {
      const baseProduct = base.find((p) => p.productCode === code);
      const previousDate = prev.arrivalDate ?? baseProduct?.arrivalDate ?? "";
      changeHistory = [
        ...changeHistory,
        {
          changedAt: new Date().toISOString(),
          previousDate,
          newDate: data.arrivalDate,
          reason: reason || "사유 없음",
        },
      ];
    }

    overrides[code] = { ...prev, ...data, changeHistory };
  }
  writeOverrides(overrides);
}

export function addNewProduct(product: ArrivalProduct): void {
  const products = readBase();
  if (products.find((p) => p.productCode === product.productCode)) {
    throw new Error(`상품코드 ${product.productCode}는 이미 존재합니다.`);
  }
  products.push(product);
  writeBase(products);
}

// 오늘 입고일인 상품 중 입고예정 상태인 것을 자동으로 입고완료 처리
export function autoCompleteArrivals(): string[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const base = readBase();
  const overrides = readOverrides();
  const updated: string[] = [];

  for (const p of base) {
    const ov = overrides[p.productCode] ?? {};
    const effectiveDate   = (ov.arrivalDate   ?? p.arrivalDate)?.trim();
    const effectiveStatus = (ov.status        ?? p.status);
    if (effectiveDate <= todayStr && effectiveStatus === "입고예정") {
      overrides[p.productCode] = { ...ov, status: "입고완료" };
      updated.push(p.productCode);
    }
  }

  if (updated.length > 0) writeOverrides(overrides);
  return updated;
}

export function addMultipleProducts(
  newProducts: ArrivalProduct[]
): { added: number; skipped: string[] } {
  const existing = readBase();
  const existingCodes = new Set(existing.map((p) => p.productCode));
  const skipped: string[] = [];
  const toAdd: ArrivalProduct[] = [];

  for (const p of newProducts) {
    if (existingCodes.has(p.productCode)) {
      skipped.push(p.productCode);
    } else {
      toAdd.push(p);
    }
  }

  if (toAdd.length > 0) {
    writeBase([...existing, ...toAdd]);
  }

  return { added: toAdd.length, skipped };
}
