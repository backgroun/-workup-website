"use client";
import { Suspense, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import * as XLSX from "xlsx";

// 엑셀 컬럼 (image · divider 페이지만 지원)
const COLUMNS = [
  { key: "page_type",   label: "종류(image/divider)" },
  { key: "image",       label: "이미지 (파일명 또는 URL)" },
  { key: "title",       label: "제목 (관리+화면 공용)" },
  { key: "description", label: "설명(이미지 캡션)" },
  { key: "link_url",    label: "링크 URL" },
  { key: "link_label",  label: "링크 문구" },
  { key: "divider_no",  label: "구분 번호(divider)" },
  { key: "divider_desc",label: "구분 설명(divider)" },
  { key: "is_visible",  label: "노출(TRUE/FALSE)" },
];

type ImageMap = Record<string, string>; // 파일명(및 확장자 제외) → 업로드된 URL

type ParsedRow = {
  _row: number;
  _error?: string;
  _imageRef: string; // 엑셀에 적힌 원본 값(파일명/URL)
  page_type: "image" | "divider";
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

const isUrl = (s: string) => /^https?:\/\//i.test(s);
const baseName = (s: string) => s.replace(/^.*[\\/]/, "");        // 경로 제거
const stripExt = (s: string) => baseName(s).replace(/\.[^.]+$/, ""); // 확장자 제거

function parseRow(row: Record<string, unknown>, idx: number, imageMap: ImageMap): ParsedRow {
  const rawType = pick(row, "종류(image/divider)", "종류", "page_type").toLowerCase();
  const page_type: "image" | "divider" = rawType === "divider" ? "divider" : "image";
  const imageRef = pick(row, "이미지 (파일명 또는 URL)", "이미지 URL", "이미지", "image", "image_url");
  const title = pick(row, "제목 (관리+화면 공용)", "목차 제목 / 구분 제목", "목차 제목", "구분 제목", "title");
  const isVisRaw = pick(row, "노출(TRUE/FALSE)", "노출", "is_visible") || "TRUE";

  // 이미지 값 해석: URL 이면 그대로, 아니면 업로드한 파일에서 찾기 (파일명 or 확장자 제외 일치)
  let image_url = "";
  if (imageRef) {
    if (isUrl(imageRef)) image_url = imageRef;
    else image_url = imageMap[baseName(imageRef)] || imageMap[stripExt(imageRef)] || "";
  }

  const errors: string[] = [];
  if (page_type === "image") {
    if (!imageRef) errors.push("이미지 페이지는 이미지 필수");
    else if (!image_url) errors.push(`업로드한 이미지에 "${imageRef}" 없음`);
  }
  if (page_type === "divider" && !title) errors.push("구분 페이지는 제목 필수");

  return {
    _row: idx + 2,
    _error: errors.length ? errors.join(", ") : undefined,
    _imageRef: imageRef,
    page_type,
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
  // 컬럼 순서: 종류 / 이미지(파일명or URL) / 제목 / 설명 / 링크URL / 링크문구 / 구분번호 / 구분설명 / 노출
  const samples = [
    ["divider", "", "상의 라인", "", "", "", "01", "현장에서 검증된 데일리 상의", "TRUE"],
    ["image", "top1.jpg", "피그먼트 워시드 티셔츠", "부드러운 촉감의 데일리 티셔츠", "/products/xxxx", "제품 보기", "", "", "TRUE"],
    ["image", "top2.png", "옥스포드 셔츠", "", "", "", "", "", "TRUE"],
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

  const [rawJson, setRawJson] = useState<Record<string, unknown>[]>([]);
  const [fileName, setFileName] = useState("");
  const [imageMap, setImageMap] = useState<ImageMap>({});
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; count?: number; error?: string } | null>(null);
  const xlsxRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);

  const rows = useMemo(
    () => rawJson.map((r, i) => parseRow(r, i, imageMap)),
    [rawJson, imageMap],
  );
  const validRows = rows.filter((r) => !r._error);
  const errorRows = rows.filter((r) => r._error);

  const handleXlsx = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = new Uint8Array(ev.target!.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      setRawJson(XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" }));
    };
    reader.readAsArrayBuffer(file);
    if (xlsxRef.current) xlsxRef.current.value = "";
  };

  const handleImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (imgRef.current) imgRef.current.value = "";
    if (files.length === 0) return;
    setResult(null);
    setUploading({ done: 0, total: files.length });
    const map: ImageMap = { ...imageMap };
    let done = 0;
    // 순차 업로드 (서버 부담·순서 안정)
    for (const f of files) {
      try {
        const fd = new FormData();
        fd.append("file", f);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const d = await res.json();
        if (res.ok && d.url) {
          map[baseName(f.name)] = d.url;
          map[stripExt(f.name)] = d.url;
        }
      } catch { /* 개별 실패는 건너뜀 — 매칭 단계에서 '없음'으로 표시됨 */ }
      done += 1;
      setUploading({ done, total: files.length });
    }
    setImageMap(map);
    setUploading(null);
  };

  const uploadedCount = useMemo(
    () => new Set(Object.values(imageMap)).size,
    [imageMap],
  );

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

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">카탈로그 페이지 Excel 업로드</h1>
          <p className="text-base text-gray-400 mt-1">
            엑셀로 <b>이미지 페이지</b>·<b>구분 페이지</b>를 한 번에 추가합니다. 기존 페이지 뒤에 순서대로 붙습니다.
            {brandId && <> · 대상: <b className="text-blue-600">브랜드 id {brandId}</b></>}
          </p>
        </div>
        <button onClick={downloadTemplate}
          className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 border-2 border-gray-200 text-sm font-semibold text-gray-700 hover:border-gray-400 transition-colors rounded">
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          템플릿 다운로드 (.xlsx)
        </button>
      </div>

      <div className="mb-8 p-4 bg-blue-50/60 border border-blue-100 rounded-xl text-sm text-slate-600 leading-relaxed">
        <b>순서</b> ① 아래에서 <b>이미지 파일들을 먼저 업로드</b> → ② 엑셀 <b>“이미지”</b> 칸에는 <b>파일명만</b>(예: <code>top1.jpg</code>) 적으면 자동 연결됩니다.
        <span className="block mt-1 text-xs text-slate-400">이미 URL(<code>https://…</code>)이 있으면 파일명 대신 URL을 그대로 적어도 됩니다. 표지·목차·분할 페이지는 편집기에서 직접 추가하세요.</span>
      </div>

      {/* 1. 이미지 업로드 */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-slate-700 mb-2">1. 이미지 파일 업로드 {uploadedCount > 0 && <span className="text-emerald-600">· {uploadedCount}개 완료</span>}</p>
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-[#303236] transition-colors"
          onClick={() => imgRef.current?.click()}>
          <input ref={imgRef} type="file" accept="image/*" multiple onChange={handleImages} className="hidden" />
          {uploading
            ? <p className="text-sm text-slate-500">업로드 중… {uploading.done}/{uploading.total}</p>
            : <p className="text-sm text-slate-600">이미지 여러 개를 한 번에 선택 (여러 번 나눠 올려도 누적됨)</p>}
        </div>
      </div>

      {/* 2. 엑셀 업로드 */}
      <div className="mb-8">
        <p className="text-sm font-semibold text-slate-700 mb-2">2. 엑셀 파일 업로드</p>
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-[#303236] transition-colors"
          onClick={() => xlsxRef.current?.click()}>
          <input ref={xlsxRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleXlsx} className="hidden" />
          <p className="text-sm font-semibold text-gray-700">{fileName || "Excel 파일을 클릭하여 선택"}</p>
          <p className="text-xs text-gray-400 mt-1">.xlsx, .xls, .csv</p>
        </div>
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
                  <th className="px-3 py-2 text-left">이미지</th>
                  <th className="px-3 py-2 text-left">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((r) => (
                  <tr key={r._row} className={r._error ? "bg-red-50/50" : ""}>
                    <td className="px-3 py-2 text-gray-400">{r._row}</td>
                    <td className="px-3 py-2">{r.page_type}</td>
                    <td className="px-3 py-2 text-gray-800">{r.title || <span className="text-gray-300">—</span>}</td>
                    <td className="px-3 py-2 text-gray-400 truncate max-w-[220px]">
                      {r._imageRef ? (r.image_url ? <span className="text-emerald-600">✓ {r._imageRef}</span> : r._imageRef) : <span className="text-gray-300">—</span>}
                    </td>
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
