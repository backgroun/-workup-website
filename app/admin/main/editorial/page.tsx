"use client";
import { useState, useEffect, useRef } from "react";

// ── 타입 정의 ──────────────────────────────────────────────
type ProductItem = {
  id: string;
  product_id: string;
  name: string;
  price: string;
  image_url: string;
  bg: string;
};

type HeroTag = {
  id: string;
  x: number;
  y: number;
  pc_x?: number;
  pc_y?: number;
  name: string;
  price: string;
  product_id: string;
  image_url: string;
  bg: string;
};

type Banner = {
  title: string;
  desc: string;
  section_bg: string;
  image_url: string;
  items: ProductItem[];
};

type EditorialBlock = {
  id: string;
  sort_order: number;
  is_visible: boolean;
  reversed: boolean;
  type: "image" | "product";
  hero: {
    title: string;
    subtitle: string;
    hero_subtitle: string;
    desc: string;
    image_url: string;
    image_position?: string;
    bg_color: string;
    tags: HeroTag[];
  };
  banner1: Banner;
  banner2: Banner;
  banner3: Banner;
  banner4: Banner;
};

type SearchProduct = { id: string; name: string; price: string; imageUrl?: string };

// ── 기본값 ──────────────────────────────────────────────────
function emptyBanner(): Banner {
  return {
    title: "",
    desc: "",
    section_bg: "#1A2B4A",
    image_url: "",
    items: [emptyItem(), emptyItem(), emptyItem()],
  };
}
function emptyItem(): ProductItem {
  return { id: uid(), product_id: "", name: "", price: "", image_url: "", bg: "#e5e7eb" };
}
function emptyBlock(order: number, reversed = false): EditorialBlock {
  return {
    id: uid(),
    sort_order: order,
    is_visible: true,
    reversed,
    type: "product",
    hero: {
      title: "",
      subtitle: "",
      hero_subtitle: "",
      desc: "",
      image_url: "",
      bg_color: "#1A2B4A",
      tags: [],
    },
    banner1: emptyBanner(),
    banner2: emptyBanner(),
    banner3: emptyBanner(),
    banner4: emptyBanner(),
  };
}
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ── 제품 검색 피커 ─────────────────────────────────────────
function ProductPicker({ products, value, onSelect }: {
  products: SearchProduct[];
  value: string;
  onSelect: (p: SearchProduct) => void;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);

  useEffect(() => { if (!open) setQuery(value); }, [value, open]);

  const results = query.trim()
    ? products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : products.slice(0, 8);

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="제품명으로 검색..."
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-[#1A2B4A]/30"
        />
        <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 border border-gray-200 rounded-lg bg-white shadow-lg max-h-44 overflow-y-auto">
          {results.map((p) => (
            <button
              key={p.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(p);
                setQuery(p.name);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 text-left border-b border-gray-100 last:border-0"
            >
              {p.imageUrl ? (
                <img src={p.imageUrl} alt="" className="w-8 h-8 object-cover rounded flex-shrink-0" />
              ) : (
                <div className="w-8 h-8 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center">
                  <span className="text-[8px] text-gray-400 font-bold">WU</span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium text-gray-800 truncate">{p.name}</p>
                <p className="text-[11px] text-gray-500">{p.price}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function createDefaultBlocks(): EditorialBlock[] {
  const di = (name: string, price: string, pid: string, bg: string): ProductItem =>
    ({ id: uid(), product_id: pid, name, price, image_url: "", bg });
  const tag = (x: number, y: number, name: string, price: string, pid: string, bg: string): HeroTag =>
    ({ id: uid(), x, y, name, price, product_id: pid, image_url: "", bg });

  return [
    // ── 블록 1: 좌측 메인 — UV 대책 특집 ──────────────────
    {
      id: uid(), sort_order: 0, is_visible: true, reversed: false, type: "product",
      hero: {
        title: "UV 대책 특집",
        subtitle: "자외선 차단 + 흡한속건",
        hero_subtitle: "여름 현장 필수 아이템",
        desc: "UPF 인증 소재로 자외선을 막고, 땀은 날려버립니다. 강렬한 여름 햇볕 아래 현장에서도 쾌적함을 유지하는 기능성 라인업.",
        image_url: "", bg_color: "#7C3400",
        tags: [
          tag(32, 22, "쿨링 반팔 티셔츠", "19,000원", "cooling-short-sleeve", "#2d4f72"),
          tag(58, 45, "흡한속건 긴팔 티셔츠", "25,000원", "quick-dry-long-sleeve", "#243d5e"),
          tag(42, 68, "스트레치 카고 팬츠", "39,000원", "stretch-cargo-pants", "#1A2B4A"),
        ],
      },
      banner1: {
        title: "자외선을 막는 기능성 상의",
        desc: "UPF 40+ 인증 소재로 강렬한 자외선을 차단하면서도 흡한속건 기능으로 쾌적함을 유지합니다.",
        section_bg: "#4a7fa5", image_url: "",
        items: [
          di("쿨링 반팔 티셔츠", "19,000원", "cooling-short-sleeve", "#2d4f72"),
          di("흡한속건 긴팔 티셔츠", "25,000원", "quick-dry-long-sleeve", "#243d5e"),
          di("워크 롤업 셔츠", "35,000원", "work-rollup-shirt", "#4d4d4d"),
        ],
      },
      banner2: {
        title: "현장을 버티는 하의",
        desc: "움직임이 많은 현장 환경에서도 불편함 없이 착용 가능한 스트레치 소재 하의 라인업입니다.",
        section_bg: "#1A2B4A", image_url: "",
        items: [
          di("스트레치 카고 팬츠", "39,000원", "stretch-cargo-pants", "#1A2B4A"),
          di("워크 치노 팬츠", "45,000원", "work-chino-pants", "#3D3D3D"),
          di("멀티포켓 조끼", "35,000원", "multi-pocket-vest", "#5a5a5a"),
        ],
      },
      banner3: {
        title: "UV 차단 액세서리 모음",
        desc: "자외선을 막는 것은 옷만이 아닙니다. 모자, 팔토시, 넥게이터까지 빈틈 없이 자외선을 차단하세요.",
        section_bg: "#6b9cb0", image_url: "",
        items: [
          di("UV 차단 팔토시", "12,000원", "cooling-short-sleeve", "#4a7fa5"),
          di("넥게이터", "9,000원", "quick-dry-long-sleeve", "#2d4f72"),
          di("챙넓은 작업 모자", "18,000원", "work-rollup-shirt", "#3a5a7a"),
        ],
      },
      banner4: {
        title: "여성 UV 케어 라인",
        desc: "여성 작업자를 위한 UV 차단 전용 라인. 슬림 핏으로 작업 효율과 스타일을 동시에 잡았습니다.",
        section_bg: "#2e4a6a", image_url: "",
        items: [
          di("여성 UV 슬림 팬츠", "42,000원", "stretch-cargo-pants", "#1A2B4A"),
          di("여성 쿨링 상의", "22,000원", "cooling-short-sleeve", "#2d4f72"),
          di("여성 기능 조끼", "33,000원", "multi-pocket-vest", "#3a5a6a"),
        ],
      },
    },

    // ── 블록 2: 우측 메인 — 건설현장 필수템 ──────────────
    {
      id: uid(), sort_order: 1, is_visible: true, reversed: true, type: "product",
      hero: {
        title: "건설현장 필수템",
        subtitle: "내구성과 안전을 동시에",
        hero_subtitle: "현장 작업자가 직접 선택한",
        desc: "15년 경력자도 인정한 현장 최강 라인업. 1,000회 내구성 테스트와 KC 인증 안전 소재로 어떤 현장에서도 믿을 수 있습니다.",
        image_url: "", bg_color: "#1A2B4A",
        tags: [
          tag(30, 28, "반사띠 안전 자켓", "79,000원", "reflective-safety-jacket", "#1A2B4A"),
          tag(52, 48, "스트레치 카고 팬츠", "39,000원", "stretch-cargo-pants", "#1A2B4A"),
          tag(38, 70, "쿨링 반팔 티셔츠", "19,000원", "cooling-short-sleeve", "#2d4f72"),
        ],
      },
      banner1: {
        title: "내구성 검증 작업복",
        desc: "1,000회 내구성 테스트를 통과한 소재. 현장의 거친 환경에서도 형태를 유지하는 워크업 SITE 라인입니다.",
        section_bg: "#243d5e", image_url: "",
        items: [
          di("스트레치 카고 팬츠", "39,000원", "stretch-cargo-pants", "#1A2B4A"),
          di("쿨링 반팔 티셔츠", "19,000원", "cooling-short-sleeve", "#2d4f72"),
          di("멀티포켓 조끼", "35,000원", "multi-pocket-vest", "#5a5a5a"),
        ],
      },
      banner2: {
        title: "안전 인증 보호구",
        desc: "KC 인증을 받은 반사 소재와 형광 원단으로 어두운 현장에서도 내 존재를 알립니다.",
        section_bg: "#2e3d28", image_url: "",
        items: [
          di("반사띠 안전 자켓", "79,000원", "reflective-safety-jacket", "#1A2B4A"),
          di("경량 방풍 자켓", "59,000원", "lightweight-windproof-jacket", "#243d5e"),
          di("흡한속건 긴팔 티셔츠", "25,000원", "quick-dry-long-sleeve", "#243d5e"),
        ],
      },
      banner3: {
        title: "현장 방호 & 보호 용품",
        desc: "장갑, 안전모, 안전화까지. 전신을 지키는 워크업 안전 보호구 풀 라인업입니다.",
        section_bg: "#1a2e4a", image_url: "",
        items: [
          di("고시인성 안전 조끼", "45,000원", "reflective-safety-jacket", "#2d4a2a"),
          di("방호 카고 팬츠", "55,000원", "stretch-cargo-pants", "#1A2B4A"),
          di("안전 멀티포켓 조끼", "39,000원", "multi-pocket-vest", "#3a3a5a"),
        ],
      },
      banner4: {
        title: "현장 작업 잡화",
        desc: "현장에서 매일 쓰는 공구함, 허리쌕, 장갑까지. 워크업 현장 잡화로 작업 효율을 높이세요.",
        section_bg: "#3a3a2e", image_url: "",
        items: [
          di("작업용 장갑 (6매)", "8,000원", "cooling-short-sleeve", "#4a3a2a"),
          di("현장 허리쌕", "28,000원", "quick-dry-long-sleeve", "#3a4a2a"),
          di("공구 파우치", "15,000원", "work-rollup-shirt", "#4a4a3a"),
        ],
      },
    },

    // ── 블록 3: 좌측 메인 — 아웃도어 특집 ────────────────
    {
      id: uid(), sort_order: 2, is_visible: true, reversed: false, type: "product",
      hero: {
        title: "아웃도어 특집",
        subtitle: "방풍·방수 퍼포먼스",
        hero_subtitle: "날씨를 이기는 기어",
        desc: "산에서도, 현장에서도. 날씨를 이기는 기어. 방풍·방수 가공과 360g 초경량 설계로 어떤 환경도 거뜬합니다.",
        image_url: "", bg_color: "#1E3A20",
        tags: [
          tag(35, 25, "경량 방풍 자켓", "59,000원", "lightweight-windproof-jacket", "#243d5e"),
          tag(55, 50, "방풍 후드 집업", "65,000원", "windproof-hoodie-zip", "#3D3D3D"),
          tag(40, 72, "스트레치 카고 팬츠", "39,000원", "stretch-cargo-pants", "#1A2B4A"),
        ],
      },
      banner1: {
        title: "바람과 비를 막는 아우터",
        desc: "방풍·방수 가공으로 거친 날씨에도 체온을 지켜주는 아우터 라인입니다. 360g의 초경량 설계로 움직임도 자유롭습니다.",
        section_bg: "#2d5a30", image_url: "",
        items: [
          di("경량 방풍 자켓", "59,000원", "lightweight-windproof-jacket", "#243d5e"),
          di("방풍 후드 집업", "65,000원", "windproof-hoodie-zip", "#3D3D3D"),
          di("멀티포켓 조끼", "35,000원", "multi-pocket-vest", "#5a5a5a"),
        ],
      },
      banner2: {
        title: "아웃도어를 완성하는 하의",
        desc: "험한 지형에서도 자유로운 움직임을 보장하는 스트레치 하의. 다용도 포켓으로 편의성을 높였습니다.",
        section_bg: "#3d5c3f", image_url: "",
        items: [
          di("스트레치 카고 팬츠", "39,000원", "stretch-cargo-pants", "#1A2B4A"),
          di("워크 치노 팬츠", "45,000원", "work-chino-pants", "#3D3D3D"),
          di("흡한속건 긴팔 티셔츠", "25,000원", "quick-dry-long-sleeve", "#243d5e"),
        ],
      },
      banner3: {
        title: "아웃도어 베이스레이어",
        desc: "피부에 직접 닿는 베이스레이어는 소재가 핵심입니다. 흡습속건·항균 기능으로 장시간 착용에도 쾌적합니다.",
        section_bg: "#1e4022", image_url: "",
        items: [
          di("흡습속건 베이스 티셔츠", "21,000원", "cooling-short-sleeve", "#2d4f72"),
          di("베이스레이어 긴팔", "27,000원", "quick-dry-long-sleeve", "#243d5e"),
          di("항균 기능 셔츠", "37,000원", "work-rollup-shirt", "#3d5c3f"),
        ],
      },
      banner4: {
        title: "아웃도어 전용 액세서리",
        desc: "장갑, 모자, 넥게이터. 작은 디테일이 모여 완벽한 아웃도어 착장이 됩니다.",
        section_bg: "#2a4a2c", image_url: "",
        items: [
          di("경량 멀티포켓 조끼", "37,000원", "multi-pocket-vest", "#4a6a4c"),
          di("아웃도어 레깅스 팬츠", "41,000원", "stretch-cargo-pants", "#2d4a30"),
          di("산행 치노 쇼츠", "33,000원", "work-chino-pants", "#3D3D3D"),
        ],
      },
    },

    // ── 블록 4: 우측 메인 — 현장 to 일상 ─────────────────
    {
      id: uid(), sort_order: 3, is_visible: true, reversed: true, type: "product",
      hero: {
        title: "현장 to 일상",
        subtitle: "출근도 퇴근도 이 한 벌로",
        hero_subtitle: "현장과 일상 사이, 어색하지 않게",
        desc: "현장 실용성 + 일상 감각. DAILY 라인 전체 모음. 오전엔 공장, 오후엔 바이어 미팅. 스트레치 소재와 세련된 실루엣으로 어느 자리에서도 어색함이 없습니다.",
        image_url: "", bg_color: "#2D2D2D",
        tags: [
          tag(36, 24, "헤비 크루넥 스웻셔츠", "49,000원", "heavy-crewneck-sweatshirt", "#4d4d4d"),
          tag(55, 52, "워크 치노 팬츠", "45,000원", "work-chino-pants", "#3D3D3D"),
          tag(40, 74, "방풍 후드 집업", "65,000원", "windproof-hoodie-zip", "#3D3D3D"),
        ],
      },
      banner1: {
        title: "일상을 완성하는 상의",
        desc: "퇴근 후 카페, 주말 나들이. 현장 작업복에서 일상복으로 자연스럽게 이어지는 DAILY 상의 라인입니다.",
        section_bg: "#4d4d4d", image_url: "",
        items: [
          di("헤비 크루넥 스웻셔츠", "49,000원", "heavy-crewneck-sweatshirt", "#4d4d4d"),
          di("워크 롤업 셔츠", "35,000원", "work-rollup-shirt", "#4d4d4d"),
          di("방풍 후드 집업", "65,000원", "windproof-hoodie-zip", "#3D3D3D"),
        ],
      },
      banner2: {
        title: "현장도 일상도 맞는 하의",
        desc: "오전엔 공장, 오후엔 바이어 미팅. 스트레치 소재와 세련된 실루엣으로 어느 자리에서도 어색함이 없습니다.",
        section_bg: "#3D3D3D", image_url: "",
        items: [
          di("워크 치노 팬츠", "45,000원", "work-chino-pants", "#3D3D3D"),
          di("스트레치 카고 팬츠", "39,000원", "stretch-cargo-pants", "#1A2B4A"),
          di("멀티포켓 조끼", "35,000원", "multi-pocket-vest", "#5a5a5a"),
        ],
      },
      banner3: {
        title: "워크데일리 코디 세트",
        desc: "상의와 하의를 함께 구매하면 더 저렴하게. 워크업이 제안하는 데일리 코디 세트를 만나보세요.",
        section_bg: "#5a5a5a", image_url: "",
        items: [
          di("크루넥 + 치노 세트", "85,000원", "heavy-crewneck-sweatshirt", "#4d4d4d"),
          di("집업 + 카고 세트", "95,000원", "windproof-hoodie-zip", "#3D3D3D"),
          di("롤업셔츠 + 치노 세트", "72,000원", "work-rollup-shirt", "#5a5a5a"),
        ],
      },
      banner4: {
        title: "커스텀 오더 라인",
        desc: "회사 로고, 이름, 부서명까지. 나만의 작업복을 맞춤 주문하세요. 10벌 이상 단체 주문 시 특별 할인.",
        section_bg: "#2D2D2D", image_url: "",
        items: [
          di("커스텀 반팔 티셔츠", "24,000원~", "cooling-short-sleeve", "#3a3a3a"),
          di("커스텀 조끼", "42,000원~", "multi-pocket-vest", "#4a4a4a"),
          di("커스텀 카고 팬츠", "47,000원~", "stretch-cargo-pants", "#1a2a3a"),
        ],
      },
    },
  ];
}

// ── 이미지 업로드 헬퍼 ─────────────────────────────────────
async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: form });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "업로드 실패");
  return json.url as string;
}

// 업로드 전 자동 리사이징 (최장변 1800px 이하로 축소, 비율 유지)
async function resizeImage(file: File, maxPx = 1800): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const objUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objUrl);
      const max = Math.max(img.width, img.height);
      if (max <= maxPx) { resolve(file); return; }
      const ratio = maxPx / max;
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => resolve(blob
          ? new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" })
          : file),
        "image/jpeg", 0.92
      );
    };
    img.onerror = () => { URL.revokeObjectURL(objUrl); resolve(file); };
    img.src = objUrl;
  });
}

// ── 서브 컴포넌트: 이미지 업로드 필드 (드래그 & 드롭 지원) ──
function ImageField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr]             = useState("");
  const [dragging, setDragging]   = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) { setErr("이미지 파일만 업로드 가능합니다."); return; }
    setErr(""); setUploading(true);
    try {
      const resized = await resizeImage(file);
      const url = await uploadImage(resized);
      onChange(url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "업로드 실패");
    } finally { setUploading(false); }
  }

  function onDragOver(e: React.DragEvent)  { e.preventDefault(); setDragging(true); }
  function onDragEnter(e: React.DragEvent) { e.preventDefault(); setDragging(true); }
  function onDragLeave(e: React.DragEvent) { e.preventDefault(); setDragging(false); }
  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      <div
        onDragOver={onDragOver} onDragEnter={onDragEnter}
        onDragLeave={onDragLeave} onDrop={onDrop}
        onClick={() => !uploading && ref.current?.click()}
        className={`relative rounded-xl border-2 transition-all cursor-pointer ${
          dragging ? "border-[#ff550c] bg-orange-50 scale-[1.01]" :
          value     ? "border-gray-200 hover:border-gray-300" :
                      "border-dashed border-gray-300 hover:border-[#1A2B4A]"
        }`}
      >
        <input ref={ref} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />

        {value ? (
          <div className="flex items-center gap-3 p-3" onClick={e => e.stopPropagation()}>
            <img src={value} alt="" className="w-20 h-14 object-cover rounded-lg flex-shrink-0 border border-gray-100" />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] text-gray-600 truncate">{value.split("/").pop()}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{hint}</p>
              <button
                onClick={(e) => { e.stopPropagation(); ref.current?.click(); }}
                className="text-[11px] text-[#1A2B4A] hover:underline mt-1"
              >이미지 변경</button>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onChange(""); }}
              className="flex-shrink-0 text-[11px] text-red-400 hover:text-red-600 border border-red-100 px-2 py-1 rounded hover:bg-red-50"
            >제거</button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-5 px-4 text-center pointer-events-none">
            <svg className={`w-7 h-7 transition-colors ${dragging ? "text-[#ff550c]" : "text-gray-300"}`}
              fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className={`text-[13px] font-medium transition-colors ${dragging ? "text-[#ff550c]" : "text-gray-500"}`}>
              {dragging ? "여기에 이미지를 놓으세요" : "클릭하거나 이미지를 드래그"}
            </p>
            <p className="text-[11px] text-gray-400">{hint}</p>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
            <div className="flex items-center gap-2 text-[13px] text-gray-600">
              <span className="w-4 h-4 border-2 border-[#ff550c] border-t-transparent rounded-full animate-spin" />
              업로드 중...
            </div>
          </div>
        )}
      </div>
      {err && <p className="text-[11px] text-red-500 mt-1">{err}</p>}
    </div>
  );
}

// ── 서브 컴포넌트: 텍스트 입력 ─────────────────────────────
function Field({
  label, value, onChange, placeholder = "", multiline = false,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; multiline?: boolean;
}) {
  const cls = "w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A2B4A]/30";
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder} rows={3} className={cls} />
      ) : (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder} className={cls} />
      )}
    </div>
  );
}

// ── 서브 컴포넌트: 색상 입력 ───────────────────────────────
function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
          className="w-9 h-9 rounded-lg border border-gray-300 cursor-pointer flex-shrink-0" />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
          className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A2B4A]/30"
          placeholder="#1A2B4A" />
      </div>
    </div>
  );
}

// ── 서브 컴포넌트: 상품 아이템 에디터 ─────────────────────
function ItemEditor({ item, onChange, onDelete, products }: {
  item: ProductItem;
  onChange: (patch: Partial<ProductItem>) => void;
  onDelete: () => void;
  products: SearchProduct[];
}) {
  return (
    <div className="border border-gray-200 rounded-xl p-3 bg-gray-50">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">상품</span>
        <button onClick={onDelete} className="text-[11px] text-red-400 hover:text-red-600">삭제</button>
      </div>
      {/* 제품 검색 */}
      <div className="mb-2">
        <label className="block text-xs font-medium text-gray-600 mb-1">제품 검색</label>
        <ProductPicker
          products={products}
          value={item.name}
          onSelect={(p) => onChange({ product_id: p.id, name: p.name, price: p.price, image_url: p.imageUrl ?? "" })}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="상품명 (직접 수정)" value={item.name} onChange={(v) => onChange({ name: v })} placeholder="쿨링 반팔 티셔츠" />
        <Field label="가격" value={item.price} onChange={(v) => onChange({ price: v })} placeholder="19,000원" />
        {item.image_url && (
          <div className="col-span-2 flex items-center gap-2">
            <img src={item.image_url} alt="" className="w-10 h-10 object-cover rounded border border-gray-200 flex-shrink-0" />
            <span className="text-[10px] text-gray-400 truncate">{item.image_url.split("/").pop()}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 서브 컴포넌트: 배너 에디터 (배너1/배너2 공용) ─────────
function BannerEditor({ banner, label, onChange, products }: {
  banner: Banner;
  label: string;
  onChange: (patch: Partial<Banner>) => void;
  products: SearchProduct[];
}) {
  function updateItem(idx: number, patch: Partial<ProductItem>) {
    const next = [...banner.items];
    next[idx] = { ...next[idx], ...patch };
    onChange({ items: next });
  }
  function addItem() {
    if (banner.items.length >= 3) return;
    onChange({ items: [...banner.items, emptyItem()] });
  }
  function deleteItem(idx: number) {
    onChange({ items: banner.items.filter((_, i) => i !== idx) });
  }

  return (
    <div className="space-y-5">
      <div className="bg-[#fff8f0] border border-orange-100 rounded-xl px-4 py-3">
        <p className="text-xs text-orange-600 font-medium">
          {label} — 이미지 권장: <strong>440 × 495px</strong> · JPG/PNG · 1MB 이하
        </p>
      </div>

      <div>
        <Field label="타이틀" value={banner.title} onChange={(v) => onChange({ title: v })}
          placeholder="자외선을 막는 기능성 상의" />
      </div>

      <Field label="설명" value={banner.desc} onChange={(v) => onChange({ desc: v })}
        placeholder="섹션 설명을 입력하세요" multiline />

      {/* AI 이미지 프롬프트 빌더 */}
      <PromptBuilder
        buildFn={(shotType, clothingType, season, extras) =>
          buildBannerPrompt(banner.title, banner.desc, shotType, clothingType, season, extras, banner.image_url || undefined)
        }
        sizeLabel="440 × 495px"
        ratioLabel="8 : 9"
        refImageUrl={banner.image_url || undefined}
      />

      <ImageField
        label="섹션 이미지"
        hint="권장: 440 × 495px (세로형) · 자동 리사이징 적용"
        value={banner.image_url}
        onChange={(url) => onChange({ image_url: url })}
      />

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-medium text-gray-600">연결 상품 ({banner.items.length}/3)</label>
          {banner.items.length < 3 && (
            <button onClick={addItem}
              className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
              + 상품 추가
            </button>
          )}
        </div>
        <div className="space-y-3">
          {banner.items.map((item, idx) => (
            <ItemEditor key={item.id} item={item}
              onChange={(patch) => updateItem(idx, patch)}
              onDelete={() => deleteItem(idx)}
              products={products}
            />
          ))}
          {banner.items.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-xl">
              상품을 추가하세요
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── AI 이미지 프롬프트 ────────────────────────────────────
const SHOT_TYPES = [
  { key: "full",   label: "전체샷",   en: "full body shot, entire outfit visible from head to toe" },
  { key: "upper",  label: "상반신",   en: "upper body shot, waist up, focus on top wear" },
  { key: "lower",  label: "하반신",   en: "lower body shot, waist down, focus on bottom wear" },
  { key: "detail", label: "클로즈업", en: "close-up detail shot, fabric texture and material focus" },
  { key: "group",  label: "그룹샷",   en: "group shot of multiple workers wearing the outfit together" },
] as const;
type ShotKey = typeof SHOT_TYPES[number]["key"];

function ShotTypeSelector({ value, onChange }: { value: ShotKey; onChange: (v: ShotKey) => void }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-gray-500 mb-1.5">촬영 구도 (프롬프트 반영)</label>
      <div className="flex flex-wrap gap-1.5">
        {SHOT_TYPES.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => onChange(s.key)}
            className={`text-[12px] px-3 py-1.5 rounded-full border font-medium transition-colors ${
              value === s.key
                ? "bg-[#1A2B4A] text-white border-[#1A2B4A]"
                : "bg-white text-gray-600 border-gray-300 hover:border-[#1A2B4A] hover:text-[#1A2B4A]"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const PROMPT_SEASON_EN: Record<string, string> = {
  "봄":    "spring transitional weather — light layering, mild temperature",
  "여름":  "summer heat — cooling, breathable, sweat-wicking",
  "가을":  "autumn transitional weather — light layering, mild temperature",
  "겨울":  "winter cold — warm, insulated, wind-resistant",
  "전천후": "all-season year-round wear",
};

// 추가 옵션 → 영문 매핑 (제품 폼과 통일)
const ED_DESCRIPTOR: Record<string, string> = {
  "남성": "male", "여성": "female", "한국인": "Korean", "서양인": "Western",
};
const ED_MOOD: Record<string, string> = {
  "캐주얼": "relaxed, approachable casual mood",
  "프로페셔널": "confident, professional working mood",
};

// 기획 장면(배경) 프리셋 → 영문 환경 묘사
const SCENE_PRESETS = ["산업·현장", "도심·거리", "카페·실내", "자연·아웃도어", "스튜디오 연출"];
const SCENE_EN: Record<string, string> = {
  "산업·현장": "an authentic industrial / construction / logistics worksite — real machinery, structures and work context",
  "도심·거리": "a contemporary urban city street — buildings, sidewalks, modern city-lifestyle backdrop",
  "카페·실내": "a warm indoor lifestyle space such as a café or interior — relaxed everyday setting",
  "자연·아웃도어": "an open natural outdoor landscape (mountains, fields, trail) — fresh air, natural scenery",
  "스튜디오 연출": "an art-directed studio set with an intentional colored / set-design backdrop and dramatic studio lighting (NOT a plain catalog backdrop)",
};

// 샷별 카메라/렌즈 (에디토리얼)
const SHOT_CAM: Record<ShotKey, string> = {
  full:   "35mm environmental wide lens, full subject within the scene, focus deep enough to read the location",
  upper:  "50mm lens, waist-up, subject prominent with the environment softly behind",
  lower:  "50mm lens angled toward the lower body, bottoms in focus with the ground / location visible",
  detail: "90mm lens, tight close-up on fabric / hardware with creamy background bokeh",
  group:  "35mm lens, several models staged together within the scene, balanced group composition",
};

// 기획(에디토리얼) 공통 프롬프트 코어 — 배경·무드가 살아있는 시네마틱
function buildEditorialPrompt(opts: {
  kind: "hero" | "banner";
  theme: string; desc: string; shotType: ShotKey;
  clothingType: "작업복" | "일상복";
  season: string; extras: string[]; scene: string; imageUrl?: string;
}): string {
  const { kind, theme, desc, shotType, clothingType, season, extras, scene, imageUrl } = opts;
  if (!theme) return "";

  const clothingEn = clothingType === "일상복" ? "Korean casual everyday wear" : "Korean functional workwear";
  const shotLabel = SHOT_TYPES.find((s) => s.key === shotType)?.label ?? "";
  const shotEn = SHOT_TYPES.find((s) => s.key === shotType)?.en ?? SHOT_TYPES[0].en;
  const shotCam = SHOT_CAM[shotType] ?? SHOT_CAM.full;
  const seasonEn = season ? (PROMPT_SEASON_EN[season] ?? season) : "";

  const descriptors = extras.filter((e) => e in ED_DESCRIPTOR).map((e) => ED_DESCRIPTOR[e]);
  const moods = extras.filter((e) => e in ED_MOOD).map((e) => ED_MOOD[e]);
  const customExtras = extras.filter((e) => !(e in ED_DESCRIPTOR) && !(e in ED_MOOD));
  const isGroup = shotType === "group";
  const modelNoun = isGroup ? "models" : "model";
  const modelDesc = descriptors.length
    ? `${descriptors.join(" ")} ${modelNoun}`
    : (isGroup ? "a few natural, authentic real-worker-type models" : "a natural, authentic real-worker-type model");
  const moodLine = [...moods, ...customExtras].join(", ");

  const sceneEn = scene && SCENE_EN[scene]
    ? SCENE_EN[scene]
    : "a tasteful real-world editorial environment that fits the theme and season — NOT a plain studio catalog backdrop";

  const composition = kind === "hero"
    ? `${shotEn}. WIDE editorial framing for a 3:4 portrait (950×1280px): camera set back, generous negative space around the subject, subject occupies ~50–60% of the frame height, centered. This image is also cropped to 8:9 (top-aligned) on desktop — keep critical elements away from the bottom edge.`
    : `${shotEn}. Vertical 8:9 section framing (440×495px): subject and environment balanced, with a clear focal point that still reads at a small thumbnail size.`;
  const output = kind === "hero"
    ? "3:4 portrait, 950 × 1280px (also used as an 8:9 center-top crop on desktop)"
    : "8:9 vertical, 440 × 495px";

  const refBlock = imageUrl
    ? `\n\n[REFERENCE IMAGE]\n- Match the uploaded product exactly — same garment style, color palette, fabric texture, prints and design details.`
    : "";

  return (
    `[GENERATION DIRECTIVE]\n` +
    `Generate ONE single photorealistic cinematic editorial image. No collage, grid, card-news, multi-panel layout, or any text inside the image.\n\n` +
    `[CONCEPT]\n` +
    `- Brand: WORKUP — ${clothingEn}\n` +
    `- Theme: "${theme}"\n` +
    (desc.trim() ? `- Story: ${desc.trim().slice(0, 160)}\n` : "") +
    `\n[SCENE & ENVIRONMENT]\n` +
    `- Set in ${sceneEn}\n` +
    (seasonEn ? `- Season mood: ${seasonEn}\n` : "") +
    `\n[WARDROBE & SUBJECT]\n` +
    `- ${modelDesc} wearing the ${clothingEn} from the theme, styled naturally\n` +
    (moodLine ? `- Mood / styling: ${moodLine}\n` : "") +
    `\n[COMPOSITION — ${shotLabel}]\n- ${composition}\n` +
    `\n[CAMERA & LENS]\n- ${shotCam}\n` +
    `\n[LIGHTING & MOOD]\n- Natural directional light (daylight / golden-hour feel), cinematic atmosphere and depth — premium commercial editorial quality\n` +
    `\n[MODEL & ANATOMY]\n- Anatomically correct proportions, natural hands and fingers, realistic joints; lifelike skin texture, no plastic skin, no over-retouching\n` +
    `\n[COLOR & FIDELITY]\n- Preserve the EXACT product colors, prints, logos and fabric; natural true-to-life editorial color grade, no color cast\n` +
    `\n[OUTPUT]\n- ${output}, high-resolution, sharp fabric texture` +
    refBlock +
    `\n\n[NEGATIVE PROMPT]\n` +
    `text, typography, caption, watermark, added graphic logo overlay, collage, grid, split-screen, multi-panel, border, frame, ` +
    `deformed hands, extra fingers, missing fingers, fused fingers, extra limbs, mutated anatomy, twisted joints, plastic skin, over-retouched, uncanny face, ` +
    `distorted product, warped proportions, wrong colors, color cast, oversaturated, blurry, low-resolution, jpeg artifacts` +
    `\n\n── 한글 참고 ──\n` +
    `테마: ${theme}\n` +
    (desc.trim() ? `설명: ${desc.trim().slice(0, 160)}\n` : "") +
    `의류유형: ${clothingType}` + (season ? ` · 시즌: ${season}` : "") + (scene ? ` · 장면: ${scene}` : "") + `\n` +
    (extras.length ? `추가 옵션: ${extras.join(", ")}\n` : "") +
    `구도: ${shotLabel} · ${kind === "hero" ? "3:4(950×1280) → PC 8:9 크롭" : "8:9(440×495)"}` +
    (imageUrl ? `\n참고 이미지: 업로드 제품과 동일하게` : "")
  );
}

// 단일 이미지 프롬프트 (모바일 3:4 생성, PC에서 8:9 center-top 크롭으로 공용 사용)
function buildHeroPrompt(
  title: string, subtitle: string, desc: string, heroSub: string,
  shotType: ShotKey,
  clothingType: "작업복" | "일상복",
  season: string,
  extras: string[],
  scene: string,
  imageUrl?: string
): string {
  const theme = [title, subtitle, heroSub].filter(Boolean).join(" · ");
  return buildEditorialPrompt({ kind: "hero", theme, desc, shotType, clothingType, season, extras, scene, imageUrl });
}

function buildBannerPrompt(
  title: string, desc: string, shotType: ShotKey,
  clothingType: "작업복" | "일상복",
  season: string,
  extras: string[],
  scene: string,
  imageUrl?: string
): string {
  return buildEditorialPrompt({ kind: "banner", theme: title.trim(), desc, shotType, clothingType, season, extras, scene, imageUrl });
}

function PromptBox({
  prompt,
  sizeLabel,
  ratioLabel,
  refImageUrl,
}: {
  prompt: string;
  sizeLabel: string;
  ratioLabel: string;
  refImageUrl?: string;
}) {
  const [copied, setCopied] = useState(false);
  if (!prompt) return null;

  const fullText = `${prompt}\n\n[권장 사이즈] ${sizeLabel}  [비율] ${ratioLabel}${refImageUrl ? `\n[참고 이미지] ${refImageUrl}` : ""}`;

  function copy() {
    navigator.clipboard.writeText(fullText)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); })
      .catch(() => {});
  }

  return (
    <div className="bg-[#f5f3ff] border border-[#c4b5fd] rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold text-purple-700">✨ AI 이미지 프롬프트</span>
          <span className="text-[10px] text-purple-400">ChatGPT / DALL·E / Midjourney</span>
        </div>
        <button onClick={copy}
          className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-colors flex-shrink-0 ${
            copied ? "bg-green-500 text-white" : "bg-purple-600 text-white hover:bg-purple-700"
          }`}>
          {copied ? "복사됨 ✓" : "복사"}
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-[11px] font-medium px-2.5 py-1 rounded-full">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
          {sizeLabel}
        </span>
        <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 text-[11px] font-medium px-2.5 py-1 rounded-full">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
          비율 {ratioLabel}
        </span>
        {refImageUrl && (
          <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-[11px] font-medium px-2.5 py-1 rounded-full">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
              <circle cx="8.5" cy="8.5" r="1.5" /><rect x="3" y="3" width="18" height="18" rx="2" />
            </svg>
            참고 이미지 포함
          </span>
        )}
      </div>

      {refImageUrl && (
        <div className="flex items-start gap-2.5 bg-orange-50 border border-orange-200 rounded-lg p-2.5">
          <img src={refImageUrl} alt="참고 이미지" className="w-12 h-12 object-cover rounded-md flex-shrink-0 border border-orange-200" />
          <div className="text-[10px] text-orange-700 leading-relaxed">
            <p className="font-semibold mb-0.5">업로드된 이미지를 참고하세요</p>
            <p>· ChatGPT: 이미지를 대화창에 업로드 후 프롬프트 붙여넣기</p>
            <p>· Midjourney: 프롬프트 맨 앞에 이미지 URL 추가</p>
          </div>
        </div>
      )}

      <p className="text-[11px] text-purple-800 leading-relaxed bg-white/60 rounded-lg p-2.5 border border-purple-100 select-all break-all">
        {prompt}
      </p>
    </div>
  );
}

// 히어로 프롬프트: 1장 이미지, 모바일(3:4) 생성 → PC는 8:9 center-top 크롭으로 공용
function HeroPromptBox({ prompt, refImageUrl }: { prompt: string; refImageUrl?: string }) {
  const [copied, setCopied] = useState(false);
  if (!prompt) return null;

  const fullText = `${prompt}\n\n[권장 사이즈] 950 × 1280px  [비율] 3 : 4\n[PC 표시] 동일 이미지를 8:9 비율 center-top 크롭으로 사용${refImageUrl ? `\n[참고 이미지] ${refImageUrl}` : ""}`;

  function copy() {
    navigator.clipboard.writeText(fullText)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); })
      .catch(() => {});
  }

  return (
    <div className="bg-[#f5f3ff] border border-[#c4b5fd] rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-purple-700">✨ AI 이미지 프롬프트 (모바일·PC 공용 1장)</span>
        <button onClick={copy}
          className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-colors flex-shrink-0 ${
            copied ? "bg-green-500 text-white" : "bg-purple-600 text-white hover:bg-purple-700"
          }`}>
          {copied ? "복사됨 ✓" : "복사"}
        </button>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="bg-purple-100 text-purple-700 text-[11px] font-medium px-2.5 py-1 rounded-full">950 × 1280px · 3:4</span>
        <span className="bg-indigo-100 text-indigo-700 text-[11px] px-2.5 py-1 rounded-full">📱 모바일 + 🖥️ PC 공용</span>
        {refImageUrl && <span className="bg-orange-100 text-orange-700 text-[11px] px-2.5 py-1 rounded-full">참고 이미지 포함</span>}
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2 text-[10px] text-indigo-700 leading-relaxed">
        <p className="font-semibold mb-0.5">📐 생성 가이드</p>
        <p>· 멀리서 촬영한 느낌 — 피사체가 프레임의 50~60% 이하 차지</p>
        <p>· PC에서 하단 약 10% 크롭됩니다 → 발끝을 프레임 안쪽에 두세요</p>
        <p>· 태그 위치는 아래 에디터에서 📱 모바일 / 🖥️ PC 별도 조정 가능</p>
      </div>

      {refImageUrl && (
        <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-lg p-2">
          <img src={refImageUrl} alt="참고" className="w-10 h-10 object-cover rounded border border-orange-200 flex-shrink-0" />
          <p className="text-[10px] text-orange-700 leading-relaxed">
            <span className="font-semibold block">참고 이미지 포함</span>
            ChatGPT: 이미지 업로드 후 붙여넣기 / Midjourney: URL을 프롬프트 맨 앞에 추가
          </p>
        </div>
      )}

      <p className="text-[11px] text-purple-800 leading-relaxed bg-white/60 rounded-lg p-2.5 border border-purple-100 select-all break-all">
        {prompt}
      </p>
    </div>
  );
}

// ── 공통 프롬프트 빌더 ────────────────────────────────────
const PROMPT_EXTRA_PRESETS = ["남성", "여성", "한국인", "서양인", "캐주얼", "프로페셔널"];

function PromptBuilder({
  buildFn,
  isHero,
  sizeLabel,
  ratioLabel,
  refImageUrl,
}: {
  buildFn: (shotType: ShotKey, clothingType: "작업복" | "일상복", season: string, extras: string[], scene: string) => string;
  isHero?: boolean;
  sizeLabel?: string;
  ratioLabel?: string;
  refImageUrl?: string;
}) {
  const [shotType, setShotType]           = useState<ShotKey>("full");
  const [clothingType, setClothingType]   = useState<"작업복" | "일상복">("작업복");
  const [season, setSeason]               = useState("");
  const [scene, setScene]                 = useState("");
  const [extras, setExtras]               = useState<string[]>([]);
  const [customInput, setCustomInput]     = useState("");
  const [prompt, setPrompt]               = useState("");
  const [showPrompt, setShowPrompt]       = useState(false);
  const [copied, setCopied]               = useState(false);

  const resetPrompt = () => setShowPrompt(false);

  const generate = () => {
    const p = buildFn(shotType, clothingType, season, extras, scene);
    if (p) { setPrompt(p); setShowPrompt(true); }
  };

  const copy = () => {
    const suffix = isHero
      ? `\n\n[권장 사이즈] 950 × 1280px  [비율] 3 : 4\n[PC 표시] 동일 이미지를 8:9 비율 center-top 크롭으로 사용`
      : `\n\n[권장 사이즈] ${sizeLabel}  [비율] ${ratioLabel}`;
    const full = prompt + suffix + (refImageUrl ? `\n[참고 이미지] ${refImageUrl}` : "");
    navigator.clipboard.writeText(full)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); })
      .catch(() => {});
  };

  return (
    <div className="space-y-3">
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-3">
        <p className="text-[11px] font-semibold text-gray-700">✨ AI 이미지 프롬프트 생성</p>

        {/* 의류 유형 */}
        <div>
          <p className="text-[11px] font-medium text-gray-500 mb-1.5">의류 유형</p>
          <div className="flex gap-1.5">
            {(["작업복", "일상복"] as const).map(t => (
              <button key={t} type="button" onClick={() => { setClothingType(t); resetPrompt(); }}
                className={`px-3 py-1.5 text-[12px] rounded-full border font-medium transition-colors ${
                  clothingType === t ? "bg-violet-600 text-white border-violet-600" : "bg-white text-gray-600 border-gray-200 hover:border-violet-400 hover:text-violet-600"
                }`}>{t}</button>
            ))}
          </div>
        </div>

        {/* 시즌 */}
        <div>
          <p className="text-[11px] font-medium text-gray-500 mb-1.5">시즌 <span className="text-gray-400 font-normal">(선택)</span></p>
          <div className="flex gap-1.5 flex-wrap">
            {["봄", "여름", "가을", "겨울", "전천후"].map(s => (
              <button key={s} type="button" onClick={() => { setSeason(season === s ? "" : s); resetPrompt(); }}
                className={`px-3 py-1.5 text-[12px] rounded-full border font-medium transition-colors ${
                  season === s ? "bg-violet-600 text-white border-violet-600" : "bg-white text-gray-600 border-gray-200 hover:border-violet-400 hover:text-violet-600"
                }`}>{s}</button>
            ))}
          </div>
        </div>

        {/* 장면(배경) — 기획 이미지는 배경이 핵심 */}
        <div>
          <p className="text-[11px] font-medium text-gray-500 mb-1.5">장면 / 배경 <span className="text-gray-400 font-normal">(선택)</span></p>
          <div className="flex gap-1.5 flex-wrap">
            {SCENE_PRESETS.map(s => (
              <button key={s} type="button" onClick={() => { setScene(scene === s ? "" : s); resetPrompt(); }}
                className={`px-3 py-1.5 text-[12px] rounded-full border font-medium transition-colors ${
                  scene === s ? "bg-violet-600 text-white border-violet-600" : "bg-white text-gray-600 border-gray-200 hover:border-violet-400 hover:text-violet-600"
                }`}>{s}</button>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-1">미선택 시 테마·시즌에 맞는 배경이 자동 적용됩니다.</p>
        </div>

        {/* 추가 옵션 */}
        <div>
          <p className="text-[11px] font-medium text-gray-500 mb-1.5">추가 옵션 <span className="text-gray-400 font-normal">(복수 선택 가능)</span></p>
          <div className="flex gap-1.5 flex-wrap mb-2">
            {PROMPT_EXTRA_PRESETS.map(opt => (
              <button key={opt} type="button"
                onClick={() => {
                  setExtras(prev => prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt]);
                  resetPrompt();
                }}
                className={`px-2.5 py-1 text-[11px] rounded-full border transition-colors ${
                  extras.includes(opt) ? "bg-violet-100 text-violet-700 border-violet-300 font-semibold" : "bg-white text-gray-500 border-gray-200 hover:border-violet-300 hover:text-violet-600"
                }`}>{opt}</button>
            ))}
          </div>
          <div className="flex gap-1.5">
            <input value={customInput} onChange={e => setCustomInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && customInput.trim()) {
                  setExtras(prev => [...prev, customInput.trim()]);
                  setCustomInput(""); resetPrompt();
                }
              }}
              placeholder="직접 입력 후 Enter..."
              className="flex-1 text-[11px] border border-gray-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-violet-400 bg-white" />
            <button type="button"
              onClick={() => {
                if (customInput.trim()) { setExtras(prev => [...prev, customInput.trim()]); setCustomInput(""); resetPrompt(); }
              }}
              className="px-3 py-1.5 text-[11px] bg-gray-200 hover:bg-gray-300 text-gray-700 rounded font-medium">추가</button>
          </div>
          {extras.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-2">
              {extras.map((opt, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-100 text-violet-700 text-[11px] rounded-full">
                  {opt}
                  <button type="button" onClick={() => { setExtras(prev => prev.filter((_, idx) => idx !== i)); resetPrompt(); }}
                    className="text-violet-400 hover:text-violet-700 leading-none">×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 촬영 구도 */}
        <ShotTypeSelector value={shotType} onChange={(v) => { setShotType(v); resetPrompt(); }} />
      </div>

      {/* 생성 버튼 */}
      <button type="button" onClick={generate}
        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold bg-gradient-to-r from-violet-500 to-indigo-500 text-white hover:from-violet-600 hover:to-indigo-600 transition-all rounded shadow-sm">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z" />
        </svg>
        이미지 프롬프트 생성
      </button>

      {/* 생성된 프롬프트 (편집 가능) */}
      {showPrompt && prompt && (
        <div className="bg-[#f5f3ff] border border-[#c4b5fd] rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-purple-700">
              {isHero ? "✨ AI 이미지 프롬프트 (모바일·PC 공용 1장)" : "✨ AI 이미지 프롬프트"}
            </span>
            <div className="flex gap-2">
              <button onClick={copy}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-colors flex-shrink-0 ${
                  copied ? "bg-green-500 text-white" : "bg-purple-600 text-white hover:bg-purple-700"
                }`}>{copied ? "복사됨 ✓" : "복사"}</button>
              <button type="button" onClick={() => setShowPrompt(false)}
                className="text-[11px] text-gray-400 hover:text-gray-600 px-1">×</button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
            {isHero ? (
              <>
                <span className="bg-purple-100 text-purple-700 font-medium px-2.5 py-1 rounded-full">950 × 1280px · 3:4</span>
                <span className="bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full">📱 모바일 + 🖥️ PC 공용</span>
              </>
            ) : (
              <>
                <span className="bg-purple-100 text-purple-700 font-medium px-2.5 py-1 rounded-full">{sizeLabel}</span>
                <span className="bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full">비율 {ratioLabel}</span>
              </>
            )}
            {refImageUrl && <span className="bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full">참고 이미지 포함</span>}
          </div>

          {isHero && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2 text-[10px] text-indigo-700 leading-relaxed">
              <p className="font-semibold mb-0.5">📐 생성 가이드</p>
              <p>· 멀리서 촬영한 느낌 — 피사체가 프레임의 50~60% 이하 차지</p>
              <p>· PC에서 하단 약 10% 크롭됩니다 → 발끝을 프레임 안쪽에 두세요</p>
            </div>
          )}

          {refImageUrl && (
            <div className="flex items-start gap-2.5 bg-orange-50 border border-orange-200 rounded-lg p-2.5">
              <img src={refImageUrl} alt="참고 이미지" className="w-10 h-10 object-cover rounded-md flex-shrink-0 border border-orange-200" />
              <p className="text-[10px] text-orange-700 leading-relaxed">
                <span className="font-semibold block">참고 이미지 포함</span>
                ChatGPT: 이미지 업로드 후 붙여넣기 / Midjourney: URL을 프롬프트 맨 앞에 추가
              </p>
            </div>
          )}

          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            rows={8}
            className="w-full text-[11px] text-purple-800 leading-relaxed bg-white/80 rounded-lg p-2.5 border border-purple-100 focus:outline-none focus:border-violet-400 resize-y"
          />
          <p className="text-[10px] text-purple-400">프롬프트를 직접 수정한 뒤 복사하세요</p>
        </div>
      )}
    </div>
  );
}

// ── 서브 컴포넌트: 메인 기획전 에디터 ──────────────────────
function HeroEditor({ hero, onChange, products }: {
  hero: EditorialBlock["hero"];
  onChange: (patch: Partial<EditorialBlock["hero"]>) => void;
  products: SearchProduct[];
}) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [tagView, setTagView] = useState<"mobile" | "pc">("mobile");
  const imgAreaRef = useRef<HTMLDivElement>(null);
  const wasDraggingRef = useRef(false);

  function handleImageClick(e: React.MouseEvent<HTMLDivElement>) {
    if (wasDraggingRef.current) { wasDraggingRef.current = false; return; }
    if (!hero.image_url) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    if (tagView === "mobile") {
      const newTag: HeroTag = { id: uid(), x, y, name: "", price: "", product_id: "", image_url: "", bg: "#1A2B4A" };
      const next = [...hero.tags, newTag];
      onChange({ tags: next });
      setSelectedIdx(next.length - 1);
    } else {
      // PC 뷰: 선택된 태그(없으면 마지막)의 PC 좌표 업데이트
      const idx = selectedIdx !== null ? selectedIdx : hero.tags.length - 1;
      if (idx >= 0) updateTag(idx, { pc_x: x, pc_y: y });
    }
  }

  function handleTagPointerDown(e: React.PointerEvent<HTMLButtonElement>, idx: number) {
    e.stopPropagation();
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    wasDraggingRef.current = false;
    setDraggingIdx(idx);
    setSelectedIdx(idx);
  }

  function handleTagPointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    if (draggingIdx === null || !imgAreaRef.current) return;
    wasDraggingRef.current = true;
    const rect = imgAreaRef.current.getBoundingClientRect();
    const x = Math.round(Math.min(99, Math.max(1, ((e.clientX - rect.left) / rect.width) * 100)));
    const y = Math.round(Math.min(99, Math.max(1, ((e.clientY - rect.top) / rect.height) * 100)));
    if (tagView === "mobile") {
      updateTag(draggingIdx, { x, y });
    } else {
      updateTag(draggingIdx, { pc_x: x, pc_y: y });
    }
  }

  function handleTagPointerUp() {
    setDraggingIdx(null);
  }

  function updateTag(idx: number, patch: Partial<HeroTag>) {
    const next = [...hero.tags];
    next[idx] = { ...next[idx], ...patch };
    onChange({ tags: next });
  }

  function deleteTag(idx: number) {
    onChange({ tags: hero.tags.filter((_, i) => i !== idx) });
    setSelectedIdx(null);
  }

  const selectedTag = selectedIdx !== null ? hero.tags[selectedIdx] : null;

  return (
    <div className="space-y-5">
      {/* 기본 텍스트 정보 */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="제목" value={hero.title} onChange={(v) => onChange({ title: v })} placeholder="UV 대책 특집" />
        <Field label="부제목" value={hero.subtitle} onChange={(v) => onChange({ subtitle: v })} placeholder="자외선 차단 + 흡한속건" />
      </div>
      <div>
        <Field label="이미지 위 작은 문구" value={hero.hero_subtitle}
          onChange={(v) => onChange({ hero_subtitle: v })} placeholder="여름 현장 필수 아이템" />
      </div>

      <Field label="설명" value={hero.desc} onChange={(v) => onChange({ desc: v })}
        placeholder="기획전 설명을 입력하세요" multiline />

      {/* AI 이미지 프롬프트 빌더 */}
      <PromptBuilder
        isHero
        buildFn={(shotType, clothingType, season, extras) =>
          buildHeroPrompt(hero.title, hero.subtitle, hero.desc, hero.hero_subtitle, shotType, clothingType, season, extras, hero.image_url || undefined)
        }
        refImageUrl={hero.image_url || undefined}
      />

      {/* 이미지 업로드 */}
      <ImageField
        label="대표 이미지 (모바일 · 3:4)"
        hint="모바일용: 950 × 1280px (3:4) — PC는 패널 전체를 채우도록 크롭"
        value={hero.image_url}
        onChange={(url) => { onChange({ image_url: url }); setSelectedIdx(null); }}
      />

      {/* 이미지 위치 조절 (PC 크롭 기준점) */}
      {hero.image_url && (() => {
        const pos = (hero.image_position ?? "50% 0%").split(" ");
        const px = parseInt(pos[0]) || 50;
        const py = parseInt(pos[1]) || 0;
        return (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-gray-700">🖥️ PC 이미지 위치 조절</label>
              <button type="button" onClick={() => onChange({ image_position: "50% 0%" })}
                className="text-[10px] text-gray-400 hover:text-gray-600">초기화</button>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-gray-500">좌우 (X)</span>
                  <span className="text-[11px] text-gray-400 font-mono">{px}%</span>
                </div>
                <input type="range" min={0} max={100} value={px}
                  onChange={(e) => onChange({ image_position: `${e.target.value}% ${py}%` })}
                  className="w-full h-1.5 accent-[#1A2B4A] cursor-pointer" />
                <div className="flex justify-between text-[9px] text-gray-400 mt-0.5">
                  <span>왼쪽</span><span>가운데</span><span>오른쪽</span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-gray-500">상하 (Y)</span>
                  <span className="text-[11px] text-gray-400 font-mono">{py}%</span>
                </div>
                <input type="range" min={0} max={100} value={py}
                  onChange={(e) => onChange({ image_position: `${px}% ${e.target.value}%` })}
                  className="w-full h-1.5 accent-[#1A2B4A] cursor-pointer" />
                <div className="flex justify-between text-[9px] text-gray-400 mt-0.5">
                  <span>위</span><span>가운데</span><span>아래</span>
                </div>
              </div>
            </div>
            {/* 미니 PC 미리보기 */}
            <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-gray-200"
              style={{ aspectRatio: "8/9", maxWidth: "120px" }}>
              <img src={hero.image_url} alt="PC 미리보기"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ objectPosition: `${px}% ${py}%` }} />
              <div className="absolute bottom-1 left-1 text-[7px] text-white bg-black/40 px-1 rounded">PC 미리보기</div>
            </div>
          </div>
        );
      })()}

      {/* ── 상품 태그 에디터 (컴팩트) ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <label className="text-xs font-medium text-gray-700">상품 태그 ({hero.tags.length}개)</label>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {hero.image_url ? "이미지 클릭 → 태그 추가 · 태그 클릭 → 편집 · 태그 드래그 → 위치 이동" : "이미지 업로드 후 클릭으로 태그 추가"}
            </p>
          </div>
          {hero.tags.length > 0 && (
            <button
              onClick={() => { onChange({ tags: [] }); setSelectedIdx(null); }}
              className="text-[11px] text-red-400 hover:text-red-600"
            >전체 삭제</button>
          )}
        </div>

        {/* 2열: 이미지(좌) + 태그 관리(우) */}
        <div className="flex gap-4">
          {/* 이미지 클릭 영역 */}
          <div className="flex-shrink-0" style={{ width: "280px" }}>
            {/* 모바일/PC 탭 */}
            <div className="flex gap-1 mb-2">
              <button type="button" onClick={() => setTagView("mobile")}
                className={`flex-1 text-[11px] font-semibold py-1.5 rounded-lg border transition-colors ${
                  tagView === "mobile" ? "bg-[#1A2B4A] text-white border-[#1A2B4A]" : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                }`}>
                📱 모바일 태그
              </button>
              <button type="button" onClick={() => setTagView("pc")}
                className={`flex-1 text-[11px] font-semibold py-1.5 rounded-lg border transition-colors ${
                  tagView === "pc" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                }`}>
                🖥️ PC 태그
              </button>
            </div>
            <div
              ref={imgAreaRef}
              onClick={handleImageClick}
              className="relative rounded-xl overflow-hidden select-none border border-gray-200"
              style={{
                width: "280px",
                aspectRatio: tagView === "mobile" ? "3 / 4" : "8 / 9",
                background: "#d1d5db",
                cursor: draggingIdx !== null ? "grabbing" : (hero.image_url ? "crosshair" : "default"),
              }}
            >
              {hero.image_url && (
                <img
                  src={hero.image_url}
                  alt=""
                  draggable={false}
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
                  style={tagView === "pc"
                    ? { objectPosition: hero.image_position ?? "50% 0%" }
                    : { objectPosition: "top" }
                  }
                />
              )}

              {!hero.image_url && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
                  <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909" />
                  </svg>
                  <p className="text-white/50 text-xs text-center px-3 leading-snug">이미지 업로드 후<br/>클릭하여 태그 추가</p>
                </div>
              )}

              {hero.tags.map((tag, idx) => {
                const tagX = tagView === "mobile" ? tag.x : (tag.pc_x ?? tag.x);
                const tagY = tagView === "mobile" ? tag.y : (tag.pc_y ?? tag.y);
                return (
                  <button
                    key={tag.id}
                    onPointerDown={(e) => handleTagPointerDown(e, idx)}
                    onPointerMove={handleTagPointerMove}
                    onPointerUp={handleTagPointerUp}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!wasDraggingRef.current) setSelectedIdx(selectedIdx === idx ? null : idx);
                    }}
                    className="absolute"
                    style={{
                      left: `${tagX}%`, top: `${tagY}%`, transform: "translate(-50%, -50%)",
                      cursor: draggingIdx === idx ? "grabbing" : "grab",
                      touchAction: "none",
                    }}
                    title={tag.name || `태그 ${idx + 1} (드래그로 이동)`}
                  >
                    <span className={`flex items-center justify-center rounded-full transition-all duration-150 ${
                      selectedIdx === idx
                        ? "w-6 h-6 bg-[#ff550c]/90 border-2 border-white shadow-lg"
                        : "w-4 h-4 bg-white/80 border-2 border-white shadow-md hover:w-5 hover:h-5"
                    }`}>
                      <span className="text-[8px] font-bold text-[#1A2B4A]">{idx + 1}</span>
                    </span>
                  </button>
                );
              })}

              <div className="absolute inset-0 pointer-events-none opacity-10"
                style={{ backgroundImage: "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)", backgroundSize: "25% 25%" }} />
            </div>
            {tagView === "pc" && hero.image_url && (
              <p className="text-[10px] text-indigo-500 mt-1.5 leading-snug">
                클릭: 선택된 태그의 PC 위치 설정<br/>태그가 없으면 모바일 탭에서 먼저 추가하세요
              </p>
            )}
          </div>

          {/* 오른쪽: 태그 칩 + 선택된 태그 편집 */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* 태그 칩 목록 */}
            {hero.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {hero.tags.map((tag, idx) => (
                  <button
                    key={tag.id}
                    onClick={() => setSelectedIdx(selectedIdx === idx ? null : idx)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] transition-colors ${
                      selectedIdx === idx
                        ? "bg-[#ff550c] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ background: "currentColor", opacity: 0.3 }}>{idx + 1}</span>
                    {tag.name || "이름 미입력"}
                  </button>
                ))}
              </div>
            )}

            {/* 선택된 태그 편집 */}
            {selectedTag !== null && selectedIdx !== null && (
              <div className="border-2 border-[#ff550c]/30 rounded-xl p-3 bg-orange-50/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#ff550c]">태그 {selectedIdx + 1} 편집</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-400">
                      📱 {selectedTag.x}%,{selectedTag.y}%
                      {(selectedTag.pc_x !== undefined || selectedTag.pc_y !== undefined) && (
                        <> · 🖥️ {selectedTag.pc_x ?? selectedTag.x}%,{selectedTag.pc_y ?? selectedTag.y}%</>
                      )}
                    </span>
                    <button onClick={() => deleteTag(selectedIdx)}
                      className="text-[11px] text-red-500 hover:text-red-700 font-medium">삭제</button>
                  </div>
                </div>
                {/* 제품 검색 */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">제품 검색</label>
                  <ProductPicker
                    products={products}
                    value={selectedTag.name}
                    onSelect={(p) => updateTag(selectedIdx, {
                      product_id: p.id, name: p.name, price: p.price, image_url: p.imageUrl ?? "",
                    })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="상품명 (직접 수정)" value={selectedTag.name}
                    onChange={(v) => updateTag(selectedIdx, { name: v })} placeholder="쿨링 반팔 티셔츠" />
                  <Field label="가격" value={selectedTag.price}
                    onChange={(v) => updateTag(selectedIdx, { price: v })} placeholder="19,000원" />
                  {selectedTag.image_url && (
                    <div className="col-span-2 flex items-center gap-2">
                      <img src={selectedTag.image_url} alt="" className="w-10 h-10 object-cover rounded border border-orange-200 flex-shrink-0" />
                      <span className="text-[10px] text-gray-400 truncate">선택된 이미지</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 태그가 없고 이미지도 없을 때 */}
            {!hero.image_url && hero.tags.length === 0 && (
              <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-gray-200 text-[12px] text-gray-400"
                style={{ minHeight: "120px" }}>
                이미지를 업로드하면<br />클릭으로 태그 추가 가능
              </div>
            )}

            {/* 이미지는 있지만 태그가 없을 때 */}
            {hero.image_url && hero.tags.length === 0 && !selectedTag && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <span className="text-blue-400 text-lg">👆</span>
                <p className="text-[12px] text-blue-600">왼쪽 이미지를 클릭하면 태그가 추가됩니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 서브 컴포넌트: 블록 카드 ────────────────────────────────
function BlockCard({
  block, index, total, products,
  onUpdate, onDelete, onMove,
}: {
  block: EditorialBlock;
  index: number;
  total: number;
  products: SearchProduct[];
  onUpdate: (patch: Partial<EditorialBlock>) => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"hero" | "banner1" | "banner2" | "banner3" | "banner4">("hero");

  const TABS = [
    { key: "hero" as const,    label: "메인 기획전" },
    { key: "banner1" as const, label: "배너 1" },
    { key: "banner2" as const, label: "배너 2" },
    { key: "banner3" as const, label: "배너 3" },
    { key: "banner4" as const, label: "배너 4" },
  ];

  return (
    <div className={`border rounded-xl overflow-hidden ${open ? "border-[#1A2B4A]/30 shadow-sm" : "border-gray-200"}`}>
      {/* 블록 헤더 */}
      <div className={`flex items-center gap-3 px-5 py-4 ${open ? "bg-[#f5f7ff] border-b border-[#1A2B4A]/10" : "bg-white hover:bg-gray-50"} transition-colors`}>
        {/* 순서 이동 */}
        <div className="flex flex-col gap-0.5 flex-shrink-0">
          <button onClick={() => onMove(-1)} disabled={index === 0}
            className="w-5 h-4 flex items-center justify-center rounded hover:bg-gray-200 disabled:opacity-30 text-gray-500 text-[10px]">▲</button>
          <button onClick={() => onMove(1)} disabled={index === total - 1}
            className="w-5 h-4 flex items-center justify-center rounded hover:bg-gray-200 disabled:opacity-30 text-gray-500 text-[10px]">▼</button>
        </div>

        {/* 번호 */}
        <span className="text-xs font-bold text-gray-400 w-5 flex-shrink-0">#{index + 1}</span>

        {/* 제목 */}
        <button className="flex-1 text-left min-w-0" onClick={() => setOpen((v) => !v)}>
          <p className="text-sm font-semibold text-[#1A2B4A] truncate">
            {block.hero.title || "제목 없음"}
          </p>
          <p className="text-xs text-gray-400 mt-0.5 truncate">
            {block.reversed ? "우측 메인 기획전" : "좌측 메인 기획전"} · {block.type === "image" ? "이미지형" : "상품형"}
          </p>
        </button>

        {/* 이미지 미리보기 썸네일 */}
        <div className="flex gap-1.5 flex-shrink-0">
          {[
            { url: block.hero.image_url,    label: "메인",  bg: block.hero.bg_color },
            { url: block.banner1.image_url, label: "B1", bg: block.banner1.section_bg },
            { url: block.banner2.image_url, label: "B2", bg: block.banner2.section_bg },
            { url: block.banner3.image_url, label: "B3", bg: block.banner3.section_bg },
            { url: block.banner4.image_url, label: "B4", bg: block.banner4.section_bg },
          ].map(({ url, label, bg }) => (
            <div
              key={label}
              className="relative rounded-lg overflow-hidden flex-shrink-0 border border-gray-200"
              style={{ width: "34px", aspectRatio: "3/4", background: bg }}
            >
              {url && (
                <img src={url} alt={label} draggable={false}
                  className="absolute inset-0 w-full h-full object-cover" />
              )}
              <div className="absolute inset-x-0 bottom-0 bg-black/30 flex justify-center py-0.5">
                <span className="text-[7px] text-white font-medium leading-none">{label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* 노출 토글 */}
        <button
          onClick={() => onUpdate({ is_visible: !block.is_visible })}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${
            block.is_visible ? "bg-[#1A2B4A]" : "bg-gray-300"
          }`}
        >
          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
            block.is_visible ? "translate-x-[18px]" : "translate-x-0.5"
          }`} />
        </button>

        {/* 삭제 */}
        <button onClick={onDelete}
          className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 열기/닫기 화살표 */}
        <button onClick={() => setOpen((v) => !v)}
          className="w-7 h-7 flex items-center justify-center text-gray-400 hover:bg-gray-100 rounded-lg flex-shrink-0">
          <svg className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* 편집 패널 */}
      {open && (
        <div className="bg-white">
          {/* 기본 설정 바 */}
          <div className="flex items-center gap-6 px-5 py-3 bg-gray-50 border-b border-gray-100 flex-wrap">
            {/* 레이아웃 */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">레이아웃</span>
              <div className="flex rounded-lg overflow-hidden border border-gray-200">
                {(["normal", "reversed"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => onUpdate({ reversed: v === "reversed" })}
                    className={`text-xs px-3 py-1.5 transition-colors ${
                      (v === "reversed") === block.reversed
                        ? "bg-[#1A2B4A] text-white"
                        : "bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {v === "normal" ? "좌측 메인" : "우측 메인"}
                  </button>
                ))}
              </div>
            </div>
            {/* 타입 */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">타입</span>
              <div className="flex rounded-lg overflow-hidden border border-gray-200">
                {(["product", "image"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => onUpdate({ type: v })}
                    className={`text-xs px-3 py-1.5 transition-colors ${
                      block.type === v
                        ? "bg-[#1A2B4A] text-white"
                        : "bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {v === "product" ? "상품형" : "이미지형"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 탭 */}
          <div className="flex border-b border-gray-100">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  tab === t.key
                    ? "text-[#1A2B4A] border-b-2 border-[#1A2B4A]"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* 탭 콘텐츠 */}
          <div className="p-5">
            {tab === "hero" && (
              <HeroEditor
                hero={block.hero}
                onChange={(patch) => onUpdate({ hero: { ...block.hero, ...patch } })}
                products={products}
              />
            )}
            {tab === "banner1" && (
              <BannerEditor
                label="우측 배너 1"
                banner={block.banner1}
                onChange={(patch) => onUpdate({ banner1: { ...block.banner1, ...patch } })}
                products={products}
              />
            )}
            {tab === "banner2" && (
              <BannerEditor
                label="우측 배너 2"
                banner={block.banner2}
                onChange={(patch) => onUpdate({ banner2: { ...block.banner2, ...patch } })}
                products={products}
              />
            )}
            {tab === "banner3" && (
              <BannerEditor
                label="우측 배너 3"
                banner={block.banner3}
                onChange={(patch) => onUpdate({ banner3: { ...block.banner3, ...patch } })}
                products={products}
              />
            )}
            {tab === "banner4" && (
              <BannerEditor
                label="우측 배너 4"
                banner={block.banner4}
                onChange={(patch) => onUpdate({ banner4: { ...block.banner4, ...patch } })}
                products={products}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── 메인 페이지 ────────────────────────────────────────────
export default function AdminMainEditorialPage() {
  const [blocks, setBlocks] = useState<EditorialBlock[]>(createDefaultBlocks);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<"ok" | "err" | null>(null);
  const [dbError, setDbError] = useState(false);
  const [products, setProducts] = useState<SearchProduct[]>([]);

  // 제품 목록 1회 로드
  useEffect(() => {
    fetch("/api/admin/products")
      .then((r) => r.ok ? r.json() : [])
      .then((data: { id: string; name: string; price: string; imageUrl?: string }[]) => {
        if (Array.isArray(data)) {
          setProducts(data.map((p) => ({ id: p.id, name: p.name, price: p.price, imageUrl: p.imageUrl })));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/admin/site-settings/editorial_blocks")
      .then((r) => {
        if (!r.ok) { setDbError(true); return null; }
        return r.json();
      })
      .then((data) => {
        if (data?.blocks?.length) {
          setBlocks(data.blocks.map((b: EditorialBlock) => ({
            ...b,
            banner3: b.banner3 ?? emptyBanner(),
            banner4: b.banner4 ?? emptyBanner(),
          })));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    setSaveMsg(null);
    const res = await fetch("/api/admin/site-settings/editorial_blocks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocks }),
    });
    setSaving(false);
    setSaveMsg(res.ok ? "ok" : "err");
    setTimeout(() => setSaveMsg(null), 2500);
  }

  function updateBlock(id: string, patch: Partial<EditorialBlock>) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }
  function deleteBlock(id: string) {
    if (!confirm("이 블록을 삭제하시겠습니까?")) return;
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  }
  function moveBlock(index: number, dir: -1 | 1) {
    const next = [...blocks];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setBlocks(next.map((b, i) => ({ ...b, sort_order: i })));
  }
  function addBlock() {
    const b = emptyBlock(blocks.length);
    setBlocks((prev) => [...prev, b]);
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">불러오는 중...</div>;
  }

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">기획전 영역</h1>
          <p className="text-base text-gray-400 mt-1">
            메인 에디토리얼 블록을 관리합니다. 블록은 순서대로 메인에 표시됩니다.
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="px-6 py-2.5 bg-[#1A2B4A] text-white text-sm font-semibold rounded hover:bg-[#243d6a] disabled:opacity-50 transition-colors"
        >
          {saving ? "저장 중..." : "전체 저장"}
        </button>
      </div>

      {saveMsg === "ok" && (
        <div className="mb-4 px-4 py-2.5 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          저장되었습니다.
        </div>
      )}
      {saveMsg === "err" && (
        <div className="mb-4 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          저장에 실패했습니다. 다시 시도해 주세요.
        </div>
      )}

      {/* 블록 목록 */}
      <div className="space-y-3 mb-4">
        {blocks.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
            등록된 기획전 블록이 없습니다.
          </div>
        ) : (
          blocks.map((block, index) => (
            <BlockCard
              key={block.id}
              products={products}
              block={block}
              index={index}
              total={blocks.length}
              onUpdate={(patch) => updateBlock(block.id, patch)}
              onDelete={() => deleteBlock(block.id)}
              onMove={(dir) => moveBlock(index, dir)}
            />
          ))
        )}
      </div>

      {/* 블록 추가 */}
      <button
        onClick={addBlock}
        className="w-full py-3.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-[#1A2B4A] hover:text-[#1A2B4A] transition-colors"
      >
        + 기획전 블록 추가
      </button>

      {/* DB 오류 안내 */}
      {dbError && (
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-xs font-semibold text-amber-800 mb-1">⚠️ Supabase 설정 필요</p>
          <p className="text-xs text-amber-700">
            저장 기능을 사용하려면 <code className="bg-amber-100 px-1 rounded">site_settings</code> 테이블이 필요합니다.
          </p>
        </div>
      )}
    </div>
  );
}
