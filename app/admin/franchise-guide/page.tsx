"use client";
import { useEffect, useState } from "react";
import {
  DEFAULT_FRANCHISE_GUIDE,
  normalizeFranchiseGuide,
  type FranchiseGuideConfig,
  type ReqGroup,
  type GuidePoint,
  type GuideBenefit,
} from "@/data/franchise-guide";

const REQ_ICON_LABEL = ["매장 아이콘", "차트 아이콘", "핀 아이콘"];
const POINT_MEDIA_LABEL = ["사진", "5km 그래픽", "無·0원 카드"];

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</p>
      {children}
    </div>
  );
}
const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400";

export default function FranchiseGuideEditPage() {
  const [cfg, setCfg] = useState<FranchiseGuideConfig>(DEFAULT_FRANCHISE_GUIDE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    fetch("/api/admin/site-settings/franchise_guide")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Partial<FranchiseGuideConfig> | null) => setCfg(normalizeFranchiseGuide(d)))
      .catch(() => setCfg(DEFAULT_FRANCHISE_GUIDE))
      .finally(() => setLoading(false));
  }, []);

  const flash = (t: string) => { setToast(t); setTimeout(() => setToast(""), 2500); };
  const setC = (patch: Partial<FranchiseGuideConfig>) => setCfg((p) => ({ ...p, ...patch }));
  const setReq = (i: number, patch: Partial<ReqGroup>) =>
    setCfg((p) => ({ ...p, requirements: p.requirements.map((r, idx) => (idx === i ? { ...r, ...patch } : r)) }));
  const setReqItem = (i: number, j: number, v: string) =>
    setReq(i, { items: cfg.requirements[i].items.map((it, idx) => (idx === j ? v : it)) });
  const addReqItem = (i: number) => setReq(i, { items: [...cfg.requirements[i].items, ""] });
  const removeReqItem = (i: number, j: number) => setReq(i, { items: cfg.requirements[i].items.filter((_, idx) => idx !== j) });
  const setPoint = (i: number, patch: Partial<GuidePoint>) =>
    setCfg((p) => ({ ...p, points: p.points.map((pt, idx) => (idx === i ? { ...pt, ...patch } : pt)) }));
  const setBenefit = (i: number, patch: Partial<GuideBenefit>) =>
    setCfg((p) => ({ ...p, benefits: p.benefits.map((b, idx) => (idx === i ? { ...b, ...patch } : b)) }));

  const save = async () => {
    setSaving(true);
    try {
      const cleaned = normalizeFranchiseGuide(cfg);
      const r = await fetch("/api/admin/site-settings/franchise_guide", {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cleaned),
      });
      if (r.ok) setCfg(cleaned);
      flash(r.ok ? "저장됐습니다. 사이트에 바로 반영됩니다." : "저장에 실패했습니다.");
    } catch {
      flash("저장에 실패했습니다.");
    } finally { setSaving(false); }
  };

  if (loading) return <div className="p-6 text-sm text-gray-400">불러오는 중...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">창업안내 페이지 편집</h1>
          <p className="mt-1 text-sm text-gray-500">/franchise 및 가맹 문의 페이지 팝업에 노출되는 창업안내 내용을 관리합니다.</p>
        </div>
        <div className="flex items-center gap-3">
          {toast && <span className="text-sm font-medium text-green-600">{toast}</span>}
          <a href="/franchise" target="_blank" rel="noopener noreferrer"
            className="px-4 py-2.5 border border-slate-200 text-slate-500 text-sm font-medium rounded-lg hover:bg-slate-50">실제 페이지 ↗</a>
          <button onClick={save} disabled={saving}
            className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* 헤더 */}
        <Card title="상단 헤더">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">워드마크</label>
            <input value={cfg.wordmark} onChange={(e) => setC({ wordmark: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">큰 제목 <span className="text-gray-400 font-normal">(줄바꿈 가능)</span></label>
            <textarea value={cfg.title} onChange={(e) => setC({ title: e.target.value })} rows={2} className={inputCls + " resize-none"} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">부제목</label>
            <input value={cfg.subtitle} onChange={(e) => setC({ subtitle: e.target.value })} className={inputCls} />
          </div>
        </Card>

        {/* 필요조건 3단 */}
        <Card title="필요조건 / 매출액 / 지역 (3단)">
          <div className="space-y-4">
            {cfg.requirements.map((r, i) => (
              <div key={i} className="border border-slate-100 rounded-lg p-3.5 space-y-2.5 bg-slate-50/40">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">{i + 1}번 · {REQ_ICON_LABEL[i]}(고정)</span>
                </div>
                <input value={r.title} onChange={(e) => setReq(i, { title: e.target.value })} placeholder="제목"
                  className={inputCls + " bg-white font-medium"} />
                <div className="space-y-1.5">
                  {r.items.map((it, j) => (
                    <div key={j} className="flex gap-2">
                      <input value={it} onChange={(e) => setReqItem(i, j, e.target.value)}
                        className="flex-1 border border-gray-200 rounded px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-400" />
                      <button onClick={() => removeReqItem(i, j)} title="삭제"
                        className="w-8 flex items-center justify-center rounded border border-red-200 text-red-400 hover:bg-red-50">✕</button>
                    </div>
                  ))}
                  <button onClick={() => addReqItem(i)} className="text-xs font-semibold text-blue-600 hover:text-blue-800">+ 항목 추가</button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* 창업 포인트 3개 */}
        <Card title="창업 포인트 (3개 · 미디어 고정)">
          <div className="space-y-4">
            {cfg.points.map((p, i) => (
              <div key={i} className="border border-slate-100 rounded-lg p-3.5 space-y-2.5 bg-slate-50/40">
                <span className="text-[10px] text-slate-400">{String(i + 1).padStart(2, "0")} · {POINT_MEDIA_LABEL[i]}(고정)</span>
                <div>
                  <label className="text-[11px] text-gray-500 block mb-1">제목 (줄바꿈 가능)</label>
                  <textarea value={p.title} onChange={(e) => setPoint(i, { title: e.target.value })} rows={2}
                    className={inputCls + " bg-white resize-none"} />
                </div>
                <div>
                  <label className="text-[11px] text-gray-500 block mb-1">설명 (줄바꿈 가능)</label>
                  <textarea value={p.desc} onChange={(e) => setPoint(i, { desc: e.target.value })} rows={2}
                    className={inputCls + " bg-white resize-none"} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* 하단 혜택 4개 */}
        <Card title="하단 혜택 (4개 · 아이콘 고정)">
          <div className="grid sm:grid-cols-2 gap-3">
            {cfg.benefits.map((b, i) => (
              <div key={i} className="border border-slate-100 rounded-lg p-3 space-y-2 bg-slate-50/40">
                <span className="text-[10px] text-slate-400">{i + 1}번</span>
                <input value={b.line1} onChange={(e) => setBenefit(i, { line1: e.target.value })} placeholder="1행"
                  className="w-full border border-gray-200 rounded px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-400" />
                <input value={b.line2} onChange={(e) => setBenefit(i, { line2: e.target.value })} placeholder="2행"
                  className="w-full border border-gray-200 rounded px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-400" />
              </div>
            ))}
          </div>
        </Card>

        {/* 가맹수 CTA */}
        <Card title="계약 가맹수">
          <p className="text-[11px] text-gray-400 leading-relaxed">가운데 숫자는 <b>실제 활성 매장 수로 자동 반영</b>됩니다. 앞뒤 문구와, 매장 데이터가 없을 때 표시할 기본값만 설정하세요.</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-gray-500 block mb-1">앞 문구</label>
              <input value={cfg.cta_prefix} onChange={(e) => setC({ cta_prefix: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="text-[11px] text-gray-500 block mb-1">뒤 문구</label>
              <input value={cfg.cta_suffix} onChange={(e) => setC({ cta_suffix: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div className="w-40">
            <label className="text-[11px] text-gray-500 block mb-1">기본값 (매장 수 0일 때)</label>
            <input type="number" min={0} value={cfg.count_fallback}
              onChange={(e) => setC({ count_fallback: Math.max(0, Number(e.target.value) || 0) })} className={inputCls} />
          </div>
          <p className="text-sm text-slate-500">미리보기: <b className="text-slate-800">{cfg.cta_prefix} <span className="text-[#ff550c]">(매장수)</span> {cfg.cta_suffix}</b></p>
        </Card>
      </div>
    </div>
  );
}
