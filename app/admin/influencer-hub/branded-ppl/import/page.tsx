"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { BRANDED_PPL_CATEGORY_ORDER, BRANDED_PPL_CATEGORY_LABEL, BRANDED_PPL_STATUS_ORDER, BRANDED_PPL_STATUS_LABEL } from "@/lib/ih/influencer-shared";

const COLUMNS = [
  { label: "ID", desc: "비우면 신규 / 채우면 해당 항목 수정", req: false, ex: "" },
  { label: "구분", desc: BRANDED_PPL_CATEGORY_ORDER.map((c) => BRANDED_PPL_CATEGORY_LABEL[c]).join("/"), req: true, ex: "인플루언서" },
  { label: "이름", desc: "모델명/채널명/인플루언서명", req: true, ex: "가나디" },
  { label: "키", desc: "연예인 전용", req: false, ex: "" },
  { label: "의견", desc: "연예인 전용 — 포지셔닝 메모", req: false, ex: "" },
  { label: "계약 기준(기간)", desc: "연예인 전용 — 예: 6개월", req: false, ex: "" },
  { label: "구독자", desc: "PPL·인플루언서 전용 — 숫자만", req: false, ex: "13700" },
  { label: "메인패널", desc: "PPL 전용 — 출연진", req: false, ex: "" },
  { label: "광고상품", desc: "PPL·인플루언서 전용 — 콘텐츠 형태", req: false, ex: "릴스" },
  { label: "채널링크", desc: "PPL·인플루언서 전용", req: false, ex: "" },
  { label: "단가", desc: "숫자(원)", req: false, ex: "800000" },
  { label: "상태", desc: BRANDED_PPL_STATUS_ORDER.map((s) => BRANDED_PPL_STATUS_LABEL[s]).join("/"), req: false, ex: "협의중" },
  { label: "특징", desc: "자유 메모", req: false, ex: "" },
];

const CATEGORY_LABEL_TO_CODE: Record<string, string> = Object.fromEntries(
  BRANDED_PPL_CATEGORY_ORDER.map((code) => [BRANDED_PPL_CATEGORY_LABEL[code], code])
);
const STATUS_LABEL_TO_CODE: Record<string, string> = Object.fromEntries(
  BRANDED_PPL_STATUS_ORDER.map((code) => [BRANDED_PPL_STATUS_LABEL[code], code])
);

type ParsedRow = {
  _row: number;
  _error?: string;
  id: string;
  category: string;
  name: string;
  height: string;
  opinion: string;
  contract_period: string;
  subscriber_count: string;
  main_cast: string;
  ad_product: string;
  channel_link: string;
  cost: string;
  status: string;
  memo: string;
};

function parseRow(row: Record<string, unknown>, idx: number): ParsedRow {
  const id = String(row["ID"] ?? row["id"] ?? "").trim();
  const name = String(row["이름"] ?? row["name"] ?? "").trim();
  const categoryRaw = String(row["구분"] ?? row["category"] ?? "").trim();
  let category = "";
  if (categoryRaw) {
    if (CATEGORY_LABEL_TO_CODE[categoryRaw]) category = CATEGORY_LABEL_TO_CODE[categoryRaw];
    else if ((BRANDED_PPL_CATEGORY_ORDER as readonly string[]).includes(categoryRaw)) category = categoryRaw;
  }
  const statusRaw = String(row["상태"] ?? row["status"] ?? "").trim();
  let status = "NEGOTIATING";
  if (statusRaw) {
    if (STATUS_LABEL_TO_CODE[statusRaw]) status = STATUS_LABEL_TO_CODE[statusRaw];
    else if ((BRANDED_PPL_STATUS_ORDER as readonly string[]).includes(statusRaw)) status = statusRaw;
    else status = "";
  }
  const subscriberRaw = String(row["구독자"] ?? row["subscriber_count"] ?? "").replace(/[^0-9]/g, "");
  const costRaw = String(row["단가"] ?? row["cost"] ?? "").replace(/[^0-9]/g, "");

  const errors: string[] = [];
  if (id && !/^\d+$/.test(id)) errors.push("ID는 숫자만");
  if (!name) errors.push("이름 필수");
  if (!categoryRaw) errors.push("구분 필수");
  else if (!category) errors.push("구분값 확인 필요");
  if (statusRaw && !status) errors.push("상태값 확인 필요");

  return {
    _row: idx + 2,
    _error: errors.length > 0 ? errors.join(", ") : undefined,
    id,
    category: category || "INFLUENCER",
    name,
    height: String(row["키"] ?? row["height"] ?? "").trim(),
    opinion: String(row["의견"] ?? row["opinion"] ?? "").trim(),
    contract_period: String(row["계약 기준(기간)"] ?? row["contract_period"] ?? "").trim(),
    subscriber_count: subscriberRaw,
    main_cast: String(row["메인패널"] ?? row["main_cast"] ?? "").trim(),
    ad_product: String(row["광고상품"] ?? row["ad_product"] ?? "").trim(),
    channel_link: String(row["채널링크"] ?? row["channel_link"] ?? "").trim(),
    cost: costRaw,
    status: status || "NEGOTIATING",
    memo: String(row["특징"] ?? row["memo"] ?? "").trim(),
  };
}

function downloadTemplate() {
  const header = COLUMNS.map((c) => c.label);
  const sample = ["", "인플루언서", "가나디", "", "", "", "13700", "", "릴스", "", "800000", "협의중", ""];
  const ws = XLSX.utils.aoa_to_sheet([header, sample]);
  ws["!cols"] = COLUMNS.map((c) => ({ wch: c.label === "특징" || c.label === "채널링크" || c.label === "의견" ? 30 : 16 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "브랜디드PPL목록");
  XLSX.writeFile(wb, "workup_branded_ppl_template.xlsx");
}

export default function BrandedPplImportPage() {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; inserted?: number; updated?: number; count?: number; error?: string } | null>(null);
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
    const payload = validRows.map((r) => ({
      id: r.id ? Number(r.id) : undefined,
      category: r.category,
      name: r.name,
      height: r.height || null,
      opinion: r.opinion || null,
      contract_period: r.contract_period || null,
      subscriber_count: r.subscriber_count ? Number(r.subscriber_count) : null,
      main_cast: r.main_cast || null,
      ad_product: r.ad_product || null,
      channel_link: r.channel_link || null,
      cost: r.cost ? Number(r.cost) : null,
      status: r.status,
      memo: r.memo || null,
    }));
    const res = await fetch("/api/admin/ih/branded-ppl/import", {
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
        <Link href="/admin/influencer-hub/branded-ppl" className="hover:text-slate-900">브랜디드/PPL</Link>
        <span>/</span>
        <span className="text-slate-900 font-semibold">Excel 대량 업로드</span>
      </div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900">브랜디드/PPL Excel 업로드</h1>
          <p className="text-[14.5px] text-slate-500 mt-1">엑셀 파일로 여러 항목을 한 번에 등록/수정합니다.</p>
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
                    {["행", "상태", "ID", "구분", "이름", "단가", "오류"].map((h) => (
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
                      <td className="px-3 py-2.5 text-slate-700">{BRANDED_PPL_CATEGORY_LABEL[row.category] ?? row.category}</td>
                      <td className="px-3 py-2.5 font-medium text-slate-800">{row.name || <span className="text-red-400 italic">없음</span>}</td>
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
              {importing ? "등록 중…" : `${validRows.length}개 항목 등록`}
            </button>
            {errorRows.length > 0 && <p className="text-[13.5px] text-red-500">오류 {errorRows.length}행은 건너뜁니다.</p>}
          </div>
        </>
      )}

      <div className="mt-10 bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100">
          <h2 className="text-[14px] font-bold text-slate-900">컬럼 가이드</h2>
          <p className="text-[13.5px] text-slate-500 mt-0.5">엑셀 1행(헤더)에 아래 컬럼명을 그대로 사용하세요.</p>
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
