"use client";
import { Suspense, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import * as XLSX from "xlsx";

// 엑셀 컬럼 (image · divider 페이지만 지원)
const COLUMNS = [
  { key: "page_type",   label: "종류(image/divider)" },
  { key: "admin_title", label: "관리용 제목" },
  { key: "image_url",   label: "이미지 URL" },
  { key: "title",       label: "목차 제목 / 구분 제목" },
  { key: "description", label: "설명(이미지 캡션)" },
  { key: "link_url",    label: "링크 URL" },
  { key: "link_label",  label: "링크 문구" },
  { key: "divider_no",  label: "구분 번호(divider)" },
  { key: "divider_desc",label: "구분 설명(divider)" },
  { key: "is_visible",  label: "노출(TRUE/FALSE)" },
];

type ParsedRow = {
  _row: number;
  _error?: string;
  page_type: "image" | "divider";
  admin_title: string;
  image_url: string;
  title: string;
  description: string;
  link_url: string;
  link_label: string;
  divider_no: string;
  divider_desc: string;
  is_visible: boolean;
};

const pick = (row: Record<string, unknown>, ...keys: string[]) => {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
};

function parseRow(row: Record<string, unknown>, idx: number): ParsedRow {
  const rawType = pick(row, "종류(image/divider)", "종류", "page_type").toLowerCase();
  const page_type: "image" | "divider" = rawType === "divider" ? "divider" : "image";
  const image_url = pick(row, "이미지 URL", "image_url");
  const title = pick(row, "목차 제목 / 구분 제목", "목차 제목", "구분 제목", "title");
  const isVisRaw = pick(row, "노출(TRUE/FALSE)", "노출", "is_visible") || "TRUE";

  const errors: string[] = [];
  if (page_type === "image" && !image_url) errors.push("이미지 페이지는 이미지 URL 필수");
  if (page_type === "divider" && !title) errors.push("구분 페이지는 제목 필수");

  return {
    _row: idx + 2,
    _error: errors.length ? errors.join(", ") : undefined,
    page_type,
    admin_title: pick(row, "관리용 제목", "admin_title"),
    image_url,
    title,
    description: pick(row, "설명(이미지 캡션)", "설명", "description"),
    link_url: pick(row, "링크 URL", "link_url"),
    link_label: pick(row, "링크 문구", "link_label"),
    divider_no: pick(row, "구분 번호(divider)", "구분 번호", "divider_no"),
    divider_desc: pick(row, "구분 설명(divider)", "구분 설명", "divider_desc"),
    is_visible: !/^(false|no|n|0|숨김)$/i.test(isVisRaw),
  };
}

function downloadTemplate() {
  const header = COLUMNS.map((c) => c.label);
  const samples = [
    ["divider", "카테고리1 구분", "", "상의 라인", "", "", "", "01", "현장에서 검증된 데일리 상의", "TRUE"],
    ["image", "상의1 착장컷", "https://images.workupkorea.com/…/top1.jpg", "피그먼트 워시드 티셔츠", "부드러운 촉감의 데일리 티셔츠", "/products/xxxx", "제품 보기", "", "", "TRUE"],
    ["image", "상의2 착장컷", "https://images.workupkorea.com/…/top2.jpg", "옥스포드 셔츠", "", "", "", "", "", "TRUE"],
  ];
  const ws = XLSX.utils.aoa_to_sheet([header, ...samples]);
  ws["!cols"] = COLUMNS.map(() => ({ wch: 22 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "카탈로그 페이지");
  XLSX.writeFile(wb, "카탈로그_페이지_템플릿.xlsx");
}

function CatalogImportInner() {
  const brandId = useSearchParams().get("brand") ?? "";
  const backHref = brandId ? `/admin/catalog?brand=${encodeURIComponent(brandId)}` : "/admin/catalog";

  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; count?: number; error?: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
      setRows(json.map((r, i) => parseRow(r, i)));
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
    const res = await fetch("/api/admin/catalog/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brand_id: brandId, rows: validRows }),
    });
    const data = await res.json();
    setResult(res.ok ? { ok: true, count: data.count } : { ok: false, error: data.error });
    setImporting(false);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
        <Link href={backHref} className="hover:text-gray-900">카탈로그 관리</Link>
        <span>/</span>
        <span className="text-gray-900 font-semibold">Excel 대량 업로드</span>
      </div>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">카탈로그 페이지 Excel 업로드</h1>
          <p className="text-base text-gray-400 mt-1">
            엑셀로 <b>이미지 페이지</b>·<b>구분 페이지</b>를 한 번에 추가합니다. 기존 페이지 뒤에 순서대로 붙습니다.
            {brandId && <> · 대상: <b className="text-blue-600">브랜드 id {brandId}</b></>}
          </p>
          <p className="text-xs text-gray-400 mt-1">표지·목차·분할 페이지는 편집기에서 직접 추가하세요.</p>
        </div>
        <button onClick={downloadTemplate}
          className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 border-2 border-gray-200 text-sm font-semibold text-gray-700 hover:border-gray-400 transition-colors rounded">
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          템플릿 다운로드 (.xlsx)
        </button>
      </div>

      <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-14 text-center cursor-pointer hover:border-[#303236] transition-colors mb-8"
        onClick={() => fileRef.current?.click()}>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" />
        <p className="text-lg font-semibold text-gray-700">{fileName || "Excel 파일을 클릭하여 선택"}</p>
        <p className="text-sm text-gray-400 mt-1">.xlsx, .xls, .csv 지원</p>
      </div>

      {rows.length > 0 && (
        <>
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
              <p className={`text-3xl font-bold mt-1 ${errorRows.length > 0 ? "text-red-500" : "text-gray-400"}`}>{errorRows.length}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs">
                <tr>
                  <th className="px-3 py-2 text-left">행</th>
                  <th className="px-3 py-2 text-left">종류</th>
                  <th className="px-3 py-2 text-left">제목</th>
                  <th className="px-3 py-2 text-left">이미지 URL</th>
                  <th className="px-3 py-2 text-left">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((r) => (
                  <tr key={r._row} className={r._error ? "bg-red-50/50" : ""}>
                    <td className="px-3 py-2 text-gray-400">{r._row}</td>
                    <td className="px-3 py-2">{r.page_type}</td>
                    <td className="px-3 py-2 text-gray-800">{r.title || r.admin_title || <span className="text-gray-300">—</span>}</td>
                    <td className="px-3 py-2 text-gray-400 truncate max-w-[280px]">{r.image_url || <span className="text-gray-300">—</span>}</td>
                    <td className="px-3 py-2">{r._error ? <span className="text-red-500 text-xs">{r._error}</span> : <span className="text-emerald-600 text-xs">OK</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button onClick={handleImport} disabled={importing || validRows.length === 0}
            className="px-6 py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
            {importing ? "추가 중…" : `${validRows.length}개 페이지 추가`}
          </button>
        </>
      )}

      {result && (
        <div className={`mt-6 px-4 py-3 rounded-lg text-sm font-medium ${result.ok ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {result.ok ? (
            <>{result.count}개 페이지를 추가했습니다. <Link href={backHref} className="underline font-semibold">카탈로그 관리로 이동</Link></>
          ) : (
            <>추가 실패: {result.error}</>
          )}
        </div>
      )}
    </div>
  );
}

export default function CatalogImportPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400 text-sm">불러오는 중…</div>}>
      <CatalogImportInner />
    </Suspense>
  );
}
