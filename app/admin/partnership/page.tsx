"use client";
import { useEffect, useState } from "react";
import PartnershipPanel from "@/components/PartnershipPanel";
import {
  DEFAULT_PARTNERSHIP,
  normalizePartnership,
  type PartnershipConfig,
  type PartnerInfo,
  type PartnerStyles,
  type TextStyle,
  type InquiryType,
  type FormConfig,
  type FormFieldText,
} from "@/data/partnership";

const COLOR_PRESETS = ["#ff550c", "#1A2B4A", "#2d4f72", "#0f172a", "#ffffff", "#d1d5db", "#9ca3af", "#6b7280"];

// ── 색상 입력(피커 + hex + 프리셋) ──
function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
        className="w-10 h-9 rounded border border-gray-200 cursor-pointer p-0.5 flex-shrink-0" />
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
        className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-400" />
      <div className="flex gap-1">
        {COLOR_PRESETS.map((c) => (
          <button key={c} type="button" title={c} onClick={() => onChange(c)}
            className="w-6 h-6 rounded border border-gray-200 hover:scale-110 transition-transform" style={{ backgroundColor: c }} />
        ))}
      </div>
    </div>
  );
}

// ── 텍스트 필드 (내용 + 크기 + 색상) ──
function StyledField({
  label, value, textarea, placeholder, onText, style, onStyle,
}: {
  label: string; value: string; textarea?: boolean; placeholder?: string;
  onText: (v: string) => void; style: TextStyle; onStyle: (p: Partial<TextStyle>) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 block">{label}</label>
      {textarea ? (
        <textarea value={value} onChange={(e) => onText(e.target.value)} rows={3} placeholder={placeholder}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none" />
      ) : (
        <input type="text" value={value} onChange={(e) => onText(e.target.value)} placeholder={placeholder}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
      )}
      <div className="flex items-center gap-5 flex-wrap pl-0.5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-400">크기</span>
          <input type="range" min={8} max={48} value={style.size} onChange={(e) => onStyle({ size: Number(e.target.value) })}
            className="w-24 accent-blue-600 h-1.5" />
          <span className="text-[11px] font-mono text-slate-500 w-9">{style.size}px</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-400">색상</span>
          <input type="color" value={style.color} onChange={(e) => onStyle({ color: e.target.value })}
            className="w-8 h-7 rounded border border-gray-200 cursor-pointer p-0.5 flex-shrink-0" />
          <input type="text" value={style.color} onChange={(e) => onStyle({ color: e.target.value })}
            className="w-20 border border-gray-200 rounded px-2 py-1 text-[11px] font-mono focus:outline-none focus:border-blue-400" />
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</p>
      {children}
    </div>
  );
}

const TABS: { key: InquiryType; label: string; href: string }[] = [
  { key: "franchise", label: "가맹·창업", href: "/partnership/franchise" },
  { key: "wholesale", label: "입점·제휴", href: "/partnership/wholesale" },
];

export default function PartnershipEditPage() {
  const [cfg, setCfg] = useState<PartnershipConfig>(DEFAULT_PARTNERSHIP);
  const [tab, setTab] = useState<InquiryType>("franchise");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    fetch("/api/admin/site-settings/partnership_page")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Partial<PartnershipConfig> | null) => setCfg(normalizePartnership(d)))
      .catch(() => setCfg(DEFAULT_PARTNERSHIP))
      .finally(() => setLoading(false));
  }, []);

  const flash = (t: string) => { setToast(t); setTimeout(() => setToast(""), 2500); };
  const info = cfg[tab];

  const patchInfo = (patch: Partial<PartnerInfo>) =>
    setCfg((prev) => ({ ...prev, [tab]: { ...prev[tab], ...patch } }));

  const patchStyles = (patch: Partial<PartnerStyles>) =>
    setCfg((prev) => ({ ...prev, [tab]: { ...prev[tab], styles: { ...prev[tab].styles, ...patch } } }));

  // TextStyle 키 하나의 일부만 갱신
  const patchStyle = (key: keyof PartnerStyles, patch: Partial<TextStyle>) =>
    patchStyles({ [key]: { ...(info.styles[key] as TextStyle), ...patch } } as Partial<PartnerStyles>);

  // 폼 설정
  const patchForm = (patch: Partial<FormConfig>) =>
    setCfg((prev) => ({ ...prev, [tab]: { ...prev[tab], form: { ...prev[tab].form, ...patch } } }));
  const patchFormStyle = (key: "label_style" | "footer_style", patch: Partial<TextStyle>) =>
    patchForm({ [key]: { ...info.form[key], ...patch } } as Partial<FormConfig>);
  const setField = (i: number, patch: Partial<FormFieldText>) =>
    patchForm({ fields: info.form.fields.map((fld, idx) => (idx === i ? { ...fld, ...patch } : fld)) });

  // 혜택 리스트
  const setBenefit = (i: number, v: string) =>
    patchInfo({ benefits: info.benefits.map((b, idx) => (idx === i ? v : b)) });
  const addBenefit = () => patchInfo({ benefits: [...info.benefits, ""] });
  const removeBenefit = (i: number) => patchInfo({ benefits: info.benefits.filter((_, idx) => idx !== i) });
  const moveBenefit = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= info.benefits.length) return;
    const next = [...info.benefits];
    [next[i], next[j]] = [next[j], next[i]];
    patchInfo({ benefits: next });
  };

  const resetTab = () => {
    if (!confirm(`${TABS.find((t) => t.key === tab)?.label} 페이지를 기본값으로 되돌릴까요? (저장 전까지 실제 반영 안 됨)`)) return;
    setCfg((prev) => ({ ...prev, [tab]: DEFAULT_PARTNERSHIP[tab] }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/admin/site-settings/partnership_page", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg),
      });
      flash(r.ok ? "저장됐습니다. 사이트에 바로 반영됩니다." : "저장에 실패했습니다.");
    } catch {
      flash("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-sm text-gray-400">불러오는 중...</div>;

  const activeTab = TABS.find((t) => t.key === tab)!;

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">가맹·입점 페이지 편집</h1>
          <p className="mt-1 text-sm text-gray-500">가맹·창업 / 입점·제휴 문의 페이지의 문구·글자 크기·색상을 자유롭게 편집합니다.</p>
        </div>
        <div className="flex items-center gap-3">
          {toast && <span className="text-sm font-medium text-green-600">{toast}</span>}
          <a href={activeTab.href} target="_blank" rel="noopener noreferrer"
            className="px-4 py-2.5 border border-slate-200 text-slate-500 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
            실제 페이지 ↗
          </a>
          <button onClick={resetTab}
            className="px-4 py-2.5 border border-slate-200 text-slate-500 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
            기본값
          </button>
          <button onClick={save} disabled={saving}
            className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50">
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 mb-6 bg-slate-100 rounded-xl p-1 w-fit">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${tab === t.key ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* 왼쪽: 편집 */}
        <div className="space-y-6">
          <Card title="패널 상단">
            <StyledField label="소제목 (eyebrow)" value={info.eyebrow} placeholder="Partnership"
              onText={(v) => patchInfo({ eyebrow: v })} style={info.styles.eyebrow} onStyle={(p) => patchStyle("eyebrow", p)} />
            <StyledField label="패널 제목" value={info.panel_title}
              onText={(v) => patchInfo({ panel_title: v })} style={info.styles.panel_title} onStyle={(p) => patchStyle("panel_title", p)} />
            <StyledField label="패널 설명" value={info.panel_desc} textarea
              onText={(v) => patchInfo({ panel_desc: v })} style={info.styles.panel_desc} onStyle={(p) => patchStyle("panel_desc", p)} />
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">패널 배경색</label>
              <ColorInput value={info.panel_bg} onChange={(v) => patchInfo({ panel_bg: v })} />
            </div>
          </Card>

          <Card title={`혜택 리스트 (${info.benefits.length})`}>
            <div className="space-y-2">
              {info.benefits.map((b, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="text" value={b} onChange={(e) => setBenefit(i, e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                  <button onClick={() => moveBenefit(i, -1)} disabled={i === 0} title="위로"
                    className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30">↑</button>
                  <button onClick={() => moveBenefit(i, 1)} disabled={i === info.benefits.length - 1} title="아래로"
                    className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30">↓</button>
                  <button onClick={() => removeBenefit(i)} title="삭제"
                    className="w-7 h-7 flex items-center justify-center rounded border border-red-200 text-red-400 hover:bg-red-50">✕</button>
                </div>
              ))}
              <button onClick={addBenefit}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800">+ 혜택 추가</button>
            </div>
            <div className="border-t border-slate-100 pt-4 flex items-center gap-5 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-400">글자 크기</span>
                <input type="range" min={8} max={32} value={info.styles.benefits.size}
                  onChange={(e) => patchStyle("benefits", { size: Number(e.target.value) })} className="w-24 accent-blue-600 h-1.5" />
                <span className="text-[11px] font-mono text-slate-500 w-9">{info.styles.benefits.size}px</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-400">글자색</span>
                <input type="color" value={info.styles.benefits.color} onChange={(e) => patchStyle("benefits", { color: e.target.value })}
                  className="w-8 h-7 rounded border border-gray-200 cursor-pointer p-0.5" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-400">불릿색</span>
                <input type="color" value={info.styles.bullet_color} onChange={(e) => patchStyles({ bullet_color: e.target.value })}
                  className="w-8 h-7 rounded border border-gray-200 cursor-pointer p-0.5" />
              </div>
            </div>
          </Card>

          <Card title="연락처">
            <StyledField label="전화 라벨" value={info.phone_label} placeholder="직통 전화"
              onText={(v) => patchInfo({ phone_label: v })} style={info.styles.phone_label} onStyle={(p) => patchStyle("phone_label", p)} />
            <StyledField label="전화번호" value={info.phone}
              onText={(v) => patchInfo({ phone: v })} style={info.styles.phone} onStyle={(p) => patchStyle("phone", p)} />
            <StyledField label="운영 시간" value={info.hours}
              onText={(v) => patchInfo({ hours: v })} style={info.styles.hours} onStyle={(p) => patchStyle("hours", p)} />
          </Card>

          <Card title="폼 영역 제목">
            <StyledField label="폼 제목" value={info.form_title}
              onText={(v) => patchInfo({ form_title: v })} style={info.styles.form_title} onStyle={(p) => patchStyle("form_title", p)} />
            <StyledField label="폼 안내 문구 (선택 · 비우면 숨김)" value={info.form_desc} textarea placeholder="폼 위에 노출할 안내 문구"
              onText={(v) => patchInfo({ form_desc: v })} style={info.styles.form_desc} onStyle={(p) => patchStyle("form_desc", p)} />
          </Card>

          <Card title="문의 폼">
            {/* 필드 (라벨·플레이스홀더) */}
            <div className="space-y-2.5">
              <p className="text-[11px] text-gray-400">필드 항목 — 순서·필수여부·입력형식은 고정, 라벨·안내문구만 편집됩니다.</p>
              {info.form.fields.map((fld, i) => (
                <div key={fld.key} className="border border-slate-100 rounded-lg p-3 space-y-2 bg-slate-50/40">
                  <span className="text-[10px] font-mono text-slate-400">{fld.key}</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-gray-500 block mb-1">라벨</label>
                      <input value={fld.label} onChange={(e) => setField(i, { label: e.target.value })}
                        className="w-full border border-gray-200 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-400 bg-white" />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-500 block mb-1">입력 안내(placeholder)</label>
                      <input value={fld.placeholder} onChange={(e) => setField(i, { placeholder: e.target.value })}
                        className="w-full border border-gray-200 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-400 bg-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 라벨·입력 글자 스타일 */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-[11px] text-gray-500 w-16 font-medium">라벨</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-400">크기</span>
                  <input type="range" min={9} max={20} value={info.form.label_style.size}
                    onChange={(e) => patchFormStyle("label_style", { size: Number(e.target.value) })} className="w-20 accent-blue-600 h-1.5" />
                  <span className="text-[11px] font-mono text-slate-500 w-9">{info.form.label_style.size}px</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-400">색</span>
                  <input type="color" value={info.form.label_style.color} onChange={(e) => patchFormStyle("label_style", { color: e.target.value })}
                    className="w-8 h-7 rounded border border-gray-200 cursor-pointer p-0.5" />
                </div>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-[11px] text-gray-500 w-16 font-medium">입력 글자</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-400">크기</span>
                  <input type="range" min={11} max={20} value={info.form.input_size}
                    onChange={(e) => patchForm({ input_size: Number(e.target.value) })} className="w-20 accent-blue-600 h-1.5" />
                  <span className="text-[11px] font-mono text-slate-500 w-9">{info.form.input_size}px</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-400">색</span>
                  <input type="color" value={info.form.input_color} onChange={(e) => patchForm({ input_color: e.target.value })}
                    className="w-8 h-7 rounded border border-gray-200 cursor-pointer p-0.5" />
                </div>
              </div>
            </div>

            {/* 제출 버튼 */}
            <div className="border-t border-slate-100 pt-4 space-y-2">
              <label className="text-sm font-medium text-gray-700 block">제출 버튼 문구</label>
              <input value={info.form.submit_text} onChange={(e) => patchForm({ submit_text: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
              <div className="flex items-center gap-5 flex-wrap pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-400">배경색</span>
                  <input type="color" value={info.form.button_bg} onChange={(e) => patchForm({ button_bg: e.target.value })}
                    className="w-8 h-7 rounded border border-gray-200 cursor-pointer p-0.5" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-400">글자색</span>
                  <input type="color" value={info.form.button_color} onChange={(e) => patchForm({ button_color: e.target.value })}
                    className="w-8 h-7 rounded border border-gray-200 cursor-pointer p-0.5" />
                </div>
              </div>
            </div>

            {/* 하단 안내 */}
            <div className="border-t border-slate-100 pt-4">
              <StyledField label="하단 안내 문구" value={info.form.footer_text}
                onText={(v) => patchForm({ footer_text: v })} style={info.form.footer_style} onStyle={(p) => patchFormStyle("footer_style", p)} />
            </div>

            {/* 접수 완료 메시지 */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">접수 완료 제목</label>
                <input value={info.form.success_title} onChange={(e) => patchForm({ success_title: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">접수 완료 설명</label>
                <textarea value={info.form.success_desc} onChange={(e) => patchForm({ success_desc: e.target.value })} rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none" />
              </div>
            </div>

            {/* 개인정보 동의 (가맹 전용) */}
            {tab === "franchise" && (
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <p className="text-[11px] text-gray-400">개인정보 동의 (가맹·창업 전용)</p>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">동의 문구</label>
                  <input value={info.form.consent_text} onChange={(e) => patchForm({ consent_text: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                  <p className="text-[10px] text-gray-400 mt-1">앞의 <b>[필수]</b> 배지와 <b>내용 보기</b> 링크·상세 팝업은 고정입니다.</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">동의 보조 문구 (비우면 숨김)</label>
                  <input value={info.form.consent_note} onChange={(e) => patchForm({ consent_note: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                </div>
              </div>
            )}
          </Card>

          <Card title="검색 노출 (SEO)">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">검색 제목 (title)</label>
              <input type="text" value={info.seo_title} onChange={(e) => patchInfo({ seo_title: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">검색 설명 (description)</label>
              <textarea value={info.seo_desc} onChange={(e) => patchInfo({ seo_desc: e.target.value })} rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none" />
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">브라우저 탭 제목과 검색 결과에 노출됩니다. 지역명·제품명을 넣으면 로컬 검색 유입에 유리합니다.</p>
          </Card>
        </div>

        {/* 오른쪽: 실시간 미리보기 */}
        <div className="lg:sticky lg:top-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">실시간 미리보기</p>
          <div className="border border-gray-200 bg-white overflow-hidden rounded-lg shadow-sm max-w-md">
            <PartnershipPanel info={info} />
            <div className="px-8 py-8">
              <h3 className="font-bold" style={{ fontSize: info.styles.form_title.size, color: info.styles.form_title.color }}>
                {info.form_title}
              </h3>
              {info.form_desc && (
                <p className="mt-1.5" style={{ fontSize: info.styles.form_desc.size, color: info.styles.form_desc.color }}>
                  {info.form_desc}
                </p>
              )}
              <div className="mt-5 space-y-3" aria-hidden>
                {info.form.fields.map((fld) => (
                  <div key={fld.key}>
                    <label className="block mb-1" style={{ fontSize: info.form.label_style.size, color: info.form.label_style.color }}>
                      {fld.label}
                    </label>
                    <div className="w-full border border-gray-200 px-3 py-2 bg-white truncate"
                      style={{ fontSize: info.form.input_size, color: "#c7c7c7" }}>
                      {fld.placeholder}
                    </div>
                  </div>
                ))}
                {tab === "franchise" && (
                  <p className="text-xs text-gray-500 leading-relaxed">
                    <span className="text-[#ff550c] font-medium">[필수]</span> {info.form.consent_text}{" "}
                    <span className="underline text-[#1A2B4A]">내용 보기</span>
                    {info.form.consent_note && <span className="block text-gray-400 mt-0.5">{info.form.consent_note}</span>}
                  </p>
                )}
                <div className="w-full text-center text-xs font-semibold tracking-widest py-3"
                  style={{ backgroundColor: info.form.button_bg, color: info.form.button_color }}>
                  {info.form.submit_text}
                </div>
                <p className="text-center" style={{ fontSize: info.form.footer_style.size, color: info.form.footer_style.color }}>
                  {info.form.footer_text}
                </p>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-3">패널·폼 문구·색상이 실제 화면과 동일하게 그려집니다. 미리보기의 입력칸은 클릭되지 않으며, 우측 ‘실시간 문의 현황’ 보드는 생략됩니다.</p>
        </div>
      </div>
    </div>
  );
}
