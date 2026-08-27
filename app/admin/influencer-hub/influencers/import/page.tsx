"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { STATUS_LABEL, COLLAB_TYPE_LABEL, CHANNEL_OPTIONS, formatFollowerDisplay } from "@/lib/ih/influencer-shared";

const STATUS_CODES = Object.keys(STATUS_LABEL) as (keyof typeof STATUS_LABEL)[];
const STATUS_LABEL_TO_CODE: Record<string, string> = Object.fromEntries(STATUS_CODES.map((code) => [STATUS_LABEL[code], code]));
const COLLAB_LABEL_TO_CODE: Record<string, "SPONSOR" | "VISIT"> = {
  [COLLAB_TYPE_LABEL.SPONSOR]: "SPONSOR",
  [COLLAB_TYPE_LABEL.VISIT]: "VISIT",
};

const COLUMNS = [
  { label: "ID", desc: "비우면 신규 / 채우면 해당 인플루언서 수정", req: false, ex: "" },
  { label: "닉네임", desc: "인플루언서 닉네임", req: true, ex: "가나디" },
  { label: "채널", desc: CHANNEL_OPTIONS.join("/") + " 등", req: false, ex: "Instagram" },
  { label: "아이디", desc: "채널 아이디(@ 제외)", req: false, ex: "gana_di" },
  { label: "채널URL", desc: "정확한 URL(중복 판별 기준)", req: false, ex: "https://instagram.com/gana_di" },
  { label: "팔로워", desc: "숫자(예: 56000)", req: false, ex: "56000" },
  { label: "구분", desc: `${COLLAB_TYPE_LABEL.SPONSOR}/${COLLAB_TYPE_LABEL.VISIT} — 쉼표로 복수 가능`, req: false, ex: COLLAB_TYPE_LABEL.SPONSOR },
  { label: "콘텐츠", desc: "쉼표로 여러 개", req: false, ex: "캠핑, 차박" },
  { label: "활동지역", desc: "쉼표로 여러 개", req: false, ex: "서울 강남구" },
  { label: "상태", desc: STATUS_CODES.map((c) => STATUS_LABEL[c]).join("/"), req: false, ex: "활동" },
  { label: "이름", desc: "실명", req: false, ex: "" },
  { label: "연락처", desc: "", req: false, ex: "" },
  { label: "주소", desc: "", req: false, ex: "" },
  { label: "메모", desc: "자유 메모", req: false, ex: "" },
];

type ParsedRow = {
  _row: number;
  _error?: string;
  id: string;
  nickname: string;
  channel: string;
  handle: string;
  channel_url: string;
  follower_count: string;
  collab_types: ("SPONSOR" | "VISIT")[];
  content_type: string[];
  activity_area: string[];
  status: string;
  name: string;
  phone: string;
  address: string;
  memo: string;
};

function splitList(v: unknown): string[] {
  return String(v ?? "")
    .split(/[,，]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseRow(row: Record<string, unknown>, idx: number): ParsedRow {
  const id = String(row["ID"] ?? row["id"] ?? "").trim();
  const nickname = String(row["닉네임"] ?? row["nickname"] ?? "").trim();
  const statusRaw = String(row["상태"] ?? row["status"] ?? "").trim();
  let status = "ACTIVE";
  if (statusRaw) {
    if (STATUS_LABEL_TO_CODE[statusRaw]) status = STATUS_LABEL_TO_CODE[statusRaw];
    else if (STATUS_CODES.includes(statusRaw as (typeof STATUS_CODES)[number])) status = statusRaw;
    else status = "";
  }
  const collabRaw = splitList(row["구분"] ?? row["collab_types"]);
  const collab_types = collabRaw.map((v) => COLLAB_LABEL_TO_CODE[v] ?? (v === "SPONSOR" || v === "VISIT" ? v : null)).filter((v): v is "SPONSOR" | "VISIT" => v != null);

  const errors: string[] = [];
  if (id && !/^\d+$/.test(id)) errors.push("ID는 숫자만");
  if (!nickname) errors.push("닉네임 필수");
  if (statusRaw && !status) errors.push("상태값 확인 필요");
  if (collabRaw.length > 0 && collab_types.length !== collabRaw.length) errors.push("구분값 확인 필요");

  return {
    _row: idx + 2,
    _error: errors.length > 0 ? errors.join(", ") : undefined,
    id,
    nickname,
    channel: String(row["채널"] ?? row["channel"] ?? "Instagram").trim() || "Instagram",
    handle: String(row["아이디"] ?? row["handle"] ?? "").trim(),
    channel_url: String(row["채널URL"] ?? row["channel_url"] ?? "").trim(),
    follower_count: String(row["팔로워"] ?? row["follower_count"] ?? "").trim(),
    collab_types,
    content_type: splitList(row["콘텐츠"] ?? row["content_type"]),
    activity_area: splitList(row["활동지역"] ?? row["activity_area"]),
    status: status || "ACTIVE",
    name: String(row["이름"] ?? row["name"] ?? "").trim(),
    phone: String(row["연락처"] ?? row["phone"] ?? "").trim(),
    address: String(row["주소"] ?? row["address"] ?? "").trim(),
    memo: String(row["메모"] ?? row["memo"] ?? "").trim(),
  };
}

function downloadTemplate() {
  const header = COLUMNS.map((c) => c.label);
  const sample = ["", "가나디", "Instagram", "gana_di", "https://instagram.com/gana_di", "56000", COLLAB_TYPE_LABEL.SPONSOR, "캠핑, 차박", "서울 강남구", "활동", "", "", "", ""];
  const ws = XLSX.utils.aoa_to_sheet([header, sample]);
  ws["!cols"] = COLUMNS.map((c) => ({ wch: c.label === "메모" || c.label === "채널URL" ? 30 : 16 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "인플루언서목록");
  XLSX.writeFile(wb, "workup_influencers_template.xlsx");
}

export default function InfluencerImportPage() {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; inserted?: number; updated?: number; count?: number; error?: string; failed?: { row: number; reason?: string }[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = new Uint8Array(ev.target!.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: "array", cellDates: true });
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
    const payload = validRows.map((r) => {
      const follower_count = r.follower_count ? Number(r.follower_count) : null;
      return {
        rowNum: r._row,
        input: {
          id: r.id ? Number(r.id) : undefined,
          nickname: r.nickname,
          channel: r.channel,
          handle: r.handle || undefined,
          channel_url: r.channel_url || undefined,
          follower_count,
          follower_display: follower_count != null ? formatFollowerDisplay(follower_count) : undefined,
          collab_types: r.collab_types,
          content_type: r.content_type,
          activity_area: r.activity_area,
          status: r.status as "ACTIVE" | "INACTIVE" | "ENDED" | "BLOCKED",
          name: r.name || undefined,
          phone: r.phone || undefined,
          address: r.address || undefined,
          memo: r.memo || undefined,
        },
      };
    });
    const res = await fetch("/api/admin/ih/influencers/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setResult(res.ok ? { ok: true, count: data.count, inserted: data.inserted, updated: data.updated, failed: data.failed } : { ok: false, error: data.error });
    setImporting(false);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-6 text-sm text-slate-600">
        <Link href="/admin/influencer-hub/influencers" className="hover:text-slate-900">인플루언서</Link>
        <span>/</span>
        <span className="text-slate-900 font-semibold">Excel 대량 업로드</span>
      </div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900">인플루언서 Excel 업로드</h1>
          <p className="text-[14.5px] text-slate-500 mt-1">엑셀 파일로 여러 인플루언서를 한 번에 등록/수정합니다.</p>
        </div>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-[14px] font-semibold text-slate-700 hover:border-slate-400 transition-colors rounded-md"
        >
          템플릿 다운로드 (.xlsx)
        </button>
      </div>

      <div
        className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-12 text-center cursor-pointer hover:border-slate-500 transition-colors mb-8"
        onClick={() => fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" />
        {fileName ? (
          <div>
            <p className="text-[15px] font-semibold text-slate-900">{fileName}</p>
            <p className="text-[13.5px] text-slate-500 mt-1">다른 파일을 선택하려면 클릭</p>
          </div>
        ) : (
          <div>
            <p className="text-[15px] font-semibold text-slate-700">Excel 파일을 클릭하여 선택</p>
            <p className="text-[13.5px] text-slate-500 mt-1">.xlsx, .xls, .csv 지원</p>
          </div>
        )}
      </div>

      {rows.length > 0 && (
        <div className="flex gap-3 mb-6">
          <div className="flex-1 bg-white border border-slate-200 rounded-lg px-5 py-4">
            <p className="text-[13.5px] text-slate-600">총 행</p>
            <p className="text-[24px] font-bold text-slate-900 mt-0.5">{rows.length}</p>
          </div>
          <div className="flex-1 bg-white border border-emerald-200 rounded-lg px-5 py-4">
            <p className="text-[13.5px] text-emerald-600">가져올 수 있음</p>
            <p className="text-[24px] font-bold text-emerald-600 mt-0.5">{validRows.length}</p>
          </div>
          <div className={`flex-1 rounded-lg px-5 py-4 ${errorRows.length > 0 ? "bg-red-50 border border-red-200" : "bg-slate-50 border border-slate-200"}`}>
            <p className={`text-[13.5px] ${errorRows.length > 0 ? "text-red-500" : "text-slate-500"}`}>오류 행</p>
            <p className={`text-[24px] font-bold mt-0.5 ${errorRows.length > 0 ? "text-red-500" : "text-slate-300"}`}>{errorRows.length}</p>
          </div>
        </div>
      )}

      {result && (
        <div className={`mb-6 px-5 py-3.5 rounded-lg text-[14.5px] font-medium ${result.ok ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {result.ok ? (
            <>
              완료 — 신규 {result.inserted ?? 0}건, 수정 {result.updated ?? 0}건
              {result.failed && result.failed.length > 0 && (
                <span className="block mt-1 text-[13px] text-amber-700">
                  건너뜀 {result.failed.length}건: {result.failed.map((f) => `${f.row}행(${f.reason})`).join(", ")}
                </span>
              )}
            </>
          ) : (
            `오류: ${result.error}`
          )}
        </div>
      )}

      {rows.length > 0 && (
        <>
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden mb-6">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-[14px] font-bold text-slate-900">미리보기</h2>
              <p className="text-[13.5px] text-slate-500">{rows.length}행 · 처음 50행 표시</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[13.5px]">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {["행", "상태", "ID", "닉네임", "채널", "팔로워", "오류"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-[12px] font-semibold text-slate-600 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.slice(0, 50).map((row) => (
                    <tr key={row._row} className={row._error ? "bg-red-50" : "hover:bg-slate-50"}>
                      <td className="px-3 py-2.5 text-slate-500">{row._row}</td>
                      <td className="px-3 py-2.5">
                        {row._error ? (
                          <span className="px-2 py-0.5 text-[11.5px] bg-red-100 text-red-600 font-semibold rounded-full">오류</span>
                        ) : row.id ? (
                          <span className="px-2 py-0.5 text-[11.5px] bg-blue-100 text-blue-600 font-semibold rounded-full">수정</span>
                        ) : (
                          <span className="px-2 py-0.5 text-[11.5px] bg-emerald-100 text-emerald-600 font-semibold rounded-full">신규</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-slate-500 font-mono text-[12px]">{row.id || "-"}</td>
                      <td className="px-3 py-2.5 font-medium text-slate-800">{row.nickname || <span className="text-red-400 italic">없음</span>}</td>
                      <td className="px-3 py-2.5 text-slate-700">{row.channel || "-"}</td>
                      <td className="px-3 py-2.5 text-slate-600 tabular-nums">{row.follower_count || "-"}</td>
                      <td className="px-3 py-2.5 text-[12px] text-red-500">{row._error || ""}</td>
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
              className="px-6 py-2.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[14.5px] font-semibold disabled:opacity-50"
            >
              {importing ? "등록 중…" : `${validRows.length}명 인플루언서 등록`}
            </button>
            {errorRows.length > 0 && <p className="text-[13.5px] text-red-500">오류 {errorRows.length}행은 건너뜁니다.</p>}
          </div>
        </>
      )}

      <div className="mt-10 bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100">
          <h2 className="text-[14px] font-bold text-slate-900">컬럼 가이드</h2>
          <p className="text-[13.5px] text-slate-500 mt-0.5">엑셀 1행(헤더)에 아래 컬럼명을 그대로 사용하세요. 채널URL이 이미 등록된 것과 같으면 중복으로 건너뜁니다.</p>
        </div>
        <table className="w-full text-[13.5px]">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {["컬럼명", "설명", "필수", "예시"].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-[12px] font-semibold text-slate-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {COLUMNS.map((col) => (
              <tr key={col.label} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 font-mono text-[13.5px] text-slate-800 font-semibold">{col.label}</td>
                <td className="px-4 py-2.5 text-slate-700">{col.desc}</td>
                <td className="px-4 py-2.5">
                  {col.req ? (
                    <span className="px-2 py-0.5 text-[11.5px] bg-red-100 text-red-600 font-semibold rounded-full">필수</span>
                  ) : (
                    <span className="px-2 py-0.5 text-[11.5px] bg-slate-100 text-slate-600 rounded-full">선택</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-slate-500 text-[12.5px]">{col.ex}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
