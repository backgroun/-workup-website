"use client";
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import NearbyStoreModal from "@/components/NearbyStoreModal";
import {
  SHIRT_COLORS,
  DEFAULT_SHIRT_ID,
  TEXT_FONTS,
  PALETTE_COLORS,
  EXPORT_W,
  EXPORT_H,
  STAGE_RATIO,
  BASE_TEXT,
  BASE_IMAGE,
  MIN_SCALE,
  MAX_SCALE,
  DROP_X,
  DROP_Y,
  IMG_MAX,
  shirtSvg,
  type Layer,
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

// 레이어 표시 크기(px) — 이미지는 너비 기준(비율 유지), 텍스트는 폰트 크기
function layerWidthPx(l: Layer, stageWidthPx: number) {
  const base = l.kind === "image" ? BASE_IMAGE : BASE_TEXT;
  return base * stageWidthPx * l.scale;
}

type Interaction =
  | { mode: "move"; id: string; dx: number; dy: number }
  | { mode: "rotate"; id: string; cx: number; cy: number }
  | { mode: "scale"; id: string; cx: number; cy: number; startDist: number; startScale: number };

type DesignAsset = { id: string; url: string; label: string };

export default function TshirtStudio({
  kakaoUrl,
  heading,
  subheading,
  shirtImageUrl,
  defaultColor,
  enabledColors = [],
  designs = [],
}: {
  kakaoUrl: string;
  heading?: string;
  subheading?: string;
  shirtImageUrl?: string;
  defaultColor?: string;
  enabledColors?: string[];
  designs?: DesignAsset[];
}) {
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [shirtId, setShirtId] = useState<string>(defaultColor ?? DEFAULT_SHIRT_ID);
  const [tab, setTab] = useState<"design" | "image" | "text">(designs.length > 0 ? "design" : "image");
  const [loadingDesign, setLoadingDesign] = useState<string | null>(null);
  // 커스텀 셔츠 이미지를 data URL로 변환해두면 캔버스에서 CORS 없이 사용 가능
  const [shirtDataUrl, setShirtDataUrl] = useState<string | null>(null);
  const [showStores, setShowStores] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [stageW, setStageW] = useState(0);

  const stageRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const interaction = useRef<Interaction | null>(null);

  const availableColors = enabledColors.length === 0
    ? SHIRT_COLORS
    : SHIRT_COLORS.filter((c) => enabledColors.includes(c.id));
  const shirt = availableColors.find((c) => c.id === shirtId) ?? availableColors[0] ?? SHIRT_COLORS[0];
  const selected = layers.find((l) => l.id === selectedId) ?? null;

  // 토스트 자동 사라짐
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 3200);
    return () => clearTimeout(t);
  }, [notice]);

  // 커스텀 셔츠 이미지 → data URL 변환 (canvas export에 사용)
  useEffect(() => {
    if (!shirtImageUrl) {
      setShirtDataUrl(null);
      return;
    }
    let cancelled = false;
    fetch(shirtImageUrl)
      .then((r) => r.blob())
      .then(
        (blob) =>
          new Promise<string>((res, rej) => {
            const reader = new FileReader();
            reader.onload = () => res(String(reader.result));
            reader.onerror = rej;
            reader.readAsDataURL(blob);
          })
      )
      .then((url) => { if (!cancelled) setShirtDataUrl(url); })
      .catch(() => { if (!cancelled) setShirtDataUrl(null); });
    return () => { cancelled = true; };
  }, [shirtImageUrl]);

  // 스테이지 가로폭 측정(레이어 px 계산용)
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setStageW(el.getBoundingClientRect().width));
    ro.observe(el);
    setStageW(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  // 드래그/회전/크기조절 — 전역 포인터 이벤트
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
          ls.map((l) => (l.id === it.id ? { ...l, x: clamp(px + it.dx, 0, 1), y: clamp(py + it.dy, 0, 1) } : l))
        );
      } else if (it.mode === "rotate") {
        const ang = (Math.atan2((py - it.cy) * rect.height, (px - it.cx) * rect.width) * 180) / Math.PI + 90;
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

  // 키보드: Delete=삭제, Esc=선택해제 (입력 중 무시)
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

  // ── 레이어 추가 ─────────────────────────────────────
  function pushLayer(partial: Omit<Layer, "id" | "x" | "y" | "scale" | "rotation" | "opacity"> & { scale?: number }) {
    const n = layers.length;
    const id = uid();
    setLayers((ls) => [
      ...ls,
      {
        id,
        x: clamp(DROP_X + ((n % 3) - 1) * 0.05, 0.1, 0.9),
        y: clamp(DROP_Y + (Math.floor(n / 3) % 3) * 0.05, 0.1, 0.9),
        scale: partial.scale ?? 1,
        rotation: 0,
        opacity: 1,
        ...partial,
      },
    ]);
    setSelectedId(id);
  }

  const addText = () =>
    pushLayer({
      kind: "text",
      text: "텍스트",
      font: TEXT_FONTS[0].family,
      weight: TEXT_FONTS[0].weight,
      color: shirt.id === "white" || shirt.id === "ivory" || shirt.id === "sand" || shirt.id === "sky" ? "#303236" : "#FFFFFF",
    });

  // 프리셋 디자인 → fetch → File → handleFiles 경유 (canvas CORS 안전)
  async function addPresetDesign(asset: DesignAsset) {
    if (loadingDesign) return;
    setLoadingDesign(asset.id);
    try {
      const resp = await fetch(asset.url);
      const blob = await resp.blob();
      const file = new File([blob], asset.label || "design", { type: blob.type || "image/png" });
      handleFiles([file]);
    } catch {
      setNotice("디자인을 불러오는 중 오류가 발생했어요.");
    } finally {
      setLoadingDesign(null);
    }
  }

  // 업로드 이미지 → (필요시 다운스케일) → 레이어 추가
  function handleFiles(files: FileList | File[]) {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result);
        const probe = new Image();
        probe.onload = () => {
          let { width, height } = probe;
          let src = dataUrl;
          if (Math.max(width, height) > IMG_MAX) {
            const s = IMG_MAX / Math.max(width, height);
            const c = document.createElement("canvas");
            c.width = Math.round(width * s);
            c.height = Math.round(height * s);
            c.getContext("2d")?.drawImage(probe, 0, 0, c.width, c.height);
            src = c.toDataURL("image/png");
            width = c.width;
            height = c.height;
          }
          // 세로로 긴 이미지가 셔츠를 넘지 않도록 초기 배율 보정
          const ratio = height / width;
          const maxH = 0.62 * STAGE_RATIO; // (스테이지 가로폭 1 기준) 높이 한도
          const dispH = BASE_IMAGE * ratio;
          const initScale = dispH > maxH ? maxH / dispH : 1;
          pushLayer({ kind: "image", src, w: width, h: height, scale: clamp(initScale, MIN_SCALE, 1) });
        };
        probe.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  }

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

  // ── 포인터 시작 ─────────────────────────────────────
  function startMove(e: ReactPointerEvent, l: Layer) {
    e.stopPropagation();
    setSelectedId(l.id);
    const rect = stageRef.current!.getBoundingClientRect();
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
    const rect = stageRef.current!.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const startDist = Math.hypot((px - l.x) * rect.width, (py - l.y) * rect.height) || 1;
    interaction.current = { mode: "scale", id: l.id, cx: l.x, cy: l.y, startDist, startScale: l.scale };
  }

  // ── PNG 내보내기 ────────────────────────────────────
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
        /* noop */
      }
    }
    // 셔츠 — 커스텀 이미지 우선, 없으면 SVG
    const shirtSrc = shirtDataUrl
      ? shirtDataUrl
      : `data:image/svg+xml;charset=utf-8,${encodeURIComponent(shirtSvg(shirt.value, EXPORT_W, EXPORT_H))}`;
    const shirtImg = await loadImage(shirtSrc);
    ctx.drawImage(shirtImg, 0, 0, EXPORT_W, EXPORT_H);
    // 이미지 레이어 미리 로드
    const imgs = new Map<string, HTMLImageElement>();
    for (const l of layers) if (l.kind === "image" && l.src) imgs.set(l.id, await loadImage(l.src));
    // 레이어 순서대로
    for (const l of layers) {
      ctx.save();
      ctx.globalAlpha = l.opacity;
      ctx.translate(l.x * EXPORT_W, l.y * EXPORT_H);
      ctx.rotate((l.rotation * Math.PI) / 180);
      if (l.kind === "image") {
        const img = imgs.get(l.id);
        if (img && l.w && l.h) {
          const dispW = BASE_IMAGE * EXPORT_W * l.scale;
          const dispH = dispW * (l.h / l.w);
          ctx.drawImage(img, -dispW / 2, -dispH / 2, dispW, dispH);
        }
      } else {
        const fs = BASE_TEXT * EXPORT_W * l.scale;
        ctx.font = `${l.weight ?? 700} ${fs}px ${l.font ?? "sans-serif"}`;
        ctx.fillStyle = l.color ?? "#303236";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(l.text ?? "", 0, 0);
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
          await navigator.share({ files: [file], title: "내가 꾸민 워크업 티셔츠", text: "이 디자인으로 매장에서 제작 상담받고 싶어요!" });
        } catch {
          /* 취소 무시 */
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

  // ── 레이어 렌더 ─────────────────────────────────────
  function renderLayer(l: Layer, widthPx: number) {
    const w = layerWidthPx(l, widthPx);
    const isSel = l.id === selectedId;
    let content: ReactNode = null;
    if (l.kind === "image" && l.src && l.w && l.h) {
      content = (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={l.src} alt="" draggable={false} style={{ width: w, height: w * (l.h / l.w), display: "block", pointerEvents: "none" }} />
      );
    } else if (l.kind === "text") {
      content = (
        <span style={{ fontSize: w, fontFamily: l.font, fontWeight: l.weight, color: l.color, lineHeight: 1.1, whiteSpace: "nowrap" }}>
          {l.text || "텍스트"}
        </span>
      );
    }
    return (
      <div
        key={l.id}
        className="absolute touch-none select-none cursor-move"
        style={{ left: `${l.x * 100}%`, top: `${l.y * 100}%`, opacity: l.opacity, transform: `translate(-50%, -50%) rotate(${l.rotation}deg)` }}
        onPointerDown={(e) => startMove(e, l)}
      >
        {isSel && <span className="pointer-events-none absolute -inset-2 border border-dashed border-[#E5541B]" aria-hidden />}
        {content}
        {isSel && (
          <>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                removeLayer(l.id);
              }}
              className="absolute -right-2 -top-2 flex h-7 w-7 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full bg-[#303236] text-white shadow-md"
              aria-label="삭제"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <button
              type="button"
              onPointerDown={(e) => startRotate(e, l)}
              className="absolute left-1/2 top-0 flex h-7 w-7 -translate-x-1/2 -translate-y-[170%] cursor-grab touch-none items-center justify-center rounded-full bg-white text-[#303236] shadow-md ring-1 ring-gray-200"
              aria-label="회전"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 9a8 8 0 0 0-14-3M4 15a8 8 0 0 0 14 3" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v6h6M20 20v-6h-6" />
              </svg>
            </button>
            <button
              type="button"
              onPointerDown={(e) => startScale(e, l)}
              className="absolute -bottom-2 -right-2 flex h-7 w-7 translate-x-1/2 translate-y-1/2 cursor-nwse-resize touch-none items-center justify-center rounded-full bg-[#E5541B] text-white shadow-md"
              aria-label="크기"
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-10">
      {/* 헤더 */}
      <div className="mb-6 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E5541B]">WORKUP STUDIO</p>
        <h1 className="mt-1 text-2xl font-extrabold text-[#303236] md:text-3xl">
          {heading ?? "나만의 티셔츠 꾸미기"}
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          {subheading ?? "사진·이미지를 올리고 텍스트를 더해 디자인하고, 매장에서 제작 상담받아 보세요."}
        </p>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        {/* 스테이지 */}
        <div className="md:w-1/2">
          <div
            ref={stageRef}
            onPointerDown={() => setSelectedId(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
            }}
            className="relative mx-auto w-full max-w-[440px] overflow-hidden rounded-xl bg-[#f3f3f4] ring-1 ring-gray-200"
            style={{ aspectRatio: `1 / ${STAGE_RATIO}` }}
          >
            {shirtImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={shirtImageUrl}
                alt="티셔츠"
                className="pointer-events-none absolute inset-0 w-full h-full object-contain"
              />
            ) : (
              <div className="pointer-events-none absolute inset-0" dangerouslySetInnerHTML={{ __html: shirtSvg(shirt.value) }} />
            )}
            <div className="pointer-events-none absolute rounded-md border border-dashed border-black/15" style={{ left: "30%", top: "28%", width: "40%", height: "34%" }} aria-hidden />
            {stageW > 0 && layers.map((l) => renderLayer(l, stageW))}
          </div>

          {/* 셔츠 색상 — 커스텀 이미지 설정 시 숨김 */}
          {!shirtImageUrl && (
            <div className="mt-4">
              <p className="mb-2 text-center text-xs font-semibold text-gray-500">
                색상 — <span className="text-[#303236]">{shirt.label}</span>
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {availableColors.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setShirtId(c.id)}
                    className={`h-8 w-8 rounded-full ring-1 transition ${shirtId === c.id ? "ring-2 ring-[#E5541B] ring-offset-2" : "ring-gray-300"}`}
                    style={{ backgroundColor: c.value }}
                    aria-label={c.label}
                    aria-pressed={shirtId === c.id}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 컨트롤 패널 */}
        <div className="md:w-1/2">
          <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
            {(
              [
                ...(designs.length > 0 ? [["design", "디자인"] as const] : []),
                ["image", "이미지"] as const,
                ["text", "텍스트"] as const,
              ]
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key as typeof tab)}
                className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${tab === key ? "bg-white text-[#303236] shadow-sm" : "text-gray-500"}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-4">
            {/* 디자인 탭 — 관리자가 올린 프리셋 */}
            {tab === "design" && (
              <div>
                <p className="mb-3 text-xs text-gray-500">
                  클릭하면 티셔츠에 디자인이 추가됩니다. 크기·위치·회전을 자유롭게 조절해 보세요.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {designs.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      disabled={!!loadingDesign}
                      onClick={() => addPresetDesign(d)}
                      className={`relative flex flex-col items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 p-2 transition hover:border-[#E5541B] hover:bg-[#E5541B]/5 ${loadingDesign === d.id ? "opacity-60" : ""}`}
                    >
                      <div className="flex h-16 w-full items-center justify-center rounded-lg bg-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={d.url} alt={d.label} className="max-h-14 max-w-full object-contain" />
                      </div>
                      {d.label && (
                        <span className="text-[10px] text-gray-500 leading-tight text-center line-clamp-1">{d.label}</span>
                      )}
                      {loadingDesign === d.id && (
                        <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/70">
                          <span className="w-5 h-5 border-2 border-[#E5541B] border-t-transparent rounded-full animate-spin" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setTab("image")}
                  className="mt-4 w-full py-2.5 rounded-lg border border-gray-200 text-sm text-gray-500 hover:border-[#E5541B] hover:text-[#E5541B] transition"
                >
                  + 내 이미지 직접 올리기
                </button>
              </div>
            )}

            {tab === "image" && (
              <div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 py-8 text-center transition hover:border-[#E5541B] hover:bg-[#E5541B]/5"
                >
                  <svg className="h-8 w-8 text-[#E5541B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M4 16l4.6-4.6a2 2 0 0 1 2.8 0L16 16m-2-2l1.6-1.6a2 2 0 0 1 2.8 0L20 14M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z" />
                  </svg>
                  <span className="text-sm font-semibold text-[#303236]">이미지 업로드</span>
                  <span className="text-xs text-gray-400">탭하거나 끌어다 놓기 · PNG·JPG · 배경 없는 PNG 추천</span>
                </button>
                <p className="mt-3 text-xs text-gray-400">올린 이미지는 드래그로 이동, 모서리로 크기·회전할 수 있어요. 여러 장을 겹쳐 콜라주처럼 꾸며보세요.</p>
              </div>
            )}

            {tab === "text" && (
              <div>
                <button
                  type="button"
                  onClick={addText}
                  className="w-full rounded-lg bg-[#303236] py-3 text-sm font-semibold text-white transition hover:bg-[#E5541B]"
                >
                  + 텍스트 추가
                </button>
                <p className="mt-3 text-xs text-gray-400">텍스트를 추가한 뒤 아래에서 문구·폰트·색상을 바꿀 수 있어요.</p>
              </div>
            )}
          </div>

          {/* 선택 요소 인스펙터 */}
          {selected && (
            <div className="mt-4 rounded-lg border border-gray-200 bg-white p-3">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">{selected.kind === "image" ? "선택한 이미지" : "선택한 텍스트"}</span>
                <div className="flex gap-1">
                  <button type="button" onClick={() => reorder(selected.id, -1)} className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100">뒤로</button>
                  <button type="button" onClick={() => reorder(selected.id, 1)} className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100">앞으로</button>
                  <button type="button" onClick={() => duplicateLayer(selected.id)} className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100">복제</button>
                  <button type="button" onClick={() => removeLayer(selected.id)} className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50">삭제</button>
                </div>
              </div>

              {selected.kind === "text" && (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={selected.text ?? ""}
                    onChange={(e) => updateLayer(selected.id, { text: e.target.value })}
                    placeholder="문구 입력"
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#E5541B]"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {TEXT_FONTS.map((f) => (
                      <button
                        key={f.label}
                        type="button"
                        onClick={() => updateLayer(selected.id, { font: f.family, weight: f.weight })}
                        className={`rounded-md border px-2.5 py-1 text-xs transition ${selected.font === f.family ? "border-[#E5541B] text-[#E5541B]" : "border-gray-200 text-gray-600"}`}
                        style={{ fontFamily: f.family }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <div>
                    <p className="mb-1.5 text-xs text-gray-400">색상</p>
                    <div className="flex flex-wrap gap-2">
                      {PALETTE_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => updateLayer(selected.id, { color: c })}
                          className={`h-7 w-7 rounded-full ring-1 transition ${selected.color === c ? "ring-2 ring-[#E5541B] ring-offset-1" : "ring-gray-200"}`}
                          style={{ backgroundColor: c }}
                          aria-label={`색상 ${c}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-3">
                <p className="mb-1 text-xs text-gray-400">크기</p>
                <input type="range" min={MIN_SCALE} max={MAX_SCALE} step={0.05} value={selected.scale} onChange={(e) => updateLayer(selected.id, { scale: Number(e.target.value) })} className="w-full accent-[#E5541B]" aria-label="크기" />
              </div>
              <div className="mt-2">
                <p className="mb-1 text-xs text-gray-400">투명도</p>
                <input type="range" min={0.1} max={1} step={0.05} value={selected.opacity} onChange={(e) => updateLayer(selected.id, { opacity: Number(e.target.value) })} className="w-full accent-[#E5541B]" aria-label="투명도" />
              </div>
            </div>
          )}

          {!selected && (
            <p className="mt-4 rounded-lg bg-gray-50 px-3 py-2.5 text-center text-xs text-gray-400">요소를 탭하면 이동·회전·크기·투명도를 조절할 수 있어요.</p>
          )}

          <button type="button" onClick={resetAll} className="mt-3 w-full rounded-lg border border-gray-200 py-2.5 text-xs text-gray-500 transition hover:border-gray-300 hover:text-gray-700">
            전체 지우기
          </button>
        </div>
      </div>

      {/* 마무리 — 오프라인 전환 액션 바 */}
      <div className="sticky z-30 mt-8 flex gap-2 border-t border-gray-200 bg-white/95 px-1 py-3 backdrop-blur md:rounded-xl md:border md:px-3" style={{ bottom: "var(--wu-bottom-nav-h, 0px)" }}>
        <button type="button" onClick={handleSave} disabled={busy} className="flex-1 rounded-lg bg-[#303236] py-3 text-sm font-bold text-white transition hover:bg-[#0f1d36] disabled:opacity-50">
          {busy ? "처리 중..." : "이미지 저장"}
        </button>
        <button type="button" onClick={handleKakao} disabled={busy} className="flex-1 rounded-lg bg-[#FEE500] py-3 text-sm font-bold text-[#3C1E1E] transition hover:brightness-95 disabled:opacity-50">
          카카오 상담
        </button>
        <button type="button" onClick={() => setShowStores(true)} className="store-cta flex-1 rounded-lg py-3 text-sm font-bold">
          매장 찾기
        </button>
      </div>

      {notice && (
        <div className="fixed left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#303236] px-5 py-2.5 text-center text-xs font-medium text-white shadow-lg" style={{ bottom: "calc(var(--wu-bottom-nav-h, 0px) + 80px)" }} role="status">
          {notice}
        </div>
      )}

      {showStores && <NearbyStoreModal productName="내가 꾸민 티셔츠" onClose={() => setShowStores(false)} />}
    </div>
  );
}
