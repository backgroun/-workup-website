"use client";
import { useState, useRef, useEffect, Fragment } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import type { Product } from "@/data/products";
import { mainCategories as staticMainCategories, subCategoriesByMain as staticSubByMain } from "@/data/products";

// 카테고리 분류 구조 (관리자 DB 설정과 동일한 형태)
type CatItem = { name: string; subs: string[] };
const STATIC_CATS: CatItem[] = staticMainCategories.map((name) => ({ name, subs: staticSubByMain[name] ?? [] }));

// ── 컬럼 정의 ────────────────────────────────────────────────────────────────
const COLUMNS = [
  { key: "name",          label: "상품명",         required: true },
  { key: "sku",           label: "상품코드",        required: true },
  { key: "sizes",         label: "사이즈(;구분)",   required: false },
  { key: "colors",        label: "색상(;구분)",     required: false },
  { key: "brand",         label: "브랜드",          required: true },
  { key: "category",      label: "대카테고리",       required: true },
  { key: "subCategory",   label: "중카테고리",       required: true },
  { key: "manufacturer",  label: "제조사",          required: false },
  { key: "origin",        label: "원산지",          required: false },
  { key: "price",         label: "판매가",          required: false },
  { key: "consumerPrice", label: "소비자가",        required: false },
  { key: "supplyPrice",   label: "공급가",          required: false },
  { key: "status",        label: "판매상태",        required: false },
];

// 색상명 → hex (제품 폼 프리셋과 동일). 미지정 색은 기본 네이비.
const COLOR_HEX: Record<string, string> = {
  "블랙": "#1C1C1C", "화이트": "#F0F0F0", "네이비": "#303236",
  "그레이": "#7A7A7A", "베이지": "#C9B99A", "카키": "#4A5240",
};
const COLOR_PRESET_NAMES = Object.keys(COLOR_HEX);
function parseColors(val: unknown): { name: string; hex: string }[] {
  return String(val ?? "").split(";").map((s) => s.trim()).filter(Boolean)
    .map((name) => ({ name, hex: COLOR_HEX[name] ?? "#303236" }));
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^\w\s가-힣]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[가-힣]/g, (c) => c.charCodeAt(0).toString(16));
}

function toArr(val: unknown): string[] {
  if (!val) return [];
  return String(val).split(";").map((s) => s.trim()).filter(Boolean);
}

// 가격 콤마 자동 포맷 — 숫자만 추출 후 천단위 콤마 + "원"
function fmtComma(v: string): string {
  const d = String(v).replace(/[^\d]/g, "");
  return d ? Number(d).toLocaleString("ko-KR") + "원" : "";
}

// 필수값 검증 — 상품명·상품코드·브랜드·대/중카테고리. 하나라도 비면 가져오기 차단.
// 사이즈·색상·판매가는 선택 입력 — 비어 있어도 등록 후 관리자 화면에서 채울 수 있다.
function computeError(r: {
  name?: string; sku?: string; brand?: string; price?: string; category?: string; subCategory?: string;
  sizes?: string[]; colors?: { name: string }[];
}): string | undefined {
  const miss: string[] = [];
  if (!r.name?.trim()) miss.push("상품명");
  if (!r.sku?.trim()) miss.push("상품코드");
  if (!r.brand?.trim()) miss.push("브랜드");
  if (!r.category?.trim()) miss.push("대카테고리");
  if (!r.subCategory?.trim()) miss.push("중카테고리");
  return miss.length ? `필수 미입력: ${miss.join(", ")}` : undefined;
}

// "리뉴얼"/"신상"(신상품)이 붙은 이름은 기존 제품의 오타·재업로드가 아니라 의도적인 별개 신제품 —
// 유사 상품명 감지에서 제외해 확인 절차 없이 바로 등록되게 한다.
const RENEWAL_TAGS = ["리뉴얼", "신상품", "신상"];
function hasRenewalTag(name: string | undefined): boolean {
  return RENEWAL_TAGS.some((t) => name?.includes(t));
}

// 두 문자열 사이 편집거리(Levenshtein) — 오타 등으로 인한 "유사 상품명" 감지에 사용
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[] = Array(n + 1).fill(0).map((_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = tmp;
    }
  }
  return dp[n];
}

// 상품코드 중복 검사 — ①업로드 파일 내 중복 ②기존 등록 상품과 중복(같은 상품 수정은 제외)을 합쳐 각 행의 오류 메시지를 다시 계산
// + 상품명이 같아 내부 상품id(슬러그)가 겹치는 행도 함께 검사 — 같은 id가 한 배치에 두 번 있으면 DB upsert가 실패한다.
// + 이미 등록된 상품과 id(슬러그)가 완전히 같으면 절대 덮어쓰지 않도록 오류로 막고,
//   완전히 같진 않지만 이름이 아주 비슷한 경우("애매한 것")는 확인 전까지 등록을 보류시킨다.
function withErrors<T extends { id: string; name?: string; sku?: string; _error?: string }>(
  rows: T[],
  existingSkuMap: Record<string, string>,
  existingNameMap: Record<string, string>, // id -> 상품명
): (T & { _similarTo?: string })[] {
  // 상품코드가 "0"이면 "코드 없음"으로 취급 — 중복 집계·검사에서 제외
  const skuCounts = new Map<string, number>();
  const idCounts = new Map<string, number>();
  rows.forEach((r) => {
    const sku = (r.sku ?? "").trim();
    if (sku && sku !== "0") skuCounts.set(sku, (skuCounts.get(sku) ?? 0) + 1);
    idCounts.set(r.id, (idCounts.get(r.id) ?? 0) + 1);
  });
  const existingIds = Object.keys(existingNameMap);

  return rows.map((r) => {
    const base = computeError(r);
    const sku = (r.sku ?? "").trim();
    let dup: string | undefined;
    if (sku && sku !== "0") {
      if ((skuCounts.get(sku) ?? 0) > 1) dup = "상품코드 중복(파일 내)";
      else if (existingSkuMap[sku] && existingSkuMap[sku] !== r.id) dup = "상품코드 중복(기존 상품)";
    }
    const nameDup = (idCounts.get(r.id) ?? 0) > 1 ? "상품명 중복(같은 상품으로 인식됨)" : undefined;

    // 이미 등록된 상품과 완전히 같은 이름(id 동일) → 절대 덮어쓰지 않도록 오류로 차단
    let existingDup: string | undefined;
    if (existingNameMap[r.id]) {
      existingDup = `이미 등록된 상품과 이름이 같음(덮어쓰기 방지로 제외됨): "${existingNameMap[r.id]}"`;
    }

    const parts = [base, dup, nameDup, existingDup].filter(Boolean);

    // 완전 일치는 아니지만 이름이 아주 비슷한 기존 상품 탐색("애매한 것") — 확인 전까지 등록 보류
    // 단, "리뉴얼"/"신상" 표기가 붙은 이름은 별개 신제품으로 간주해 이 검사를 건너뛴다.
    let similarTo: string | undefined;
    if (!existingDup && !hasRenewalTag(r.name) && r.id && r.id.length >= 3) {
      for (const eid of existingIds) {
        if (eid === r.id) continue;
        const dist = levenshtein(r.id, eid);
        const closeEnough = dist <= 2 || eid.includes(r.id) || r.id.includes(eid);
        if (closeEnough && Math.abs(eid.length - r.id.length) <= 4) {
          similarTo = existingNameMap[eid];
          break;
        }
      }
    }

    return { ...r, _error: parts.length ? parts.join(" · ") : undefined, _similarTo: similarTo };
  });
}

function parseRow(
  row: Record<string, unknown>,
  idx: number,
  cats: CatItem[],
): Partial<Product> & { id: string; _row: number; _error?: string } {
  const mainNames = cats.map((c) => c.name);
  const subsByMain: Record<string, string[]> = Object.fromEntries(cats.map((c) => [c.name, c.subs]));
  // 카테고리 미입력 시 첫 번째 분류로 기본 배정
  const defaultMain = mainNames[0] ?? "";
  const defaultSub = (subsByMain[defaultMain]?.[0]) ?? "";

  const name = String(row["상품명"] ?? row["name"] ?? "").trim();
  const sku = String(row["상품코드"] ?? row["sku"] ?? "").trim();
  const brand = String(row["브랜드"] ?? row["brand"] ?? "").trim();
  const price = fmtComma(String(row["판매가"] ?? row["price"] ?? ""));
  const consumerPrice = fmtComma(String(row["소비자가"] ?? row["consumerPrice"] ?? ""));
  const supplyPrice = fmtComma(String(row["공급가"] ?? row["supplyPrice"] ?? ""));
  const category = String(row["대카테고리"] ?? row["category"] ?? defaultMain).trim() as Product["category"];
  const subCategory = String(row["중카테고리"] ?? row["subCategory"] ?? defaultSub).trim() as Product["subCategory"];
  const sizes = toArr(row["사이즈(;구분)"] ?? row["sizes"]);
  const colors = parseColors(row["색상(;구분)"] ?? row["colors"]);

  const id = slugify(name) || `product-${Date.now()}-${idx}`;

  return {
    _row: idx + 2,
    _error: computeError({ name, sku, brand, price, category, subCategory, sizes, colors }),
    id,
    name,
    sku: sku || undefined,
    brand: brand || undefined,
    category,
    subCategory,
    manufacturer: String(row["제조사"] ?? row["manufacturer"] ?? "").trim() || undefined,
    origin: String(row["원산지"] ?? row["origin"] ?? "").trim() || undefined,
    price,
    consumerPrice: consumerPrice || undefined,
    supplyPrice: supplyPrice || undefined,
    status: (String(row["판매상태"] ?? row["status"] ?? "판매중").trim() || "판매중") as Product["status"],
    sizes,
    colors,
    line: "SITE",
    jobTypes: [],
    bg: "bg-[#303236]",
  };
}

// exceljs로 스타일 템플릿 생성: 필수열 색상 + 카테고리 드롭다운(선택+입력) + 가격 콤마 서식
async function downloadTemplate(fallbackCats: CatItem[]) {
  // 다운로드 시점에 항상 최신 카테고리를 새로 가져온다(상태 타이밍/캐시로 옛 카테고리가 들어가는 문제 방지)
  let cats = fallbackCats;
  try {
    const d = await fetch("/api/admin/site-settings/categories", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null));
    if (d?.categories && Array.isArray(d.categories) && d.categories.length > 0) cats = d.categories as CatItem[];
  } catch { /* 실패 시 전달받은 값 사용 */ }
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("상품목록");

  // 컬럼 위치(키 기반 — 순서가 바뀌어도 안전)·엑셀 열 문자
  const colNum = (key: string) => COLUMNS.findIndex((c) => c.key === key) + 1; // 1-based
  const colLetter = (n: number) => { let s = ""; let x = n; while (x > 0) { const m = (x - 1) % 26; s = String.fromCharCode(65 + m) + s; x = Math.floor((x - 1) / 26); } return s; };
  const validName = (s: string) => /^[가-힣A-Za-z_][가-힣A-Za-z0-9_]*$/.test(s);

  // 드롭다운 참조용 숨김 시트: A열=대분류, 대분류별 subs는 각 열에 + 이름정의(종속 드롭다운용)
  const opt = wb.addWorksheet("목록");
  const mainList = cats.map((c) => c.name);
  mainList.forEach((m, i) => { opt.getCell(i + 1, 1).value = m; });
  cats.forEach((c, ci) => {
    const col = ci + 2; // B, C, ...
    c.subs.forEach((s, si) => { opt.getCell(si + 1, col).value = s; });
    // 대분류명이 엑셀 이름 규칙에 맞고 subs가 있으면 이름정의 → INDIRECT 종속 드롭다운
    if (validName(c.name) && c.subs.length > 0) {
      const L = colLetter(col);
      try { wb.definedNames.add(`목록!$${L}$1:$${L}$${c.subs.length}`, c.name); } catch { /* 이름 충돌 무시 */ }
    }
  });
  opt.state = "veryHidden";

  const c0 = cats[0];
  const sampleByKey: Record<string, string | number> = {
    name: "스트레치 카고 팬츠", sku: "WU-S001",
    sizes: "S;M;L;XL;2XL", colors: "블랙;화이트;네이비",
    brand: "WORKUP", category: c0?.name ?? "현장", subCategory: c0?.subs[0] ?? "하의",
    manufacturer: "(주)워크업코리아", origin: "대한민국",
    price: 39000, consumerPrice: 45000, supplyPrice: 25000, status: "판매중",
  };
  const totalCols = COLUMNS.length;
  const MAX_ROWS = 1000;

  // 상단 안내 문구 (빨간색, 컬럼 전체 병합)
  const notes = [
    "● 노란색 음영 칸은 필수 입력 항목입니다.",
    "● 가격(판매가·소비자가·공급가)은 숫자만 입력하면 콤마가 자동 적용됩니다.",
    "● 사이즈별로 가격이 다른 경우: 판매가에 기본가를 입력한 뒤, 업로드 후 미리보기에서 '사이즈별가'를 체크해 사이즈마다 수동 입력하세요.",
    "● 대카테고리를 선택하면 중카테고리에는 해당 하위 분류만 표시됩니다.",
  ];
  notes.forEach((text, i) => {
    const r = i + 1;
    ws.mergeCells(r, 1, r, totalCols);
    const cell = ws.getCell(r, 1);
    cell.value = text;
    cell.font = { color: { argb: "FFD6336C" }, bold: i === 0, size: 11 };
    cell.alignment = { vertical: "middle" };
  });

  const HEADER_ROW = notes.length + 2; // 안내문 아래 한 줄 띄우고 헤더
  const FIRST_DATA = HEADER_ROW + 1;
  const LAST_DATA = HEADER_ROW + MAX_ROWS;

  // 헤더 + 샘플
  COLUMNS.forEach((c, i) => { ws.getCell(HEADER_ROW, i + 1).value = c.label; });
  COLUMNS.forEach((c, i) => { ws.getCell(FIRST_DATA, i + 1).value = sampleByKey[c.key] ?? ""; });

  const thin = { style: "thin" as const, color: { argb: "FFCED4DA" } };
  const cellBorder = { top: thin, left: thin, bottom: thin, right: thin };

  COLUMNS.forEach((col, i) => {
    const ci = i + 1;
    ws.getColumn(ci).width = i === 0 ? 24 : 14;
    const h = ws.getCell(HEADER_ROW, ci);
    h.font = { bold: true, color: { argb: "FF303236" } };
    h.alignment = { vertical: "middle", horizontal: "center" };
    h.fill = { type: "pattern", pattern: "solid", fgColor: { argb: col.required ? "FFFFD666" : "FFEDF0F3" } };
    h.border = cellBorder;
    // 데이터 영역 — 입력 칸에 테두리 + 필수 컬럼 음영
    for (let r = FIRST_DATA; r <= LAST_DATA; r++) {
      const dc = ws.getCell(r, ci);
      dc.border = cellBorder;
      if (col.required) dc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF7E0" } };
    }
  });

  // 데이터 유효성: 대카테고리=대분류 목록 / 중카테고리=INDIRECT(대카테고리) 종속 / 가격=콤마
  const daeCol = colNum("category");
  const jungCol = colNum("subCategory");
  const daeL = colLetter(daeCol);
  for (let r = FIRST_DATA; r <= LAST_DATA; r++) {
    ws.getCell(r, daeCol).dataValidation = { type: "list", allowBlank: true, showErrorMessage: false, formulae: [`목록!$A$1:$A$${Math.max(mainList.length, 1)}`] };
    ws.getCell(r, jungCol).dataValidation = { type: "list", allowBlank: true, showErrorMessage: false, formulae: [`INDIRECT($${daeL}${r})`] };
    ws.getCell(r, colNum("price")).numFmt = "#,##0";
    ws.getCell(r, colNum("consumerPrice")).numFmt = "#,##0";
    ws.getCell(r, colNum("supplyPrice")).numFmt = "#,##0";
  }
  ws.getRow(HEADER_ROW).height = 22;
  // 눈금선 제거 + 헤더까지 고정
  ws.views = [{ showGridLines: false, state: "frozen", ySplit: HEADER_ROW }];

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf as ArrayBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "workup_products_template.xlsx";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function nowStamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

// 중복 행 목록을 CSV로 자동 다운로드 — 알림창의 긴 텍스트를 일일이 읽는 대신 엑셀에서 바로 확인·정리하도록.
function downloadDupListCsv(dupRows: { _row: number; name?: string; sku?: string; _error?: string }[]) {
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const header = ["행", "상품명", "상품코드", "오류"].map(esc).join(",");
  const lines = dupRows.map((r) => [r._row, r.name || "(상품명 없음)", r.sku ?? "", r._error ?? ""].map(esc).join(","));
  const csv = String.fromCharCode(0xfeff) + [header, ...lines].join("\r\n"); // BOM — 엑셀에서 한글 깨짐 방지
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `중복상품목록_${nowStamp()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

type ParsedRow = Partial<Product> & { id: string; _row: number; _error?: string; _similarTo?: string };

const TABLE_HEADERS = ["행", "상태", "상품명*", "상품코드*", "사이즈", "색상", "브랜드*", "대분류*", "중분류*", "판매가", "소비자가", "공급가", "사이즈별가", "오류"];

export default function ProductImportPage() {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; count?: number; error?: string } | null>(null);
  const [cats, setCats] = useState<CatItem[]>(STATIC_CATS);
  // 기존 등록 상품의 상품코드(sku, trim) → id — 엑셀 상품코드가 기존 상품과 중복되는지 검사용
  const [existingSkuMap, setExistingSkuMap] = useState<Record<string, string>>({});
  // 기존 등록 상품의 id(상품명 슬러그) → 상품명 — 이름 중복(덮어쓰기 방지)·유사 상품명 감지 기준
  const [existingNameMap, setExistingNameMap] = useState<Record<string, string>>({});
  // "애매한" 유사 상품명 행 중 관리자가 "다른 상품이 맞음"으로 확인한 행 번호
  const [confirmedRows, setConfirmedRows] = useState<Set<number>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  // 카테고리 분류 — 관리자 DB 설정에서 로드 (검증 기준을 최신 분류와 일치시킴)
  useEffect(() => {
    fetch("/api/admin/site-settings/categories")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.categories && Array.isArray(data.categories) && data.categories.length > 0) {
          setCats(data.categories as CatItem[]);
        }
      })
      .catch(() => {});
  }, []);

  // 기존 상품 상품코드·이름(id) 목록 — 중복 검사 기준
  useEffect(() => {
    fetch("/api/admin/products")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: { id: string; name?: string; sku?: string }[]) => {
        if (!Array.isArray(data)) return;
        const skuMap: Record<string, string> = {};
        const nameMap: Record<string, string> = {};
        data.forEach((p) => {
          const sku = (p.sku ?? "").trim();
          if (sku) skuMap[sku] = p.id;
          if (p.id) nameMap[p.id] = p.name ?? p.id;
        });
        setExistingSkuMap(skuMap);
        setExistingNameMap(nameMap);
      })
      .catch(() => {});
  }, []);

  // 기존 상품 목록이 뒤늦게 도착한 경우 대비 — 이미 미리보기 중인 행들도 재검사
  useEffect(() => {
    setRows((prev) => (prev.length ? withErrors(prev, existingSkuMap, existingNameMap) : prev));
  }, [existingSkuMap, existingNameMap]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = new Uint8Array(ev.target!.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      // 시트를 2차원 배열로 읽어 "상품명"이 있는 실제 헤더 행을 찾는다(상단 안내문구 줄을 건너뜀)
      const aoa = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "" });
      const headerIdx = aoa.findIndex((r) => Array.isArray(r) && r.some((c) => String(c).trim() === "상품명"));
      if (headerIdx < 0) {
        alert("헤더(상품명 등)를 찾을 수 없습니다. 템플릿을 다운로드해 그대로 작성·업로드해 주세요.");
        return;
      }
      const headers = (aoa[headerIdx] as unknown[]).map((c) => String(c).trim());
      const dataRows = aoa.slice(headerIdx + 1).filter((r) => Array.isArray(r) && r.some((c) => String(c).trim()));
      const json = dataRows.map((r) => {
        const arr = r as unknown[];
        const obj: Record<string, unknown> = {};
        headers.forEach((h, i) => { if (h) obj[h] = arr[i] ?? ""; });
        return obj;
      });
      const parsed = withErrors(json.map((r, i) => parseRow(r, headerIdx + i, cats)), existingSkuMap, existingNameMap);
      setRows(parsed);
      setConfirmedRows(new Set());

      // 상품코드·상품명 중복 행이 있으면 목록을 CSV 파일로 자동 다운로드해 바로 확인·정리할 수 있게 한다.
      const dupRows = parsed.filter((r) => r._error?.includes("중복"));
      if (dupRows.length > 0) {
        downloadDupListCsv(dupRows);
        alert(`중복된 행이 ${dupRows.length}개 있어 해당 행은 가져올 수 없습니다. 중복 목록을 CSV 파일로 다운로드했습니다.\n\n상품코드 또는 상품명을 수정한 뒤 다시 시도해 주세요.`);
      }
      const similarRows = parsed.filter((r) => r._similarTo && !r._error);
      if (similarRows.length > 0) {
        const lines = similarRows.map((r) => `${r._row}행 · ${r.name} — 기존 상품 "${r._similarTo}"과(와) 이름이 비슷함`);
        alert(`이름이 비슷한 기존 상품이 있어 확인이 필요합니다(${similarRows.length}건). 미리보기 표에서 확인 체크 후 가져오기 하세요.\n\n${lines.join("\n")}`);
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  // 유사 상품명("애매한 것")이 있는 행은 관리자가 체크로 확인하기 전까지 가져오기 대상에서 제외
  const validRows = rows.filter((r) => !r._error && (!r._similarTo || confirmedRows.has(r._row)));
  const errorRows = rows.filter((r) => r._error);
  const similarUnconfirmedRows = rows.filter((r) => !r._error && r._similarTo && !confirmedRows.has(r._row));

  const toggleConfirmRow = (rowNum: number, on: boolean) => {
    setConfirmedRows((prev) => {
      const next = new Set(prev);
      if (on) next.add(rowNum); else next.delete(rowNum);
      return next;
    });
  };

  // 미리보기 셀 직접 수정 → 즉시 재검증(상품코드 중복 포함 — 다른 행과의 관계도 함께 다시 계산)
  const updateRow = (rowNum: number, patch: Partial<ParsedRow>) => {
    setRows((prev) => withErrors(
      prev.map((r) => (r._row === rowNum ? ({ ...r, ...patch } as ParsedRow) : r)),
      existingSkuMap,
      existingNameMap,
    ));
  };
  // 필수 입력칸 색상 — 비면 빨강, 채워지면 연노랑
  const reqCls = (val: string | undefined) =>
    `w-full border rounded px-2 py-1 text-xs focus:outline-none ${
      (val ?? "").trim() ? "border-amber-200 bg-amber-50 focus:border-[#303236]" : "border-red-300 bg-red-50 focus:border-red-400"
    }`;
  const optCls = "w-full border border-gray-200 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:border-[#303236]";

  // 사이즈별 가격 — 체크 시 행 펼침. 끄면 입력값 초기화.
  const [sizePriceOpen, setSizePriceOpen] = useState<Set<number>>(new Set());
  const toggleSizePrice = (rowNum: number, on: boolean) => {
    setSizePriceOpen((prev) => {
      const next = new Set(prev);
      if (on) next.add(rowNum); else next.delete(rowNum);
      return next;
    });
    if (!on) setRows((prev) => prev.map((r) => (r._row === rowNum ? { ...r, sizePrices: [] } : r)));
  };
  const setRowSizePrice = (rowNum: number, size: string, raw: string) => {
    const price = fmtComma(raw);
    setRows((prev) => prev.map((r) => {
      if (r._row !== rowNum) return r;
      const others = (r.sizePrices ?? []).filter((sp) => sp.size !== size);
      return { ...r, sizePrices: price ? [...others, { size, price }] : others };
    }));
  };

  const handleImport = async () => {
    // 오류 행(필수 미입력·상품코드 중복)은 validRows에서 이미 제외되어 있어 정상 행만 가져온다.
    if (validRows.length === 0) return;
    setImporting(true);
    setResult(null);
    try {
      // 미등록 브랜드 자동 생성 (엑셀에 입력된 브랜드를 브랜드 리스트에 추가)
      try {
        const brandNames = Array.from(new Set(validRows.map((r) => (r.brand ?? "").trim()).filter(Boolean)));
        if (brandNames.length) {
          const existing = await fetch("/api/admin/brands").then((r) => (r.ok ? r.json() : []));
          const existingSet = new Set((Array.isArray(existing) ? existing : []).map((b: { name: string }) => b.name));
          await Promise.all(
            brandNames.filter((b) => !existingSet.has(b)).map((name) =>
              fetch("/api/admin/brands", {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }),
              }).catch(() => {})
            )
          );
        }
      } catch { /* 브랜드 생성 실패는 무시 — 제품 등록은 계속 진행 */ }

      const res = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validRows),
      });
      const data = await res.json();
      setResult(res.ok ? { ok: true, count: data.count } : { ok: false, error: data.error });
    } catch (e) {
      setResult({ ok: false, error: String(e) });
    }
    setImporting(false);
  };

  // 미리보기 테이블 행 렌더링 — 정상 행/오류 행 두 테이블에서 공용으로 사용
  const renderRows = (list: ParsedRow[]) => list.slice(0, 50).map((row) => (
    <Fragment key={row._row}>
      <tr className={row._error ? "bg-red-50/40" : "hover:bg-gray-50"}>
        <td className="px-3 py-2 text-gray-400 text-xs">{row._row}</td>
        <td className="px-3 py-2">
          {row._error ? (
            <span className="px-2 py-0.5 text-[11px] bg-red-100 text-red-600 font-semibold rounded-full whitespace-nowrap">오류</span>
          ) : (
            <span className="px-2 py-0.5 text-[11px] bg-emerald-100 text-emerald-600 font-semibold rounded-full whitespace-nowrap">정상</span>
          )}
        </td>
        <td className="px-2 py-2 min-w-[150px]">
          <input value={row.name ?? ""} onChange={(e) => updateRow(row._row, { name: e.target.value })} className={reqCls(row.name)} />
        </td>
        <td className="px-2 py-2 min-w-[110px]">
          <input value={row.sku ?? ""} onChange={(e) => updateRow(row._row, { sku: e.target.value })} className={reqCls(row.sku)} />
        </td>
        <td className="px-2 py-2 min-w-[120px]">
          <input list="imp-sizes" value={(row.sizes ?? []).join(";")}
            onChange={(e) => updateRow(row._row, { sizes: toArr(e.target.value) })}
            className={optCls} placeholder="S;M;L;XL" />
        </td>
        <td className="px-2 py-2 min-w-[130px]">
          <input list="imp-colors" value={(row.colors ?? []).map((c) => c.name).join(";")}
            onChange={(e) => updateRow(row._row, { colors: parseColors(e.target.value) })}
            className={optCls} placeholder="블랙;화이트" />
        </td>
        <td className="px-2 py-2 min-w-[110px]">
          <input value={row.brand ?? ""} onChange={(e) => updateRow(row._row, { brand: e.target.value })} className={reqCls(row.brand)} />
        </td>
        <td className="px-2 py-2 min-w-[110px]">
          <input list="imp-cat-main" value={row.category ?? ""}
            onChange={(e) => updateRow(row._row, { category: e.target.value as Product["category"], subCategory: "" as Product["subCategory"] })}
            className={reqCls(row.category)} placeholder="선택/입력" />
        </td>
        <td className="px-2 py-2 min-w-[110px]">
          <input list={`imp-cat-sub-${row.category}`} value={row.subCategory ?? ""}
            onChange={(e) => updateRow(row._row, { subCategory: e.target.value as Product["subCategory"] })}
            className={reqCls(row.subCategory)} placeholder="선택/입력" />
        </td>
        <td className="px-2 py-2 min-w-[100px]">
          <input inputMode="numeric" value={row.price ?? ""} onChange={(e) => updateRow(row._row, { price: fmtComma(e.target.value) })} className={optCls} />
        </td>
        <td className="px-2 py-2 min-w-[100px]">
          <input inputMode="numeric" value={row.consumerPrice ?? ""} onChange={(e) => updateRow(row._row, { consumerPrice: fmtComma(e.target.value) })} className={optCls} />
        </td>
        <td className="px-2 py-2 min-w-[100px]">
          <input inputMode="numeric" value={row.supplyPrice ?? ""} onChange={(e) => updateRow(row._row, { supplyPrice: fmtComma(e.target.value) })} className={optCls} />
        </td>
        <td className="px-3 py-2 text-center">
          <input type="checkbox" checked={sizePriceOpen.has(row._row)}
            onChange={(e) => toggleSizePrice(row._row, e.target.checked)}
            className="w-4 h-4 accent-[#303236] cursor-pointer" title="사이즈별 가격 입력" />
        </td>
        <td className="px-3 py-2 text-[11px] text-red-500 min-w-[140px]">{row._error || ""}</td>
      </tr>
      {sizePriceOpen.has(row._row) && (
        <tr className="bg-amber-50/50">
          <td colSpan={14} className="px-4 py-3">
            <div className="flex flex-wrap gap-3 items-center">
              <span className="text-xs font-semibold text-[#303236]">사이즈별 가격</span>
              {(row.sizes ?? []).length === 0 ? (
                <span className="text-xs text-gray-400">먼저 사이즈를 입력하세요.</span>
              ) : (
                (row.sizes ?? []).map((sz) => (
                  <label key={sz} className="flex items-center gap-1 text-xs">
                    <span className="font-semibold text-[#303236] min-w-[34px] text-center">{sz}</span>
                    <input inputMode="numeric"
                      value={row.sizePrices?.find((sp) => sp.size === sz)?.price ?? ""}
                      onChange={(e) => setRowSizePrice(row._row, sz, e.target.value)}
                      placeholder={row.price || "기본가"}
                      className="w-24 border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-[#303236]" />
                  </label>
                ))
              )}
              <span className="text-[11px] text-gray-400">· 비운 사이즈는 기본 판매가 적용</span>
            </div>
          </td>
        </tr>
      )}
    </Fragment>
  ));

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
        <Link href="/admin/products" className="hover:text-gray-900">제품 관리</Link>
        <span>/</span>
        <span className="text-gray-900 font-semibold">Excel 대량 업로드</span>
      </div>
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Excel 대량 업로드</h1>
          <p className="text-base text-gray-400 mt-1">엑셀 파일로 여러 제품을 한 번에 등록하거나 수정합니다.</p>
        </div>
        <button
          onClick={() => { downloadTemplate(cats).catch(() => alert("템플릿 생성 중 오류가 발생했습니다.")); }}
          className="flex items-center gap-2 px-5 py-2.5 border-2 border-gray-200 text-sm font-semibold text-gray-700 hover:border-gray-400 transition-colors rounded"
        >
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          템플릿 다운로드 (.xlsx)
        </button>
      </div>

      {/* 파일 업로드 영역 */}
      <div
        className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-14 text-center cursor-pointer hover:border-[#303236] transition-colors mb-8"
        onClick={() => fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" />
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          {fileName ? (
            <div>
              <p className="text-lg font-semibold text-gray-900">{fileName}</p>
              <p className="text-sm text-gray-400 mt-1">다른 파일을 선택하려면 클릭</p>
            </div>
          ) : (
            <div>
              <p className="text-lg font-semibold text-gray-700">Excel 파일을 클릭하여 선택</p>
              <p className="text-sm text-gray-400 mt-1">.xlsx, .xls, .csv 지원 · 최대 1000행</p>
            </div>
          )}
        </div>
      </div>

      {/* 파싱 결과 요약 */}
      {rows.length > 0 && (
        <div className="flex gap-4 mb-6">
          <div className="flex-1 bg-white border border-gray-200 rounded-xl px-6 py-5">
            <p className="text-sm text-gray-500">총 행</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{rows.length}</p>
          </div>
          <div className="flex-1 bg-white border border-emerald-200 rounded-xl px-6 py-5">
            <p className="text-sm text-emerald-600">가져올 수 있음</p>
            <p className="text-3xl font-bold text-emerald-600 mt-1">{validRows.length}</p>
          </div>
          <div className={`flex-1 rounded-xl px-6 py-5 ${similarUnconfirmedRows.length > 0 ? "bg-amber-50 border border-amber-200" : "bg-gray-50 border border-gray-200"}`}>
            <p className={`text-sm ${similarUnconfirmedRows.length > 0 ? "text-amber-600" : "text-gray-400"}`}>확인 필요(유사 상품명)</p>
            <p className={`text-3xl font-bold mt-1 ${similarUnconfirmedRows.length > 0 ? "text-amber-600" : "text-gray-300"}`}>{similarUnconfirmedRows.length}</p>
          </div>
          <div className={`flex-1 rounded-xl px-6 py-5 ${errorRows.length > 0 ? "bg-red-50 border border-red-200" : "bg-gray-50 border border-gray-200"}`}>
            <p className={`text-sm ${errorRows.length > 0 ? "text-red-500" : "text-gray-400"}`}>오류 행</p>
            <p className={`text-3xl font-bold mt-1 ${errorRows.length > 0 ? "text-red-500" : "text-gray-300"}`}>{errorRows.length}</p>
          </div>
        </div>
      )}

      {/* 결과 메시지 */}
      {result && (
        <div className={`mb-6 px-6 py-4 rounded-xl text-base font-medium ${result.ok ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {result.ok ? `✓ ${result.count}개 제품이 성공적으로 등록/수정됐습니다.` : `✗ 오류: ${result.error}`}
        </div>
      )}

      {/* 데이터 미리보기 */}
      {rows.length > 0 && (
        <>
          {/* 카테고리 드롭다운+입력용 datalist (현재 등록 카테고리) — 두 테이블이 공용으로 참조 */}
          <datalist id="imp-cat-main">{cats.map((c) => <option key={c.name} value={c.name} />)}</datalist>
          <datalist id="imp-colors">{COLOR_PRESET_NAMES.map((c) => <option key={c} value={c} />)}</datalist>
          <datalist id="imp-sizes">{["S", "M", "L", "XL", "2XL", "3XL", "4XL"].map((s) => <option key={s} value={s} />)}</datalist>
          {cats.map((c) => (
            <datalist key={c.name} id={`imp-cat-sub-${c.name}`}>{c.subs.map((s) => <option key={s} value={s} />)}</datalist>
          ))}

          {/* 정상 행 — 가져올 수 있음 */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm mb-8">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">정상 행 <span className="text-emerald-600">{validRows.length}개</span></h2>
              <p className="text-sm text-gray-400">가져올 수 있음 · 처음 50행 표시</p>
            </div>
            <div className="px-6 pb-2 text-[11px] text-gray-400">
              <span className="inline-block w-3 h-3 align-middle bg-amber-50 border border-amber-200 rounded-sm mr-1" /> 필수 입력 · 가격은 숫자만 입력하면 콤마 자동
            </div>
            {validRows.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-gray-400">가져올 수 있는 행이 없습니다. 아래 오류 행을 먼저 수정해 주세요.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {TABLE_HEADERS.map((h) => (
                        <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">{renderRows(validRows)}</tbody>
                </table>
              </div>
            )}
          </div>

          {/* 유사 상품명 — 이미 등록된 상품과 이름이 비슷함, 확인 전까지 가져오기 보류 */}
          {similarUnconfirmedRows.length > 0 && (
            <div className="bg-white border border-amber-200 rounded-xl overflow-hidden shadow-sm mb-8">
              <div className="px-6 py-4 border-b border-amber-100 bg-amber-50">
                <h2 className="text-lg font-bold text-amber-700">확인 필요 — 유사 상품명 {similarUnconfirmedRows.length}개</h2>
                <p className="text-sm text-amber-600 mt-1">
                  이미 등록된 상품과 이름이 비슷합니다. 같은 상품을 잘못 다시 올리는 게 아니라 확실히 다른 상품이라면
                  체크 후 가져오세요. 체크하지 않으면 가져오기에서 제외됩니다(덮어쓰기 방지).
                </p>
              </div>
              <div className="divide-y divide-amber-50">
                {similarUnconfirmedRows.map((row) => (
                  <div key={row._row} className="px-6 py-3 flex items-center gap-4">
                    <span className="text-xs text-gray-400 w-10 flex-shrink-0">{row._row}행</span>
                    <div className="flex-1 text-sm">
                      <span className="font-semibold text-gray-800">{row.name}</span>
                      <span className="text-gray-400"> ({row.sku})</span>
                      <span className="text-amber-600"> — 기존 상품 &quot;{row._similarTo}&quot;과(와) 이름이 비슷함</span>
                    </div>
                    <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer flex-shrink-0">
                      <input type="checkbox" checked={confirmedRows.has(row._row)}
                        onChange={(e) => toggleConfirmRow(row._row, e.target.checked)} />
                      다른 상품이 맞음(등록 진행)
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 오류 행 — 제외하고 가져오기 */}
          {errorRows.length > 0 && (
            <div className="bg-white border border-red-200 rounded-xl overflow-hidden shadow-sm mb-8">
              <div className="px-6 py-4 border-b border-red-100 bg-red-50 flex items-center justify-between">
                <h2 className="text-lg font-bold text-red-600">오류 행 {errorRows.length}개</h2>
                <p className="text-sm text-red-400">가져오기에서 제외됨 · 처음 50행 표시</p>
              </div>
              <div className="px-6 pb-2 pt-3 text-[11px] text-gray-400">
                <span className="inline-block w-3 h-3 align-middle bg-red-50 border border-red-300 rounded-sm mr-1" /> 미입력·상품코드/상품명 중복 — 값을 고치면 자동으로 정상 행으로 이동합니다.
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {TABLE_HEADERS.map((h) => (
                        <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">{renderRows(errorRows)}</tbody>
                </table>
              </div>
            </div>
          )}

          {/* 가져오기 버튼 */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleImport}
              disabled={importing || validRows.length === 0}
              className="px-8 py-3 bg-[#E5541B] text-white text-base font-semibold hover:bg-[#e04500] transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded"
            >
              {importing ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  가져오는 중...
                </span>
              ) : (
                `${validRows.length}개 제품 가져오기`
              )}
            </button>
            {(errorRows.length > 0 || similarUnconfirmedRows.length > 0) && (
              <p className="text-sm text-gray-500">
                오류 행 {errorRows.length}개
                {similarUnconfirmedRows.length > 0 && `, 확인 대기 중인 유사 상품명 행 ${similarUnconfirmedRows.length}개`}는 제외하고 {validRows.length}개만 가져옵니다.
              </p>
            )}
          </div>
        </>
      )}

      {/* 컬럼 가이드 */}
      <div className="mt-12 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">컬럼 가이드</h2>
          <p className="text-sm text-gray-400 mt-0.5">엑셀 1행(헤더)에 아래 컬럼명을 그대로 사용하세요.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">컬럼명</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">설명</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">필수</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">예시</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                { label: "상품명",         desc: "제품 이름",            req: true,  ex: "스트레치 카고 팬츠" },
                { label: "상품코드",        desc: "SKU 코드 (필수)",      req: true,  ex: "WU-S001" },
                { label: "사이즈(;구분)",   desc: "세미콜론으로 여러 사이즈 (선택 — 비우면 등록 후 입력 가능)",   req: false, ex: "S;M;L;XL;2XL" },
                { label: "색상(;구분)",     desc: `세미콜론으로 여러 색상 (${COLOR_PRESET_NAMES.join("·")}) (선택 — 비우면 등록 후 입력 가능)`, req: false, ex: "블랙;화이트;네이비" },
                { label: "브랜드",          desc: "브랜드명 (목록에 없으면 자동 생성)", req: true, ex: "WORKUP" },
                { label: "대카테고리",       desc: `현재 등록: ${cats.map((c) => c.name).join(" / ") || "-"} (미리보기에서 선택/입력)`, req: true, ex: cats[0]?.name ?? "현장" },
                { label: "중카테고리",       desc: "대분류의 하위 — 미리보기에서 드롭다운 선택 또는 직접 입력", req: true, ex: cats[0]?.subs[0] ?? "하의" },
                { label: "판매가",          desc: "판매 가격 (선택 — 비우면 등록 후 입력 가능)",            req: false,  ex: "39,000원" },
                { label: "소비자가",         desc: "소비자가",             req: false, ex: "45,000원" },
                { label: "공급가",          desc: "공급가",               req: false, ex: "25,000원" },
                { label: "판매상태",         desc: "판매중/품절/판매중지/예약판매/진열대기", req: false, ex: "판매중" },
                { label: "사이즈별 가격",   desc: "엑셀엔 없음 — 업로드 후 미리보기에서 '사이즈별가' 체크 시 사이즈마다 입력", req: false, ex: "체크 후 입력" },
              ].map((col) => (
                <tr key={col.label} className="hover:bg-gray-50">
                  <td className="px-5 py-3.5 font-mono text-sm text-[#303236] font-semibold">{col.label}</td>
                  <td className="px-5 py-3.5 text-gray-600">{col.desc}</td>
                  <td className="px-5 py-3.5">
                    {col.req
                      ? <span className="px-2.5 py-0.5 text-xs bg-red-100 text-red-600 font-semibold rounded-full">필수</span>
                      : <span className="px-2.5 py-0.5 text-xs bg-gray-100 text-gray-500 rounded-full">선택</span>
                    }
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs">{col.ex}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
