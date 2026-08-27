"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { BRANCH_MKT_STATUS_ORDER, BRANCH_MKT_STATUS_LABEL, stripBranchPrefix } from "@/lib/ih/influencer-shared";

const COLUMNS = [
  { label: "ID", desc: "비우면 신규 / 채우면 해당 지점 마케팅 수정", req: false, ex: "" },
  { label: "지점명", desc: "매장명(일부만 일치해도 매칭, '워크업' 접두어는 없어도 됨)", req: true, ex: "인천부평점" },
  { label: "닉네임", desc: "인플루언서 닉네임(정확히 일치해야 매칭됨)", req: true, ex: "가나디" },
  { label: "진행일", desc: "YYYY-MM-DD", req: false, ex: "2026-08-20" },
  { label: "회차", desc: "숫자(비우면 자동)", req: false, ex: "1" },
  { label: "비용", desc: "숫자(원)", req: false, ex: "100000" },
  { label: "콘텐츠 형태", desc: "릴스/피드/스토리/쇼츠/유튜브 영상/블로그 등", req: false, ex: "릴스" },
  { label: "조회수", desc: "숫자", req: false, ex: "" },
  { label: "반응수", desc: "숫자", req: false, ex: "" },
  { label: "콘텐츠 URL", desc: "업로드된 콘텐츠 링크", req: false, ex: "" },
  { label: "상태", desc: BRANCH_MKT_STATUS_ORDER.map((s) => BRANCH_MKT_STATUS_LABEL[s]).join("/"), req: false, ex: "방문예정" },
  { label: "메모", desc: "자유 메모", req: false, ex: "" },
];

const STATUS_LABEL_TO_CODE: Record<string, string> = Object.fromEntries(
  BRANCH_MKT_STATUS_ORDER.map((code) => [BRANCH_MKT_STATUS_LABEL[code], code])
);

type ParsedRow = {
  _row: number;
  _error?: string;
  id: string;
  branchName: string;
  branchId: number | null;
  nickname: string;
  influencerId: number | null;
  marketing_date: string;
  round: string;
  cost: string;
  content_format: string;
  views: string;
  reactions: string;
  content_url: string;
  status: string;
  memo: string;
};

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

function parseRow(
  row: Record<string, unknown>,
  idx: number,
  nicknameIndex: Map<string, number[]>,
  branchIndex: Map<string, number[]>
): ParsedRow {
  const id = String(row["ID"] ?? row["id"] ?? "").trim();
  const branchName = String(row["지점명"] ?? row["branch"] ?? "").trim();
  const nickname = String(row["닉네임"] ?? row["nickname"] ?? "").trim();
  const statusRaw = String(row["상태"] ?? row["status"] ?? "").trim();
  let status = "VISIT_SCHEDULED";
  if (statusRaw) {
    if (STATUS_LABEL_TO_CODE[statusRaw]) status = STATUS_LABEL_TO_CODE[statusRaw];
    else if ((BRANCH_MKT_STATUS_ORDER as readonly string[]).includes(statusRaw)) status = statusRaw;
    else status = "";
  }

  const infMatches = nicknameIndex.get(nickname) ?? [];
  const branchKey = stripBranchPrefix(branchName).toLowerCase();
  const branchMatches = branchIndex.get(branchKey) ?? [];

  const errors: string[] = [];
  if (id && !/^\d+$/.test(id)) errors.push("ID는 숫자만");
  if (!branchName) errors.push("지점명 필수");
  else if (branchMatches.length === 0) errors.push("일치하는 지점 없음");
  else if (branchMatches.length > 1) errors.push("지점명 중복 — 특정할 수 없음");
  if (!nickname) errors.push("닉네임 필수");
  else if (infMatches.length === 0) errors.push("일치하는 인플루언서 없음");
  else if (infMatches.length > 1) errors.push("닉네임 중복 — 인플루언서를 특정할 수 없음");
  if (statusRaw && !status) errors.push("상태값 확인 필요");

  return {
    _row: idx + 2,
    _error: errors.length > 0 ? errors.join(", ") : undefined,
    id,
    branchName,
    branchId: branchMatches.length === 1 ? branchMatches[0] : null,
    nickname,
    influencerId: infMatches.length === 1 ? infMatches[0] : null,
    marketing_date: normalizeDate(row["진행일"] ?? row["marketing_date"]),
    round: String(row["회차"] ?? row["round"] ?? "").trim(),
    cost: String(row["비용"] ?? row["cost"] ?? "").trim(),
    content_format: String(row["콘텐츠 형태"] ?? row["content_format"] ?? "").trim(),
    views: String(row["조회수"] ?? row["views"] ?? "").trim(),
    reactions: String(row["반응수"] ?? row["reactions"] ?? "").trim(),
    content_url: String(row["콘텐츠 URL"] ?? row["content_url"] ?? "").trim(),
    status: status || "VISIT_SCHEDULED",
    memo: String(row["메모"] ?? row["memo"] ?? "").trim(),
  };
}

function downloadTemplate() {
  const header = COLUMNS.map((c) => c.label);
  const sample = ["", "인천부평점", "가나디", "2026-08-20", "1", "100000", "릴스", "", "", "", "방문예정", ""];
  const ws = XLSX.utils.aoa_to_sheet([header, sample]);
  ws["!cols"] = COLUMNS.map((c) => ({ wch: c.label === "메모" || c.label === "콘텐츠 URL" ? 30 : 16 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "지점마케팅목록");
  XLSX.writeFile(wb, "workup_branch_marketing_template.xlsx");
}

export default function BranchMarketingImportPage() {
  const [nicknameIndex, setNicknameIndex] = useState<Map<string, number[]> | null>(null);
  const [branchIndex, setBranchIndex] = useState<Map<string, number[]> | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; inserted?: number; updated?: number; count?: number; error?: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const ready = nicknameIndex != null && branchIndex != null;

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
    fetch("/api/admin/ih/branches")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { branches: { id: number; branch_name: string }[] } | null) => {
        const map = new Map<string, number[]>();
        for (const b of data?.branches ?? []) {
          const key = stripBranchPrefix(b.branch_name).toLowerCase();
          if (!map.has(key)) map.set(key, []);
          map.get(key)!.push(b.id);
        }
        setBranchIndex(map);
      })
      .catch(() => setBranchIndex(new Map()));
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !nicknameIndex || !branchIndex) return;
    setFileName(file.name);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = new Uint8Array(ev.target!.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: "array", cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
      setRows(json.map((r, i) => parseRow(r, i, nicknameIndex, branchIndex)));
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
      branch_id: r.branchId as number,
      activity_type: "INFLUENCER_VISIT" as const,
      marketing_date: r.marketing_date || null,
      round: r.round ? Number(r.round) : null,
      cost: r.cost ? Number(r.cost) : null,
      content_format: r.content_format || null,
      views: r.views ? Number(r.views) : null,
      reactions: r.reactions ? Number(r.reactions) : null,
      content_url: r.content_url || null,
      status: r.status,
      memo: r.memo || null,
    }));
    const res = await fetch("/api/admin/ih/branch-marketing/import", {
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
        <Link href="/admin/influencer-hub/branch-marketing" className="hover:text-slate-900">지점 마케팅</Link>
        <span>/</span>
        <span className="text-slate-900 font-semibold">Excel 대량 업로드</span>
      </div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900">지점 마케팅 Excel 업로드</h1>
          <p className="text-[14.5px] text-slate-500 mt-1">엑셀 파일로 여러 지점 마케팅을 한 번에 등록/수정합니다.</p>
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
        onClick={() => ready && fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" />
        {!ready ? (
          <p className="text-[14.5px] text-slate-500">인플루언서/지점 목록을 불러오는 중…</p>
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
                    {["행", "상태", "ID", "지점명", "닉네임", "진행일", "비용", "오류"].map((h) => (
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
                      <td className="px-3 py-2.5 text-slate-700">{row.branchName || "-"}</td>
                      <td className="px-3 py-2.5 font-medium text-slate-800">{row.nickname || <span className="text-red-400 italic">없음</span>}</td>
                      <td className="px-3 py-2.5 text-slate-600 tabular-nums">{row.marketing_date || "-"}</td>
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
              {importing ? "등록 중…" : `${validRows.length}개 지점 마케팅 등록`}
            </button>
            {errorRows.length > 0 && <p className="text-[13.5px] text-red-500">오류 {errorRows.length}행은 건너뜁니다.</p>}
          </div>
        </>
      )}

      <div className="mt-10 bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100">
          <h2 className="text-[14px] font-bold text-slate-900">컬럼 가이드</h2>
          <p className="text-[13.5px] text-slate-500 mt-0.5">엑셀 1행(헤더)에 아래 컬럼명을 그대로 사용하세요. 닉네임/지점명은 기존 데이터와 일치해야 매칭됩니다.</p>
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
