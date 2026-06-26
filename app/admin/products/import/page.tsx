"use client";
import { useState, useRef, useEffect } from "react";
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
  { key: "sku",           label: "상품코드",        required: false },
  { key: "brand",         label: "브랜드",          required: false },
  { key: "category",      label: "대카테고리",       required: true },
  { key: "subCategory",   label: "중카테고리",       required: true },
  { key: "manufacturer",  label: "제조사",          required: false },
  { key: "origin",        label: "원산지",          required: false },
  { key: "price",         label: "판매가",          required: true },
  { key: "consumerPrice", label: "소비자가",        required: false },
  { key: "supplyPrice",   label: "공급가",          required: false },
  { key: "status",        label: "판매상태",        required: false },
  { key: "sizes",         label: "사이즈(;구분)",   required: false },
  { key: "metaTitle",     label: "메타타이틀",      required: false },
  { key: "metaDesc",      label: "메타설명",        required: false },
];

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

function parseRow(
  row: Record<string, unknown>,
  idx: number,
  cats: CatItem[],
): Partial<Product> & { id: string; _row: number; _error?: string } {
  const mainNames = cats.map((c) => c.name);
  const subsByMain: Record<string, string[]> = Object.fromEntries(cats.map((c) => [c.name, c.subs]));
  // 카테고리 미입력 시 첫 번째 분류로 기본 배정 (정적 기본값 대신 실제 분류 사용)
  const defaultMain = mainNames[0] ?? "";
  const defaultSub = (subsByMain[defaultMain]?.[0]) ?? "";

  const name = String(row["상품명"] ?? row["name"] ?? "").trim();
  const price = String(row["판매가"] ?? row["price"] ?? "").trim();
  const category = String(row["대카테고리"] ?? row["category"] ?? defaultMain).trim() as Product["category"];
  const subCategory = String(row["중카테고리"] ?? row["subCategory"] ?? defaultSub).trim() as Product["subCategory"];

  const errors: string[] = [];
  if (!name) errors.push("상품명 필수");
  if (!price) errors.push("판매가 필수");
  if (!mainNames.includes(category)) errors.push(`잘못된 대카테고리: ${category}`);

  const validSubs = category ? (subsByMain[category] ?? []) : [];
  if (subCategory && validSubs.length > 0 && !validSubs.includes(subCategory as never)) {
    errors.push(`잘못된 중카테고리: ${subCategory}`);
  }

  const id = slugify(name) || `product-${Date.now()}-${idx}`;

  return {
    _row: idx + 2,
    _error: errors.length > 0 ? errors.join(", ") : undefined,
    id,
    name,
    sku: String(row["상품코드"] ?? row["sku"] ?? "").trim() || undefined,
    brand: String(row["브랜드"] ?? row["brand"] ?? "").trim() || undefined,
    category,
    subCategory,
    manufacturer: String(row["제조사"] ?? row["manufacturer"] ?? "").trim() || undefined,
    origin: String(row["원산지"] ?? row["origin"] ?? "").trim() || undefined,
    price,
    consumerPrice: String(row["소비자가"] ?? row["consumerPrice"] ?? "").trim() || undefined,
    supplyPrice: String(row["공급가"] ?? row["supplyPrice"] ?? "").trim() || undefined,
    status: (String(row["판매상태"] ?? row["status"] ?? "판매중").trim() || "판매중") as Product["status"],
    sizes: toArr(row["사이즈(;구분)"] ?? row["sizes"]),
    metaTitle: String(row["메타타이틀"] ?? row["metaTitle"] ?? "").trim() || undefined,
    metaDesc: String(row["메타설명"] ?? row["metaDesc"] ?? "").trim() || undefined,
    line: "SITE",
    jobTypes: [],
    bg: "bg-[#1A2B4A]",
    colors: [],
  };
}

function downloadTemplate() {
  const header = COLUMNS.map((c) => c.label);
  const sample = [
    "스트레치 카고 팬츠",
    "WU-S001",
    "WORKUP",
    "현장",
    "하의",
    "(주)워크업코리아",
    "대한민국",
    "39,000원",
    "45,000원",
    "25,000원",
    "판매중",
    "S;M;L;XL;2XL",
    "스트레치 카고 팬츠 | WORKUP",
    "현장 작업자를 위한 스트레치 카고 팬츠",
  ];
  const ws = XLSX.utils.aoa_to_sheet([header, sample]);
  ws["!cols"] = COLUMNS.map((_, i) => ({ wch: i === 0 ? 24 : 16 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "상품목록");
  XLSX.writeFile(wb, "workup_products_template.xlsx");
}

type ParsedRow = Partial<Product> & { id: string; _row: number; _error?: string };

export default function ProductImportPage() {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; count?: number; error?: string } | null>(null);
  const [cats, setCats] = useState<CatItem[]>(STATIC_CATS);
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
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
      setRows(json.map((r, i) => parseRow(r, i, cats)));
    };
    reader.readAsArrayBuffer(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const validRows = rows.filter((r) => !r._error);
  const errorRows = rows.filter((r) => r._error);

  const handleImport = async () => {
    if (validRows.length === 0) return;
    setImporting(true);
    setResult(null);
    try {
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
          onClick={downloadTemplate}
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
        className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-14 text-center cursor-pointer hover:border-[#1A2B4A] transition-colors mb-8"
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
              <p className="text-sm text-gray-400 mt-1">.xlsx, .xls, .csv 지원 · 최대 500행</p>
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
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm mb-8">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">미리보기</h2>
              <p className="text-sm text-gray-400">{rows.length}행 · 처음 50행 표시</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">행</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">상태</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">상품명</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">상품코드</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">카테고리</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">판매가</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">판매상태</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">오류</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.slice(0, 50).map((row) => (
                    <tr key={row._row} className={row._error ? "bg-red-50" : "hover:bg-gray-50"}>
                      <td className="px-4 py-4 text-gray-400 text-sm">{row._row}</td>
                      <td className="px-4 py-4">
                        {row._error ? (
                          <span className="px-2.5 py-1 text-xs bg-red-100 text-red-600 font-semibold rounded-full">오류</span>
                        ) : (
                          <span className="px-2.5 py-1 text-xs bg-emerald-100 text-emerald-600 font-semibold rounded-full">정상</span>
                        )}
                      </td>
                      <td className="px-4 py-4 font-medium text-gray-900">{row.name || <span className="text-red-400 italic">없음</span>}</td>
                      <td className="px-4 py-4 text-gray-500 font-mono text-xs">{row.sku || "-"}</td>
                      <td className="px-4 py-4 text-gray-600">{row.category}{row.subCategory ? ` / ${row.subCategory}` : ""}</td>
                      <td className="px-4 py-4 font-semibold text-gray-800">{row.price || "-"}</td>
                      <td className="px-4 py-4 text-gray-600">{row.status || "판매중"}</td>
                      <td className="px-4 py-4 text-xs text-red-500">{row._error || ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 가져오기 버튼 */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleImport}
              disabled={importing || validRows.length === 0}
              className="px-8 py-3 bg-[#ff550c] text-white text-base font-semibold hover:bg-[#e04500] transition-colors disabled:opacity-50 rounded"
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
            {errorRows.length > 0 && (
              <p className="text-sm text-red-500">
                오류 {errorRows.length}행은 건너뜁니다. 오류를 수정 후 다시 업로드하세요.
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
                { label: "상품코드",        desc: "SKU 코드",            req: false, ex: "WU-S001" },
                { label: "브랜드",          desc: "브랜드명",             req: false, ex: "WORKUP" },
                { label: "대카테고리",       desc: "공용/남성/여성/소품/현장/일상", req: true, ex: "현장" },
                { label: "중카테고리",       desc: "대카테고리에 속하는 하위",     req: true, ex: "하의" },
                { label: "판매가",          desc: "판매 가격",            req: true,  ex: "39,000원" },
                { label: "소비자가",         desc: "소비자가",             req: false, ex: "45,000원" },
                { label: "공급가",          desc: "공급가",               req: false, ex: "25,000원" },
                { label: "판매상태",         desc: "판매중/품절/판매중지/예약판매/진열대기", req: false, ex: "판매중" },
                { label: "사이즈(;구분)",   desc: "세미콜론으로 여러 사이즈",   req: false, ex: "S;M;L;XL;2XL" },
                { label: "메타타이틀",       desc: "SEO 타이틀",           req: false, ex: "스트레치 카고 팬츠 | WORKUP" },
                { label: "메타설명",         desc: "SEO 설명",             req: false, ex: "현장 작업자를 위한 스트레치..." },
              ].map((col) => (
                <tr key={col.label} className="hover:bg-gray-50">
                  <td className="px-5 py-3.5 font-mono text-sm text-[#1A2B4A] font-semibold">{col.label}</td>
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
