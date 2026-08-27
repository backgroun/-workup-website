"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { SPONSOR_STAGE_ORDER, SPONSOR_STAGE_LABEL } from "@/lib/ih/influencer-shared";

const COLUMNS = [
  { label: "ID", desc: "비우면 신규 / 채우면 해당 협찬 수정", req: false, ex: "" },
  { label: "닉네임", desc: "인플루언서 닉네임(정확히 일치해야 매칭됨)", req: true, ex: "가나디" },
  { label: "제품", desc: "협찬 제품명", req: true, ex: "쿨링 재킷" },
  { label: "회차", desc: "협찬 회차(숫자)", req: false, ex: "1" },
  { label: "제공 제품/사이즈", desc: "실제 제공한 제품/사이즈", req: false, ex: "상 95" },
  { label: "발송일", desc: "YYYY-MM-DD", req: false, ex: "2026-08-20" },
  { label: "콘텐츠 형태", desc: "릴스/피드/스토리/쇼츠/유튜브 영상/블로그 등", req: false, ex: "릴스" },
  { label: "비용", desc: "숫자(원)", req: false, ex: "100000" },
  { label: "상태", desc: SPONSOR_STAGE_ORDER.map((s) => SPONSOR_STAGE_LABEL[s]).join("/"), req: false, ex: "협찬 예정" },
  { label: "실제 업로드일", desc: "YYYY-MM-DD", req: false, ex: "" },
  { label: "콘텐츠 URL", desc: "업로드된 콘텐츠 링크", req: false, ex: "" },
  { label: "메모", desc: "자유 메모", req: false, ex: "" },
];

const STATUS_LABEL_TO_CODE: Record<string, string> = Object.fromEntries(
  SPONSOR_STAGE_ORDER.map((code) => [SPONSOR_STAGE_LABEL[code], code])
);

type ParsedRow = {
  _row: number;
  _error?: string;
  id: string;
  nickname: string;
  influencerId: number | null;
  product: string;
  round: string;
  support_type: string;
  send_date: string;
  content_format: string;
  cost: string;
  status: string;
  upload_date: string;
  content_url: string;
  memo: string;
};

// 엑셀 날짜 셀이 시리얼 숫자로 오는 경우를 방어한다(cellDates: true로 대부분 Date 객체가 되지만,
// 텍스트 서식 셀은 문자열로 온다) — 이 프로젝트에서 과거 영업시간 파싱 때도 같은 문제가 있었다.
function normalizeDate(v: unknown): string {
  if (v == null || v === "") return "";
  if (v instanceof Date) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, "0");
    const d = String(v.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const s = String(v).trim();
  const m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  return s;
}

function parseRow(row: Record<string, unknown>, idx: number, nicknameIndex: Map<string, number[]>): ParsedRow {
  const id = String(row["ID"] ?? row["id"] ?? "").trim();
  const nickname = String(row["닉네임"] ?? row["nickname"] ?? "").trim();
  const product = String(row["제품"] ?? row["product"] ?? "").trim();
  const statusRaw = String(row["상태"] ?? row["status"] ?? "").trim();
  let status = "PLANNED";
  if (statusRaw) {
    if (STATUS_LABEL_TO_CODE[statusRaw]) status = STATUS_LABEL_TO_CODE[statusRaw];
    else if ((SPONSOR_STAGE_ORDER as readonly string[]).includes(statusRaw)) status = statusRaw;
    else status = "";
  }

  const matches = nicknameIndex.get(nickname) ?? [];
  const errors: string[] = [];
  if (id && !/^\d+$/.test(id)) errors.push("ID는 숫자만");
  if (!nickname) errors.push("닉네임 필수");
  else if (matches.length === 0) errors.push("일치하는 인플루언서 없음");
  else if (matches.length > 1) errors.push("닉네임 중복 — 인플루언서를 특정할 수 없음");
  if (!product) errors.push("제품 필수");
  if (statusRaw && !status) errors.push("상태값 확인 필요");

  return {
    _row: idx + 2,
    _error: errors.length > 0 ? errors.join(", ") : undefined,
    id,
    nickname,
    influencerId: matches.length === 1 ? matches[0] : null,
    product,
    round: String(row["회차"] ?? row["round"] ?? "").trim(),
    support_type: String(row["제공 제품/사이즈"] ?? row["support_type"] ?? "").trim(),
    send_date: normalizeDate(row["발송일"] ?? row["send_date"]),
    content_format: String(row["콘텐츠 형태"] ?? row["content_format"] ?? "").trim(),
    cost: String(row["비용"] ?? row["cost"] ?? "").trim(),
    status: status || "PLANNED",
    upload_date: normalizeDate(row["실제 업로드일"] ?? row["upload_date"]),
    content_url: String(row["콘텐츠 URL"] ?? row["content_url"] ?? "").trim(),
    memo: String(row["메모"] ?? row["memo"] ?? "").trim(),
  };
}

function downloadTemplate() {
  const header = COLUMNS.map((c) => c.label);
  const sample = ["", "가나디", "쿨링 재킷", "1", "상 95", "2026-08-20", "릴스", "100000", "협찬 예정", "", "", ""];
  const ws = XLSX.utils.aoa_to_sheet([header, sample]);
  ws["!cols"] = COLUMNS.map((c) => ({ wch: c.label === "메모" || c.label === "콘텐츠 URL" ? 30 : 16 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "제품협찬목록");
  XLSX.writeFile(wb, "workup_sponsors_template.xlsx");
}

export default function SponsorImportPage() {
  const [nicknameIndex, setNicknameIndex] = useState<Map<string, number[]> | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; inserted?: number; updated?: number; count?: number; error?: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/ih/influencers/lookup")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { influencers: { id: number; nickname: string }[] } | null) => {
        const map = new Map<string, number[]>();
        for (const inf of data?.influencers ?? []) {
          if (!map.has(inf.nickname)) map.set(inf.nickname, []);
          map.get(inf.nickname)!.push(inf.id);
        }
        setNicknameIndex(map);
      })
      .catch(() => setNicknameIndex(new Map()));
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !nicknameIndex) return;
    setFileName(file.name);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = new Uint8Array(ev.target!.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: "array", cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
      setRows(json.map((r, i) => parseRow(r, i, nicknameIndex)));
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
    const payload = validRows.map((r) => ({
      id: r.id ? Number(r.id) : undefined,
      influencer_id: r.influencerId as number,
      product: r.product,
      round: r.round ? Number(r.round) : null,
      support_type: r.support_type || null,
      content_format: r.content_format || null,
      send_date: r.send_date || null,
      upload_date: r.upload_date || null,
      content_url: r.content_url || null,
      cost: r.cost ? Number(r.cost) : null,
      status: r.status,
      memo: r.memo || null,
    }));
    const res = await fetch("/api/admin/ih/sponsors/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setResult(res.ok ? { ok: true, count: data.count, inserted: data.inserted, updated: data.updated } : { ok: false, error: data.error });
    setImporting(false);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-6 text-sm text-slate-600">
        <Link href="/admin/influencer-hub/sponsors" className="hover:text-slate-900">제품 협찬</Link>
        <span>/</span>
        <span className="text-slate-900 font-semibold">Excel 대량 업로드</span>
      </div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900">제품 협찬 Excel 업로드</h1>
          <p className="text-[14.5px] text-slate-500 mt-1">엑셀 파일로 여러 협찬을 한 번에 등록/수정합니다.</p>
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
        onClick={() => nicknameIndex && fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" />
        {!nicknameIndex ? (
          <p className="text-[14.5px] text-slate-500">인플루언서 목록을 불러오는 중…</p>
        ) : fileName ? (
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
          {result.ok ? `완료 — 신규 ${result.inserted ?? 0}건, 수정 ${result.updated ?? 0}건 (총 ${result.count}건)` : `오류: ${result.error}`}
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
                    {["행", "상태", "ID", "닉네임", "제품", "회차", "발송일", "비용", "오류"].map((h) => (
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
                      <td className="px-3 py-2.5 text-slate-700">{row.product || "-"}</td>
                      <td className="px-3 py-2.5 text-slate-600 tabular-nums">{row.round || "-"}</td>
                      <td className="px-3 py-2.5 text-slate-600 tabular-nums">{row.send_date || "-"}</td>
                      <td className="px-3 py-2.5 text-slate-600 tabular-nums">{row.cost || "-"}</td>
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
              {importing ? "등록 중…" : `${validRows.length}개 협찬 등록`}
            </button>
            {errorRows.length > 0 && <p className="text-[13.5px] text-red-500">오류 {errorRows.length}행은 건너뜁니다.</p>}
          </div>
        </>
      )}

      <div className="mt-10 bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100">
          <h2 className="text-[14px] font-bold text-slate-900">컬럼 가이드</h2>
          <p className="text-[13.5px] text-slate-500 mt-0.5">엑셀 1행(헤더)에 아래 컬럼명을 그대로 사용하세요. 닉네임은 기존 인플루언서와 정확히 일치해야 매칭됩니다.</p>
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
