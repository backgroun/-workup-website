"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import StoryHeroView from "@/components/StoryHeroView";
import StorySectionView from "@/components/StorySectionView";
import {
  DEFAULT_STORY, DEFAULT_STORY_STYLE, storyStyleVars, STORY_IMAGE_RATIOS,
  emptySection, uid, SECTION_TYPE_LABEL,
  type StoryConfig, type StoryHero, type StorySection, type StorySectionType,
  type SectionBg, type StoryStyle, type StoryImageRatio, type PartialSection,
  type TextFx, type TextAlign,
} from "@/data/story";

const SECTION_TYPES: StorySectionType[] = [
  "declaration", "problem", "features3", "category", "values", "founding", "storeCta", "cta", "richtext", "photos",
];

// 선택 요소(서식 툴바 대상). baseSize 는 활성화 순간 실제 렌더된 폰트 크기(px) — fx.size 를 아직 지정 안 했을 때
// 툴바가 "자동" 대신 이 값을 그대로 보여줘서, 사용자가 감으로 +/- 하지 않고 실제 수치에서 바로 조정하게 한다.
type ActiveField =
  | { scope: "hero"; field: string; baseSize?: number }
  | { scope: "section"; id: string; field: string; baseSize?: number };

const FIELD_LABEL: Record<string, string> = {
  heading: "제목", eyebrow: "라벨", lead: "리드", emphasis: "강조문", emphasisStrong: "굵은 문구",
  body: "본문", closing: "마무리", ctaLabel: "버튼", ctaHref: "버튼 링크", sub: "서브",
};

const FX_COLORS = ["#1A2B4A", "#111827", "#6B7280", "#9CA3AF", "#1d4ed8", "#dc2626", "#ea580c", "#059669", "#ffffff"];

export default function StoryEditor() {
  const [hero, setHero] = useState<StoryHero>(DEFAULT_STORY.hero);
  const [sections, setSections] = useState<StorySection[]>([]);
  const [style, setStyle] = useState<StoryStyle>(DEFAULT_STORY_STYLE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState("");
  const [designOpen, setDesignOpen] = useState(false);
  const [palette, setPalette] = useState<number | null>(null); // 어느 위치에 섹션 추가 팔레트를 열지
  const [active, setActive] = useState<ActiveField | null>(null); // 서식 툴바 대상 요소

  // 이미지 업로드 파이프라인: pickImage(cb) → 파일창 → 업로드 → cb(url)
  const fileRef = useRef<HTMLInputElement>(null);
  const pickCb = useRef<((url: string) => void) | null>(null);
  const openPicker = (cb: (url: string) => void) => { pickCb.current = cb; fileRef.current?.click(); };
  const onFile = async (file: File) => {
    setToast("이미지 업로드 중...");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      if (res.ok) { const { url } = await res.json(); pickCb.current?.(url); setDirty(true); setToast(""); }
      else { const e = await res.json().catch(() => ({})); setToast("업로드 실패: " + (e.error ?? res.status)); }
    } catch { setToast("업로드 실패"); }
    finally { pickCb.current = null; }
  };

  useEffect(() => {
    fetch("/api/admin/site-settings/story_page")
      .then((r) => r.json())
      .then((data: StoryConfig | null) => {
        setHero(data?.hero ?? DEFAULT_STORY.hero);
        setSections(data?.sections?.length ? data.sections : DEFAULT_STORY.sections);
        setStyle({ ...DEFAULT_STORY_STYLE, ...(data?.style ?? {}) });
      })
      .catch(() => { setHero(DEFAULT_STORY.hero); setSections(DEFAULT_STORY.sections); })
      .finally(() => setLoading(false));
  }, []);

  // 저장되지 않은 변경 이탈 경고
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const flash = (t: string) => { setToast(t); if (t) setTimeout(() => setToast(""), 2500); };

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/admin/site-settings/story_page", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hero, sections, style }),
      });
      if (r.ok) { setDirty(false); flash("저장됐습니다."); } else flash("저장 실패");
    } catch { flash("저장 실패"); }
    finally { setSaving(false); }
  };

  // ── 상태 변경 헬퍼(항상 dirty) ──
  const patchHero = (p: Partial<StoryHero>) => { setHero((h) => ({ ...h, ...p })); setDirty(true); };
  const patchStyle = <K extends keyof StoryStyle>(k: K, v: StoryStyle[K]) => { setStyle((s) => ({ ...s, [k]: v })); setDirty(true); };
  const patchSection = (id: string, p: PartialSection) => {
    setSections((prev) => prev.map((s) => (s.id === id ? ({ ...s, ...p } as StorySection) : s)));
    setDirty(true);
  };
  const moveSection = (i: number, dir: -1 | 1) => {
    setSections((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    setDirty(true);
  };
  const duplicateSection = (i: number) => {
    setSections((prev) => {
      const copy = { ...(JSON.parse(JSON.stringify(prev[i])) as StorySection), id: uid() };
      const next = [...prev]; next.splice(i + 1, 0, copy); return next;
    });
    setDirty(true);
  };
  const deleteSection = (id: string) => {
    if (!confirm("이 섹션을 삭제할까요?")) return;
    setSections((prev) => prev.filter((s) => s.id !== id));
    setDirty(true);
  };
  const insertSection = (at: number, type: StorySectionType) => {
    setSections((prev) => { const next = [...prev]; next.splice(at, 0, emptySection(type)); return next; });
    setPalette(null); setDirty(true);
  };

  // ── 요소별 서식(fx) ──
  const activeSection = active?.scope === "section" ? sections.find((s) => s.id === active.id) : undefined;
  const activeFx: TextFx | undefined = !active ? undefined
    : active.scope === "hero" ? hero.fx?.[active.field] : activeSection?.fx?.[active.field];

  // 함수형 업데이터로 최신 상태에 병합 — 연속 클릭(배칭) 시 이전 서식이 사라지지 않게 한다.
  const applyFx = (patch: Partial<TextFx>) => {
    if (!active) return;
    setDirty(true);
    if (active.scope === "hero") {
      setHero((prev) => ({ ...prev, fx: { ...(prev.fx ?? {}), [active.field]: { ...(prev.fx?.[active.field] ?? {}), ...patch } } }));
    } else {
      setSections((prev) => prev.map((s) =>
        s.id === active.id ? ({ ...s, fx: { ...(s.fx ?? {}), [active.field]: { ...(s.fx?.[active.field] ?? {}), ...patch } } } as StorySection) : s));
    }
  };
  const resetActiveFx = () => {
    if (!active) return;
    setDirty(true);
    if (active.scope === "hero") {
      setHero((prev) => { const rest = { ...(prev.fx ?? {}) }; delete rest[active.field]; return { ...prev, fx: rest }; });
    } else {
      setSections((prev) => prev.map((s) => {
        if (s.id !== active.id) return s;
        const rest = { ...(s.fx ?? {}) }; delete rest[active.field]; return { ...s, fx: rest } as StorySection;
      }));
    }
  };

  if (loading) return <div className="p-10 text-sm text-gray-400">불러오는 중...</div>;

  const canvasVars = storyStyleVars(style) as CSSProperties;

  return (
    // 실제 /story 와 100% 동일한 전체 뷰포트 폭으로 편집하도록 관리자 레이아웃(사이드바·패딩)을 덮어 풀스크린으로 띄운다.
    <div className="st-editor-on fixed inset-0 z-50 overflow-y-auto bg-white">
      <style>{`
        .st-editable{outline:none;cursor:text;border-radius:3px;transition:box-shadow .12s,background .12s;}
        .st-editor-on .st-editable:hover{box-shadow:0 0 0 2px rgba(59,130,246,.25);}
        .st-editable:focus{box-shadow:0 0 0 2px rgba(59,130,246,.75);background:rgba(59,130,246,.05);}
        .st-editable:empty::before{content:attr(data-ph);color:#cbd5e1;font-weight:400;}
      `}</style>

      {/* 상단 툴바 */}
      <div className="sticky top-0 z-40 flex items-center justify-between gap-3 px-5 py-3 bg-slate-900 text-white shadow-lg">
        <div className="flex items-center gap-3 min-w-0">
          <a href="/admin" title="관리자로 돌아가기"
            className="flex items-center gap-1 text-[12px] font-semibold text-slate-300 hover:text-white whitespace-nowrap">
            ← 관리자
          </a>
          <span className="w-px h-4 bg-white/15" />
          <h1 className="text-sm font-bold whitespace-nowrap">STORY 위지윅 편집</h1>
          <span className="text-[12px] text-slate-400 truncate hidden md:inline">화면에서 글자·이미지를 직접 클릭해 수정하세요</span>
        </div>
        <div className="flex items-center gap-2">
          {toast && <span className="text-[12px] text-emerald-300 mr-1">{toast}</span>}
          {dirty && <span className="text-[12px] text-amber-300 mr-1">● 저장 안 됨</span>}
          <button onClick={() => setDesignOpen((v) => !v)}
            className={`text-[12px] font-semibold rounded-lg px-3 py-1.5 border ${designOpen ? "bg-white/15 border-white/30" : "border-white/20 hover:bg-white/10"}`}>
            전체 디자인
          </button>
          <a href="/story" target="_blank" rel="noreferrer"
            className="text-[12px] font-semibold rounded-lg px-3 py-1.5 border border-white/20 hover:bg-white/10">미리보기 ↗</a>
          <button onClick={save} disabled={saving || !dirty}
            className="text-[13px] font-bold rounded-lg px-4 py-1.5 bg-blue-500 hover:bg-blue-400 disabled:opacity-40 disabled:cursor-not-allowed">
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>

      {/* 전체 디자인 패널 */}
      {designOpen && (
        <div className="sticky top-[52px] z-30 bg-white border-b border-slate-200 shadow-sm px-5 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3">
            <Range label="폰트 크기" value={style.fontScale} min={0.8} max={1.4} step={0.05} display={`${Math.round(style.fontScale * 100)}%`} onChange={(v) => patchStyle("fontScale", v)} />
            <Range label="줄간격" value={style.lineHeight} min={1.4} max={2.2} step={0.05} display={style.lineHeight.toFixed(2)} onChange={(v) => patchStyle("lineHeight", v)} />
            <Range label="섹션 여백" value={style.sectionSpacing} min={0.6} max={1.6} step={0.05} display={`${Math.round(style.sectionSpacing * 100)}%`} onChange={(v) => patchStyle("sectionSpacing", v)} />
            <Range label="이미지 너비" value={style.imageWidth} min={35} max={60} step={1} display={`${style.imageWidth}%`} onChange={(v) => patchStyle("imageWidth", v)} />
          </div>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-gray-500 mr-1">이미지 비율</span>
            {STORY_IMAGE_RATIOS.map((r) => (
              <button key={r.value} onClick={() => patchStyle("imageRatio", r.value as StoryImageRatio)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${style.imageRatio === r.value ? "border-blue-400 text-blue-600 bg-blue-50" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
                {r.label}
              </button>
            ))}
            <button onClick={() => { setStyle(DEFAULT_STORY_STYLE); setDirty(true); }}
              className="ml-auto text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50">기본값으로</button>
          </div>
        </div>
      )}

      {/* 편집 캔버스 */}
      <div style={canvasVars}>
        {/* 히어로 */}
        <div className="relative group/sec">
          <StoryHeroView hero={hero} edit={{
            patch: patchHero, pickImage: openPicker,
            activate: (field, px) => setActive({ scope: "hero", field, baseSize: px }),
            activeField: active?.scope === "hero" ? active.field : undefined,
          }} />
          <Inserter show={palette === 0} onToggle={() => setPalette(palette === 0 ? null : 0)} onPick={(t) => insertSection(0, t)} />
        </div>

        {/* 섹션들 */}
        {sections.map((s, i) => (
          <div key={s.id} className={`relative group/sec ${s.visible ? "" : "opacity-45"}`}>
            {/* 숨김 배지 */}
            {!s.visible && (
              <div className="absolute top-3 left-3 z-20 text-[11px] font-bold text-white bg-slate-700/90 rounded-full px-3 py-1">숨김 (공개 페이지 미노출)</div>
            )}
            {/* 섹션 툴바 */}
            <SectionChrome
              section={s}
              first={i === 0}
              last={i === sections.length - 1}
              onUp={() => moveSection(i, -1)}
              onDown={() => moveSection(i, 1)}
              onDup={() => duplicateSection(i)}
              onDel={() => deleteSection(s.id)}
              onToggleVisible={() => patchSection(s.id, { visible: !s.visible })}
              onBg={(bg) => patchSection(s.id, { bg })}
              onPatch={(p) => patchSection(s.id, p)}
            />
            <StorySectionView section={s} edit={{
              patch: (p) => patchSection(s.id, p), pickImage: openPicker,
              activate: (field, px) => setActive({ scope: "section", id: s.id, field, baseSize: px }),
              activeField: active?.scope === "section" && active.id === s.id ? active.field : undefined,
            }} />
            <Inserter show={palette === i + 1} onToggle={() => setPalette(palette === i + 1 ? null : i + 1)} onPick={(t) => insertSection(i + 1, t)} />
          </div>
        ))}

        {sections.length === 0 && (
          <div className="py-20 text-center text-slate-400 text-sm">섹션이 없습니다. 아래 + 버튼으로 추가하세요.</div>
        )}
      </div>

      {/* 요소 서식 툴바 */}
      {active && (
        <FormatToolbar
          label={FIELD_LABEL[active.field] ?? active.field}
          fx={activeFx}
          baseSize={active.baseSize}
          onApply={applyFx}
          onReset={resetActiveFx}
          onClose={() => setActive(null)}
        />
      )}

      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
    </div>
  );
}

// ── 섹션 hover 툴바(상단 중앙) ──
function SectionChrome({ section, first, last, onUp, onDown, onDup, onDel, onToggleVisible, onBg, onPatch }: {
  section: StorySection; first: boolean; last: boolean;
  onUp: () => void; onDown: () => void; onDup: () => void; onDel: () => void;
  onToggleVisible: () => void; onBg: (bg: SectionBg) => void; onPatch: (p: PartialSection) => void;
}) {
  return (
    <div className="absolute top-2 right-2 z-20 opacity-0 group-hover/sec:opacity-100 transition-opacity">
      <div className="flex items-center gap-1 bg-white/95 backdrop-blur border border-slate-200 rounded-lg shadow-lg px-1.5 py-1">
        <span className="text-[10px] font-bold text-slate-400 px-1.5">{SECTION_TYPE_LABEL[section.type]}</span>
        {/* 배경 */}
        <ChipBtn active={section.bg === "white"} onClick={() => onBg("white")} title="흰 배경"><span className="w-3 h-3 rounded-full bg-white border border-slate-300 inline-block" /></ChipBtn>
        <ChipBtn active={section.bg === "beige"} onClick={() => onBg("beige")} title="베이지 배경"><span className="w-3 h-3 rounded-full bg-[#e6e3db] border border-slate-300 inline-block" /></ChipBtn>
        {/* 타입별 옵션 */}
        {(section.type === "founding" || section.type === "problem") && (
          <>
            <div className="w-px h-4 bg-slate-200 mx-0.5" />
            <ChipBtn active={section.imageSide === "left"} onClick={() => onPatch({ imageSide: "left" })} title="이미지 왼쪽">◧</ChipBtn>
            <ChipBtn active={section.imageSide === "right"} onClick={() => onPatch({ imageSide: "right" })} title="이미지 오른쪽">◨</ChipBtn>
          </>
        )}
        {section.type === "values" && (
          <>
            <div className="w-px h-4 bg-slate-200 mx-0.5" />
            <ChipBtn active={section.layout === "number"} onClick={() => onPatch({ layout: "number" })} title="숫자형">01</ChipBtn>
            <ChipBtn active={section.layout === "icon"} onClick={() => onPatch({ layout: "icon" })} title="아이콘형">◎</ChipBtn>
          </>
        )}
        {section.type === "photos" && (
          <>
            <div className="w-px h-4 bg-slate-200 mx-0.5" />
            {[2, 3, 4].map((n) => (
              <ChipBtn key={n} active={section.columns === n} onClick={() => onPatch({ columns: n as 2 | 3 | 4 })} title={`${n}열`}>{n}</ChipBtn>
            ))}
          </>
        )}
        <div className="w-px h-4 bg-slate-200 mx-0.5" />
        <IconBtn onClick={onUp} disabled={first} title="위로">↑</IconBtn>
        <IconBtn onClick={onDown} disabled={last} title="아래로">↓</IconBtn>
        <IconBtn onClick={onDup} title="복제">⎘</IconBtn>
        <IconBtn onClick={onToggleVisible} title={section.visible ? "숨기기" : "보이기"}>{section.visible ? "👁" : "🚫"}</IconBtn>
        <IconBtn onClick={onDel} title="삭제" danger>🗑</IconBtn>
      </div>
    </div>
  );
}

function ChipBtn({ active, onClick, title, children }: { active: boolean; onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button type="button" title={title} onClick={onClick}
      className={`min-w-6 h-6 px-1 rounded flex items-center justify-center text-[12px] font-semibold ${active ? "bg-blue-100 text-blue-700" : "text-slate-500 hover:bg-slate-100"}`}>
      {children}
    </button>
  );
}
function IconBtn({ onClick, title, disabled, danger, children }: { onClick: () => void; title: string; disabled?: boolean; danger?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" title={title} onClick={onClick} disabled={disabled}
      className={`w-6 h-6 rounded flex items-center justify-center text-[13px] disabled:opacity-30 ${danger ? "hover:bg-red-50 text-red-500" : "text-slate-600 hover:bg-slate-100"}`}>
      {children}
    </button>
  );
}

// ── 섹션 사이 추가 인서터 ──
function Inserter({ show, onToggle, onPick }: { show: boolean; onToggle: () => void; onPick: (t: StorySectionType) => void }) {
  return (
    <div className="relative">
      <div className="absolute left-0 right-0 -bottom-4 z-20 flex justify-center opacity-0 group-hover/sec:opacity-100 transition-opacity">
        <button type="button" onClick={onToggle}
          className="w-8 h-8 rounded-full bg-blue-500 text-white text-lg leading-none shadow-lg hover:bg-blue-400 flex items-center justify-center">+</button>
      </div>
      {show && (
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 translate-y-full z-30 bg-white border border-slate-200 rounded-xl shadow-xl p-2 grid grid-cols-3 gap-1.5 w-[280px]">
          {SECTION_TYPES.map((t) => (
            <button key={t} onClick={() => onPick(t)}
              className="text-[12px] font-medium text-slate-600 border border-slate-200 bg-white px-2 py-2 rounded-lg hover:border-blue-400 hover:text-blue-600">
              {SECTION_TYPE_LABEL[t]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 요소 서식 툴바(하단 플로팅) ──
function Sep() { return <span className="w-px h-5 bg-white/15 mx-0.5" />; }
function FBtn({ active, onClick, title, children }: { active?: boolean; onClick: () => void; title?: string; children: React.ReactNode }) {
  return (
    <button type="button" title={title} onMouseDown={(e) => e.preventDefault()} onClick={onClick}
      className={`min-w-7 h-7 px-1.5 rounded text-[13px] flex items-center justify-center ${active ? "bg-blue-500 text-white" : "text-slate-200 hover:bg-white/10"}`}>
      {children}
    </button>
  );
}
function FormatToolbar({ label, fx, baseSize, onApply, onReset, onClose }: {
  label: string; fx?: TextFx; baseSize?: number;
  onApply: (patch: Partial<TextFx>) => void; onReset: () => void; onClose: () => void;
}) {
  // 오버라이드(fx.size)가 없으면 활성화 시점에 측정한 실제 렌더 크기(baseSize)를 그대로 보여준다 —
  // "자동"이라고만 뜨던 이전 방식은 지금 몇 px인지 몰라 감으로 +/- 눌러야 했던 불편함의 원인이었다.
  const display = fx?.size ?? (baseSize ? Math.round(baseSize) : undefined);
  const align = fx?.align;
  const bold = fx?.weight === 700;
  const step = (d: number) => onApply({ size: Math.max(8, Math.min(160, (display ?? 16) + d)) });
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60]">
      <div className="flex items-center gap-1.5 bg-slate-900/95 backdrop-blur text-white rounded-2xl shadow-2xl border border-white/10 px-3 py-2 flex-wrap max-w-[96vw]">
        <span className="text-[12px] font-bold text-blue-300 pr-1">{label}</span>
        <Sep />
        <span className="text-[11px] text-slate-400">크기</span>
        <FBtn onClick={() => step(-1)} title="작게">−</FBtn>
        <input type="number" value={display ?? ""} placeholder="—"
          onChange={(e) => { const n = Number(e.target.value); if (e.target.value !== "" && Number.isFinite(n)) onApply({ size: Math.max(8, Math.min(160, n)) }); }}
          className="w-12 h-7 text-center bg-white/10 rounded font-mono text-[12px] outline-none focus:bg-white/20" />
        <FBtn onClick={() => step(1)} title="크게">＋</FBtn>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => onApply({ size: undefined })}
          className="text-[10px] text-slate-400 hover:text-white px-1">기본</button>
        <Sep />
        <span className="text-[11px] text-slate-400">색상</span>
        {FX_COLORS.map((c) => (
          <button key={c} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => onApply({ color: c })} title={c}
            className={`w-5 h-5 rounded-full border ${fx?.color === c ? "ring-2 ring-blue-400 border-white" : "border-white/30"}`} style={{ background: c }} />
        ))}
        <label className="w-5 h-5 rounded-full overflow-hidden border border-white/30 cursor-pointer relative" title="사용자 색상">
          <input type="color" value={fx?.color ?? "#1A2B4A"} onChange={(e) => onApply({ color: e.target.value })}
            className="absolute -inset-2 w-9 h-9 cursor-pointer" />
        </label>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => onApply({ color: undefined })}
          className="text-[10px] text-slate-400 hover:text-white px-1">기본</button>
        <Sep />
        <span className="text-[11px] text-slate-400">정렬</span>
        {(["left", "center", "right"] as TextAlign[]).map((a) => (
          <FBtn key={a} active={align === a} onClick={() => onApply({ align: align === a ? undefined : a })} title={a}>
            {a === "left" ? "⯇" : a === "center" ? "≡" : "⯈"}
          </FBtn>
        ))}
        <Sep />
        <FBtn active={bold} onClick={() => onApply({ weight: bold ? undefined : 700 })} title="굵게"><span className="font-bold">B</span></FBtn>
        <Sep />
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={onReset} className="text-[11px] text-amber-300 hover:text-amber-200 px-1">서식 초기화</button>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-white text-sm px-1" title="닫기">✕</button>
      </div>
    </div>
  );
}

// ── 슬라이더 ──
function Range({ label, value, min, max, step, display, onChange }: {
  label: string; value: number; min: number; max: number; step: number; display: string; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-semibold text-gray-500">{label}</label>
        <span className="text-xs font-mono font-semibold text-blue-600">{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-blue-500 cursor-pointer" />
    </div>
  );
}
