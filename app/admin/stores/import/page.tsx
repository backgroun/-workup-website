"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";

const COLUMNS = [
  { key: "name",              label: "매장명",            required: true },
  { key: "region",            label: "지역",              required: false },
  { key: "address",           label: "주소",              required: true },
  { key: "lat",               label: "위도",              required: false },
  { key: "lng",               label: "경도",              required: false },
  { key: "phone",             label: "전화번호",           required: false },
  { key: "hours",             label: "영업시간",           required: false },
  { key: "store_type",        label: "매장유형",           required: false },
  { key: "brands",            label: "취급브랜드(;구분)",   required: false },
  { key: "parking",           label: "주차여부",           required: false },
  { key: "description",       label: "매장소개",           required: false },
  { key: "kakao_channel_url", label: "카카오채널URL",       required: false },
  { key: "store_url",         label: "스토어URL",          required: false },
  { key: "is_active",         label: "활성여부",           required: false },
];

type ParsedRow = Record<string, string> & { _row: number; _error?: string };

function parseRow(row: Record<string, unknown>, idx: number): ParsedRow {
  const name = String(row["매장명"] ?? row["name"] ?? "").trim();
  const address = String(row["주소"] ?? row["address"] ?? "").trim();
  const errors: string[] = [];
  if (!name) errors.push("매장명 필수");
  if (!address) errors.push("주소 필수");
  return {
    _row: idx + 2,
    _error: errors.length > 0 ? errors.join(", ") : undefined,
    name,
    region: String(row["지역"] ?? row["region"] ?? "").trim(),
    address,
    lat: String(row["위도"] ?? row["lat"] ?? "").trim(),
    lng: String(row["경도"] ?? row["lng"] ?? "").trim(),
    phone: String(row["전화번호"] ?? row["phone"] ?? "").trim(),
    hours: String(row["영업시간"] ?? row["hours"] ?? "").trim(),
    store_type: String(row["매장유형"] ?? row["store_type"] ?? "직영점").trim() || "직영점",
    brands: String(row["취급브랜드(;구분)"] ?? row["brands"] ?? "").trim(),
    parking: String(row["주차여부"] ?? row["parking"] ?? "").trim(),
    description: String(row["매장소개"] ?? row["description"] ?? "").trim(),
    kakao_channel_url: String(row["카카오채널URL"] ?? row["kakao_channel_url"] ?? "").trim(),
    store_url: String(row["스토어URL"] ?? row["store_url"] ?? "").trim(),
    is_active: String(row["활성여부"] ?? row["is_active"] ?? "true").trim(),
  };
}

function downloadTemplate() {
  const header = COLUMNS.map((c) => c.label);
  const sample = [
    "워크업 포천직영점", "경기", "경기도 포천시 호국로 90 워크업 포천 본점",
    "37.783470", "127.121414", "031-000-0000", "10:00 - 20:00 (매일)",
    "직영점", "WORKUP;나이키", "false", "포천 직영점입니다.", "", "", "true",
  ];
  const ws = XLSX.utils.aoa_to_sheet([header, sample]);
  ws["!cols"] = COLUMNS.map((_, i) => ({ wch: i === 0 ? 24 : i === 10 ? 30 : 16 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "매장목록");
  XLSX.writeFile(wb, "workup_stores_template.xlsx");
}

export default function StoreImportPage() {
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
    const res = await fetch("/api/admin/stores/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validRows),
    });
    const data = await res.json();
    setResult(res.ok ? { ok: true, count: data.count } : { ok: false, error: data.error });
    setImporting(false);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
        <Link href="/admin/stores" className="hover:text-gray-900">스토어 관리</Link>
        <span>/</span>
        <span className="text-gray-900 font-semibold">Excel 대량 업로드</span>
      </div>
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">매장 Excel 업로드</h1>
          <p className="text-base text-gray-400 mt-1">엑셀 파일로 여러 매장을 한 번에 등록합니다.</p>
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
              <p className="text-sm text-gray-400 mt-1">.xlsx, .xls, .csv 지원</p>
            </div>
          )}
        </div>
      </div>

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

      {result && (
        <div className={`mb-6 px-6 py-4 rounded-xl text-base font-medium ${result.ok ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {result.ok ? `✓ ${result.count}개 매장이 성공적으로 등록됐습니다.` : `✗ 오류: ${result.error}`}
        </div>
      )}

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
                    {["행", "상태", "매장명", "지역", "주소", "전화", "유형", "오류"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.slice(0, 50).map((row) => (
                    <tr key={row._row} className={row._error ? "bg-red-50" : "hover:bg-gray-50"}>
                      <td className="px-4 py-4 text-gray-400 text-sm">{row._row}</td>
                      <td className="px-4 py-4">
                        {row._error
                          ? <span className="px-2.5 py-1 text-xs bg-red-100 text-red-600 font-semibold rounded-full">오류</span>
                          : <span className="px-2.5 py-1 text-xs bg-emerald-100 text-emerald-600 font-semibold rounded-full">정상</span>
                        }
                      </td>
                      <td className="px-4 py-4 font-medium text-gray-900">{row.name || <span className="text-red-400 italic">없음</span>}</td>
                      <td className="px-4 py-4 text-gray-600">{row.region || "-"}</td>
                      <td className="px-4 py-4 text-gray-500 text-xs max-w-[200px] truncate">{row.address || "-"}</td>
                      <td className="px-4 py-4 text-gray-600 font-mono text-xs">{row.phone || "-"}</td>
                      <td className="px-4 py-4 text-gray-600">{row.store_type || "직영점"}</td>
                      <td className="px-4 py-4 text-xs text-red-500">{row._error || ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleImport}
              disabled={importing || validRows.length === 0}
              className="px-8 py-3 bg-[#ff550c] text-white text-base font-semibold hover:bg-[#e04500] transition-colors disabled:opacity-50 rounded"
            >
              {importing ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  등록 중...
                </span>
              ) : `${validRows.length}개 매장 등록`}
            </button>
            {errorRows.length > 0 && (
              <p className="text-sm text-red-500">오류 {errorRows.length}행은 건너뜁니다.</p>
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
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {["컬럼명", "설명", "필수", "예시"].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {[
              { label: "매장명",          desc: "매장 이름",              req: true,  ex: "워크업 포천직영점" },
              { label: "지역",            desc: "지역명 (서울, 경기 등)",   req: false, ex: "경기" },
              { label: "주소",            desc: "전체 주소",              req: true,  ex: "경기도 포천시 호국로 90" },
              { label: "위도",            desc: "위도 (소수점)",           req: false, ex: "37.7834706" },
              { label: "경도",            desc: "경도 (소수점)",           req: false, ex: "127.1214147" },
              { label: "전화번호",         desc: "전화번호",               req: false, ex: "031-000-0000" },
              { label: "영업시간",         desc: "영업시간 문자열",          req: false, ex: "10:00 - 20:00 (매일)" },
              { label: "매장유형",         desc: "직영점/대리점/아울렛 등",  req: false, ex: "직영점" },
              { label: "취급브랜드(;구분)", desc: "세미콜론으로 브랜드 구분",  req: false, ex: "WORKUP;나이키" },
              { label: "주차여부",         desc: "true / false",          req: false, ex: "true" },
              { label: "매장소개",         desc: "매장 소개 텍스트",         req: false, ex: "포천 직영점입니다." },
              { label: "카카오채널URL",    desc: "카카오 채널 링크",         req: false, ex: "https://pf.kakao.com/..." },
              { label: "스토어URL",        desc: "스토어 바로가기 링크",      req: false, ex: "https://..." },
              { label: "활성여부",         desc: "true(공개) / false(비공개)", req: false, ex: "true" },
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
  );
}
