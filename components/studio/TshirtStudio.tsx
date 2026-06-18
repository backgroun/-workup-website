"use client";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import NearbyStoreModal from "@/components/NearbyStoreModal";
import {
  SHIRT_COLORS,
  DEFAULT_SHIRT_ID,
  STICKER_GROUPS,
  TEXT_FONTS,
  PALETTE_COLORS,
  SHAPES,
  EXPORT_W,
  EXPORT_H,
  STAGE_RATIO,
  BASE_STICKER,
  BASE_TEXT,
  BASE_SHAPE,
  MIN_SCALE,
  MAX_SCALE,
  DROP_X,
  DROP_Y,
  EMOJI_FONT,
  shirtSvg,
  shapeSvg,
  type Layer,
  type LayerKind,
  type ShapeId,
} from "./assets";

// ── 유틸 ────────────────────────────────────────────────
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.round(Math.random() * 1e6)}`;

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });

const svgDataUrl = (svg: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

// 레이어 기본 px 크기(스테이지 가로폭 기준 · 배율 1)
function baseSizePx(kind: LayerKind, widthPx: number) {
  if (kind === "sticker") return BASE_STICKER * widthPx;
  if (kind === "text") return BASE_TEXT * widthPx;
  return BASE_SHAPE * widthPx;
}

type Interaction =
  | { mode: "move"; id: string; dx: number; dy: number }
  | { mode: "rotate"; id: string; cx: number; cy: number }
  | { mode: "scale"; id: string; cx: number; cy: number; startDist: number; startScale: number };

export default function TshirtStudio({ kakaoUrl }: { kakaoUrl: string }) {
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [shirtId, setShirtId] = useState<string>(DEFAULT_SHIRT_ID);
  const [tab, setTab] = useState<"sticker" | "text" | "shape">("sticker");
  const [showStores, setShowStores] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const interaction = useRef<Interaction | null>(null);

  const shirt = SHIRT_COLORS.find((c) => c.id === shirtId) ?? SHIRT_COLORS[0];
  const selected = layers.find((l) => l.id === selectedId) ?? null;

  // 토스트 자동 사라짐
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 3200);
    return () => clearTimeout(t);
  }, [notice]);

  // 드래그/회전/크기조절 — 전역 포인터 이벤트로 처리
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const it = interaction.current;
      const stage = stageRef.current;
      if (!it || !stage) return;
      const rect = stage.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      if (it.mode === "move") {
        setLayers((ls) =>
          ls.map((l) =>
            l.id === it.id ? { ...l, x: clamp(px + it.dx, 0, 1), y: clamp(py + it.dy, 0, 1) } : l
          )
        );
      } else if (it.mode === "rotate") {
        const ang =
          (Math.atan2((py - it.cy) * rect.height, (px - it.cx) * rect.width) * 180) / Math.PI + 90;
        setLayers((ls) => ls.map((l) => (l.id === it.id ? { ...l, rotation: Math.round(ang) } : l)));
      } else {
        const dist = Math.hypot((px - it.cx) * rect.width, (py - it.cy) * rect.height);
        const scale = clamp((it.startScale * dist) / it.startDist, MIN_SCALE, MAX_SCALE);
        setLayers((ls) => ls.map((l) => (l.id === it.id ? { ...l, scale } : l)));
      }
    };
    const onUp = () => {
      interaction.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  // 키보드: Delete=삭제, Esc=선택해제 (입력 중에는 무시)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (!selectedId) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        removeLayer(selectedId);
      } else if (e.key === "Escape") {
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId]);

  // ── 레이어 조작 ─────────────────────────────────────
  function addLayer(partial: Omit<Layer, "id" | "x" | "y" | "scale" | "rotation">) {
    const n = layers.length;
    const id = uid();
    setLayers((ls) => [
      ...ls,
      {
        id,
        x: clamp(DROP_X + ((n % 3) - 1) * 0.05, 0.1, 0.9),
        y: clamp(DROP_Y + (Math.floor(n / 3) % 3) * 0.05, 0.1, 0.9),
        scale: 1,
        rotation: 0,
        ...partial,
      },
    ]);
    setSelectedId(id);
  }

  const addSticker = (glyph: string) => addLayer({ kind: "sticker", glyph });
  const addText = () =>
    addLayer({
      kind: "text",
      text: "텍스트",
      font: TEXT_FONTS[0].family,
      weight: TEXT_FONTS[0].weight,
      color: shirt.id === "white" || shirt.id === "sand" ? "#1A2B4A" : "#FFFFFF",
    });
  const addShape = (shape: ShapeId) => addLayer({ kind: "shape", shape, color: "#ff550c" });

  function updateLayer(id: string, patch: Partial<Layer>) {
    setLayers((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }
  function removeLayer(id: string) {
    setLayers((ls) => ls.filter((l) => l.id !== id));
    setSelectedId((s) => (s === id ? null : s));
  }
  function duplicateLayer(id: string) {
    const src = layers.find((l) => l.id === id);
    if (!src) return;
    const nid = uid();
    setLayers((ls) => [...ls, { ...src, id: nid, x: clamp(src.x + 0.05, 0, 1), y: clamp(src.y + 0.05, 0, 1) }]);
    setSelectedId(nid);
  }
  function reorder(id: string, dir: 1 | -1) {
    setLayers((ls) => {
      const i = ls.findIndex((l) => l.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= ls.length) return ls;
      const copy = [...ls];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  }
  function resetAll() {
    if (layers.length && !window.confirm("꾸민 요소를 모두 지울까요?")) return;
    setLayers([]);
    setSelectedId(null);
  }

  // ── 포인터 시작 핸들러 ──────────────────────────────
  function rectInfo() {
    return stageRef.current!.getBoundingClientRect();
  }
  function startMove(e: ReactPointerEvent, l: Layer) {
    e.stopPropagation();
    setSelectedId(l.id);
    const rect = rectInfo();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    interaction.current = { mode: "move", id: l.id, dx: l.x - px, dy: l.y - py };
  }
  function startRotate(e: ReactPointerEvent, l: Layer) {
    e.stopPropagation();
    interaction.current = { mode: "rotate", id: l.id, cx: l.x, cy: l.y };
  }
  function startScale(e: ReactPointerEvent, l: Layer) {
    e.stopPropagation();
    const rect = rectInfo();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const startDist = Math.hypot((px - l.x) * rect.width, (py - l.y) * rect.height) || 1;
    interaction.current = { mode: "scale", id: l.id, cx: l.x, cy: l.y, startDist, startScale: l.scale };
  }

  // ── PNG 내보내기(라이브러리 없이 canvas 재렌더) ──────
  async function buildBlob(): Promise<Blob | null> {
    const canvas = document.createElement("canvas");
    canvas.width = EXPORT_W;
    canvas.height = EXPORT_H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    if (document.fonts?.ready) {
      try {
        await document.fonts.ready;
      } catch {
        /* 폰트 준비 실패해도 진행 */
      }
    }
    // 1) 셔츠
    const shirtImg = await loadImage(svgDataUrl(shirtSvg(shirt.value, shirt.stroke, EXPORT_W, EXPORT_H)));
    ctx.drawImage(shirtImg, 0, 0, EXPORT_W, EXPORT_H);
    // 2) 도형 이미지 미리 로드
    const shapeImgs = new Map<string, HTMLImageElement>();
    for (const l of layers) {
      if (l.kind === "shape" && l.shape) {
        const size = baseSizePx("shape", EXPORT_W) * l.scale;
        shapeImgs.set(l.id, await loadImage(svgDataUrl(shapeSvg(l.shape, l.color ?? "#ff550c", size))));
      }
    }
    // 3) 레이어 순서대로 그리기
    for (const l of layers) {
      ctx.save();
      ctx.translate(l.x * EXPORT_W, l.y * EXPORT_H);
      ctx.rotate((l.rotation * Math.PI) / 180);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (l.kind === "sticker") {
        const fs = baseSizePx("sticker", EXPORT_W) * l.scale;
        ctx.font = `${fs}px ${EMOJI_FONT}`;
        ctx.fillText(l.glyph ?? "", 0, 0);
      } else if (l.kind === "text") {
        const fs = baseSizePx("text", EXPORT_W) * l.scale;
        ctx.font = `${l.weight ?? 700} ${fs}px ${l.font ?? "sans-serif"}`;
        ctx.fillStyle = l.color ?? "#1A2B4A";
        ctx.fillText(l.text ?? "", 0, 0);
      } else {
        const img = shapeImgs.get(l.id);
        const size = baseSizePx("shape", EXPORT_W) * l.scale;
        if (img) ctx.drawImage(img, -size / 2, -size / 2, size, size);
      }
      ctx.restore();
    }
    return await new Promise<Blob | null>((res) => canvas.toBlob((b) => res(b), "image/png"));
  }

  function downloadBlob(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleSave() {
    if (!layers.length) return setNotice("먼저 티셔츠를 꾸며보세요!");
    setBusy(true);
    try {
      const blob = await buildBlob();
      if (blob) {
        downloadBlob(blob, "workup-tshirt.png");
        setNotice("이미지를 저장했어요! 매장에서 보여주시면 제작 상담을 도와드려요.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleKakao() {
    if (!layers.length) return setNotice("먼저 티셔츠를 꾸며보세요!");
    setBusy(true);
    try {
      const blob = await buildBlob();
      if (!blob) return;
      const file = new File([blob], "workup-tshirt.png", { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.canShare?.({ files: [file] }) && navigator.share) {
        try {
          await navigator.share({
            files: [file],
            title: "내가 꾸민 워크업 티셔츠",
            text: "이 디자인으로 매장에서 제작 상담받고 싶어요!",
          });
        } catch {
          /* 사용자가 공유 취소 — 무시 */
        }
      } else {
        downloadBlob(blob, "workup-tshirt.png");
        if (kakaoUrl) window.open(kakaoUrl, "_blank", "noopener,noreferrer");
        setNotice("이미지를 저장했어요. 카카오톡 상담창에 첨부해 보내주세요!");
      }
    } finally {
      setBusy(false);
    }
  }

  // ── 렌더: 레이어 1개 ────────────────────────────────
  function renderLayer(l: Layer, widthPx: number) {
    const size = baseSizePx(l.kind, widthPx) * l.scale;
    const isSel = l.id === selectedId;
    let content: ReactNode = null;
    if (l.kind === "sticker") {
      content = <span style={{ fontSize: size, lineHeight: 1 }}>{l.glyph}</span>;
    } else if (l.kind === "text") {
      content = (
        <span
          style={{
            fontSize: size,
            fontFamily: l.font,
            fontWeight: l.weight,
            color: l.color,
            lineHeight: 1.1,
            whiteSpace: "nowrap",
          }}
        >
          {l.text || "텍스트"}
        </span>
      );
    } else if (l.kind === "shape" && l.shape) {
      content = (
        <span
          style={{ display: "block", width: size, height: size }}
          dangerouslySetInnerHTML={{ __html: shapeSvg(l.shape, l.color ?? "#ff550c", size) }}
        />
      );
    }
    return (
      <div
        key={l.id}
        className="absolute touch-none select-none cursor-move"
        style={{ left: `${l.x * 100}%`, top: `${l.y * 100}%`, transform: `translate(-50%, -50%) rotate(${l.rotation}deg)` }}
        onPointerDown={(e) => startMove(e, l)}
      >
        {/* 선택 외곽선 */}
        {isSel && (
          <span className="pointer-events-none absolute -inset-2 border border-dashed border-[#ff550c]" aria-hidden />
        )}
        {content}
        {isSel && (
          <>
            {/* 삭제 */}
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                removeLayer(l.id);
              }}
              className="absolute -right-2 -top-2 flex h-7 w-7 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full bg-[#1A2B4A] text-white shadow-md"
              aria-label="요소 삭제"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {/* 회전 */}
            <button
              type="button"
              onPointerDown={(e) => startRotate(e, l)}
              className="absolute left-1/2 top-0 flex h-7 w-7 -translate-x-1/2 -translate-y-[170%] cursor-grab touch-none items-center justify-center rounded-full bg-white text-[#1A2B4A] shadow-md ring-1 ring-gray-200"
              aria-label="회전"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v6h6M20 20v-6h-6" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 9a8 8 0 0 0-14-3M4 15a8 8 0 0 0 14 3" />
              </svg>
            </button>
            {/* 크기 */}
            <button
              type="button"
              onPointerDown={(e) => startScale(e, l)}
              className="absolute -bottom-2 -right-2 flex h-7 w-7 translate-x-1/2 translate-y-1/2 cursor-nwse-resize touch-none items-center justify-center rounded-full bg-[#ff550c] text-white shadow-md"
              aria-label="크기 조절"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 21H3v-6M21 9V3h-6M3 21l8-8M21 3l-8 8" />
              </svg>
            </button>
          </>
        )}
      </div>
    );
  }

  // 스테이지 가로폭(레이어 px 계산용) — 측정해 두고 리사이즈 반영
  const [stageW, setStageW] = useState(0);
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setStageW(el.getBoundingClientRect().width));
    ro.observe(el);
    setStageW(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-10">
      {/* 헤더 */}
      <div className="mb-6 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#ff550c]">WORKUP STUDIO</p>
        <h1 className="mt-1 text-2xl font-extrabold text-[#1A2B4A] md:text-3xl">나만의 티셔츠 꾸미기</h1>
        <p className="mt-2 text-sm text-gray-500">스티커·텍스트·도형을 올려 나만의 디자인을 만들고, 매장에서 제작 상담받아 보세요.</p>
      </div>

      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        {/* 스테이지 */}
        <div className="md:w-1/2">
          <div
            ref={stageRef}
            onPointerDown={() => setSelectedId(null)}
            className="relative mx-auto w-full max-w-[420px] overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100"
            style={{ aspectRatio: `1 / ${STAGE_RATIO}` }}
          >
            {/* 셔츠 */}
            <div
              className="pointer-events-none absolute inset-0"
              dangerouslySetInnerHTML={{ __html: shirtSvg(shirt.value, shirt.stroke) }}
            />
            {/* 프린트 영역 가이드 */}
            <div
              className="pointer-events-none absolute rounded-md border border-dashed border-black/15"
              style={{ left: "30%", top: "28%", width: "40%", height: "34%" }}
              aria-hidden
            />
            {/* 레이어 */}
            {stageW > 0 && layers.map((l) => renderLayer(l, stageW))}
          </div>

          {/* 셔츠 색상 */}
          <div className="mt-4">
            <p className="mb-2 text-center text-xs font-semibold text-gray-500">티셔츠 색상</p>
            <div className="flex flex-wrap justify-center gap-2.5">
              {SHIRT_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setShirtId(c.id)}
                  className={`h-9 w-9 rounded-full ring-2 transition ${
                    shirtId === c.id ? "ring-[#ff550c] ring-offset-2" : "ring-gray-200"
                  }`}
                  style={{ backgroundColor: c.value }}
                  aria-label={c.label}
                  aria-pressed={shirtId === c.id}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 컨트롤 패널 */}
        <div className="md:w-1/2">
          {/* 탭 */}
          <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
            {(
              [
                ["sticker", "스티커"],
                ["text", "텍스트"],
                ["shape", "도형"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${
                  tab === key ? "bg-white text-[#1A2B4A] shadow-sm" : "text-gray-500"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* 탭 내용 */}
          <div className="mt-4 max-h-[320px] overflow-y-auto pr-1">
            {tab === "sticker" &&
              STICKER_GROUPS.map((g) => (
                <div key={g.label} className="mb-4">
                  <p className="mb-2 text-xs font-semibold text-gray-400">{g.label}</p>
                  <div className="grid grid-cols-6 gap-2">
                    {g.items.map((glyph, i) => (
                      <button
                        key={`${glyph}-${i}`}
                        type="button"
                        onClick={() => addSticker(glyph)}
                        className="flex aspect-square items-center justify-center rounded-lg bg-gray-50 text-2xl transition hover:bg-[#ff550c]/10 active:scale-95"
                        aria-label={`스티커 ${glyph} 추가`}
                      >
                        {glyph}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

            {tab === "text" && (
              <div>
                <button
                  type="button"
                  onClick={addText}
                  className="w-full rounded-lg bg-[#1A2B4A] py-3 text-sm font-semibold text-white transition hover:bg-[#ff550c]"
                >
                  + 텍스트 추가
                </button>
                <p className="mt-3 text-xs text-gray-400">텍스트를 추가한 뒤 아래에서 문구·폰트·색상을 바꿀 수 있어요.</p>
              </div>
            )}

            {tab === "shape" && (
              <div className="grid grid-cols-3 gap-2">
                {SHAPES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => addShape(s.id)}
                    className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg bg-gray-50 transition hover:bg-[#ff550c]/10 active:scale-95"
                    aria-label={`도형 ${s.label} 추가`}
                  >
                    <span
                      className="h-9 w-9 text-[#ff550c]"
                      dangerouslySetInnerHTML={{ __html: shapeSvg(s.id, "#ff550c", 36) }}
                    />
                    <span className="text-[11px] text-gray-500">{s.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 선택 요소 인스펙터 */}
          {selected && (
            <div className="mt-4 rounded-lg border border-gray-200 bg-white p-3">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">선택한 요소</span>
                <div className="flex gap-1">
                  <button type="button" onClick={() => reorder(selected.id, -1)} className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100" aria-label="뒤로 보내기">뒤로</button>
                  <button type="button" onClick={() => reorder(selected.id, 1)} className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100" aria-label="앞으로 가져오기">앞으로</button>
                  <button type="button" onClick={() => duplicateLayer(selected.id)} className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100">복제</button>
                  <button type="button" onClick={() => removeLayer(selected.id)} className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50">삭제</button>
                </div>
              </div>

              {/* 텍스트 편집 */}
              {selected.kind === "text" && (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={selected.text ?? ""}
                    onChange={(e) => updateLayer(selected.id, { text: e.target.value })}
                    placeholder="문구 입력"
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#ff550c]"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {TEXT_FONTS.map((f) => (
                      <button
                        key={f.label}
                        type="button"
                        onClick={() => updateLayer(selected.id, { font: f.family, weight: f.weight })}
                        className={`rounded-md border px-2.5 py-1 text-xs transition ${
                          selected.font === f.family ? "border-[#ff550c] text-[#ff550c]" : "border-gray-200 text-gray-600"
                        }`}
                        style={{ fontFamily: f.family }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 색상(텍스트·도형) */}
              {(selected.kind === "text" || selected.kind === "shape") && (
                <div className="mt-3">
                  <p className="mb-1.5 text-xs text-gray-400">색상</p>
                  <div className="flex flex-wrap gap-2">
                    {PALETTE_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => updateLayer(selected.id, { color: c })}
                        className={`h-7 w-7 rounded-full ring-1 transition ${
                          selected.color === c ? "ring-2 ring-[#ff550c] ring-offset-1" : "ring-gray-200"
                        }`}
                        style={{ backgroundColor: c }}
                        aria-label={`색상 ${c}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 크기 슬라이더(키보드 접근성) */}
              <div className="mt-3">
                <p className="mb-1 text-xs text-gray-400">크기</p>
                <input
                  type="range"
                  min={MIN_SCALE}
                  max={MAX_SCALE}
                  step={0.05}
                  value={selected.scale}
                  onChange={(e) => updateLayer(selected.id, { scale: Number(e.target.value) })}
                  className="w-full accent-[#ff550c]"
                  aria-label="크기 조절"
                />
              </div>
            </div>
          )}

          {!selected && (
            <p className="mt-4 rounded-lg bg-gray-50 px-3 py-2.5 text-center text-xs text-gray-400">
              요소를 탭하면 이동·회전·크기 조절과 편집을 할 수 있어요.
            </p>
          )}

          <button
            type="button"
            onClick={resetAll}
            className="mt-3 w-full rounded-lg border border-gray-200 py-2.5 text-xs text-gray-500 transition hover:border-gray-300 hover:text-gray-700"
          >
            전체 지우기
          </button>
        </div>
      </div>

      {/* 마무리 — 오프라인 전환 액션 바 */}
      <div
        className="sticky z-30 mt-8 flex gap-2 border-t border-gray-200 bg-white/95 px-1 py-3 backdrop-blur md:rounded-xl md:border md:px-3"
        style={{ bottom: "var(--wu-bottom-nav-h, 0px)" }}
      >
        <button
          type="button"
          onClick={handleSave}
          disabled={busy}
          className="flex-1 rounded-lg bg-[#1A2B4A] py-3 text-sm font-bold text-white transition hover:bg-[#0f1d36] disabled:opacity-50"
        >
          {busy ? "처리 중..." : "이미지 저장"}
        </button>
        <button
          type="button"
          onClick={handleKakao}
          disabled={busy}
          className="flex-1 rounded-lg bg-[#FEE500] py-3 text-sm font-bold text-[#3C1E1E] transition hover:brightness-95 disabled:opacity-50"
        >
          카카오 상담
        </button>
        <button
          type="button"
          onClick={() => setShowStores(true)}
          className="store-cta flex-1 rounded-lg py-3 text-sm font-bold"
        >
          매장 찾기
        </button>
      </div>

      {/* 토스트 */}
      {notice && (
        <div className="fixed left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#1A2B4A] px-5 py-2.5 text-center text-xs font-medium text-white shadow-lg" style={{ bottom: "calc(var(--wu-bottom-nav-h, 0px) + 80px)" }} role="status">
          {notice}
        </div>
      )}

      {showStores && <NearbyStoreModal productName="내가 꾸민 티셔츠" onClose={() => setShowStores(false)} />}
    </div>
  );
}
