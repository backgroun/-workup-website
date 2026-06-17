"use client";
import { useState, useEffect, type ReactNode } from "react";
import AdminImageField from "@/components/admin/AdminImageField";
import StoryHeroView from "@/components/StoryHeroView";
import StorySectionView from "@/components/StorySectionView";
import {
  DEFAULT_STORY, emptySection, uid, SECTION_TYPE_LABEL,
  type StoryConfig, type StoryHero, type StorySection, type StorySectionType, type SectionBg, type ValueItem,
  type DeclarationSection, type CategorySection, type ValuesSection,
  type FoundingSection, type CtaSection, type RichTextSection,
} from "@/data/story";

const SECTION_TYPES: StorySectionType[] = ["declaration", "category", "values", "founding", "cta", "richtext"];
const INPUT = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400";
const CTA_PRESETS = [
  { label: "매장 찾기", href: "/store" },
  { label: "제품 보기", href: "/products" },
  { label: "전화", href: "tel:010-0000-0000" },
  { label: "카카오톡", href: "http://pf.kakao.com/" },
];

function cleanSection(s: StorySection): StorySection {
  if (s.type === "category") {
    const tags = s.tags.map((t) => t.trim()).filter(Boolean);
    return { ...s, tags: tags.length ? tags : [""] };
  }
  if (s.type === "founding") {
    // 뒤쪽 빈 문단만 제거 — 첫 문단(=인용구 앞 슬롯)의 위치를 보존한다.
    const trimmed = s.paragraphs.map((p) => p.trim());
    let end = trimmed.length;
    while (end > 0 && !trimmed[end - 1]) end--;
    const paragraphs = trimmed.slice(0, end);
    return { ...s, paragraphs: paragraphs.length ? paragraphs : [""] };
  }
  return s;
}

export default function AdminStoryPage() {
  const [hero, setHero] = useState<StoryHero>(DEFAULT_STORY.hero);
  const [sections, setSections] = useState<StorySection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ text: "", type: "" });
  const [editing, setEditing] = useState<StorySection | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/admin/site-settings/story_page")
      .then((r) => r.json())
      .then((data: StoryConfig | null) => {
        setHero(data?.hero ?? DEFAULT_STORY.hero);
        setSections(data?.sections?.length ? data.sections : DEFAULT_STORY.sections);
      })
      .catch(() => {
        setHero(DEFAULT_STORY.hero);
        setSections(DEFAULT_STORY.sections);
      })
      .finally(() => setLoading(false));
  }, []);

  const flash = (text: string, type = "ok") => {
    setToast({ text, type });
    setTimeout(() => setToast({ text: "", type: "" }), 3000);
  };

  const saveAll = async (nextHero: StoryHero, nextSections: StorySection[]) => {
    setSaving(true);
    try {
      const r = await fetch("/api/admin/site-settings/story_page", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hero: nextHero, sections: nextSections }),
      });
      flash(r.ok ? "저장됐습니다." : "저장에 실패했습니다.", r.ok ? "ok" : "err");
    } catch {
      flash("저장에 실패했습니다.", "err");
    } finally {
      setSaving(false);
    }
  };

  // ── 히어로 ──
  const setHeroField = <K extends keyof StoryHero>(k: K, v: StoryHero[K]) =>
    setHero((prev) => ({ ...prev, [k]: v }));
  const handleSaveHero = () => saveAll(hero, sections);

  // ── 섹션 목록 (변경 즉시 저장) ──
  const addSection = (type: StorySectionType) => { setEditing(emptySection(type)); setIsNew(true); setPickerOpen(false); };
  const openEdit = (s: StorySection) => { setEditing(JSON.parse(JSON.stringify(s))); setIsNew(false); setPickerOpen(false); };

  const handleSaveSection = async () => {
    if (!editing) return;
    const cleaned = cleanSection(editing);
    const updated = isNew ? [...sections, cleaned] : sections.map((s) => (s.id === cleaned.id ? cleaned : s));
    setSections(updated);
    setEditing(null);
    await saveAll(hero, updated);
  };

  const handleDuplicate = async (s: StorySection) => {
    const copy: StorySection = { ...JSON.parse(JSON.stringify(s)), id: uid() };
    const idx = sections.findIndex((x) => x.id === s.id);
    const next = [...sections];
    next.splice(idx + 1, 0, copy);
    setSections(next);
    await saveAll(hero, next);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 섹션을 삭제할까요?")) return;
    const updated = sections.filter((s) => s.id !== id);
    setSections(updated);
    if (editing?.id === id) setEditing(null);
    await saveAll(hero, updated);
  };

  const toggleVisible = async (s: StorySection) => {
    const updated = sections.map((x) => (x.id === s.id ? { ...x, visible: !x.visible } : x));
    setSections(updated);
    await saveAll(hero, updated);
  };

  const handleDrop = async (target: number) => {
    if (dragIndex === null || dragIndex === target) { setDragIndex(null); setDragOver(null); return; }
    const next = [...sections];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(target, 0, moved);
    setSections(next);
    setDragIndex(null); setDragOver(null);
    await saveAll(hero, next);
  };

  // ── 편집 폼 setter (타입별 narrow → 캐스트/any 불필요) ──
  const setCommon = (patch: { visible?: boolean; bg?: SectionBg }) =>
    setEditing((p) => (p ? ({ ...p, ...patch } as StorySection) : p));
  const setDecl = (patch: Partial<DeclarationSection>) =>
    setEditing((p) => (p && p.type === "declaration" ? { ...p, ...patch } : p));
  const setCat = (patch: Partial<CategorySection>) =>
    setEditing((p) => (p && p.type === "category" ? { ...p, ...patch } : p));
  const setVal = (patch: Partial<ValuesSection>) =>
    setEditing((p) => (p && p.type === "values" ? { ...p, ...patch } : p));
  const setFound = (patch: Partial<FoundingSection>) =>
    setEditing((p) => (p && p.type === "founding" ? { ...p, ...patch } : p));
  const setCta = (patch: Partial<CtaSection>) =>
    setEditing((p) => (p && p.type === "cta" ? { ...p, ...patch } : p));
  const setRich = (patch: Partial<RichTextSection>) =>
    setEditing((p) => (p && p.type === "richtext" ? { ...p, ...patch } : p));

  const updTags = (fn: (a: string[]) => string[]) =>
    setEditing((p) => (p && p.type === "category" ? { ...p, tags: fn(p.tags) } : p));
  const updParas = (fn: (a: string[]) => string[]) =>
    setEditing((p) => (p && p.type === "founding" ? { ...p, paragraphs: fn(p.paragraphs) } : p));
  const updItems = (fn: (a: ValueItem[]) => ValueItem[]) =>
    setEditing((p) => (p && p.type === "values" ? { ...p, items: fn(p.items) } : p));

  if (loading) return <div className="p-6 text-sm text-gray-400">불러오는 중...</div>;

  const visibleCount = sections.filter((s) => s.visible).length;

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">STORY 관리</h1>
          <p className="mt-1 text-sm text-gray-500">/story 페이지의 상단 이미지와 구성을 관리합니다.</p>
        </div>
        <div className="flex items-center gap-3">
          {toast.text && (
            <span className={`text-sm font-medium ${toast.type === "err" ? "text-red-500" : "text-green-600"}`}>{toast.text}</span>
          )}
          <a href="/story" target="_blank"
            className="px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
            STORY 미리보기 ↗
          </a>
        </div>
      </div>

      {/* ── 상단 히어로 카드 ── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="px-6 py-3.5 bg-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">상단 히어로</h2>
          <button onClick={handleSaveHero} disabled={saving}
            className="px-4 py-1.5 bg-blue-500 hover:bg-blue-400 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
            {saving ? "저장 중..." : "히어로 저장"}
          </button>
        </div>
        <div className="p-6 flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-w-0 space-y-4">
            <AdminImageField
              value={hero.image_url}
              onChange={(url) => setHeroField("image_url", url)}
              promptType="product"
              promptSeed="브랜드 스토리 히어로, 일하는 사람, 와이드 배경"
              label="상단 히어로 이미지 (비우면 네이비 배경 + WU 워터마크)"
            />
            <Field label="헤드라인 (줄바꿈 Enter)">
              <textarea value={hero.heading} onChange={(e) => setHeroField("heading", e.target.value)} rows={2}
                className={`${INPUT} resize-none`} placeholder="일하는 사람 편에서&#10;만든 브랜드" />
            </Field>
            <Field label="서브 문구">
              <input type="text" value={hero.sub} onChange={(e) => setHeroField("sub", e.target.value)}
                className={INPUT} placeholder="워크업이 왜 존재하는가" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="높이 (px)">
                <input type="number" value={hero.height} min={280}
                  onChange={(e) => setHeroField("height", Number(e.target.value))}
                  onBlur={(e) => setHeroField("height", Math.min(2000, Math.max(280, Number(e.target.value) || 580)))}
                  className={INPUT} />
              </Field>
              <div className="flex items-end gap-4 pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={hero.showWatermark}
                    onChange={(e) => setHeroField("showWatermark", e.target.checked)} className="w-4 h-4 accent-[#1A2B4A]" />
                  <span className="text-sm text-gray-700">WU 워터마크</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="color" value={hero.bg} onChange={(e) => setHeroField("bg", e.target.value)}
                    className="w-9 h-8 rounded border border-gray-200 cursor-pointer p-0.5" />
                  <span className="text-xs text-gray-500">배경색</span>
                </label>
              </div>
            </div>
          </div>
          {/* 히어로 미리보기 */}
          <div className="w-full lg:w-[300px] flex-shrink-0">
            <p className="text-xs font-semibold text-slate-500 mb-2">미리보기</p>
            <div className="rounded-lg overflow-hidden border border-slate-200">
              <StoryHeroView hero={{ ...hero, height: 240 }} />
            </div>
          </div>
        </div>
      </div>

      {/* 노출 섹션 0개 경고 */}
      {visibleCount === 0 && (
        <div className="mb-5 px-4 py-3 text-sm rounded-lg bg-amber-50 border border-amber-200 text-amber-700">
          노출 중인 섹션이 없습니다. 현재 상단 히어로만 표시됩니다.
        </div>
      )}

      {/* ── 섹션 관리 ── */}
      <div className="flex gap-6 items-start">
        {/* 목록 */}
        <div className="w-[340px] flex-shrink-0 sticky top-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">섹션 ({sections.length})</h2>
              <button onClick={() => setPickerOpen((v) => !v)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800">+ 섹션 추가</button>
            </div>

            {/* 타입 팔레트 */}
            {pickerOpen && (
              <div className="p-3 border-b border-slate-100 bg-slate-50 grid grid-cols-3 gap-1.5">
                {SECTION_TYPES.map((t) => (
                  <button key={t} onClick={() => addSection(t)}
                    className="text-[11px] font-medium text-slate-600 border border-slate-200 bg-white px-2 py-1.5 rounded hover:border-blue-400 hover:text-blue-600 transition-colors">
                    {SECTION_TYPE_LABEL[t]}
                  </button>
                ))}
              </div>
            )}

            {sections.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">등록된 섹션이 없습니다.</div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {sections.map((s, i) => (
                  <li key={s.id} draggable
                    onDragStart={() => setDragIndex(i)}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(i); }}
                    onDrop={() => handleDrop(i)}
                    onDragEnd={() => { setDragIndex(null); setDragOver(null); }}
                    className={`flex items-start gap-2 px-3 py-2.5 cursor-grab active:cursor-grabbing transition-colors ${editing?.id === s.id ? "bg-blue-50" : "hover:bg-slate-50"} ${dragOver === i && dragIndex !== i ? "bg-orange-50 border-l-2 border-orange-400" : ""}`}>
                    <svg className="w-3 h-3 text-slate-300 flex-shrink-0 mt-1.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 6a1 1 0 100-2 1 1 0 000 2zM16 6a1 1 0 100-2 1 1 0 000 2zM8 12a1 1 0 100-2 1 1 0 000 2zM16 12a1 1 0 100-2 1 1 0 000 2zM8 18a1 1 0 100-2 1 1 0 000 2zM16 18a1 1 0 100-2 1 1 0 000 2z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded flex-shrink-0">
                          {SECTION_TYPE_LABEL[s.type]}
                        </span>
                        <p className="flex-1 min-w-0 text-xs font-semibold text-slate-800 truncate">
                          {sectionSummary(s)}
                        </p>
                        <button onClick={() => toggleVisible(s)} title={s.visible ? "노출 중" : "숨김"}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${s.visible ? "bg-blue-500" : "bg-slate-200"}`}>
                          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${s.visible ? "translate-x-[18px]" : "translate-x-0.5"}`} />
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 mt-2">
                        <button onClick={() => openEdit(s)} className="text-[11px] font-medium text-slate-600 border border-slate-200 px-2 py-0.5 hover:bg-slate-100 rounded">수정</button>
                        <button onClick={() => handleDuplicate(s)} className="text-[11px] font-medium text-blue-500 border border-blue-200 px-2 py-0.5 hover:bg-blue-50 rounded">복제</button>
                        <button onClick={() => handleDelete(s.id)} className="text-[11px] font-medium text-red-400 border border-red-200 px-2 py-0.5 hover:bg-red-50 rounded">삭제</button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* 편집 폼 */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 bg-slate-800 flex items-center justify-between">
                <h2 className="text-base font-semibold text-white">
                  {isNew ? "새 섹션 추가" : "섹션 수정"} <span className="text-slate-400 text-sm font-normal">· {SECTION_TYPE_LABEL[editing.type]}</span>
                </h2>
                <div className="flex items-center gap-3">
                  <button onClick={handleSaveSection} disabled={saving}
                    className="px-4 py-1.5 bg-blue-500 hover:bg-blue-400 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
                    {saving ? "저장 중..." : "저장"}
                  </button>
                  <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>

              <div className="p-6 flex gap-6">
                <div className="flex-1 min-w-0 space-y-5">
                  {/* 공통: 노출 + 배경 */}
                  <div className="flex items-center gap-6 pb-4 border-b border-gray-100">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={editing.visible} onChange={(e) => setCommon({ visible: e.target.checked })} className="w-4 h-4 accent-[#1A2B4A]" />
                      <span className="text-sm text-gray-700">이 섹션 노출</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">배경</span>
                      {(["white", "beige"] as SectionBg[]).map((b) => (
                        <button key={b} onClick={() => setCommon({ bg: b })}
                          className={`text-xs px-3 py-1 rounded-lg border transition-colors ${editing.bg === b ? "border-blue-400 text-blue-600 bg-blue-50" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
                          {b === "white" ? "흰색" : "베이지"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 타입별 필드 */}
                  {editing.type === "declaration" && (
                    <>
                      <Field label="상단 영문 (eyebrow)"><input type="text" value={editing.eyebrow} onChange={(e) => setDecl({ eyebrow: e.target.value })} className={INPUT} placeholder="Brand Declaration" /></Field>
                      <Field label="제목 (줄바꿈 Enter)"><textarea value={editing.heading} onChange={(e) => setDecl({ heading: e.target.value })} rows={2} className={`${INPUT} resize-none`} /></Field>
                      <Field label="리드 문장"><input type="text" value={editing.lead} onChange={(e) => setDecl({ lead: e.target.value })} className={INPUT} /></Field>
                      <Field label="강조 문단 (줄바꿈 Enter)"><textarea value={editing.emphasis} onChange={(e) => setDecl({ emphasis: e.target.value })} rows={2} className={`${INPUT} resize-none`} /></Field>
                      <Field label="마지막 굵은 문구"><input type="text" value={editing.emphasisStrong} onChange={(e) => setDecl({ emphasisStrong: e.target.value })} className={INPUT} placeholder="워크업이 존재합니다." /></Field>
                    </>
                  )}

                  {editing.type === "category" && (
                    <>
                      <Field label="상단 영문 (eyebrow)"><input type="text" value={editing.eyebrow} onChange={(e) => setCat({ eyebrow: e.target.value })} className={INPUT} placeholder="Our Category" /></Field>
                      <Field label="큰 제목"><input type="text" value={editing.heading} onChange={(e) => setCat({ heading: e.target.value })} className={INPUT} placeholder="Work Life Wear" /></Field>
                      <Field label="리드 문장"><input type="text" value={editing.lead} onChange={(e) => setCat({ lead: e.target.value })} className={INPUT} /></Field>
                      <ArrayField label="태그 칩 ('+' 로 연결)" onAdd={() => updTags((a) => [...a, ""])}>
                        {editing.tags.map((t, i) => (
                          <div key={i} className="flex gap-2">
                            <input type="text" value={t} onChange={(e) => updTags((a) => a.map((x, idx) => (idx === i ? e.target.value : x)))} className={INPUT} placeholder="Workwear" />
                            {editing.tags.length > 1 && <RemoveBtn onClick={() => updTags((a) => a.filter((_, idx) => idx !== i))} />}
                          </div>
                        ))}
                      </ArrayField>
                      <Field label="하단 본문 (줄바꿈 Enter)"><textarea value={editing.body} onChange={(e) => setCat({ body: e.target.value })} rows={2} className={`${INPUT} resize-none`} /></Field>
                    </>
                  )}

                  {editing.type === "values" && (
                    <>
                      <Field label="상단 영문 (eyebrow)"><input type="text" value={editing.eyebrow} onChange={(e) => setVal({ eyebrow: e.target.value })} className={INPUT} placeholder="Core Values" /></Field>
                      <Field label="제목"><input type="text" value={editing.heading} onChange={(e) => setVal({ heading: e.target.value })} className={INPUT} /></Field>
                      <ArrayField label="가치 항목" onAdd={() => updItems((a) => { const next = a.reduce((m, x) => Math.max(m, parseInt(x.num, 10) || 0), 0) + 1; return [...a, { num: String(next).padStart(2, "0"), en: "", title: "", desc: "" }]; })}>
                        {editing.items.map((it, i) => (
                          <div key={i} className="p-3 border border-slate-200 rounded-lg space-y-2 bg-slate-50">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-semibold text-slate-500">항목 {i + 1}</span>
                              {editing.items.length > 1 && <RemoveBtn onClick={() => updItems((a) => a.filter((_, idx) => idx !== i))} />}
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <input type="text" value={it.num} onChange={(e) => updItems((a) => a.map((x, idx) => (idx === i ? { ...x, num: e.target.value } : x)))} className={INPUT} placeholder="01" />
                              <input type="text" value={it.en} onChange={(e) => updItems((a) => a.map((x, idx) => (idx === i ? { ...x, en: e.target.value } : x)))} className={`${INPUT} col-span-2`} placeholder="Function" />
                            </div>
                            <input type="text" value={it.title} onChange={(e) => updItems((a) => a.map((x, idx) => (idx === i ? { ...x, title: e.target.value } : x)))} className={INPUT} placeholder="기능성" />
                            <textarea value={it.desc} onChange={(e) => updItems((a) => a.map((x, idx) => (idx === i ? { ...x, desc: e.target.value } : x)))} rows={2} className={`${INPUT} resize-none`} placeholder="설명 (줄바꿈 Enter)" />
                          </div>
                        ))}
                      </ArrayField>
                    </>
                  )}

                  {editing.type === "founding" && (
                    <>
                      <Field label="상단 영문 (eyebrow)"><input type="text" value={editing.eyebrow} onChange={(e) => setFound({ eyebrow: e.target.value })} className={INPUT} placeholder="Founding Story" /></Field>
                      <Field label="제목 (줄바꿈 Enter)"><textarea value={editing.heading} onChange={(e) => setFound({ heading: e.target.value })} rows={2} className={`${INPUT} resize-none`} /></Field>
                      <ArrayField label="본문 문단 (인용구 앞 1개 + 뒤 나머지)" onAdd={() => updParas((a) => [...a, ""])}>
                        {editing.paragraphs.map((para, i) => (
                          <div key={i} className="flex gap-2">
                            <textarea value={para} onChange={(e) => updParas((a) => a.map((x, idx) => (idx === i ? e.target.value : x)))} rows={2} className={`${INPUT} resize-none`} />
                            {editing.paragraphs.length > 1 && <RemoveBtn onClick={() => updParas((a) => a.filter((_, idx) => idx !== i))} />}
                          </div>
                        ))}
                      </ArrayField>
                      <Field label="인용구 (굵게, 첫 문단 다음에 표시)"><input type="text" value={editing.emphasis} onChange={(e) => setFound({ emphasis: e.target.value })} className={INPUT} placeholder={'"왜 일하는 사람은 좋은 옷을 포기해야 할까?"'} /></Field>
                      <Field label="마무리 문장 (줄바꿈 Enter)"><textarea value={editing.closing} onChange={(e) => setFound({ closing: e.target.value })} rows={2} className={`${INPUT} resize-none`} /></Field>
                      <Field label="이미지 위치">
                        <div className="flex gap-2">
                          {(["right", "left"] as const).map((side) => (
                            <button key={side} onClick={() => setFound({ imageSide: side })}
                              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${editing.imageSide === side ? "border-blue-400 text-blue-600 bg-blue-50" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
                              {side === "right" ? "오른쪽" : "왼쪽"}
                            </button>
                          ))}
                        </div>
                      </Field>
                      <AdminImageField value={editing.image_url} onChange={(url) => setFound({ image_url: url })} promptType="product" promptSeed={`창업 스토리, ${editing.heading}`} label="창업 스토리 이미지 (비우면 플레이스홀더)" />
                    </>
                  )}

                  {editing.type === "cta" && (
                    <>
                      <Field label="상단 영문 (eyebrow)"><input type="text" value={editing.eyebrow} onChange={(e) => setCta({ eyebrow: e.target.value })} className={INPUT} placeholder="Experience WORKUP" /></Field>
                      <Field label="제목"><input type="text" value={editing.heading} onChange={(e) => setCta({ heading: e.target.value })} className={INPUT} /></Field>
                      <Field label="본문 (줄바꿈 Enter)"><textarea value={editing.body} onChange={(e) => setCta({ body: e.target.value })} rows={2} className={`${INPUT} resize-none`} /></Field>
                      <Field label="버튼 문구"><input type="text" value={editing.ctaLabel} onChange={(e) => setCta({ ctaLabel: e.target.value })} className={INPUT} placeholder="가까운 매장 찾기 →" /></Field>
                      <Field label="버튼 링크" hint="오프라인 전환: 매장 찾기·전화·카카오톡 권장">
                        <input type="text" value={editing.ctaHref} onChange={(e) => setCta({ ctaHref: e.target.value })} className={INPUT} placeholder="/store" />
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {CTA_PRESETS.map((p) => (
                            <button key={p.href} onClick={() => setCta({ ctaHref: p.href })}
                              className="text-[11px] px-2.5 py-1 rounded-full border border-slate-200 text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </Field>
                    </>
                  )}

                  {editing.type === "richtext" && (
                    <>
                      <Field label="상단 영문 (eyebrow)"><input type="text" value={editing.eyebrow} onChange={(e) => setRich({ eyebrow: e.target.value })} className={INPUT} /></Field>
                      <Field label="제목 (줄바꿈 Enter)"><textarea value={editing.heading} onChange={(e) => setRich({ heading: e.target.value })} rows={2} className={`${INPUT} resize-none`} /></Field>
                      <Field label="본문 (줄바꿈 Enter)"><textarea value={editing.body} onChange={(e) => setRich({ body: e.target.value })} rows={4} className={`${INPUT} resize-none`} /></Field>
                    </>
                  )}
                </div>

                {/* 섹션 미리보기 */}
                <div className="w-[280px] flex-shrink-0">
                  <p className="text-xs font-semibold text-slate-500 mb-2">미리보기</p>
                  <div className="rounded-lg overflow-auto border border-slate-200 bg-white max-h-[460px]">
                    <div style={{ zoom: 0.55 }}>
                      <StorySectionView section={editing} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm gap-3">
              <p>목록에서 섹션을 선택하거나 “+ 섹션 추가”로 새 섹션을 만드세요.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 작은 헬퍼 컴포넌트 ──
function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>
      {hint && <p className="text-[11px] text-gray-400 mb-1.5">{hint}</p>}
      {children}
    </div>
  );
}

function ArrayField({ label, onAdd, children }: { label: string; onAdd: () => void; children: ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold text-gray-500">{label}</label>
        <button type="button" onClick={onAdd} className="text-xs text-blue-600 hover:text-blue-800">+ 추가</button>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
  return <button type="button" onClick={onClick} className="text-red-400 hover:text-red-600 text-sm px-1 flex-shrink-0">✕</button>;
}

function sectionSummary(s: StorySection): string {
  switch (s.type) {
    case "declaration": return s.heading || s.eyebrow || "(선언문)";
    case "category": return s.heading || s.eyebrow || "(카테고리)";
    case "values": return s.heading || s.eyebrow || "(핵심가치)";
    case "founding": return s.heading || s.eyebrow || "(창업스토리)";
    case "cta": return s.heading || s.eyebrow || "(CTA)";
    case "richtext": return s.heading || s.eyebrow || "(자유텍스트)";
    default: return "(섹션)";
  }
}
