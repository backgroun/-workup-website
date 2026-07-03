"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

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
  label?: string;     // 상세페이지 상단 라벨 (배너별 기획전명) — 예: "그대 이름은 바람 바람 바람"
  section_bg: string;
  image_url: string;
  items: ProductItem[];
  detail_items?: ProductItem[];  // 상세페이지 전용 추가 상품 (메인 items 뒤에 노출)
  tags?: HeroTag[];   // 섹션 이미지 위 상품 핫스팟 (단일 x/y 좌표 사용)
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
    image_position_mobile?: string;
    image_scale?: number;
    image_scale_mobile?: number;
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
    tags: [],
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

  const MAX_RESULTS = 50;
  const q = query.trim().toLowerCase();
  const matched = q
    ? products.filter((p) => p.name.toLowerCase().includes(q))
    : products;
  const results = matched.slice(0, MAX_RESULTS);
  const overflow = matched.length - results.length;

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
        <div className="absolute z-50 left-0 right-0 top-full mt-1 border border-gray-200 rounded-lg bg-white shadow-lg max-h-64 overflow-y-auto">
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
          {overflow > 0 && (
            <p className="px-3 py-2 text-[11px] text-gray-400 bg-gray-50 sticky bottom-0 border-t border-gray-100">
              외 {overflow}개 더 있음 — 검색어를 입력해 좁혀보세요
            </p>
          )}
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
        image_url: "", image_scale: 1.0, image_scale_mobile: 1.0, bg_color: "#1A2B4A",
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
  compact = false,
  aspectRatio,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (url: string) => void;
  compact?: boolean;
  aspectRatio?: string;
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

  if (compact) {
    return (
      <div>
        <label className="block text-[11px] font-semibold text-gray-700 mb-1.5">{label}</label>
        <div
          onDragOver={onDragOver} onDragEnter={onDragEnter}
          onDragLeave={onDragLeave} onDrop={onDrop}
          onClick={() => !uploading && ref.current?.click()}
          className={`relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
            dragging ? "border-[#ff550c] bg-orange-50" :
            value ? "border-gray-200 hover:border-gray-300" :
                    "border-dashed border-gray-300 hover:border-[#1A2B4A]"
          }`}
          style={{ aspectRatio: aspectRatio ?? "3/4" }}
        >
          <input ref={ref} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
          {value ? (
            <img src={value} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 pointer-events-none">
              <svg className={`w-6 h-6 ${dragging ? "text-[#ff550c]" : "text-gray-300"}`} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <p className="text-[10px] text-gray-400 text-center leading-snug px-2">클릭 또는<br/>드래그</p>
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
              <span className="w-4 h-4 border-2 border-[#ff550c] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        {value && (
          <div className="mt-1.5 space-y-0.5">
            <p className="text-[10px] text-gray-500 truncate">{value.split("/").pop()}</p>
            <p className="text-[10px] text-gray-400 leading-snug">{hint}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <button type="button" onClick={(e) => { e.stopPropagation(); ref.current?.click(); }}
                className="text-[11px] text-[#1A2B4A] hover:underline">이미지 변경</button>
              <button type="button" onClick={(e) => { e.stopPropagation(); onChange(""); }}
                className="text-[11px] text-red-400 hover:text-red-600">제거</button>
            </div>
          </div>
        )}
        {!value && <p className="text-[10px] text-gray-400 mt-1 leading-snug">{hint}</p>}
        {err && <p className="text-[11px] text-red-500 mt-1">{err}</p>}
      </div>
    );
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

// ── 서브 컴포넌트: 배너 섹션 이미지 상품 태그 에디터 ───────
// 프런트(WhiteBox)와 동일하게 8:9 object-contain → 단일 x/y 좌표로 PC·모바일 공용
function BannerTagEditor({ tags, imageUrl, onChange, products }: {
  tags: HeroTag[];
  imageUrl: string;
  onChange: (tags: HeroTag[]) => void;
  products: SearchProduct[];
}) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const imgAreaRef = useRef<HTMLDivElement>(null);
  const wasDraggingRef = useRef(false);

  function updateTag(idx: number, patch: Partial<HeroTag>) {
    const next = [...tags];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  }
  function deleteTag(idx: number) {
    onChange(tags.filter((_, i) => i !== idx));
    setSelectedIdx(null);
  }

  function handleImageClick(e: React.MouseEvent<HTMLDivElement>) {
    if (wasDraggingRef.current) { wasDraggingRef.current = false; return; }
    if (!imageUrl) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    const next = [...tags, { id: uid(), x, y, name: "", price: "", product_id: "", image_url: "", bg: "#1A2B4A" }];
    onChange(next);
    setSelectedIdx(next.length - 1);
  }
  function onTagDown(e: React.PointerEvent<HTMLButtonElement>, idx: number) {
    e.stopPropagation();
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    wasDraggingRef.current = false;
    setDraggingIdx(idx);
    setSelectedIdx(idx);
  }
  function onTagMove(e: React.PointerEvent<HTMLButtonElement>) {
    if (draggingIdx === null || !imgAreaRef.current) return;
    wasDraggingRef.current = true;
    const rect = imgAreaRef.current.getBoundingClientRect();
    const x = Math.round(Math.min(99, Math.max(1, ((e.clientX - rect.left) / rect.width) * 100)));
    const y = Math.round(Math.min(99, Math.max(1, ((e.clientY - rect.top) / rect.height) * 100)));
    updateTag(draggingIdx, { x, y });
  }

  const selectedTag = selectedIdx !== null ? tags[selectedIdx] : null;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-[11px] font-semibold text-gray-700">📍 이미지 상품 태그 ({tags.length}개)</label>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {imageUrl ? "이미지 클릭 → 태그 추가 · 드래그 → 위치 이동 · 클릭 → 편집" : "섹션 이미지를 먼저 등록하세요"}
          </p>
        </div>
        {tags.length > 0 && (
          <button onClick={() => { onChange([]); setSelectedIdx(null); }}
            className="text-[11px] text-red-400 hover:text-red-600">전체 삭제</button>
        )}
      </div>

      <div className="flex gap-3">
        {/* 클릭 영역 — 프런트와 동일 8:9 object-contain */}
        <div
          ref={imgAreaRef}
          onClick={handleImageClick}
          className="relative flex-shrink-0 rounded-xl overflow-hidden select-none border border-gray-200 bg-gray-200"
          style={{ width: "150px", aspectRatio: "440 / 495", cursor: draggingIdx !== null ? "grabbing" : (imageUrl ? "crosshair" : "default") }}
        >
          {imageUrl ? (
            <img src={imageUrl} alt="" draggable={false}
              className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[10px] text-gray-400">이미지 없음</div>
          )}
          {tags.map((tag, idx) => (
            <button
              key={tag.id}
              onPointerDown={(e) => onTagDown(e, idx)}
              onPointerMove={onTagMove}
              onPointerUp={() => setDraggingIdx(null)}
              onClick={(e) => { e.stopPropagation(); if (!wasDraggingRef.current) setSelectedIdx(selectedIdx === idx ? null : idx); }}
              className="absolute"
              style={{ left: `${tag.x}%`, top: `${tag.y}%`, transform: "translate(-50%,-50%)", cursor: draggingIdx === idx ? "grabbing" : "grab", touchAction: "none" }}
              title={tag.name || `태그 ${idx + 1}`}
            >
              <span className={`flex items-center justify-center rounded-full transition-all ${
                selectedIdx === idx ? "w-5 h-5 bg-[#ff550c]/90 border-2 border-white shadow-lg" : "w-4 h-4 bg-white/80 border-2 border-white shadow-md"
              }`}>
                <span className="text-[8px] font-bold text-[#1A2B4A]">{idx + 1}</span>
              </span>
            </button>
          ))}
          <div className="absolute inset-0 pointer-events-none opacity-10"
            style={{ backgroundImage: "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)", backgroundSize: "25% 25%" }} />
        </div>

        {/* 칩 + 선택 태그 편집 */}
        <div className="flex-1 min-w-0 space-y-2.5">
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag, idx) => (
                <button key={tag.id} onClick={() => setSelectedIdx(selectedIdx === idx ? null : idx)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] transition-colors ${
                    selectedIdx === idx ? "bg-[#ff550c] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}>
                  <span className="w-3.5 h-3.5 rounded-full bg-current opacity-30 flex items-center justify-center text-[9px] font-bold">{idx + 1}</span>
                  {tag.name || "이름 미입력"}
                </button>
              ))}
            </div>
          )}

          {selectedTag !== null && selectedIdx !== null ? (
            <div className="border-2 border-[#ff550c]/30 rounded-xl p-3 bg-orange-50/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#ff550c]">태그 {selectedIdx + 1} 편집</span>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-gray-400">{selectedTag.x}%, {selectedTag.y}%</span>
                  <button onClick={() => deleteTag(selectedIdx)} className="text-[11px] text-red-500 hover:text-red-700 font-medium">삭제</button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">제품 검색</label>
                <ProductPicker products={products} value={selectedTag.name}
                  onSelect={(p) => updateTag(selectedIdx, { product_id: p.id, name: p.name, price: p.price, image_url: p.imageUrl ?? "" })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="상품명" value={selectedTag.name} onChange={(v) => updateTag(selectedIdx, { name: v })} placeholder="쿨링 반팔 티셔츠" />
                <Field label="가격" value={selectedTag.price} onChange={(v) => updateTag(selectedIdx, { price: v })} placeholder="19,000원" />
              </div>
            </div>
          ) : (
            imageUrl && tags.length === 0 && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <span className="text-blue-400 text-lg">👆</span>
                <p className="text-[12px] text-blue-600">왼쪽 이미지를 클릭하면 태그가 추가됩니다.</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ── 서브 컴포넌트: 연결상품 슬롯 에디터 (탭 내부) ───────────
function SlotItemEditor({ item, onChange, products }: {
  item: ProductItem;
  onChange: (patch: Partial<ProductItem>) => void;
  products: SearchProduct[];
}) {
  return (
    <div className="flex gap-4">
      {/* 상품 이미지 미리보기 */}
      <div className="flex-shrink-0" style={{ width: "110px" }}>
        <div
          className="rounded-xl overflow-hidden border border-gray-200 bg-gray-100"
          style={{ aspectRatio: "1 / 1" }}
        >
          {item.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 3l18 18" />
              </svg>
            </div>
          )}
        </div>
        {item.image_url && (
          <p className="text-[9px] text-gray-400 mt-1 truncate leading-tight">
            {item.image_url.split("/").pop()}
          </p>
        )}
      </div>

      {/* 필드 */}
      <div className="flex-1 min-w-0 space-y-3">
        <div>
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
        </div>
      </div>
    </div>
  );
}

// ── 서브 컴포넌트: 기획전 합성기 ───────────────────────────
// 모델컷/착용컷 3장을 캔버스로 픽셀 그대로 한 배너(440×495)에 합성 → 의류 변형 0%
type ComposeLayout = "duoV" | "duoH" | "vtri" | "htri" | "main2" | "quad";
const COMPOSE_LAYOUTS = [
  { key: "duoV",  label: "2분할 세로", panels: 2, desc: "2컬럼" },
  { key: "duoH",  label: "2분할 가로", panels: 2, desc: "2로우" },
  { key: "vtri",  label: "세로 3분할", panels: 3, desc: "3컬럼 트립틱 (전신컷에 적합)" },
  { key: "htri",  label: "가로 3분할", panels: 3, desc: "3로우 (가로 크롭)" },
  { key: "main2", label: "메인 + 2",   panels: 3, desc: "좌측 큰 컷 + 우측 작은 2컷" },
  { key: "quad",  label: "4분할",      panels: 4, desc: "2×2 그리드" },
] as const;

type ComposeSlot = { url: string; img: HTMLImageElement | null; fx: number; fy: number };

function composePanelCount(layout: ComposeLayout): number {
  return COMPOSE_LAYOUTS.find((l) => l.key === layout)?.panels ?? 3;
}

function composePanels(layout: ComposeLayout, W: number, H: number, g: number) {
  switch (layout) {
    case "duoV": { const pw = (W - g) / 2; return [0, 1].map((i) => ({ x: i * (pw + g), y: 0, w: pw, h: H })); }
    case "duoH": { const ph = (H - g) / 2; return [0, 1].map((i) => ({ x: 0, y: i * (ph + g), w: W, h: ph })); }
    case "vtri": { const pw = (W - 2 * g) / 3; return [0, 1, 2].map((i) => ({ x: i * (pw + g), y: 0, w: pw, h: H })); }
    case "htri": { const ph = (H - 2 * g) / 3; return [0, 1, 2].map((i) => ({ x: 0, y: i * (ph + g), w: W, h: ph })); }
    case "quad": {
      const pw = (W - g) / 2, ph = (H - g) / 2;
      return ([[0, 0], [1, 0], [0, 1], [1, 1]] as const).map(([cx, cy]) => ({ x: cx * (pw + g), y: cy * (ph + g), w: pw, h: ph }));
    }
    default: {
      const lw = Math.round((W - g) * 0.58), rw = W - g - lw, rh = (H - g) / 2;
      return [
        { x: 0, y: 0, w: lw, h: H },
        { x: lw + g, y: 0, w: rw, h: rh },
        { x: lw + g, y: rh + g, w: rw, h: rh },
      ];
    }
  }
}

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawCover(
  ctx: CanvasRenderingContext2D, img: HTMLImageElement,
  dx: number, dy: number, dw: number, dh: number, fx: number, fy: number
) {
  const ir = img.width / img.height, pr = dw / dh;
  let sw: number, sh: number, sx: number, sy: number;
  if (ir > pr) { sh = img.height; sw = sh * pr; sx = (img.width - sw) * fx; sy = 0; }
  else { sw = img.width; sh = sw / pr; sx = 0; sy = (img.height - sh) * fy; }
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

function BannerComposer({ items, onApply }: {
  items: ProductItem[];
  onApply: (url: string) => void;
}) {
  const [open, setOpen]     = useState(false);
  const [layout, setLayout] = useState<ComposeLayout>("vtri");
  const [gap, setGap]       = useState(6);
  const [bg, setBg]         = useState("#ffffff");
  const [slots, setSlots]   = useState<ComposeSlot[]>([
    { url: "", img: null, fx: 0.5, fy: 0.5 },
    { url: "", img: null, fx: 0.5, fy: 0.5 },
    { url: "", img: null, fx: 0.5, fy: 0.5 },
    { url: "", img: null, fx: 0.5, fy: 0.5 },
  ]);
  const [radius, setRadius]           = useState(0);
  const [border, setBorder]           = useState(0);
  const [borderColor, setBorderColor] = useState("#ffffff");
  const [vignette, setVignette]       = useState(0);
  const [busy, setBusy]     = useState(false);
  const [err, setErr]       = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 언마운트 시 살아있는 blob URL 정리 (누수 방지)
  const slotsRef = useRef(slots);
  slotsRef.current = slots;
  useEffect(() => () => {
    slotsRef.current.forEach((s) => { if (s.url.startsWith("blob:")) URL.revokeObjectURL(s.url); });
  }, []);

  const W = 880, H = 990; // 440×495 @2x

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    c.width = W; c.height = H;
    const ctx = c.getContext("2d"); if (!ctx) return;
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    // 라운드는 패널이 떨어져 있을 때만 의미 — gap=0이면 경계에 흰 노치가 생기므로 비활성
    const effRadius = gap > 0 ? radius : 0;
    composePanels(layout, W, H, gap).forEach((p, i) => {
      const s = slots[i];
      ctx.save();
      if (effRadius > 0) { roundRectPath(ctx, p.x, p.y, p.w, p.h, effRadius); ctx.clip(); }
      if (s?.img) {
        drawCover(ctx, s.img, p.x, p.y, p.w, p.h, s.fx, s.fy);
        if (vignette > 0) {
          const cx = p.x + p.w / 2, cy = p.y + p.h / 2, rad = Math.max(p.w, p.h) / 2;
          const grd = ctx.createRadialGradient(cx, cy, rad * 0.55, cx, cy, rad);
          grd.addColorStop(0, "rgba(0,0,0,0)");
          grd.addColorStop(1, `rgba(0,0,0,${(0.55 * vignette).toFixed(3)})`);
          ctx.fillStyle = grd; ctx.fillRect(p.x, p.y, p.w, p.h);
        }
      } else {
        ctx.fillStyle = "#e5e7eb"; ctx.fillRect(p.x, p.y, p.w, p.h);
      }
      ctx.restore();
      if (border > 0) {
        ctx.save();
        ctx.lineWidth = border; ctx.strokeStyle = borderColor;
        const bx = p.x + border / 2, by = p.y + border / 2, bw = p.w - border, bh = p.h - border;
        if (effRadius > 0) roundRectPath(ctx, bx, by, bw, bh, Math.max(0, effRadius - border / 2));
        else { ctx.beginPath(); ctx.rect(bx, by, bw, bh); }
        ctx.stroke();
        ctx.restore();
      }
    });
  }, [slots, layout, gap, bg, radius, border, borderColor, vignette]);

  function setSlot(idx: number, patch: Partial<ComposeSlot>) {
    setSlots((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }
  function loadFile(idx: number, file: File) {
    setErr("");
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => setSlots((prev) => prev.map((s, i) => {
      if (i !== idx) return s;
      if (s.url.startsWith("blob:")) URL.revokeObjectURL(s.url); // 직전 blob 해제
      return { ...s, url, img };
    }));
    img.onerror = () => { URL.revokeObjectURL(url); setErr("이미지를 불러오지 못했습니다."); };
    img.src = url;
  }
  function loadProductCut(idx: number, src: string) {
    setErr("");
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setSlot(idx, { url: src, img });
    img.onerror = () => setErr("제품 이미지를 불러오지 못했습니다 — 파일로 업로드해 주세요.");
    img.src = src;
  }

  async function apply() {
    const c = canvasRef.current; if (!c) return;
    setBusy(true); setErr("");
    try {
      const blob: Blob = await new Promise((res, rej) =>
        c.toBlob((b) => (b ? res(b) : rej(new Error("export failed"))), "image/jpeg", 0.92));
      const file = new File([blob], "showcase-composed.jpg", { type: "image/jpeg" });
      const url = await uploadImage(file);
      onApply(url);
    } catch (e) {
      const name = (e as { name?: string })?.name ?? "";
      const msg = e instanceof Error ? e.message : "";
      const tainted = name === "SecurityError" || /tainted|security|insecure/i.test(msg);
      setErr(tainted
        ? "교차 출처 이미지로 내보내기 실패 — 각 칸을 ‘파일 업로드’로 올려 주세요."
        : "합성 이미지 생성에 실패했습니다.");
    } finally { setBusy(false); }
  }

  const panelCount = composePanelCount(layout);
  const filled = slots.slice(0, panelCount).filter((s) => s.img).length;
  const hiddenFilled = slots.slice(panelCount).filter((s) => s.img).length;

  return (
    <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl overflow-hidden">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left">
        <span className="text-[12px] font-bold text-emerald-700">🧩 기획전 합성기 — 모델컷을 한 배너로 (생성형 X · 옷 100% 유지)</span>
        <span className="text-[11px] text-emerald-600">{open ? "접기 ▲" : "열기 ▼"}</span>
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-3">
          <p className="text-[10px] text-emerald-700 leading-relaxed bg-white/70 rounded-lg p-2 border border-emerald-100">
            각 칸에 그 제품의 <b>모델컷·착용컷</b>을 올리면, 생성형이 아니라 <b>픽셀 그대로 합성</b>하므로 의류가 절대 바뀌지 않습니다.
            완성본은 그대로 <b>섹션 이미지</b>로 적용됩니다.
          </p>

          {/* 레이아웃 */}
          <div className="flex flex-wrap gap-1.5">
            {COMPOSE_LAYOUTS.map((l) => (
              <button key={l.key} type="button" onClick={() => setLayout(l.key)} title={l.desc}
                className={`text-[11px] px-2.5 py-1 rounded-full border font-medium transition-colors ${
                  layout === l.key ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-gray-600 border-gray-300 hover:border-emerald-400"
                }`}>{l.label}</button>
            ))}
          </div>

          <div className="flex gap-3 items-start">
            {/* 미리보기 */}
            <div className="flex-shrink-0">
              <canvas ref={canvasRef} style={{ width: "180px", height: "202.5px" }}
                className="rounded-lg border border-emerald-200 bg-white" />
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] text-gray-500 w-9 flex-shrink-0">간격</label>
                  <input type="range" min={0} max={40} value={gap} onChange={(e) => setGap(+e.target.value)}
                    className="flex-1 h-1 accent-emerald-600" />
                  <input type="color" value={bg} onChange={(e) => setBg(e.target.value)}
                    className="w-6 h-6 rounded border border-gray-300 cursor-pointer flex-shrink-0" title="배경색" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] text-gray-500 w-9 flex-shrink-0">모서리</label>
                  <input type="range" min={0} max={48} value={radius} onChange={(e) => setRadius(+e.target.value)}
                    className="flex-1 h-1 accent-emerald-600" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] text-gray-500 w-9 flex-shrink-0">테두리</label>
                  <input type="range" min={0} max={16} value={border} onChange={(e) => setBorder(+e.target.value)}
                    className="flex-1 h-1 accent-emerald-600" />
                  <input type="color" value={borderColor} onChange={(e) => setBorderColor(e.target.value)}
                    className="w-6 h-6 rounded border border-gray-300 cursor-pointer flex-shrink-0" title="테두리색" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] text-gray-500 w-9 flex-shrink-0">비네트</label>
                  <input type="range" min={0} max={100} value={Math.round(vignette * 100)} onChange={(e) => setVignette(+e.target.value / 100)}
                    className="flex-1 h-1 accent-emerald-600" />
                </div>
              </div>
            </div>

            {/* 3 슬롯 */}
            <div className="flex-1 min-w-0 space-y-2">
              {slots.slice(0, panelCount).map((s, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-lg p-2 flex items-center gap-2">
                  <div className="w-10 h-12 flex-shrink-0 rounded bg-gray-100 overflow-hidden flex items-center justify-center">
                    {s.img ? <img src={s.url} alt="" className="w-full h-full object-cover" /> : <span className="text-[9px] text-gray-400 font-bold">{i + 1}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-500 truncate mb-1">{items[i]?.name || `칸 ${i + 1}`}</p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <label className="text-[10px] px-2 py-0.5 bg-emerald-600 text-white rounded cursor-pointer hover:bg-emerald-700">
                        파일 업로드
                        <input type="file" accept="image/*" className="hidden"
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(i, f); e.target.value = ""; }} />
                      </label>
                      {items[i]?.image_url && (
                        <button type="button" onClick={() => loadProductCut(i, items[i].image_url)}
                          className="text-[10px] px-2 py-0.5 border border-gray-300 rounded text-gray-600 hover:bg-gray-50">제품컷 사용</button>
                      )}
                      {s.img && (
                        <>
                          <span className="text-[9px] text-gray-400">좌우</span>
                          <input type="range" min={0} max={100} value={Math.round(s.fx * 100)}
                            onChange={(e) => setSlot(i, { fx: +e.target.value / 100 })} className="w-14 h-1 accent-emerald-600" />
                          <span className="text-[9px] text-gray-400">상하</span>
                          <input type="range" min={0} max={100} value={Math.round(s.fy * 100)}
                            onChange={(e) => setSlot(i, { fy: +e.target.value / 100 })} className="w-14 h-1 accent-emerald-600" />
                          <button type="button" onClick={() => setSlots((prev) => prev.map((sl, j) => {
                              if (j !== i) return sl;
                              if (sl.url.startsWith("blob:")) URL.revokeObjectURL(sl.url);
                              return { ...sl, url: "", img: null };
                            }))}
                            className="text-[10px] text-red-400 hover:text-red-600">비우기</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {hiddenFilled > 0 && (
            <p className="text-[11px] text-amber-600">
              현재 레이아웃은 {panelCount}칸만 사용 — 숨겨진 칸 {hiddenFilled}개의 사진은 합성에 포함되지 않습니다.
            </p>
          )}
          {err && <p className="text-[11px] text-red-500">{err}</p>}

          <button type="button" onClick={apply} disabled={busy || filled === 0}
            className="w-full py-2 text-[12px] font-semibold rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors">
            {busy ? "생성 중..." : `합성 이미지 생성 → 섹션 이미지로 적용 (${filled}/${panelCount})`}
          </button>
        </div>
      )}
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
  const [itemTab, setItemTab] = useState(0);

  // 항상 3개 슬롯 고정
  const items3: ProductItem[] = [0, 1, 2].map((i) => banner.items[i] ?? emptyItem());

  function updateItem(idx: number, patch: Partial<ProductItem>) {
    const next = items3.map((item, i) => (i === idx ? { ...item, ...patch } : item));
    onChange({ items: next });
  }

  // 상세페이지 전용 추가 상품 (가변 개수)
  const detailItems: ProductItem[] = banner.detail_items ?? [];
  function addDetailItem() {
    onChange({ detail_items: [...detailItems, emptyItem()] });
  }
  function updateDetailItem(idx: number, patch: Partial<ProductItem>) {
    onChange({ detail_items: detailItems.map((it, i) => (i === idx ? { ...it, ...patch } : it)) });
  }
  function removeDetailItem(idx: number) {
    onChange({ detail_items: detailItems.filter((_, i) => i !== idx) });
  }

  return (
    <div className="space-y-4">
      {/* 상단 라벨 (상세페이지 상단 기획전명 — 배너별로 개별 노출) */}
      <Field
        label="상단 라벨 (상세페이지 기획전명)"
        value={banner.label ?? ""}
        onChange={(v) => onChange({ label: v })}
        placeholder="그대 이름은 바람 바람 바람"
      />

      {/* 타이틀 + 설명 한 줄 (single-line inputs) */}
      <div className="flex gap-3 items-end">
        <div className="flex-shrink-0" style={{ width: "220px" }}>
          <Field label="타이틀" value={banner.title} onChange={(v) => onChange({ title: v })}
            placeholder="자외선을 막는 기능성 상의" />
        </div>
        <div className="flex-1 min-w-0">
          <Field label="설명" value={banner.desc} onChange={(v) => onChange({ desc: v })}
            placeholder="섹션 설명을 입력하세요" />
        </div>
      </div>

      {/* 섹션 이미지 + 연결상품 탭 — 한 줄 배치 */}
      <div className="flex gap-4 items-start">
        {/* 좌: 섹션 이미지 — 8:9 비율 (440×495px 실제 노출 비율) */}
        <div className="flex-shrink-0" style={{ width: "160px" }}>
          <ImageField
            label="섹션 이미지"
            hint="440 × 495px"
            value={banner.image_url}
            onChange={(url) => onChange({ image_url: url })}
            compact
            aspectRatio="8/9"
          />
          <p className="mt-2 text-[11px] text-gray-500 leading-relaxed">
            이미지 배치 후 ChatGPT로 기획 이미지 생성
          </p>
        </div>

        {/* 우: 연결상품 3개 탭 */}
        <div className="flex-1 min-w-0">
          {/* 탭 바 — 좌측 정렬, 자연 너비 */}
          <div className="flex border border-gray-200 rounded-t-xl overflow-hidden">
            {[0, 1, 2].map((i) => (
              <button
                key={i}
                onClick={() => setItemTab(i)}
                className={`px-5 py-2.5 text-sm font-semibold transition-colors border-r last:border-r-0 border-gray-200 text-left whitespace-nowrap ${
                  itemTab === i
                    ? "bg-[#1A2B4A] text-white"
                    : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                }`}
              >
                상품{i + 1}
                {items3[i].name && (
                  <span className={`ml-1.5 text-[10px] font-normal ${itemTab === i ? "text-white/70" : "text-gray-400"}`}>
                    · {items3[i].name}
                  </span>
                )}
              </button>
            ))}
          </div>
          {/* 탭 콘텐츠 */}
          <div className="border border-t-0 border-gray-200 rounded-b-xl p-4">
            <SlotItemEditor
              key={itemTab}
              item={items3[itemTab]}
              onChange={(patch) => updateItem(itemTab, patch)}
              products={products}
            />
          </div>
        </div>
      </div>

      {/* 기획전 합성기 — 모델컷 3장을 옷 변형 없이 한 배너로 합쳐 섹션 이미지로 적용 */}
      <BannerComposer items={items3} onApply={(url) => onChange({ image_url: url })} />

      {/* 상세페이지 추가 상품 — 섹션이미지 클릭 시 이동하는 상세페이지에만 노출 (메인 3개 뒤) */}
      <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/60">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[13px] font-semibold text-[#1A2B4A]">상세페이지 추가 상품</p>
          <button
            type="button"
            onClick={addDetailItem}
            className="flex items-center gap-1 text-[12px] font-medium text-white bg-[#1A2B4A] hover:bg-[#26385c] px-3 py-1.5 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            상품 추가
          </button>
        </div>
        <p className="text-[11px] text-gray-400 mb-3">
          섹션이미지를 클릭하면 열리는 상세페이지에서 위 연결상품 3개 뒤에 이어서 노출됩니다. (메인 화면에는 표시되지 않음)
        </p>

        {detailItems.length === 0 ? (
          <div className="text-center py-5 text-[12px] text-gray-400 border border-dashed border-gray-200 rounded-lg bg-white">
            추가된 상품이 없습니다. &lsquo;상품 추가&rsquo;로 상세페이지에만 노출할 제품을 담아보세요.
          </div>
        ) : (
          <div className="space-y-2.5">
            {detailItems.map((item, idx) => (
              <div key={item.id} className="flex gap-3 items-start bg-white border border-gray-200 rounded-lg p-2.5">
                {/* 썸네일 */}
                <div className="flex-shrink-0 w-14 h-14 rounded-md overflow-hidden border border-gray-100 bg-gray-100 flex items-center justify-center">
                  {item.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[9px] text-gray-300 font-bold">WU</span>
                  )}
                </div>
                {/* 필드 */}
                <div className="flex-1 min-w-0 space-y-2">
                  <ProductPicker
                    products={products}
                    value={item.name}
                    onSelect={(p) => updateDetailItem(idx, { product_id: p.id, name: p.name, price: p.price, image_url: p.imageUrl ?? "" })}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateDetailItem(idx, { name: e.target.value })}
                      placeholder="상품명"
                      className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A2B4A]/30"
                    />
                    <input
                      type="text"
                      value={item.price}
                      onChange={(e) => updateDetailItem(idx, { price: e.target.value })}
                      placeholder="가격"
                      className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A2B4A]/30"
                    />
                  </div>
                </div>
                {/* 삭제 */}
                <button
                  type="button"
                  onClick={() => removeDetailItem(idx)}
                  className="flex-shrink-0 text-gray-300 hover:text-red-500 transition-colors p-1"
                  aria-label="삭제"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
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
  { key: "side",   label: "측면샷",   en: "side profile shot at 45-90 degrees showing garment silhouette and layering" },
  { key: "action", label: "동작샷",   en: "dynamic action shot with natural work movement, walking or active pose" },
  { key: "back",   label: "뒷모습",   en: "rear view shot emphasizing back design, seams and overall fit from behind" },
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

function ShowcaseModeSelector({ value, onChange }: { value: ShowcaseMode; onChange: (v: ShowcaseMode) => void }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-gray-500 mb-1.5">기획전 구도 (하단 3제품 반영)</label>
      <div className="flex flex-wrap gap-1.5">
        {SHOWCASE_MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => onChange(m.key)}
            title={m.desc}
            className={`text-[12px] px-3 py-1.5 rounded-full border font-medium transition-colors ${
              value === m.key
                ? "bg-violet-600 text-white border-violet-600"
                : "bg-white text-gray-600 border-gray-300 hover:border-violet-400 hover:text-violet-600"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-gray-400 mt-1">{SHOWCASE_MODES.find((m) => m.key === value)?.desc}</p>
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
  side:   "50mm lens, side profile angle, silhouette and layering clearly readable from a 45-90 degree perspective",
  action: "35mm lens, slight motion blur on extremities, dynamic working or walking motion captured mid-movement",
  back:   "50mm lens, rear view centered, back panel design and overall silhouette clearly visible",
};

// ── 기획전(컬렉션) 모드: 하단 연결상품 3개를 하나로 아우르는 상단 이미지 ──
type ShowcaseMode = "flatlay" | "hero" | "lineup";
const SHOWCASE_MODES = [
  { key: "flatlay", label: "컬렉션 정물", desc: "무모델 정물(놀링) — 3제품을 또렷하게" },
  { key: "hero",    label: "대표 모델컷", desc: "선택한 1제품을 모델이 착용 — 일치도 가장 높음" },
  { key: "lineup",  label: "그룹 모델컷", desc: "여러 모델이 각 1점씩 착장" },
] as const;

type CollItem = { name: string; garment: string; imageUrl?: string };

// 한글 제품명 → 영문 의류 표현 (이미지 모델 인식률 ↑, 미매칭은 참고이미지에 위임)
// 색상은 앞에 와서 자연스러운 영문이 되도록 상단 배치
const GARMENT_KEYWORDS: Record<string, string> = {
  "네이비": "navy", "그레이": "gray", "회색": "gray", "차콜": "charcoal",
  "블랙": "black", "검정": "black", "화이트": "white", "흰색": "white",
  "카키": "khaki", "베이지": "beige", "올리브": "olive", "카멜": "camel",
  "브라운": "brown", "블루": "blue", "그린": "green", "버건디": "burgundy",
  "소로나": "Sorona-blend", "흡한속건": "moisture-wicking quick-dry",
  "흡습속건": "moisture-wicking quick-dry", "쿨링": "cooling",
  "기능성": "technical functional", "방풍": "windproof", "방수": "waterproof",
  "반사": "reflective safety", "경량": "lightweight", "스트레치": "stretch",
  "반팔티": "short-sleeve t-shirt", "긴팔티": "long-sleeve t-shirt",
  "반팔": "short-sleeve", "긴팔": "long-sleeve", "티셔츠": "t-shirt",
  "스웻셔츠": "sweatshirt", "맨투맨": "sweatshirt", "셔츠": "button-up shirt",
  "후드": "hooded", "집업": "zip-up", "자켓": "jacket",
  "조끼": "vest", "베스트": "vest", "카고": "cargo", "치노": "chino",
  "팬츠": "pants", "쇼츠": "shorts", "캠프": "camp-collar",
  "팔토시": "UV arm sleeves", "넥게이터": "neck gaiter", "모자": "cap",
  "백팩": "backpack", "파우치": "pouch",
};
function describeGarment(name: string): string {
  const keys = Object.keys(GARMENT_KEYWORDS).filter((k) => name.includes(k));
  // 더 긴 키에 포함되는 짧은 키 제거 (예: "반팔" ⊂ "반팔티")
  const kept = keys.filter((k) => !keys.some((o) => o !== k && o.includes(k)));
  const en = kept.map((k) => GARMENT_KEYWORDS[k]);
  return en.length ? Array.from(new Set(en)).join(" ") : "functional apparel piece";
}

// 컬렉션 프롬프트 본문 — 모드별 피사체/구도 분기, no-text 규칙 동일 상속
function buildCollectionPrompt(opts: {
  theme: string; desc: string;
  clothingEn: string; seasonEn: string; sceneEn: string;
  descriptors: string[]; moodLine: string;
  collection: { mode: ShowcaseMode; items: CollItem[]; repIndex?: number };
}): string {
  const { theme, desc, clothingEn, seasonEn, sceneEn, descriptors, moodLine, collection } = opts;
  const { mode, items } = collection;
  const repIndex = Math.min(Math.max(collection.repIndex ?? 0, 0), items.length - 1);
  const who = descriptors.length ? `${descriptors.join(" ")} ` : "";
  const output = "8:9 vertical, 440 × 495px";
  const isHero = mode === "hero";

  // 대표 모델컷은 선택 1제품만 묘사·참고 → 일치도 ↑ / 나머지 모드는 전체
  const promptItems = isHero ? [items[repIndex]] : items;
  const lineup = promptItems.map((it, n) => `  ${n + 1}. ${it.name} — ${it.garment}`).join("\n");
  const refs = (isHero ? [items[repIndex]?.imageUrl] : items.map((it) => it.imageUrl)).filter(Boolean) as string[];

  // 참고이미지 1:1 바인딩 — 이미지 있는 항목만 순번 부여 (첨부 순서와 일치)
  let refCounter = 0;
  const bindings = promptItems.map((it) => ({ it, ref: it.imageUrl ? ++refCounter : null }));

  let subject = "", composition = "", camera = "", anatomy = "";
  if (mode === "flatlay") {
    subject = `- NO human model. The ${items.length} actual garments themselves are the hero subject, each reproduced EXACTLY from its reference photo.`;
    composition = `- Flat-lay / knolling still-life: the ${items.length} garments neatly folded or laid out and styled together as ONE cohesive collection on a clean minimal surface. Top-down or slight 30° angle, balanced layout with gentle negative space, every piece clearly readable even at a small 440×495 thumbnail. Vertical 8:9 framing.`;
    camera = `- 50mm product still-life setup, soft even light with subtle directional shadow for material depth`;
  } else if (mode === "lineup") {
    subject = `- EXACTLY ${promptItems.length} ${who}authentic, real-worker-type Korean models, ONE garment per model, each garment LOCKED 1:1 to its reference photo as listed in [GARMENT LOCK]. No garment is altered, swapped, merged or restyled${moodLine ? `; overall mood: ${moodLine}` : ""}.`;
    composition = `- Group editorial framing (vertical 8:9, 440×495): the ${promptItems.length} models staged together in one balanced composition so the collection reads as a single themed group, while each garment stays exactly as its reference.`;
    camera = `- 35mm lens, several models within the scene, cohesive group composition`;
    anatomy = `\n[MODEL & ANATOMY]\n- Anatomically correct proportions, natural hands and fingers, realistic joints; lifelike skin texture, no plastic skin, no over-retouching\n`;
  } else {
    const rep = items[repIndex];
    subject = `- One ${who}authentic, real-worker-type Korean model wearing EXACTLY the garment in Reference Image 1 ("${rep.name}", ${rep.garment}), reproduced pixel-faithfully per [GARMENT LOCK]. ONLY this single, unaltered garment, styled naturally${moodLine ? `; ${moodLine}` : ""}.`;
    composition = `- Single-subject model shot (vertical 8:9, 440×495): one model worn-on-body, the product clearly visible and in focus, environment softly behind. Clear focal point that still reads at thumbnail size.`;
    camera = `- 50mm lens, waist-up to full body, subject prominent with environment softly behind`;
    anatomy = `\n[MODEL & ANATOMY]\n- Anatomically correct proportions, natural hands and fingers, realistic joints; lifelike skin texture, no plastic skin, no over-retouching\n`;
  }

  // 의류 잠금 — 강제·비협상 블록 (각 참고사진을 모델/의류에 1:1 고정, 변경 절대 금지)
  const lockNoun = mode === "flatlay" ? "Garment" : "Model";
  const lockLines = bindings.map((b, i) => {
    const where = b.ref ? `in Reference Image ${b.ref}` : `as named (no photo provided)`;
    return `  - ${lockNoun} ${i + 1} = the EXACT garment ${where}: "${b.it.name}" (${b.it.garment}). Reproduce it pixel-faithfully; do NOT change it in any way.`;
  }).join("\n");

  const garmentLockBlock =
    `[GARMENT LOCK — MANDATORY · NON-NEGOTIABLE]\n` +
    `This is a photo-COMPOSITING task, NOT a redesign. Every garment is a FIXED, UNCHANGEABLE ASSET taken from its attached reference photo.\n` +
    `ALLOWED to change: pose, body / person, camera framing, background, lighting.\n` +
    `FORBIDDEN to change — even slightly: each garment's design, silhouette, cut, length, collar / neckline, sleeves, color, pattern, print, logo, buttons, zippers, pockets, fabric and proportions.\n` +
    (mode !== "flatlay"
      ? `Each model wears exactly ONE garment, bound 1:1 to its own reference photo — NEVER mix, blend or swap garments between models.\n`
      : ``) +
    lockLines + `\n` +
    `If an exact match is uncertain, COPY the garment directly from its reference instead of inventing or restyling. Treat each reference as a locked layer composited onto a new model/scene.\n\n`;

  const lineupHeader = isHero
    ? `\n[PRODUCT] — feature THIS single locked product on the model:\n`
    : `\n[COLLECTION LINEUP] — ${promptItems.length} locked garments shown together, one per model:\n`;

  const refsBlock = refs.length
    ? `\n\n[REFERENCE IMAGES] (${refs.length}) — attach in THIS exact order; each is the single, unchangeable source for its garment:\n` +
      bindings.filter((b) => b.ref).map((b) => `  ${b.ref}. ${b.it.name} → ${b.it.imageUrl}`).join("\n")
    : "";

  return (
    `[GENERATION DIRECTIVE]\n` +
    `Assemble the provided garments (LOCKED reference assets) into ONE single photorealistic cinematic editorial image — one cohesive scene. No collage, grid, card-news, multi-panel layout, split-screen, or any text inside the image.\n\n` +
    garmentLockBlock +
    `[CONCEPT]\n` +
    `- Brand: WORKUP — ${clothingEn}\n` +
    `- Theme: "${theme}"\n` +
    (desc.trim() ? `- Story: ${desc.trim().slice(0, 160)}\n` : "") +
    lineupHeader +
    lineup + `\n` +
    `\n[SCENE & ENVIRONMENT]\n- Set in ${sceneEn}\n` +
    (seasonEn ? `- Season mood: ${seasonEn}\n` : "") +
    `\n[SUBJECT]\n${subject}\n` +
    `\n[COMPOSITION]\n${composition}\n` +
    `\n[CAMERA & LENS]\n${camera}\n` +
    `\n[LIGHTING & MOOD]\n- Natural directional light (daylight / golden-hour feel), cinematic atmosphere and depth — premium commercial editorial quality\n` +
    anatomy +
    `\n[COLOR & FIDELITY]\n- Preserve the EXACT product colors, prints, logos and fabric; natural true-to-life editorial color grade, no color cast\n` +
    `\n[OUTPUT]\n- ${output}, high-resolution, sharp fabric texture` +
    refsBlock +
    `\n\n[NEGATIVE PROMPT]\n` +
    `text, typography, caption, watermark, added graphic logo overlay, collage, grid, split-screen, multi-panel, border, frame, ` +
    `different garment, redesigned clothing, restyled outfit, altered color, recolored fabric, wrong collar, wrong neckline, wrong sleeve length, invented print, changed pattern, added logo, removed logo, extra clothing items, ` +
    `garment swap, swapped clothing, mixed garments, blended outfits, merged clothing, mismatched garment, garment from wrong reference, hallucinated clothing, ` +
    `deformed hands, extra fingers, missing fingers, fused fingers, extra limbs, mutated anatomy, twisted joints, plastic skin, over-retouched, uncanny face, ` +
    `distorted product, warped proportions, wrong colors, color cast, oversaturated, blurry, low-resolution, jpeg artifacts` +
    `\n\n── 한글 참고 ──\n` +
    `테마: ${theme}\n` +
    (desc.trim() ? `설명: ${desc.trim().slice(0, 160)}\n` : "") +
    `기획전 구도: ${SHOWCASE_MODES.find((m) => m.key === mode)?.label}\n` +
    (isHero ? `대표 제품: ${items[repIndex]?.name ?? ""}\n` : `연결상품: ${items.map((i) => i.name).join(", ")}\n`) +
    (refs.length
      ? `참고 이미지 ${refs.length}장: ${isHero ? "대표 제품 사진과 동일하게 (1장만 첨부 → 일치도 ↑)" : "각 제품 사진과 동일하게"}`
      : "참고 이미지 없음 — 제품명 묘사 기반 (이미지 첨부 시 일치도 크게 향상)")
  );
}

// 기획(에디토리얼) 공통 프롬프트 코어 — 배경·무드가 살아있는 시네마틱
function buildEditorialPrompt(opts: {
  kind: "hero" | "banner";
  theme: string; desc: string; shotType: ShotKey;
  clothingType: "작업복" | "일상복" | "잡화";
  season: string; extras: string[]; scene: string; imageUrl?: string;
  collection?: { mode: ShowcaseMode; items: CollItem[]; repIndex?: number };
}): string {
  const { kind, theme, desc, shotType, clothingType, season, extras, scene, imageUrl, collection } = opts;
  if (!theme) return "";

  const clothingEn = clothingType === "일상복" ? "Korean casual everyday wear"
    : clothingType === "잡화" ? "Korean workwear accessories and hard goods"
    : "Korean functional workwear";
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

  // 기획전(컬렉션) 모드 — 하단 연결상품을 하나로 아우르는 별도 코어로 위임
  if (collection && collection.items.length) {
    return buildCollectionPrompt({
      theme, desc, clothingEn, seasonEn, sceneEn, descriptors, moodLine, collection,
    });
  }

  const composition = kind === "hero"
    ? `${shotEn}. WIDE editorial framing for a 3:4 portrait (950×1280px): camera set back, generous negative space around the subject, subject occupies ~50–60% of the frame height, centered. This image is also cropped to 8:9 (top-aligned) on desktop — keep critical elements away from the bottom edge.`
    : `${shotEn}. Vertical 8:9 section framing (440×495px): subject and environment balanced, with a clear focal point that still reads at a small thumbnail size.`;
  const output = kind === "hero"
    ? "3:4 portrait, 950 × 1280px (also used as an 8:9 center-top crop on desktop)"
    : "8:9 vertical, 440 × 495px";

  const refBlock = imageUrl
    ? `\n\n[REFERENCE IMAGE — SINGLE SOURCE OF TRUTH]\n` +
      `- Use the uploaded product photo as the primary reference, not as loose inspiration.\n` +
      `- The garment MUST match the uploaded product exactly: same silhouette, cut, collar / neckline, sleeve length, color, fabric texture, seams, pockets, zippers, buttons, prints and logos.\n` +
      `- Do NOT invent, restyle, recolor, or substitute a different garment. Only the model, pose, lighting and background may change.`
    : `\n\n[PRODUCT ACCURACY WARNING]\n` +
      `- No product reference image is attached. Do NOT claim this is an exact worn photo of a real product.\n` +
      `- Create a product-inspired editorial mood image only. If exact product fidelity is required, ask for the real product photo first.`;

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
    `- ${modelDesc} wearing the ${imageUrl ? "exact referenced product" : clothingEn + " from the theme"}, styled naturally\n` +
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
  clothingType: "작업복" | "일상복" | "잡화",
  season: string,
  extras: string[],
  scene: string,
  imageUrl?: string
): string {
  const theme = [title, subtitle].filter(Boolean).join(" · ");
  return buildEditorialPrompt({ kind: "hero", theme, desc, shotType, clothingType, season, extras, scene, imageUrl });
}

function buildBannerPrompt(
  title: string, desc: string, shotType: ShotKey,
  clothingType: "작업복" | "일상복" | "잡화",
  season: string,
  extras: string[],
  scene: string,
  imageUrl?: string
): string {
  return buildEditorialPrompt({ kind: "banner", theme: title.trim(), desc, shotType, clothingType, season, extras, scene, imageUrl });
}

// 기획전 프롬프트 — 배너 하단 연결상품(items)을 하나로 아우르는 상단 이미지
// repIndex: 대표 모델컷에서 어떤 제품을 대표로 쓸지 (named 제품 기준 인덱스)
function buildShowcasePrompt(
  title: string, desc: string, items: ProductItem[],
  mode: ShowcaseMode, repIndex: number,
  clothingType: "작업복" | "일상복" | "잡화",
  season: string, extras: string[], scene: string
): string {
  const coll = items
    .filter((i) => i.name.trim())
    .map((i) => ({ name: i.name.trim(), garment: describeGarment(i.name), imageUrl: i.image_url || undefined }));
  if (!coll.length) return "";
  return buildEditorialPrompt({
    kind: "banner", theme: title.trim(), desc,
    shotType: "full", clothingType, season, extras, scene,
    collection: { mode, items: coll, repIndex },
  });
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
const PROMPT_EXTRA_PRESETS = [
  "남성", "여성", "한국인", "서양인", "캐주얼", "프로페셔널",
  "청년", "중장년", "단체", "야외작업", "도심출근",
];

function PromptBuilder({
  buildFn,
  buildShowcaseFn,
  enableShowcase,
  items,
  isHero,
  sizeLabel,
  ratioLabel,
  refImageUrl,
}: {
  buildFn: (shotType: ShotKey, clothingType: "작업복" | "일상복" | "잡화", season: string, extras: string[], scene: string) => string;
  buildShowcaseFn?: (mode: ShowcaseMode, repIndex: number, clothingType: "작업복" | "일상복" | "잡화", season: string, extras: string[], scene: string) => string;
  enableShowcase?: boolean;
  items?: ProductItem[];
  isHero?: boolean;
  sizeLabel?: string;
  ratioLabel?: string;
  refImageUrl?: string;
}) {
  const [shotType, setShotType]           = useState<ShotKey>("full");
  const [clothingType, setClothingType]   = useState<"작업복" | "일상복" | "잡화">("작업복");
  const [season, setSeason]               = useState("");
  const [scene, setScene]                 = useState("");
  const [extras, setExtras]               = useState<string[]>([]);
  const [customInput, setCustomInput]     = useState("");
  const [prompt, setPrompt]               = useState("");
  const [showPrompt, setShowPrompt]       = useState(false);
  const [copied, setCopied]               = useState(false);
  const [showcaseOn, setShowcaseOn]       = useState<boolean>(!!enableShowcase);
  const [showcaseMode, setShowcaseMode]   = useState<ShowcaseMode>("flatlay");
  const [repIndex, setRepIndex]           = useState(0);

  const showcaseActive = !!(enableShowcase && showcaseOn && buildShowcaseFn);
  const itemRefs = (items ?? []).map((i) => i.image_url).filter(Boolean) as string[];
  const namedItems = (items ?? []).filter((i) => i.name.trim());
  const missingImageItems = namedItems.filter((i) => !i.image_url);
  const safeRep = Math.min(repIndex, Math.max(0, namedItems.length - 1));
  // 대표 모델컷은 대표 제품 1장만, 그 외는 전체 — 프롬프트 본문과 참고이미지 표기 일치
  const showcaseRefs = showcaseMode === "hero"
    ? ([namedItems[safeRep]?.image_url].filter(Boolean) as string[])
    : itemRefs;
  const activeRefCount = showcaseActive ? showcaseRefs.length : (refImageUrl ? 1 : 0);

  const resetPrompt = () => setShowPrompt(false);

  const generate = () => {
    const p = showcaseActive
      ? buildShowcaseFn!(showcaseMode, safeRep, clothingType, season, extras, scene)
      : buildFn(shotType, clothingType, season, extras, scene);
    if (p) { setPrompt(p); setShowPrompt(true); }
  };

  const copy = () => {
    const suffix = isHero
      ? `\n\n[권장 사이즈] 950 × 1280px  [비율] 3 : 4\n[PC 표시] 동일 이미지를 8:9 비율 center-top 크롭으로 사용`
      : `\n\n[권장 사이즈] ${sizeLabel}  [비율] ${ratioLabel}`;
    // 기획전 본문에 이미 순서·바인딩 포함된 [REFERENCE IMAGES]가 있어 중복 방지
    const refPart = showcaseActive
      ? ""
      : (refImageUrl ? `\n[참고 이미지] ${refImageUrl}` : "");
    const usageGuide = activeRefCount
      ? `[ChatGPT 사용법]\n1. 아래 참고 이미지 URL의 실제 제품 사진을 먼저 대화창에 업로드하세요.\n2. 그 다음 이 프롬프트를 붙여넣어 생성하세요.\n3. 색상, 주머니, 절개선, 로고, 지퍼/단추 위치가 다르면 폐기하고 다시 생성하세요.\n\n`
      : `[ChatGPT 사용법]\n정확한 착용샷이 필요하면 먼저 실제 제품 이미지를 업로드하세요. 참고 이미지 없이 생성하면 비슷한 옷으로 바뀔 수 있습니다.\n\n`;
    const full = usageGuide + prompt + suffix + refPart;
    navigator.clipboard.writeText(full)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); })
      .catch(() => {});
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
      {/* 헤더: 제목 + 생성 버튼 */}
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-[11px] font-semibold text-gray-700">{enableShowcase ? "✨ 기획 AI 이미지 프롬프트 생성" : "✨ AI 이미지 프롬프트 생성"}</p>
        <button type="button" onClick={generate}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold bg-gradient-to-r from-violet-500 to-indigo-500 text-white hover:from-violet-600 hover:to-indigo-600 transition-all rounded shadow-sm">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z" />
          </svg>
          이미지 프롬프트 생성
        </button>
      </div>

      {/* 2열: 컨트롤 (좌) | 프롬프트 (우) */}
      <div className="flex gap-3">
        {/* Left: 컨트롤 */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* 기획전 모드 */}
          {enableShowcase && buildShowcaseFn && (
            <div className="bg-violet-50 border border-violet-200 rounded-lg p-2.5 space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[11px] font-semibold text-violet-700">🎯 하단 연결상품 반영</span>
                <button type="button" onClick={() => { setShowcaseOn((v) => !v); resetPrompt(); }}
                  className={`relative w-9 h-5 rounded-full transition-colors ${showcaseOn ? "bg-violet-600" : "bg-gray-300"}`} aria-pressed={showcaseOn}>
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${showcaseOn ? "translate-x-4" : ""}`} />
                </button>
              </label>
              {showcaseOn && (
                <>
                  <ShowcaseModeSelector value={showcaseMode} onChange={(v) => { setShowcaseMode(v); resetPrompt(); }} />
                  {namedItems.length > 0 && missingImageItems.length > 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-[10px] leading-snug text-amber-700">
                      상품 이미지가 없는 연결상품 {missingImageItems.length}개가 있습니다. 실제 제품과 같은 착용샷이 필요하면 먼저 각 상품 이미지를 등록하세요.
                    </div>
                  )}

                  {/* 대표 모델컷 — 어떤 제품을 대표로 쓸지 선택 */}
                  {showcaseMode === "hero" && namedItems.length > 0 && (
                    <div className="bg-white/70 border border-violet-100 rounded-lg p-2">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <p className="text-[10px] text-violet-600 font-medium">대표 착용 제품 선택</p>
                        <span className="text-[9px] text-violet-400">이미지 있는 상품 권장</span>
                      </div>
                      <div className="grid grid-cols-1 gap-1.5">
                        {namedItems.map((it, idx) => (
                          <button
                            key={it.id}
                            type="button"
                            onClick={() => { setRepIndex(idx); resetPrompt(); }}
                            className={`flex items-center gap-2 rounded-lg px-2 py-1.5 border text-left transition-colors ${
                              safeRep === idx ? "bg-violet-600 border-violet-600 text-white" : "bg-white border-violet-200 text-gray-600 hover:border-violet-400"
                            }`}
                          >
                            {it.image_url
                              ? <img src={it.image_url} alt="" className="w-8 h-8 object-cover rounded border border-black/10 flex-shrink-0" />
                              : <span className="w-8 h-8 rounded border border-amber-200 bg-amber-50 flex items-center justify-center text-[8px] text-amber-500 font-bold flex-shrink-0">NO IMG</span>}
                            <span className="min-w-0 flex-1">
                              <span className="block text-[11px] font-semibold truncate">{it.name}</span>
                              <span className={`block text-[9px] ${safeRep === idx ? "text-white/70" : it.image_url ? "text-gray-400" : "text-amber-600"}`}>
                                {it.image_url ? "참고 이미지 있음" : "이미지 없음 - 정확도 낮음"}
                              </span>
                            </span>
                            {safeRep === idx && <span className="text-[9px] font-semibold bg-white/20 px-1.5 py-0.5 rounded">대표</span>}
                          </button>
                        ))}
                      </div>
                      {!namedItems[safeRep]?.image_url && (
                        <p className="text-[10px] text-amber-600 mt-1.5">선택 제품에 이미지가 없습니다 — 이미지를 등록하면 일치도가 크게 올라갑니다.</p>
                      )}
                    </div>
                  )}

                  {namedItems.length > 0 ? (
                    <div className="bg-white/70 border border-violet-100 rounded-lg p-2">
                      <p className="text-[10px] text-violet-600 font-medium mb-1">반영될 제품 {namedItems.length}개{itemRefs.length > 0 && ` · 참고이미지 ${itemRefs.length}장`}</p>
                      <div className="flex flex-wrap gap-1">
                        {namedItems.map((it) => (
                          <span key={it.id} className="inline-flex items-center gap-1 bg-white border border-violet-100 rounded-full pl-1 pr-2 py-0.5">
                            {it.image_url ? <img src={it.image_url} alt="" className="w-4 h-4 object-cover rounded-full" /> : <span className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-[7px] text-gray-400 font-bold">WU</span>}
                            <span className="text-[10px] text-gray-600 max-w-[80px] truncate">{it.name}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-amber-600">아래 &lsquo;연결 상품&rsquo;을 먼저 추가하세요.</p>
                  )}
                </>
              )}
            </div>
          )}

          {/* 의류 유형 + 시즌 + 장면/배경 */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-gray-500 whitespace-nowrap">의류 유형</span>
              <div className="flex gap-1">
                {(["작업복", "일상복", "잡화"] as const).map(t => (
                  <button key={t} type="button" onClick={() => { setClothingType(t); resetPrompt(); }}
                    className={`px-2.5 py-1 text-[11px] rounded-full border font-medium transition-colors ${
                      clothingType === t ? "bg-violet-600 text-white border-violet-600" : "bg-white text-gray-600 border-gray-200 hover:border-violet-400 hover:text-violet-600"
                    }`}>{t}</button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-gray-500 whitespace-nowrap">시즌</span>
              <select value={season} onChange={e => { setSeason(e.target.value); resetPrompt(); }}
                className="text-[11px] border border-gray-200 rounded px-2 py-1 bg-white text-gray-600 focus:outline-none focus:border-violet-400">
                <option value="">선택 없음</option>
                {["봄", "여름", "가을", "겨울", "전천후"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-gray-500 whitespace-nowrap">장면/배경</span>
              <select value={scene} onChange={e => { setScene(e.target.value); resetPrompt(); }}
                className="text-[11px] border border-gray-200 rounded px-2 py-1 bg-white text-gray-600 focus:outline-none focus:border-violet-400">
                <option value="">자동 선택</option>
                {SCENE_PRESETS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* 추가 옵션 */}
          <div>
            {/* 라벨 줄 — 직접 입력 input + + 버튼을 같은 줄에 */}
            <div className="flex items-center gap-2 mb-1.5">
              <p className="text-[11px] font-medium text-gray-500 flex-shrink-0">추가 옵션 <span className="text-gray-400 font-normal">(복수 선택 가능)</span></p>
              <input value={customInput} onChange={e => setCustomInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && customInput.trim()) { setExtras(prev => [...prev, customInput.trim()]); setCustomInput(""); resetPrompt(); } }}
                placeholder="직접 입력 후 Enter 또는 + 클릭"
                className="flex-1 min-w-0 text-[11px] border border-gray-200 rounded px-2.5 py-1 focus:outline-none focus:border-violet-400 bg-white" />
              <button type="button" onClick={() => { if (customInput.trim()) { setExtras(prev => [...prev, customInput.trim()]); setCustomInput(""); resetPrompt(); } }}
                className="flex-shrink-0 px-3 py-1 text-[11px] bg-gray-200 hover:bg-gray-300 text-gray-700 rounded font-semibold">+</button>
            </div>
            {/* 프리셋 버튼 */}
            <div className="flex flex-wrap items-center gap-1.5">
              {PROMPT_EXTRA_PRESETS.map(opt => (
                <button key={opt} type="button"
                  onClick={() => { setExtras(prev => prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt]); resetPrompt(); }}
                  className={`px-2.5 py-1 text-[11px] rounded-full border transition-colors ${
                    extras.includes(opt) ? "bg-violet-100 text-violet-700 border-violet-300 font-semibold" : "bg-white text-gray-500 border-gray-200 hover:border-violet-300 hover:text-violet-600"
                  }`}>{opt}</button>
              ))}
            </div>
            {extras.length > 0 && (
              <div className="flex gap-1 flex-wrap mt-1">
                {extras.map((opt, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-100 text-violet-700 text-[11px] rounded-full">
                    {opt}
                    <button type="button" onClick={() => { setExtras(prev => prev.filter((_, idx) => idx !== i)); resetPrompt(); }} className="text-violet-400 hover:text-violet-700 leading-none">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 촬영 구도 */}
          {!showcaseActive && (
            <ShotTypeSelector value={shotType} onChange={(v) => { setShotType(v); resetPrompt(); }} />
          )}
        </div>

        {/* Right: 프롬프트 생성 영역 */}
        <div className="flex-shrink-0 w-[450px]">
          {showPrompt && prompt ? (
            <div className="bg-[#f5f3ff] border border-[#c4b5fd] rounded-xl p-3 space-y-2 h-full">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-purple-700">
                  {isHero ? "✨ 프롬프트 (공용 1장)" : "✨ AI 이미지 프롬프트"}
                </span>
                <div className="flex gap-2">
                  <button onClick={copy}
                    className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      copied ? "bg-green-500 text-white" : "bg-purple-600 text-white hover:bg-purple-700"
                    }`}>{copied ? "복사됨 ✓" : "복사"}</button>
                  <button type="button" onClick={() => setShowPrompt(false)} className="text-[11px] text-gray-400 hover:text-gray-600 px-1">×</button>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-wrap text-[10px]">
                {isHero ? (
                  <><span className="bg-purple-100 text-purple-700 font-medium px-2 py-0.5 rounded-full">950×1280 · 3:4</span>
                  <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">📱+🖥️ 공용</span></>
                ) : (
                  <><span className="bg-purple-100 text-purple-700 font-medium px-2 py-0.5 rounded-full">{sizeLabel}</span>
                  <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">비율 {ratioLabel}</span></>
                )}
                {showcaseActive
                  ? (showcaseRefs.length > 0 && <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">참고 {showcaseRefs.length}장{showcaseMode === "hero" ? " · 대표" : ""}</span>)
                  : (refImageUrl && <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">참고 이미지</span>)}
              </div>
              {activeRefCount === 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-[10px] leading-snug text-amber-700">
                  실제 제품과 같은 착용샷이 필요하면 먼저 상품 이미지를 연결한 뒤 생성하세요. 참고 이미지 없이 만들면 색상, 주머니, 절개선이 다른 옷으로 나올 수 있습니다.
                </div>
              )}
              {activeRefCount > 0 && (
                <div className="rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-2 text-[10px] leading-snug text-orange-700">
                  ChatGPT에 참고 이미지를 먼저 업로드한 뒤 복사한 프롬프트를 붙여넣으세요. 생성 후 색상, 포켓, 절개선, 로고/부자재 위치를 실제 제품과 비교하세요.
                </div>
              )}
              {/* 참고이미지 + 생성가이드 한 라인 */}
              {(isHero || (!showcaseActive && refImageUrl) || (showcaseActive && showcaseRefs.length > 0)) && (
                <div className="flex items-start gap-1.5">
                  {/* 참고이미지 썸네일들 */}
                  {showcaseActive && showcaseRefs.length > 0 && (
                    <div className="flex gap-0.5 flex-shrink-0">
                      {showcaseRefs.slice(0, 3).map((u, i) => <img key={i} src={u} alt="" className="w-6 h-6 object-cover rounded border border-orange-200" />)}
                    </div>
                  )}
                  {!showcaseActive && refImageUrl && (
                    <img src={refImageUrl} alt="" className="w-6 h-6 object-cover rounded border border-orange-200 flex-shrink-0" />
                  )}
                  {/* 안내 텍스트 */}
                  <div className="text-[10px] leading-snug min-w-0">
                    {isHero && <p className="text-indigo-600">· 피사체 50~60% · PC 하단 10% 크롭</p>}
                    {(!showcaseActive && refImageUrl) && <p className="text-orange-600">참고 이미지 포함</p>}
                    {showcaseActive && showcaseRefs.length > 0 && (
                      <p className="text-orange-600">{showcaseMode === "hero" ? "대표 제품 1장 반영 — 일치도 ↑" : `참고 ${showcaseRefs.length}장 반영`}</p>
                    )}
                  </div>
                </div>
              )}
              <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={8}
                className="w-full text-[11px] text-purple-800 leading-relaxed bg-white/80 rounded-lg p-2 border border-purple-100 focus:outline-none focus:border-violet-400 resize-y" />
              <p className="text-[10px] text-purple-400">수정 후 복사하세요</p>
            </div>
          ) : (
            <div className="bg-gray-900 rounded-xl flex items-center justify-center" style={{ minHeight: "180px" }}>
              <p className="text-white/50 text-[12px] font-bold">프롬프트 생성 영역</p>
            </div>
          )}
        </div>
      </div>
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
  const [posView, setPosView] = useState<"pc" | "mobile">("pc");
  const [isDraggingPos, setIsDraggingPos] = useState(false);
  const imgAreaRef = useRef<HTMLDivElement>(null);
  const posPreviewRef = useRef<HTMLDivElement>(null);
  const wasDraggingRef = useRef(false);
  const posDragRef = useRef<{ startX: number; startY: number; startPx: number; startPy: number } | null>(null);

  function handleImageClick(e: React.MouseEvent<HTMLDivElement>) {
    if (wasDraggingRef.current) { wasDraggingRef.current = false; return; }
    if (!hero.image_url) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    if (posView === "mobile") {
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
    if (posView === "mobile") {
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

  // ── 이미지 위치/스케일 파싱 ──────────────────────────────────
  const pcPos = (hero.image_position ?? "50% 0%").split(" ");
  const pcPx = parseInt(pcPos[0]) || 50;
  const pcPy = parseInt(pcPos[1]) || 0;
  const mobilePos = (hero.image_position_mobile ?? "50% 50%").split(" ");
  const mobilePx = parseInt(mobilePos[0]) || 50;
  const mobilePy = parseInt(mobilePos[1]) || 50;
  const pcScale = hero.image_scale ?? 1.0;
  const mobileScale = hero.image_scale_mobile ?? 1.0;
  const currPx = posView === "pc" ? pcPx : mobilePx;
  const currPy = posView === "pc" ? pcPy : mobilePy;
  const currScale = posView === "pc" ? pcScale : mobileScale;

  function handlePosDragStart(e: React.PointerEvent<HTMLDivElement>) {
    if (!hero.image_url) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    posDragRef.current = { startX: e.clientX, startY: e.clientY, startPx: currPx, startPy: currPy };
    setIsDraggingPos(true);
  }

  function handlePosDragMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!posDragRef.current || !posPreviewRef.current) return;
    const rect = posPreviewRef.current.getBoundingClientRect();
    const dx = e.clientX - posDragRef.current.startX;
    const dy = e.clientY - posDragRef.current.startY;
    const newPx = Math.round(Math.min(100, Math.max(0, posDragRef.current.startPx - (dx / rect.width) * 100)));
    const newPy = Math.round(Math.min(100, Math.max(0, posDragRef.current.startPy - (dy / rect.height) * 100)));
    const posStr = `${newPx}% ${newPy}%`;
    if (posView === "pc") onChange({ image_position: posStr });
    else onChange({ image_position_mobile: posStr });
  }

  function handlePosDragEnd() {
    setIsDraggingPos(false);
    posDragRef.current = null;
  }

  return (
    <div className="space-y-4">
      {/* AI 이미지 프롬프트 빌더 */}
      <PromptBuilder
        isHero
        buildFn={(shotType, clothingType, season, extras, scene) =>
          buildHeroPrompt(hero.title, hero.subtitle, hero.desc, hero.hero_subtitle, shotType, clothingType, season, extras, scene, hero.image_url || undefined)
        }
        refImageUrl={hero.image_url || undefined}
      />

      {/* ── 3-column (대표이미지 | 위치·크기 | 상품태그) ── */}
      <div className="flex gap-3 items-start">

        {/* Col 1: 대표 이미지 (compact, 3:4) */}
        <div className="flex-shrink-0" style={{ width: "130px" }}>
          <ImageField
            label="대표 이미지 (모바일 · 3:4)"
            hint="모바일용: 950 × 1280px (3:4) — PC는 패널 전체를 채우도록 크롭"
            value={hero.image_url}
            onChange={(url) => { onChange({ image_url: url }); setSelectedIdx(null); }}
            compact
          />
        </div>

        {/* Col 2: 이미지 위치 / 스케일 컨트롤 */}
        {!hero.image_url && (
          <div className="flex-shrink-0 flex items-center justify-center rounded-xl border-2 border-dashed border-gray-200 text-[11px] text-gray-400" style={{ width: "200px", minHeight: "200px" }}>
            이미지를 업로드하면<br/>위치·크기 조절 가능
          </div>
        )}
        {hero.image_url && (
          <div className="flex-shrink-0 space-y-2" style={{ width: "200px" }}>
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-gray-700">이미지 위치·크기</label>
              <button type="button"
                onClick={() => {
                  if (posView === "pc") onChange({ image_position: "50% 0%", image_scale: 1.0 });
                  else onChange({ image_position_mobile: "50% 50%", image_scale_mobile: 1.0 });
                }}
                className="text-[10px] text-gray-400 hover:text-gray-600">초기화</button>
            </div>
            {/* PC / 모바일 탭 */}
            <div className="flex gap-1">
              {(["pc", "mobile"] as const).map((v) => (
                <button key={v} type="button" onClick={() => setPosView(v)}
                  className={`flex-1 text-[10px] font-semibold py-1 rounded border transition-colors ${
                    posView === v
                      ? (v === "pc" ? "bg-indigo-600 text-white border-indigo-600" : "bg-[#1A2B4A] text-white border-[#1A2B4A]")
                      : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                  }`}>
                  {v === "pc" ? "🖥️ PC" : "📱 모바일"}
                </button>
              ))}
            </div>
            {/* 드래그 미리보기 */}
            <div
              ref={posPreviewRef}
              onPointerDown={handlePosDragStart}
              onPointerMove={handlePosDragMove}
              onPointerUp={handlePosDragEnd}
              className="relative overflow-hidden rounded-lg border border-gray-200 select-none"
              style={{
                aspectRatio: posView === "pc" ? "8/9" : "3/4",
                cursor: isDraggingPos ? "grabbing" : "grab",
                touchAction: "none",
              }}
            >
              <img
                src={hero.image_url} alt=""
                draggable={false}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
                style={{
                  objectPosition: `${currPx}% ${currPy}%`,
                  ...(currScale !== 1.0 ? { transform: `scale(${currScale})`, transformOrigin: `${currPx}% ${currPy}%` } : {}),
                }}
              />
              {/* 태그 도트 오버레이 — 실시간 반영 */}
              {hero.tags.map((tag) => {
                const tx = posView === "mobile" ? tag.x : (tag.pc_x ?? tag.x);
                const ty = posView === "mobile" ? tag.y : (tag.pc_y ?? tag.y);
                return (
                  <div key={tag.id}
                    className="absolute rounded-full bg-white/80 border-2 border-orange-400 pointer-events-none"
                    style={{ width: "10px", height: "10px", left: `${tx}%`, top: `${ty}%`, transform: "translate(-50%,-50%)" }} />
                );
              })}
              <div className="absolute bottom-1 left-1 text-[7px] text-white bg-black/40 px-1 rounded pointer-events-none">드래그로 이동</div>
              <div className="absolute top-1 right-1 text-[7px] text-white bg-black/40 px-1 rounded pointer-events-none">{currPx}%·{currPy}%</div>
            </div>
            {/* 스케일 슬라이더 */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] text-gray-500">확대/축소</span>
                <span className="text-[11px] text-gray-400 font-mono">{Math.round(currScale * 100)}%</span>
              </div>
              <input type="range" min={80} max={200} step={5}
                value={Math.round(currScale * 100)}
                onChange={(e) => {
                  const scale = parseInt(e.target.value) / 100;
                  if (posView === "pc") onChange({ image_scale: scale });
                  else onChange({ image_scale_mobile: scale });
                }}
                className="w-full h-1.5 accent-[#1A2B4A] cursor-pointer" />
              <div className="flex justify-between text-[9px] text-gray-400 mt-0.5">
                <span>80%</span><span>원본</span><span>200%</span>
              </div>
            </div>
          </div>
        )}

        {/* Col 3: 상품 태그 에디터 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div>
              <label className="text-xs font-medium text-gray-700">상품 태그 ({hero.tags.length}개)</label>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {hero.image_url ? "이미지 클릭 → 태그 추가 · 드래그 → 위치 이동" : "이미지 업로드 후 클릭으로 태그 추가"}
              </p>
            </div>
            {hero.tags.length > 0 && (
              <button
                onClick={() => { onChange({ tags: [] }); setSelectedIdx(null); }}
                className="text-[11px] text-red-400 hover:text-red-600"
              >전체 삭제</button>
            )}
          </div>

          <div className="flex gap-3">
            {/* 태그 이미지 클릭 영역 */}
            <div className="flex-shrink-0" style={{ width: "200px" }}>
            <div
              ref={imgAreaRef}
              onClick={handleImageClick}
              className="relative rounded-xl overflow-hidden select-none border border-gray-200"
              style={{
                width: "200px",
                aspectRatio: posView === "mobile" ? "3 / 4" : "8 / 9",
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
                  style={posView === "pc"
                    ? { objectPosition: `${pcPx}% ${pcPy}%`, ...(pcScale !== 1.0 ? { transform: `scale(${pcScale})`, transformOrigin: `${pcPx}% ${pcPy}%` } : {}) }
                    : { objectPosition: `${mobilePx}% ${mobilePy}%`, ...(mobileScale !== 1.0 ? { transform: `scale(${mobileScale})`, transformOrigin: `${mobilePx}% ${mobilePy}%` } : {}) }
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
                const tagX = posView === "mobile" ? tag.x : (tag.pc_x ?? tag.x);
                const tagY = posView === "mobile" ? tag.y : (tag.pc_y ?? tag.y);
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
            {posView === "pc" && hero.image_url && (
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
  </div>
  );
}

// ── 서브 컴포넌트: 블록 카드 ────────────────────────────────
function BlockCard({
  block, index, total, products,
  onUpdate, onDelete, onMove, alwaysOpen,
}: {
  block: EditorialBlock;
  index: number;
  total: number;
  products: SearchProduct[];
  onUpdate: (patch: Partial<EditorialBlock>) => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
  alwaysOpen?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"hero" | "banner1" | "banner2" | "banner3" | "banner4">("hero");
  const isOpen = alwaysOpen || open;

  const TABS = [
    { key: "hero" as const,    label: "메인 기획전" },
    { key: "banner1" as const, label: "배너 1" },
    { key: "banner2" as const, label: "배너 2" },
    { key: "banner3" as const, label: "배너 3" },
    { key: "banner4" as const, label: "배너 4" },
  ];

  return (
    <div className={`border rounded-xl overflow-hidden ${isOpen ? "border-[#1A2B4A]/30 shadow-sm" : "border-gray-200"}`}>
      {/* 블록 헤더 — 아코디언 모드에서만 표시 */}
      {!alwaysOpen && (
      <div className={`flex items-center gap-3 px-5 py-4 ${isOpen ? "bg-[#f5f7ff] border-b border-[#1A2B4A]/10" : "bg-white hover:bg-gray-50"} transition-colors`}>
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
          <svg className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      )}

      {/* 편집 패널 */}
      {isOpen && (
        <div className="bg-white">
          {/* 기본 설정 바 */}
          <div className="flex items-center gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100">
            {/* 레이아웃 */}
            <div className="flex items-center gap-2 flex-shrink-0">
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
            {/* 제목 */}
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <span className="text-xs text-gray-500 flex-shrink-0">제목</span>
              <input
                type="text"
                value={block.hero.title}
                onChange={(e) => onUpdate({ hero: { ...block.hero, title: e.target.value } })}
                placeholder="UV 대책 특집"
                className="flex-1 min-w-0 text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:border-[#1A2B4A]"
              />
            </div>
            {/* 부제목 */}
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <span className="text-xs text-gray-500 flex-shrink-0">부제목</span>
              <input
                type="text"
                value={block.hero.subtitle}
                onChange={(e) => onUpdate({ hero: { ...block.hero, subtitle: e.target.value, hero_subtitle: e.target.value } })}
                placeholder="이미지 위 작은 문구"
                className="flex-1 min-w-0 text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:border-[#1A2B4A]"
              />
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
  const [activeIdx, setActiveIdx] = useState(0);
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
    setBlocks((prev) => {
      const next = prev.filter((b) => b.id !== id);
      setActiveIdx((i) => Math.min(i, Math.max(0, next.length - 1)));
      return next;
    });
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
    setBlocks((prev) => { setActiveIdx(prev.length); return [...prev, b]; });
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
        <div className="flex items-center gap-2">
          <Link
            href="/admin/main/editorial/list"
            className="px-5 py-2.5 border border-gray-300 text-gray-600 text-sm font-semibold rounded hover:bg-gray-50 transition-colors"
          >
            목록 보기
          </Link>
          <button
            onClick={save}
            disabled={saving}
            className="px-6 py-2.5 bg-[#1A2B4A] text-white text-sm font-semibold rounded hover:bg-[#243d6a] disabled:opacity-50 transition-colors"
          >
            {saving ? "저장 중..." : "전체 저장"}
          </button>
        </div>
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

      {/* 블록 탭 */}
      {blocks.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl mb-4">
          등록된 기획전 블록이 없습니다.
        </div>
      ) : (
        <>
          {/* 탭 바 */}
          <div className="flex items-stretch gap-0 border-b border-gray-200 mb-0 overflow-x-auto">
            {blocks.map((block, index) => (
              <div key={block.id} className="relative flex-shrink-0 group flex items-stretch">
                <button
                  onClick={() => setActiveIdx(index)}
                  className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeIdx === index
                      ? "text-[#1A2B4A] border-[#1A2B4A] bg-[#f5f7ff]"
                      : "text-gray-500 border-transparent hover:text-[#1A2B4A] hover:bg-gray-50"
                  }`}
                >
                  <span className="text-[10px] text-gray-400 mr-1">#{index + 1}</span>
                  {block.hero.title || "제목 없음"}
                  {/* 노출 상태 dot */}
                  <span className={`ml-1.5 inline-block w-1.5 h-1.5 rounded-full ${block.is_visible ? "bg-green-400" : "bg-gray-300"}`} />
                </button>
                {/* 탭 내 삭제 버튼 */}
                <button
                  onClick={() => deleteBlock(block.id)}
                  className="opacity-0 group-hover:opacity-100 self-center -ml-2 mr-1 w-4 h-4 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all text-[10px] flex-shrink-0"
                  title="블록 삭제"
                >×</button>
              </div>
            ))}
            {/* + 추가 버튼 */}
            <button
              onClick={addBlock}
              className="px-4 py-3 text-sm text-gray-400 hover:text-[#1A2B4A] border-b-2 border-transparent hover:border-[#1A2B4A] transition-colors flex-shrink-0 whitespace-nowrap"
            >+ 추가</button>
          </div>

          {/* 선택된 블록 에디터 */}
          {blocks[activeIdx] && (
            <BlockCard
              key={blocks[activeIdx].id}
              products={products}
              block={blocks[activeIdx]}
              index={activeIdx}
              total={blocks.length}
              onUpdate={(patch) => updateBlock(blocks[activeIdx].id, patch)}
              onDelete={() => deleteBlock(blocks[activeIdx].id)}
              onMove={(dir) => moveBlock(activeIdx, dir)}
              alwaysOpen
            />
          )}
        </>
      )}

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
