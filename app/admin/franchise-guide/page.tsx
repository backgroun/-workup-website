"use client";
import { useEffect, useState } from "react";
import FranchiseGuide from "@/components/FranchiseGuide";
import AdminImageField from "@/components/admin/AdminImageField";
import {
  DEFAULT_FRANCHISE_GUIDE,
  normalizeFranchiseGuide,
  type FranchiseGuideConfig,
  type GuideStyleKey,
  type GuideColors,
  type TextStyle,
  type ReqGroup,
  type GuidePoint,
  type GuideBenefit,
} from "@/data/franchise-guide";

const POINT_MEDIA_LABEL = ["사진", "5km 그래픽", "無·0원 카드"];
const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</p>
      {children}
    </div>
  );
}

function NumIn({ label, v, step, min, max, unit, onC }: { label: string; v: number; step: number; min: number; max: number; unit?: string; onC: (v: number) => void }) {
  return (
    <label className="flex items-center gap-1 whitespace-nowrap">
      <span className="text-gray-400">{label}</span>
      <input type="number" value={v} step={step} min={min} max={max} onChange={(e) => onC(Number(e.target.value))}
        className="w-14 border border-gray-200 rounded px-1.5 py-1 text-[11px] text-right focus:outline-none focus:border-blue-400" />
      {unit && <span className="text-gray-300">{unit}</span>}
    </label>
  );
}

// 요소별 스타일(크기·자간·행간·색) 컨트롤
function StyleControls({ value, onChange }: { value: TextStyle; onChange: (patch: Partial<TextStyle>) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
      <NumIn label="크기" v={value.size} step={1} min={8} max={96} unit="px" onC={(v) => onChange({ size: v })} />
      <NumIn label="자간" v={value.tracking} step={0.01} min={-0.1} max={0.5} unit="em" onC={(v) => onChange({ tracking: v })} />
      <NumIn label="행간" v={value.leading} step={0.05} min={0.8} max={2.4} onC={(v) => onChange({ leading: v })} />
      <label className="flex items-center gap-1">
        <span className="text-gray-400">색</span>
        <input type="color" value={value.color} onChange={(e) => onChange({ color: e.target.value })} className="w-6 h-6 rounded border border-gray-200 p-0.5 cursor-pointer" />
      </label>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-9 h-8 rounded border border-gray-200 p-0.5 cursor-pointer flex-shrink-0" />
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="w-24 border border-gray-200 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-blue-400" />
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}

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
  const setStyle = (k: GuideStyleKey, patch: Partial<TextStyle>) =>
    setCfg((p) => ({ ...p, styles: { ...p.styles, [k]: { ...p.styles[k], ...patch } } }));
  const setColor = (k: keyof GuideColors, v: string) =>
    setCfg((p) => ({ ...p, colors: { ...p.colors, [k]: v } }));
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
    } catch { flash("저장에 실패했습니다."); } finally { setSaving(false); }
  };

  if (loading) return <div className="p-6 text-sm text-gray-400">불러오는 중...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">창업안내 페이지 편집</h1>
          <p className="mt-1 text-sm text-gray-500">텍스트·크기·자간·행간·색상·배경·사진을 모두 편집합니다. 오른쪽 미리보기에 즉시 반영됩니다.</p>
        </div>
        <div className="flex items-center gap-3">
          {toast && <span className="text-sm font-medium text-green-600">{toast}</span>}
          <a href="/franchise" target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 border border-slate-200 text-slate-500 text-sm font-medium rounded-lg hover:bg-slate-50">실제 페이지 ↗</a>
          <button onClick={save} disabled={saving} className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? "저장 중..." : "저장"}</button>
        </div>
      </div>

      <div className="grid xl:grid-cols-[1fr_440px] gap-6 items-start">
        {/* 편집 */}
        <div className="space-y-5">
          <Card title="색상 · 배경">
            <div className="grid sm:grid-cols-2 gap-3">
              <ColorField label="강조색(오렌지)" value={cfg.colors.accent} onChange={(v) => setColor("accent", v)} />
              <ColorField label="페이지 배경" value={cfg.colors.page_bg} onChange={(v) => setColor("page_bg", v)} />
              <ColorField label="헤더 배경" value={cfg.colors.header_bg} onChange={(v) => setColor("header_bg", v)} />
              <ColorField label="카드 배경" value={cfg.colors.card_bg} onChange={(v) => setColor("card_bg", v)} />
              <ColorField label="가맹수 배경" value={cfg.colors.cta_bg} onChange={(v) => setColor("cta_bg", v)} />
            </div>
          </Card>

          <Card title="사진">
            <div className="grid sm:grid-cols-2 gap-5">
              <AdminImageField label="창업 포인트 01 사진" value={cfg.team_img} onChange={(url) => setC({ team_img: url })} promptType="person" promptSeed="워크업 매장 작업자 팀" recommendedSize="800x520" />
            </div>
          </Card>

          <Card title="상단 헤더">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">큰 제목 <span className="text-gray-400 font-normal">(줄바꿈 가능, 중앙정렬 한 줄로 표시)</span></label>
              <textarea value={cfg.title} onChange={(e) => setC({ title: e.target.value })} rows={2} className={inputCls + " resize-none"} />
              <StyleControls value={cfg.styles.title} onChange={(p) => setStyle("title", p)} />
            </div>
          </Card>

          <Card title="필요조건 / 매출액 / 가맹비 / 지역 (2x2)">
            <div className="space-y-2">
              <p className="text-[11px] text-gray-500 font-medium">제목 스타일(공통)</p>
              <StyleControls value={cfg.styles.req_title} onChange={(p) => setStyle("req_title", p)} />
              <p className="text-[11px] text-gray-500 font-medium mt-2">항목 스타일(공통)</p>
              <StyleControls value={cfg.styles.req_item} onChange={(p) => setStyle("req_item", p)} />
            </div>
            <div className="space-y-4 border-t border-slate-100 pt-4">
              {cfg.requirements.map((r, i) => (
                <div key={i} className="border border-slate-100 rounded-lg p-3.5 space-y-2.5 bg-slate-50/40">
                  <span className="text-[10px] text-slate-400">{i + 1}번 아이콘 고정</span>
                  <input value={r.title} onChange={(e) => setReq(i, { title: e.target.value })} placeholder="제목" className={inputCls + " bg-white font-medium"} />
                  <div className="space-y-1.5">
                    {r.items.map((it, j) => (
                      <div key={j} className="flex gap-2">
                        <input value={it} onChange={(e) => setReqItem(i, j, e.target.value)} className="flex-1 border border-gray-200 rounded px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-400" />
                        <button onClick={() => removeReqItem(i, j)} className="w-8 flex items-center justify-center rounded border border-red-200 text-red-400 hover:bg-red-50">✕</button>
                      </div>
                    ))}
                    <button onClick={() => addReqItem(i)} className="text-xs font-semibold text-blue-600 hover:text-blue-800">+ 항목 추가</button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="창업 포인트">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">소제목 (eyebrow)</label>
              <input value={cfg.eyebrow} onChange={(e) => setC({ eyebrow: e.target.value })} className={inputCls} />
              <StyleControls value={cfg.styles.eyebrow} onChange={(p) => setStyle("eyebrow", p)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">섹션 제목</label>
              <input value={cfg.section_title} onChange={(e) => setC({ section_title: e.target.value })} className={inputCls} />
              <StyleControls value={cfg.styles.section_title} onChange={(p) => setStyle("section_title", p)} />
            </div>
            <div className="border-t border-slate-100 pt-4 space-y-2">
              <p className="text-[11px] text-gray-500 font-medium">번호 스타일 / 제목 스타일 / 설명 스타일 (공통)</p>
              <StyleControls value={cfg.styles.point_no} onChange={(p) => setStyle("point_no", p)} />
              <StyleControls value={cfg.styles.point_title} onChange={(p) => setStyle("point_title", p)} />
              <StyleControls value={cfg.styles.point_desc} onChange={(p) => setStyle("point_desc", p)} />
            </div>
            <div className="space-y-4">
              {cfg.points.map((p, i) => (
                <div key={i} className="border border-slate-100 rounded-lg p-3.5 space-y-2.5 bg-slate-50/40">
                  <span className="text-[10px] text-slate-400">{String(i + 1).padStart(2, "0")} · {POINT_MEDIA_LABEL[i]} 고정</span>
                  <textarea value={p.title} onChange={(e) => setPoint(i, { title: e.target.value })} rows={2} placeholder="제목(줄바꿈 가능)" className={inputCls + " bg-white resize-none"} />
                  <textarea value={p.desc} onChange={(e) => setPoint(i, { desc: e.target.value })} rows={2} placeholder="설명(줄바꿈 가능)" className={inputCls + " bg-white resize-none"} />
                </div>
              ))}
            </div>
          </Card>

          <Card title="하단 혜택 (4개)">
            <StyleControls value={cfg.styles.benefit} onChange={(p) => setStyle("benefit", p)} />
            <div className="grid sm:grid-cols-2 gap-3">
              {cfg.benefits.map((b, i) => (
                <div key={i} className="border border-slate-100 rounded-lg p-3 space-y-2 bg-slate-50/40">
                  <span className="text-[10px] text-slate-400">{i + 1}번</span>
                  <input value={b.line1} onChange={(e) => setBenefit(i, { line1: e.target.value })} placeholder="1행" className="w-full border border-gray-200 rounded px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-400" />
                  <input value={b.line2} onChange={(e) => setBenefit(i, { line2: e.target.value })} placeholder="2행" className="w-full border border-gray-200 rounded px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-400" />
                </div>
              ))}
            </div>
          </Card>

          <Card title="계약 가맹수">
            <p className="text-[11px] text-gray-400 leading-relaxed">가운데 숫자는 <b>실제 활성 매장 수로 자동 반영</b>됩니다. 앞뒤 문구·스타일과, 매장 수가 0일 때 표시할 기본값만 설정하세요.</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] text-gray-500">앞 문구</label>
                <input value={cfg.cta_prefix} onChange={(e) => setC({ cta_prefix: e.target.value })} className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] text-gray-500">뒤 문구</label>
                <input value={cfg.cta_suffix} onChange={(e) => setC({ cta_suffix: e.target.value })} className={inputCls} />
              </div>
            </div>
            <div className="space-y-1"><p className="text-[11px] text-gray-500">문구 스타일</p><StyleControls value={cfg.styles.cta_label} onChange={(p) => setStyle("cta_label", p)} /></div>
            <div className="space-y-1"><p className="text-[11px] text-gray-500">숫자 스타일</p><StyleControls value={cfg.styles.cta_number} onChange={(p) => setStyle("cta_number", p)} /></div>
            <div className="w-40">
              <label className="text-[11px] text-gray-500 block mb-1">기본값 (매장 수 0일 때)</label>
              <input type="number" min={0} value={cfg.count_fallback} onChange={(e) => setC({ count_fallback: Math.max(0, Number(e.target.value) || 0) })} className={inputCls} />
            </div>
          </Card>
        </div>

        {/* 실시간 미리보기 */}
        <div className="xl:sticky xl:top-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">실시간 미리보기</p>
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="max-h-[82vh] overflow-y-auto">
              <FranchiseGuide config={cfg} storeCount={0} embedded />
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">좁은 폭 미리보기입니다. 데스크톱 배치는 <a href="/franchise" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">실제 페이지 ↗</a>에서 확인하세요.</p>
        </div>
      </div>
    </div>
  );
}
