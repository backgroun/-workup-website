"use client";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Product, DetailBlock, MainExpose, Season, SizeGuide, DetailInfoItem } from "@/data/products";

// ── 상수 ──────────────────────────────────────────────────────────────────────
const STATUS_OPTIONS = ["판매중", "품절", "판매중지", "예약판매", "진열대기"] as const;
// 상세 정보 탭 기본 라벨 (필요 항목만 값 입력 → 빈 값은 노출 안 됨)
const DETAIL_INFO_DEFAULTS = [
  "제품정보", "품명 및 모델명", "소재", "색상", "사이즈", "제조국·제조지",
  "세탁방법 및 취급시 주의사항", "제조연월", "품질보증기준",
  "A/S 책임자와 전화번호 / 소비자상담관련 전화번호",
];
const SIZE_NOTE_DEFAULT = "본 사이즈는 상품의 실제 측정사이즈이며 ±1-2cm의 오차가 있을 수 있습니다. (단위:cm)";
const SIZE_GUIDE_DEFAULT: SizeGuide = {
  mode: "table",
  columns: ["항목", "S", "M", "L", "XL", "XXL"],
  rows: [],
  note: SIZE_NOTE_DEFAULT,
};
// 사이즈 가이드 행(측정 항목) 템플릿 — 클릭 시 항목 행 자동 구성 (사이즈 열은 기존 값 유지)
const SIZE_GUIDE_ROW_TEMPLATES: { label: string; firstCol: string; rows: string[] }[] = [
  { label: "티셔츠", firstCol: "항목", rows: ["총장", "어깨너비", "가슴둘레", "밑단너비", "소매길이", "전체 팔길이", "밑단둘레", "가슴너비"] },
  { label: "바지", firstCol: "항목", rows: ["허리", "힙", "밑위", "인심(다리길이)", "허벅지너비", "밑단 너비"] },
  { label: "상하세트", firstCol: "사이즈", rows: ["총장", "어깨너비", "가슴둘레", "허리둘레", "소매길이", "전체 팔길이", "인심(다리길이)", "허리", "밑단둘레"] },
];
const SEASON_OPTIONS: Season[] = ["봄/가을", "여름", "겨울"];
const FEATURE_TAG_PRESETS = ["냉감", "방수", "방풍", "스트레치", "고내구성", "UV차단", "흡한속건", "경량", "보온", "반사"];
const JOB_SITE_PRESETS = ["건설", "물류", "정비", "배달", "농업", "서비스", "캠핑"];
const MAIN_EXPOSE_OPTIONS: MainExpose[] = ["신상품", "추천상품", "베스트", "기획전"];
const DETAIL_BLOCK_TYPES = ["상품 소개", "착용 컷", "기능 설명", "현장 테스트", "사이즈표", "세탁법", "구매 안내"] as const;
const CLOTHING_SIZE_PRESETS = ["S", "M", "L", "XL", "2XL", "3XL", "4XL"];
// 직접 입력 사이즈 빠른 템플릿 (신발·단독사이즈 등) — 클릭 시 해당 사이즈 세트로 교체
const SIZE_TEMPLATES: { label: string; sizes: string[] }[] = [
  { label: "신발 (230–290)", sizes: ["230", "235", "240", "245", "250", "255", "260", "265", "270", "275", "280", "285", "290"] },
  { label: "허리인치 (28–38)", sizes: ["28", "30", "32", "34", "36", "38"] },
  { label: "ONE SIZE", sizes: ["ONE SIZE"] },
];
const COLOR_PRESETS = [
  { name: "블랙",   hex: "#1C1C1C" },
  { name: "화이트", hex: "#F0F0F0" },
  { name: "네이비", hex: "#1A2B4A" },
  { name: "그레이", hex: "#7A7A7A" },
  { name: "베이지", hex: "#C9B99A" },
  { name: "카키",   hex: "#4A5240" },
];
const DEFAULT_SIZES = ["S", "M", "L", "XL", "2XL", "3XL", "4XL"];

const PROMPT_TYPES = [
  { key: "대표반신컷", label: "대표 반신컷" },
  { key: "전신컷",    label: "전신컷" },
  { key: "측면컷",    label: "측면컷" },
  { key: "후면컷",    label: "후면컷" },
  { key: "누끼컷",    label: "누끼컷" },
  { key: "원단컷",    label: "원단컷" },
] as const;
type PromptTypeKey = typeof PROMPT_TYPES[number]["key"];

type CategoryEntry = { main: string; sub: string };

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^\w\s가-힣]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[가-힣]/g, (c) => c.charCodeAt(0).toString(16));
}

function formatPrice(raw: string): string {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("ko-KR") + "원";
}

type FormData = {
  id: string;
  sku: string;
  brand: string;
  hideBrandPrefix: boolean;
  manufacturer: string;
  origin: string;
  name: string;
  line: string;
  categories: CategoryEntry[];
  tagline: string;
  price: string;
  consumerPrice: string;
  supplyPrice: string;
  status: string;
  seasons: string[];
  promoStart: string;
  promoEnd: string;
  imageUrl: string;
  subImages: string[];
  detailBlocks: (Omit<DetailBlock, "id"> & { id: string })[];
  features: string;
  featureTags: string[];
  customFeatureTag: string;
  jobSites: string[];
  customJobSite: string;
  mainExpose: string[];
  sizes: string[];
  sizePrices: { size: string; price: string }[];
  sizeGuide: SizeGuide;
  detailInfo: DetailInfoItem[];
  customSizeInput: string;
  colorName: string;
  colorHex: string;
  colors: { name: string; hex: string }[];
  relatedIds: string[];
  metaTitle: string;
  metaDesc: string;
  fieldTest: string;
  isNew: boolean;
};

function toForm(p?: Product): FormData {
  // 기존 단일 카테고리 or 신규 다중 카테고리 모두 지원
  const rawCats = (p as Record<string, unknown> | undefined)?.categories as CategoryEntry[] | undefined;
  const categories: CategoryEntry[] = rawCats?.length
    ? rawCats
    : p?.category
      ? [{ main: p.category as string, sub: (p.subCategory ?? "") as string }]
      : [{ main: "현장", sub: "상의" }];

  return {
    id: p?.id ?? "",
    sku: p?.sku ?? "",
    brand: p?.brand ?? "",
    hideBrandPrefix: p?.hideBrandPrefix ?? false,
    manufacturer: p?.manufacturer ?? "",
    origin: p?.origin ?? "",
    name: p?.name ?? "",
    line: p?.line ?? "SITE",
    categories,
    tagline: p?.tagline ?? "",
    price: p?.price ?? "",
    consumerPrice: p?.consumerPrice ?? "",
    supplyPrice: p?.supplyPrice ?? "",
    status: p?.status ?? "판매중",
    seasons: p?.seasons ?? [],
    promoStart: p?.promoStart ?? "",
    promoEnd: p?.promoEnd ?? "",
    imageUrl: p?.imageUrl ?? "",
    subImages: p?.subImages ?? [],
    detailBlocks: p?.detailBlocks ?? [],
    features: (p?.features ?? []).join("\n"),
    featureTags: p?.featureTags ?? [],
    customFeatureTag: "",
    jobSites: p?.jobSites ?? [],
    customJobSite: "",
    mainExpose: p?.mainExpose ?? (p?.isNew ? ["신상품"] : []),
    sizes: (p?.sizes ?? DEFAULT_SIZES),
    sizePrices: (p?.sizePrices ?? []).map((sp) => ({ size: sp.size, price: sp.price })),
    sizeGuide: p?.sizeGuide ?? { ...SIZE_GUIDE_DEFAULT },
    detailInfo: p?.detailInfo ?? [],
    customSizeInput: "",
    colorName: "",
    colorHex: "#1A2B4A",
    colors: p?.colors ?? [],
    relatedIds: p?.relatedIds ?? [],
    metaTitle: p?.metaTitle ?? "",
    metaDesc: p?.metaDesc ?? "",
    fieldTest: p?.fieldTest ?? "",
    isNew: p?.isNew ?? false,
  };
}

// ─── UI 헬퍼 ──────────────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-bold text-[#1A2B4A] uppercase tracking-widest border-b border-gray-100 pb-3 mb-5">
      {children}
    </h2>
  );
}

function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

const INPUT_CLS = "w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1A2B4A] rounded";
const SELECT_CLS = `${INPUT_CLS} bg-white`;

function SaveBar({ saving, isEdit, onCancel, status, onStatusChange }: {
  saving: boolean; isEdit?: boolean; onCancel: () => void;
  status: string; onStatusChange: (s: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <select value={status} onChange={(e) => onStatusChange(e.target.value)}
        title="판매 상태"
        className="border border-gray-200 px-3 py-2.5 text-sm bg-white rounded focus:outline-none focus:border-[#1A2B4A]">
        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <button type="submit" disabled={saving}
        className="px-8 py-2.5 bg-[#ff550c] text-white text-sm font-semibold hover:bg-[#e04500] transition-colors disabled:opacity-50 rounded">
        {saving ? "저장 중..." : isEdit ? "수정 완료" : "제품 추가"}
      </button>
      <button type="button" onClick={onCancel}
        className="px-8 py-2.5 border border-gray-200 text-gray-600 text-sm hover:border-gray-400 transition-colors rounded">
        취소
      </button>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
export default function ProductForm({ initial, isEdit }: { initial?: Product; isEdit?: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(toForm(initial));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 이미지 업로드 상태
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingSubIdx, setUploadingSubIdx] = useState<number | null>(null);
  const [uploadingBlockIdx, setUploadingBlockIdx] = useState<number | null>(null);
  const [uploadingSizeGuide, setUploadingSizeGuide] = useState(false);
  const [ocrBusy, setOcrBusy] = useState(false);   // 사이즈표 무료 OCR 진행 상태
  const [ocrProgress, setOcrProgress] = useState(0);
  const [bulkColInput, setBulkColInput] = useState("");  // 사이즈 가이드 열 일괄 추가 입력
  const [uploadingMulti, setUploadingMulti] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const mainInputRef = useRef<HTMLInputElement>(null);
  const subInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const blockImgRefs = useRef<(HTMLInputElement | null)[]>([]);
  const multiSubInputRef = useRef<HTMLInputElement>(null);

  // 추가 이미지 드래그 순서 변경
  const [dragSubIdx, setDragSubIdx] = useState<number | null>(null);
  const [dragOverSubIdx, setDragOverSubIdx] = useState<number | null>(null);

  // 동적 카테고리
  type CatItem = { name: string; subs: string[] };
  const DEFAULT_CAT_LIST: CatItem[] = [
    { name: "현장", subs: ["상의", "하의", "계절·기능", "안전용품"] },
    { name: "여성", subs: ["여성 상의", "여성 하의", "여성 아우터"] },
    { name: "소품", subs: ["가방", "모자", "장갑", "양말", "벨트", "기타"] },
    { name: "남성", subs: ["남성 상의", "남성 하의", "남성 아우터", "신발"] },
    { name: "공용", subs: ["공용 상의", "공용 하의", "공용 아우터"] },
    { name: "일상", subs: ["데일리웨어", "아우터", "팬츠"] },
  ];
  const [catList, setCatList] = useState<CatItem[]>(DEFAULT_CAT_LIST);
  const dynMainCats = catList.map((c) => c.name);
  const dynSubCats = (main: string) => catList.find((c) => c.name === main)?.subs ?? [];

  // 카테고리 피커 UI 상태
  const [pickerMain, setPickerMain] = useState<string>(DEFAULT_CAT_LIST[0].name);
  const [pickerSub, setPickerSub] = useState<string>("");

  // AI 이미지 프롬프트
  const [aiPrompt, setAiPrompt] = useState("");
  const [showAiPrompt, setShowAiPrompt] = useState(false);
  const [promptPanelOpen, setPromptPanelOpen] = useState(false); // AI 이미지 생성 프롬프트 — 기본 접힘
  const [promptCopied, setPromptCopied] = useState(false);
  const [promptType, setPromptType] = useState<PromptTypeKey>("대표반신컷");
  const [promptClothingType, setPromptClothingType] = useState<"작업복" | "일상복">("작업복");
  const [promptSeason, setPromptSeason] = useState<string>("");
  const [promptModelAge, setPromptModelAge] = useState<string>("");
  const [promptWornFocus, setPromptWornFocus] = useState<string>("기본");
  const [promptExtras, setPromptExtras] = useState<string[]>([]);
  const [promptCustomInput, setPromptCustomInput] = useState<string>("");

  // 외부 데이터
  const [brands, setBrands] = useState<string[]>([]);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [allProducts, setAllProducts] = useState<{ id: string; name: string; category: string; imageUrl?: string }[]>([]);
  const [relatedCatFilter, setRelatedCatFilter] = useState("");
  const [relatedSearch, setRelatedSearch] = useState("");
  const [relatedModalOpen, setRelatedModalOpen] = useState(false);
  const [blockMenuOpen, setBlockMenuOpen] = useState(false); // 상세설명 "블록 추가" 드롭다운
  const [uploadingBlocksMulti, setUploadingBlocksMulti] = useState(false); // 상세설명 여러 장 업로드
  const [dragBlockIdx, setDragBlockIdx] = useState<number | null>(null);
  const [dragOverBlockIdx, setDragOverBlockIdx] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/admin/site-settings/categories")
      .then((r) => r.ok ? r.json() : null)
      .then((data: unknown) => {
        if (data && Array.isArray((data as { categories?: unknown }).categories)) {
          const cats = (data as { categories: CatItem[] }).categories;
          setCatList(cats);
          if (cats.length > 0) setPickerMain(cats[0].name);
        }
      })
      .catch(() => {});

    fetch("/api/admin/brands")
      .then((r) => r.ok ? r.json() : [])
      .then((data: unknown) => {
        if (Array.isArray(data)) setBrands(data.map((b: { name: string }) => b.name));
      })
      .catch(() => {});

    fetch("/api/admin/manufacturers")
      .then((r) => r.ok ? r.json() : [])
      .then((data: unknown) => {
        if (Array.isArray(data)) setManufacturers(data.map((m: { name: string }) => m.name));
      })
      .catch(() => {});

    fetch("/api/admin/products")
      .then((r) => r.ok ? r.json() : [])
      .then((data: unknown) => {
        if (Array.isArray(data)) {
          setAllProducts(
            (data as { id: string; name: string; category: string; imageUrl?: string }[]).map((p) => ({
              id: p.id, name: p.name, category: p.category, imageUrl: p.imageUrl,
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  // SEO 자동 입력
  useEffect(() => {
    setForm((prev) => {
      if (prev.name && !prev.metaTitle) return { ...prev, metaTitle: `${prev.name} | WORKUP 작업복` };
      return prev;
    });
  }, [form.name]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setForm((prev) => {
      if (prev.tagline && !prev.metaDesc) {
        const featList = prev.features.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 2);
        return { ...prev, metaDesc: featList.length > 0 ? `${prev.tagline} ${featList.join(", ")}.` : prev.tagline };
      }
      return prev;
    });
  }, [form.tagline]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (key: keyof FormData, val: unknown) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const autoGenSeo = () => {
    const featList = form.features.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 2);
    set("metaTitle", form.name ? `${form.name} | WORKUP 작업복` : "");
    set("metaDesc", featList.length > 0 ? `${form.tagline} ${featList.join(", ")}.` : form.tagline);
  };

  // ── AI 이미지 프롬프트 생성 ────────────────────────────────────────────────
  const generateAIPrompt = () => {
    const name     = form.name    || "[제품명]";
    const tagline  = form.tagline || "";
    const features = form.features.split("\n").map((s) => s.trim()).filter(Boolean);
    const catLabel = form.categories[0]
      ? `${form.categories[0].main} / ${form.categories[0].sub}`
      : promptClothingType;

    // 하의(바지)인지 자동 감지 — 대표반신컷을 하반신 중심으로 전환하기 위함
    const catSub = form.categories[0]?.sub ?? "";
    const isBottom = /하의|팬츠|바지|슬랙스|쇼츠|반바지|조거/.test(`${catSub} ${name}`);

    const clothingEng = promptClothingType === "일상복"
      ? "Korean casual everyday wear"
      : "Korean functional workwear";

    const SEASON_ENG: Record<string, string> = {
      "봄":   "spring transitional weather — light layering, mild-temperature styling",
      "여름": "midsummer heat — lightweight, breathable, sweat-wicking styling",
      "가을": "autumn transitional weather — light layering, mild-temperature styling",
      "겨울": "deep winter cold — warm, insulated, wind-resistant layered styling",
      "전천후": "all-season, year-round versatility",
    };
    const seasonContext = promptSeason ? SEASON_ENG[promptSeason] : "";

    // 추가 옵션 → 영문 매핑 (성별·인종 / 무드 분리)
    const DESCRIPTOR: Record<string, string> = {
      "남성": "male", "여성": "female",
      "한국인": "Korean", "서양인": "Western",
    };
    const MOOD: Record<string, string> = {
      "캐주얼": "relaxed, approachable casual mood",
      "프로페셔널": "confident, professional working mood",
    };
    const descriptors = promptExtras.filter((e) => e in DESCRIPTOR).map((e) => DESCRIPTOR[e]);
    const moods       = promptExtras.filter((e) => e in MOOD).map((e) => MOOD[e]);
    const customExtras = promptExtras.filter((e) => !(e in DESCRIPTOR) && !(e in MOOD));
    const ageEng      = promptModelAge ? `in their ${promptModelAge.replace("대", "")}s` : "";

    const needsModel = !["누끼컷", "원단컷"].includes(promptType);

    const modelSubject = (descriptors.length || ageEng)
      ? [descriptors.join(" "), "model", ageEng].filter(Boolean).join(" ").replace(/\s+/g, " ").trim()
      : "natural, authentic real-worker-type model";
    const moodLine = [...moods, ...customExtras].join(", ");

    // ── 배경 (썸네일 통일 — 항상 #EDEDED 단색) ──
    const background =
      "STRICT plain solid #EDEDED light-gray seamless studio backdrop ONLY. The ENTIRE background must be one flat #EDEDED color — absolutely NO scenery, NO environment, NO location, NO real-world setting, NO props, NO furniture, NO gradients, NO patterns, NO texture, NO cast shadows on the backdrop. This is a strict e-commerce thumbnail rule — the background color must stay identical across every product.";

    // ── 샷별 구도 · 카메라/렌즈 · 라이팅 ──
    const SHOT: Record<PromptTypeKey, { compose: string; camera: string; light: string; kor: string }> = {
      "대표반신컷": {
        compose:
          "Half-body representative crop — waist-up for tops, mid-thigh-up for bottoms. " +
          "FIXED, REPEATABLE SCALE — frame the model identically every single time: the shoulders span ~48–56% of the image width, and the body is cropped at the hip / upper-thigh line. The subject must FILL the frame at this exact scale — do NOT zoom out, do NOT render the model small or distant, do NOT leave wide empty margins. " +
          "Natural front-facing or slight 3/4 diagonal pose. Do NOT use for full sets or dresses.",
        camera: "Full-frame mirrorless, 85mm f/5.6 portrait lens, eye-level — tack-sharp on the garment fabric",
        light:  "Large octabox key light at 45°, white fill card opposite, subtle rim light for clean subject separation — even, true-to-color commercial lighting",
        kor: "대표 반신컷 — 상의=상체/하의=하체 중심 · [고정] 어깨너비 화면 48~56%·엉덩이선 크롭(매번 같은 크기로 프레임 채움, 작게 금지) · 85mm 인물렌즈 · 45° 옥타박스 키라이트",
      },
      "전신컷": {
        compose:
          "Full body, head-to-toe, every part visible. Subject height occupies ~75–82% of the 930px vertical frame, vertically centered. " +
          "Comfortable breathing room above the head and below the feet (do not crop tight to the top), balanced left-right margins.",
        camera: "Full-frame mirrorless, 50mm f/8 from slightly below eye-level to elongate the silhouette, sharp front-to-back",
        light:  "Two tall softboxes for even head-to-toe illumination, soft fill, gentle floor falloff",
        kor: "전신컷 — 머리~발끝 전체 · 세로 75~82% · 50mm · 상하 여백 여유 · 좌우 균형",
      },
      "측면컷": {
        compose:
          "Exact 90° side profile. Clearly reveals the side silhouette, side seams and lateral lines. Arms and legs relaxed, no product detail hidden.",
        camera: "Full-frame mirrorless, 85mm f/5.6, perfectly perpendicular side angle",
        light:  "Key light from the front-side to model the silhouette and side seams, soft fill to retain shadow detail",
        kor: "측면컷 — 정확한 90° 측면 · 옆라인/사이드심 강조 · 85mm",
      },
      "후면컷": {
        compose:
          "Direct rear view, back panel squarely facing camera, full rear visible. Back design and fit clearly shown. " +
          "Hair tied up or swept aside — never covering the back. No detail obscured by pose.",
        camera: "Full-frame mirrorless, 85mm f/5.6, centered on the back panel",
        light:  "Even back-panel illumination, soft fill, subtle rim light for shoulder-edge separation",
        kor: "후면컷 — 등이 카메라 정면 · 뒷면 디자인/핏 강조 · 머리·포즈로 가리지 않음",
      },
      "누끼컷": {
        compose:
          "Product only — NO model, NO visible mannequin. Invisible/ghost-mannequin look for garments so the 3D shape and fit read naturally. " +
          "Centered, front-facing with a slight angle, full product with even comfortable margins.",
        camera: "100mm product lens, f/11, tethered studio capture, dead-centered",
        light:  "Two-softbox even cross-lighting, soft and near-shadowless, true product color — e-commerce listing standard",
        kor: "누끼컷 — 모델 없음 · 고스트(투명)마네킹 · 정면 중앙 · 100mm f/11 · 균일 무그림자 라이팅",
      },
      "원단컷": {
        compose:
          "Extreme macro close-up of the fabric surface — NO model, NO mannequin. Emphasize weave structure, texture and tactile surface relief. " +
          "Show stitching, seam finishing and construction crisply. Never alter true material color or texture.",
        camera: "100mm macro lens, f/8, focus-stacked for edge-to-edge sharpness",
        light:  "Low raking side light grazing the surface to reveal weave relief, thread dimensionality and stitch detail",
        kor: "원단컷 — 모델 없음 · 매크로 클로즈업 · 조직감/봉제 디테일 · 100mm 매크로 · 측면 그레이징 라이트",
      },
    };
    const shot = SHOT[promptType];

    // ── 착용 부위 (장갑·모자·안전용품 등 — 착용컷이 해당 신체 부위에 집중) ──
    const WORN_FOCUS: Record<string, { eng: string; head: boolean; kor: string }> = {
      "손·장갑": {
        eng: "Tight close-up of both hands and forearms WEARING the gloves — hands naturally posed (relaxed, or lightly gripping a tool / handle). The gloves fill ~60–70% of the frame; every finger, seam, grip pad and cuff fully visible; anatomically correct hands.",
        head: false,
        kor: "착용 부위: 손·장갑 — 양손/팔뚝 클로즈업 · 장갑 화면 60~70% · 손가락 정확",
      },
      "머리·모자": {
        eng: "Head-and-shoulders portrait WEARING the cap / hat — face clearly visible, the hat correctly fitted on the head, slight front-3/4 angle. Hat and upper face fill the frame.",
        head: true,
        kor: "착용 부위: 머리·모자 — 얼굴+어깨 포트레이트 · 모자가 머리에 명확",
      },
      "발·신발/양말": {
        eng: "Lower legs and feet WEARING the shoes / socks — calf-down crop, feet planted naturally. The footwear is the clear focal point, filling ~50–60% of the frame.",
        head: false,
        kor: "착용 부위: 발·신발/양말 — 종아리~발 크롭 · 신발/양말이 초점",
      },
      "허리·벨트": {
        eng: "Waist and hip area WEARING the belt — mid-torso crop (lower chest to upper thigh). The belt and buckle at the waistline are the clear, sharp focal point.",
        head: false,
        kor: "착용 부위: 허리·벨트 — 허리/골반 크롭 · 벨트 버클이 초점",
      },
      "상체·조끼/가방": {
        eng: "Upper body WEARING the safety vest / CARRYING the bag — half-body crop. The vest or bag is the clear hero on the torso / shoulder, worn naturally.",
        head: true,
        kor: "착용 부위: 상체·조끼/가방 — 반신 크롭 · 조끼/가방이 초점",
      },
      "얼굴·고글/마스크": {
        eng: "Face WEARING the protective goggles / mask / eyewear — head-and-shoulders, the protective gear correctly worn on the face, sharp focus on the gear.",
        head: true,
        kor: "착용 부위: 얼굴·고글/마스크 — 얼굴+어깨 · 보호장비가 얼굴에 명확",
      },
    };
    const ANGLE_NOTE: Record<PromptTypeKey, string> = {
      "대표반신컷": "front-facing or slight 3/4 angle",
      "전신컷": "front-facing, slightly wider view",
      "측면컷": "exact 90° side-profile angle",
      "후면컷": "rear / from-behind angle",
      "누끼컷": "", "원단컷": "",
    };
    const wornFocus = needsModel ? WORN_FOCUS[promptWornFocus] : undefined;
    const accessoryMode = !!wornFocus;
    // 하의 + 대표반신컷 → 상반신이 아니라 하반신(다리·바지) 중심으로 전환
    const bottomHalfBody = !wornFocus && isBottom && promptType === "대표반신컷";
    const headInFrame = wornFocus ? wornFocus.head : !bottomHalfBody;
    const composeText = wornFocus
      ? `${wornFocus.eng} Shown from a ${ANGLE_NOTE[promptType]}. The worn item is the hero of the shot — fill the frame with it, never render it small or distant.`
      : bottomHalfBody
      ? "Lower-body representative crop for PANTS / BOTTOMS — frame from the waist / hip DOWN to mid-calf, with the trousers filling ~60–70% of the frame as the clear hero. The pants and legs are the subject, NOT the upper body — crop above the waist so the torso and head stay out of frame. FIXED, REPEATABLE SCALE every time: pants fill the frame, do not zoom out, do not switch to an upper-body / torso shot. Natural standing pose with a slight stance to show the leg line and taper."
      : shot.compose;
    const cameraText = wornFocus
      ? "Full-frame mirrorless, 90mm at close focusing distance, f/5.6 — tack-sharp on the worn item with gentle background falloff"
      : bottomHalfBody
      ? "Full-frame mirrorless, 85mm f/5.6, framed low on the lower body — tack-sharp on the trouser fabric, seams and taper"
      : shot.camera;

    // ── 모델·스타일링 블록 (착용컷 전용) ──
    const MODEL_BLOCK = needsModel
      ? `\n\n[MODEL & STYLING]\n` +
        `- ${modelSubject}\n` +
        (moodLine ? `- Mood / styling: ${moodLine}\n` : "") +
        `- Natural commercial fashion-editorial style — believable, never runway-exaggerated\n` +
        `- Anatomically correct proportions; natural finger positions, realistic joint angles (wrists/elbows/knees/ankles never warped)\n` +
        `- Relaxed stance, weight on one leg, loose shoulders, subtle authentic expression / gentle natural smile\n` +
        `- Natural gaze, appears unaware of the camera\n` +
        `- Realistic fine skin texture — no over-retouching, no plastic skin, no unrealistic proportions\n` +
        `- Hands fully visible and anatomically correct`
      : (customExtras.length ? `\n\n[ADDITIONAL NOTES]\n- ${customExtras.join(", ")}` : "");

    // ── 헤드룸 / 여백 (착용컷 전용 · 머리가 화면에 있을 때만 — 썸네일에서 답답하지 않게) ──
    const HEADROOM_BLOCK = (needsModel && headInFrame)
      ? `\n[FRAMING & HEADROOM — identical scale every time]\n` +
        `- Small, consistent headroom: the top of the head sits ~8–12% down from the top edge — never touching the top, but do NOT add excessive empty space\n` +
        `- The model must FILL the frame at the SAME size every time — centered, with only modest, even side margins\n` +
        `- Do NOT zoom out, do NOT render the subject small, distant, or surrounded by large empty areas — consistency of subject scale is critical\n`
      : "";

    // ── 긍정 프롬프트 ──
    const POSITIVE =
      `[GENERATION DIRECTIVE]\n` +
      `Generate ONE single photorealistic image only. No collage, grid, card-news, or multi-panel composition.` +
      ` The background MUST be a plain solid #EDEDED studio backdrop — NEVER a real-world scene, room, or outdoor/worksite environment.` +
      `\n\n` +
      `[SUBJECT]\n` +
      `- ${clothingEng}: "${name}" (${catLabel})` + (tagline ? ` — "${tagline}"` : "") + `\n` +
      (features.length > 0 ? `- Signature features to preserve: ${features.slice(0, 4).join(", ")}\n` : "") +
      (seasonContext ? `- Season styling: ${seasonContext}\n` : "") +
      `\n[COMPOSITION — ${promptType}${accessoryMode ? " · " + promptWornFocus : bottomHalfBody ? " · 하의" : ""}]\n- ${composeText}\n` +
      HEADROOM_BLOCK +
      `\n[CAMERA & LENS]\n- ${cameraText}\n` +
      `\n[LIGHTING]\n- ${shot.light}` +
      MODEL_BLOCK +
      `\n\n[BACKGROUND]\n- ${background}\n` +
      `\n[COLOR & FIDELITY]\n` +
      `- Neutral 5500K white balance, color-accurate and true-to-life — no color cast, no over-saturation\n` +
      `- Preserve the EXACT product colors, logos, prints, embroidery, stitching and construction — zero shape distortion\n` +
      `\n[OUTPUT]\n` +
      `- 1:1 aspect ratio, 960 × 930 px, high-resolution photorealistic commercial apparel photography, tack-sharp product detail`;

    // ── 네거티브 프롬프트 (샷 유형별 분기) ──
    const NEG_COMMON =
      "text, typography, captions, watermark, signature, brand logo overlay, " +
      "collage, grid, split-screen, multi-panel, card-news layout, border, frame, " +
      "distorted product shape, warped proportions, wrong colors, color cast, oversaturated, " +
      "blurry, low-resolution, jpeg artifacts, noise, cropped product";
    const NEG_MODEL_ANATOMY =
      ", deformed hands, extra fingers, missing fingers, fused fingers, extra limbs, " +
      "mutated anatomy, unnatural joints, twisted wrists, plastic skin, waxy skin, over-retouched, uncanny face";
    const NEG_MODEL_FRAMING = bottomHalfBody
      ? ", upper-body-focused, torso-dominant, shoulders-focused, jacket or top as main subject, pants cropped out, pants too small, legs cut off at thigh, face close-up, head close-up"
      : ", head touching top edge, cropped head, cut-off head, cramped framing, no headroom, subject too large, oversized subject, zoomed-in too tight, " +
        "subject too small, distant subject, zoomed out, wide shot, tiny figure, excessive empty space, inconsistent scale, full body when half-body requested";
    const NEG_PRODUCT =
      ", visible mannequin, mannequin seams, visible hanger, floating fabric, human model, body parts, hands";
    // 배경 통일(#EDEDED) 강제 — 환경/배경 요소 차단
    const NEG_BACKGROUND =
      ", background scenery, environment, on-location background, outdoor scene, indoor scene, room, worksite background, " +
      "construction site, factory, warehouse, street, nature, wall, props, furniture, plants, " +
      "bokeh background, depth-of-field background, blurred background, gradient background, textured background, shadows cast on the backdrop";
    const NEGATIVE =
      `\n\n[NEGATIVE PROMPT]\n` + NEG_COMMON + (needsModel ? NEG_MODEL_ANATOMY + NEG_MODEL_FRAMING : NEG_PRODUCT) + NEG_BACKGROUND;

    // ── Midjourney 파라미터 (참고) ──
    const MJ_PARAMS =
      `\n\n[MIDJOURNEY PARAMS · 참고] --ar 1:1 --style raw --q 2 --v 6.1` +
      (needsModel ? "" : " --no people");

    // ── 한글 참고 ──
    const korRef =
      `\n\n── 한글 참고 (위 영문 프롬프트를 AI 도구에 입력) ──\n` +
      `제품명: ${name}\n` +
      (tagline ? `한줄 소개: ${tagline}\n` : "") +
      (features.length > 0 ? `주요 특징: ${features.slice(0, 4).join(" / ")}\n` : "") +
      `카테고리: ${catLabel} · 의류유형: ${promptClothingType}` +
      (promptSeason ? ` · 시즌: ${promptSeason}` : "") +
      (needsModel && promptModelAge ? ` · 모델: ${promptModelAge}` : "") + `\n` +
      (promptExtras.length > 0 ? `추가 옵션: ${promptExtras.join(", ")}\n` : "") +
      `배경: #EDEDED 단색 스튜디오 · 비율 1:1 · 960×930px\n` +
      (wornFocus ? wornFocus.kor : bottomHalfBody ? "대표 반신컷(하의) — 허리~종아리 하반신 중심 · 바지가 화면 60~70% · 상체·머리는 프레임 밖 · 85mm" : shot.kor);

    setAiPrompt(POSITIVE + NEGATIVE + MJ_PARAMS + korRef);
    setShowAiPrompt(true);
    setPromptCopied(false);
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(aiPrompt);
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  // ── 카테고리 다중 선택 ─────────────────────────────────────────────────────
  const addCategory = () => {
    if (!pickerMain || !pickerSub) return;
    const alreadyExists = form.categories.some((c) => c.main === pickerMain && c.sub === pickerSub);
    if (!alreadyExists) {
      set("categories", [...form.categories, { main: pickerMain, sub: pickerSub }]);
    }
    setPickerSub("");
  };

  const removeCategory = (idx: number) => {
    set("categories", form.categories.filter((_, i) => i !== idx));
  };

  // ── 이미지 업로드 ──────────────────────────────────────────────────────────
  const uploadFile = async (file: File): Promise<string | null> => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok) return data.url as string;
    setUploadError(data.error ?? "업로드 실패");
    return null;
  };

  const handleMainFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadError(""); setUploadingMain(true);
    const url = await uploadFile(file);
    setUploadingMain(false);
    if (url) set("imageUrl", url);
    if (mainInputRef.current) mainInputRef.current.value = "";
  };

  const handleSubFile = async (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadError(""); setUploadingSubIdx(idx);
    const url = await uploadFile(file);
    setUploadingSubIdx(null);
    if (url) { const next = [...form.subImages]; next[idx] = url; set("subImages", next); }
    if (subInputRefs.current[idx]) subInputRefs.current[idx]!.value = "";
  };

  const removeSubImage = (idx: number) => {
    const next = [...form.subImages]; next.splice(idx, 1); set("subImages", next);
  };

  // 여러 장 한번에 업로드
  const handleMultiSubFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadError(""); setUploadingMulti(true);
    const filled = form.subImages.filter(Boolean);
    const slots = Math.max(0, 9 - filled.length);
    const toUpload = files.slice(0, slots);
    const urls: string[] = [];
    for (const file of toUpload) {
      const url = await uploadFile(file);
      if (url) urls.push(url);
    }
    set("subImages", [...filled, ...urls]);
    setUploadingMulti(false);
    if (multiSubInputRef.current) multiSubInputRef.current.value = "";
  };

  // 드래그로 순서 변경
  const handleDragStart = (idx: number) => setDragSubIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragSubIdx !== null && dragSubIdx !== idx) setDragOverSubIdx(idx);
  };
  const handleDrop = (e: React.DragEvent, toIdx: number) => {
    e.preventDefault();
    if (dragSubIdx === null || dragSubIdx === toIdx) {
      setDragSubIdx(null); setDragOverSubIdx(null); return;
    }
    const next = [...form.subImages];
    while (next.length <= Math.max(dragSubIdx, toIdx)) next.push("");
    const temp = next[dragSubIdx];
    next[dragSubIdx] = next[toIdx] ?? "";
    next[toIdx] = temp;
    // 뒷 빈슬롯 정리
    while (next.length > 0 && !next[next.length - 1]) next.pop();
    set("subImages", next);
    setDragSubIdx(null); setDragOverSubIdx(null);
  };
  const handleDragEnd = () => { setDragSubIdx(null); setDragOverSubIdx(null); };

  // ── 상세 설명 블록 ──────────────────────────────────────────────────────────
  const addBlock = (type: (typeof DETAIL_BLOCK_TYPES)[number] = "상품 소개") => {
    set("detailBlocks", [
      ...form.detailBlocks,
      { id: `block-${Date.now()}`, type, content: "", imageUrl: "" },
    ]);
  };

  // 착용컷 — 등록된 썸네일(대표·추가 이미지)을 착용컷 블록으로 일괄 추가 (중복 제외)
  const addWornCutsFromThumbnails = () => {
    const existing = new Set(form.detailBlocks.map((b) => b.imageUrl).filter(Boolean));
    const imgs = Array.from(new Set([form.imageUrl, ...form.subImages].filter(Boolean)))
      .filter((u) => !existing.has(u));
    if (imgs.length === 0) {
      alert("추가할 썸네일이 없습니다. 제품 이미지(대표·추가 이미지)를 먼저 등록하거나, 이미 모두 추가된 상태입니다.");
      return;
    }
    const blocks = imgs.map((url, i) => ({
      id: `block-${Date.now()}-${i}`, type: "착용 컷" as const, content: "", imageUrl: url,
    }));
    set("detailBlocks", [...form.detailBlocks, ...blocks]);
  };

  const updateBlock = (idx: number, key: string, val: string) => {
    const next = form.detailBlocks.map((b, i) => i === idx ? { ...b, [key]: val } : b);
    set("detailBlocks", next);
  };

  const removeBlock = (idx: number) => {
    set("detailBlocks", form.detailBlocks.filter((_, i) => i !== idx));
  };

  const moveBlock = (idx: number, dir: -1 | 1) => {
    const next = [...form.detailBlocks];
    const to = idx + dir;
    if (to < 0 || to >= next.length) return;
    [next[idx], next[to]] = [next[to], next[idx]];
    set("detailBlocks", next);
  };

  const handleBlockImgFile = async (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadError(""); setUploadingBlockIdx(idx);
    const url = await uploadFile(file);
    setUploadingBlockIdx(null);
    if (url) updateBlock(idx, "imageUrl", url);
    if (blockImgRefs.current[idx]) blockImgRefs.current[idx]!.value = "";
  };

  // 상세설명 — 여러 장 한 번에 업로드 → 각 이미지가 블록으로 추가 (이미지 중심 에디터)
  const handleBlocksMultiUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    setUploadError(""); setUploadingBlocksMulti(true);
    const urls: string[] = [];
    for (const file of files) { const url = await uploadFile(file); if (url) urls.push(url); }
    const blocks = urls.map((url, i) => ({ id: `block-${Date.now()}-${i}`, type: "상품 소개" as const, content: "", imageUrl: url }));
    if (blocks.length) set("detailBlocks", [...form.detailBlocks, ...blocks]);
    setUploadingBlocksMulti(false);
  };

  // 블록 드래그 순서 변경 (드래그 핸들 ⠿ 사용 → 입력칸 편집 방해 없음)
  const onBlockDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragBlockIdx !== null && dragBlockIdx !== idx) setDragOverBlockIdx(idx);
  };
  const onBlockDrop = (e: React.DragEvent, toIdx: number) => {
    e.preventDefault();
    if (dragBlockIdx === null || dragBlockIdx === toIdx) { setDragBlockIdx(null); setDragOverBlockIdx(null); return; }
    const next = [...form.detailBlocks];
    const [moved] = next.splice(dragBlockIdx, 1);
    next.splice(toIdx, 0, moved);
    set("detailBlocks", next);
    setDragBlockIdx(null); setDragOverBlockIdx(null);
  };
  const onBlockDragEnd = () => { setDragBlockIdx(null); setDragOverBlockIdx(null); };

  // ── 태그 토글 ──────────────────────────────────────────────────────────────
  const toggleArr = (key: "featureTags" | "jobSites" | "mainExpose" | "seasons" | "sizes", val: string) => {
    const arr = form[key] as string[];
    set(key, arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  };

  const addCustomTag = (key: "featureTags" | "jobSites", inputKey: "customFeatureTag" | "customJobSite") => {
    const val = (form[inputKey] as string).trim();
    if (!val) return;
    const arr = form[key] as string[];
    if (!arr.includes(val)) set(key, [...arr, val]);
    set(inputKey, "");
  };

  // ── 커스텀 사이즈 ─────────────────────────────────────────────────────────
  const customSizes = form.sizes.filter((s) => !CLOTHING_SIZE_PRESETS.includes(s));

  const addCustomSize = () => {
    const val = form.customSizeInput.trim();
    if (!val || form.sizes.includes(val)) { set("customSizeInput", ""); return; }
    set("sizes", [...form.sizes, val]);
    set("customSizeInput", "");
  };

  // ── 사이즈별 가격 ──────────────────────────────────────────────────────────
  const sizePriceOf = (size: string) => form.sizePrices.find((sp) => sp.size === size)?.price ?? "";
  const setSizePrice = (size: string, price: string) => {
    const others = form.sizePrices.filter((sp) => sp.size !== size);
    set("sizePrices", price.trim() ? [...others, { size, price: price.trim() }] : others);
  };

  // ── 사이즈 가이드 (이미지 / 행·열 표) ──────────────────────────────────────
  const sg = form.sizeGuide;
  const setSG = (patch: Partial<SizeGuide>) => set("sizeGuide", { ...sg, ...patch });
  const sgCols = sg.columns ?? [];
  const sgRows = sg.rows ?? [];
  const sgAddColumn = () => setSG({ columns: [...sgCols, ""], rows: sgRows.map((r) => ({ cells: [...r.cells, ""] })) });
  const sgRemoveColumn = (ci: number) => setSG({ columns: sgCols.filter((_, i) => i !== ci), rows: sgRows.map((r) => ({ cells: r.cells.filter((_, i) => i !== ci) })) });
  const sgSetColumn = (ci: number, v: string) => setSG({ columns: sgCols.map((c, i) => (i === ci ? v : c)) });
  const sgAddRow = () => setSG({ rows: [...sgRows, { cells: sgCols.map(() => "") }] });
  // 열 일괄 추가 — "XL, 2XL, 3XL"처럼 입력하면 한 번에 여러 열 추가 (기존 열 뒤에 붙임)
  const sgBulkAddColumns = () => {
    const items = bulkColInput.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
    if (!items.length) return;
    setSG({
      columns: [...sgCols, ...items],
      rows: sgRows.map((r) => ({ cells: [...r.cells, ...items.map(() => "")] })),
    });
    setBulkColInput("");
  };
  const sgRemoveRow = (ri: number) => setSG({ rows: sgRows.filter((_, i) => i !== ri) });
  const sgSetCell = (ri: number, ci: number, v: string) =>
    setSG({ rows: sgRows.map((r, i) => (i === ri ? { cells: r.cells.map((c, j) => (j === ci ? v : c)) } : r)) });
  const sgApplyTemplate = (tpl: { firstCol: string; rows: string[] }) => {
    if (sgRows.length > 0 && !confirm("현재 표의 행(항목)을 선택한 템플릿으로 교체할까요?")) return;
    const sizeCols = sgCols.length > 1 ? sgCols.slice(1) : ["S", "M", "L", "XL", "XXL"];
    setSG({
      mode: "table",
      columns: [tpl.firstCol, ...sizeCols],
      rows: tpl.rows.map((label) => ({ cells: [label, ...sizeCols.map(() => "")] })),
    });
  };
  const sgClearAll = () => {
    if (!confirm("사이즈 가이드를 전체 삭제할까요?")) return;
    setSG({ columns: [], rows: [], image: "", note: "" });
  };
  // 무료 OCR — 표 구조는 관리자가 만들고, 가운데 "수치 칸"만 자동으로 채운다.
  // (한글 항목/사이즈 제목은 건드리지 않음 → 라벨 깨짐 없음. 인식 오류는 검수)
  const handleSizeOcr = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (sgRows.length === 0 || sgCols.length < 2) {
      alert("먼저 템플릿(티셔츠·바지·상하세트)이나 ‘+ 열 추가 / + 행 추가’로 표 구조(항목·사이즈)를 만든 뒤 사용하세요.\n수치 칸만 채워집니다.");
      return;
    }
    setOcrBusy(true); setOcrProgress(0);
    try {
      const { extractSizeValuesFromImage } = await import("@/lib/sizeGuideOcr");
      const valueRows = await extractSizeValuesFromImage(file, (p) => setOcrProgress(p));
      if (!valueRows.length) {
        alert("수치를 인식하지 못했습니다. 더 선명한(글자가 큰) 캡쳐를 사용해 주세요.");
        return;
      }
      // 기존 행/열 제목은 유지하고, 각 행의 첫 칸(라벨)을 제외한 수치 칸만 채움
      const newRows = sgRows.map((row, ri) => {
        const vals = valueRows[ri] ?? [];
        const cells = [...row.cells];
        while (cells.length < sgCols.length) cells.push("");
        for (let ci = 1; ci < sgCols.length; ci++) {
          const v = vals[ci - 1];
          if (v != null && v !== "") cells[ci] = v;
        }
        return { cells };
      });
      setSG({ rows: newRows });
      alert("수치를 채웠습니다. 인식 오류가 있을 수 있으니 값을 꼭 확인·수정해 주세요.");
    } catch {
      alert("OCR 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setOcrBusy(false); setOcrProgress(0);
    }
  };
  const handleSizeGuideFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadError(""); setUploadingSizeGuide(true);
    const url = await uploadFile(file);
    setUploadingSizeGuide(false);
    if (url) setSG({ image: url });
    e.target.value = "";
  };

  // ── 상세 정보 (라벨/값 텍스트) ─────────────────────────────────────────────
  const diAdd = () => set("detailInfo", [...form.detailInfo, { label: "", value: "" }]);
  const diRemove = (i: number) => set("detailInfo", form.detailInfo.filter((_, idx) => idx !== i));
  const diSet = (i: number, key: "label" | "value", v: string) =>
    set("detailInfo", form.detailInfo.map((it, idx) => (idx === i ? { ...it, [key]: v } : it)));
  const diLoadDefaults = () => set("detailInfo", DETAIL_INFO_DEFAULTS.map((label) => ({ label, value: "" })));
  const diClearAll = () => {
    if (form.detailInfo.length === 0) return;
    if (!confirm("상세 정보를 전체 삭제할까요?")) return;
    set("detailInfo", []);
  };

  // ── 색상 ──────────────────────────────────────────────────────────────────
  const toggleColor = (preset: { name: string; hex: string }) => {
    const exists = form.colors.some((c) => c.name === preset.name);
    if (exists) {
      set("colors", form.colors.filter((c) => c.name !== preset.name));
    } else {
      set("colors", [...form.colors, { name: preset.name, hex: preset.hex }]);
    }
  };

  const addCustomColor = () => {
    if (!form.colorName.trim()) return;
    if (form.colors.some((c) => c.name === form.colorName.trim())) return;
    set("colors", [...form.colors, { name: form.colorName.trim(), hex: form.colorHex }]);
    set("colorName", "");
    set("colorHex", "#1A2B4A");
  };

  // ── 연관 상품 ──────────────────────────────────────────────────────────────
  const filteredRelatedProducts = allProducts
    .filter((p) => !form.id || p.id !== form.id)
    .filter((p) => !relatedCatFilter || p.category === relatedCatFilter)
    .filter((p) => !relatedSearch.trim() || p.name.toLowerCase().includes(relatedSearch.trim().toLowerCase()));

  const toggleRelated = (id: string) => {
    set("relatedIds", form.relatedIds.includes(id)
      ? form.relatedIds.filter((rid) => rid !== id)
      : [...form.relatedIds, id]);
  };

  // ── 저장 ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSaving(true);

    if (form.categories.length === 0) {
      setError("카테고리를 하나 이상 선택해 주세요.");
      setSaving(false);
      return;
    }

    const id = form.id || slugify(form.name) || `product-${Date.now()}`;
    const primaryCat = form.categories[0];

    const payload: Partial<Product> & { id: string; categories?: CategoryEntry[] } = {
      id,
      sku: form.sku || undefined,
      brand: form.brand || undefined,
      hideBrandPrefix: form.hideBrandPrefix,
      manufacturer: form.manufacturer || undefined,
      origin: form.origin || undefined,
      name: form.name,
      line: form.line as Product["line"],
      category: primaryCat.main as Product["category"],
      subCategory: primaryCat.sub as Product["subCategory"],
      categories: form.categories,
      tagline: form.tagline,
      price: form.price,
      consumerPrice: form.consumerPrice || undefined,
      supplyPrice: form.supplyPrice || undefined,
      status: form.status as Product["status"],
      seasons: form.seasons as Season[],
      promoStart: form.status === "예약판매" ? (form.promoStart || undefined) : undefined,
      promoEnd: form.status === "예약판매" ? (form.promoEnd || undefined) : undefined,
      imageUrl: form.imageUrl || undefined,
      subImages: form.subImages.filter(Boolean),
      detailBlocks: form.detailBlocks as DetailBlock[],
      features: form.features.split("\n").map((s) => s.trim()).filter(Boolean),
      featureTags: form.featureTags,
      jobTypes: initial?.jobTypes ?? [],   // 폼에서 편집하지 않는 필드는 기존 값 보존 (덮어쓰기로 인한 손실 방지)
      jobSites: form.jobSites,
      wearerQuote: initial?.wearerQuote,   // 착용자 후기도 폼 밖 필드 — 보존
      mainExpose: form.mainExpose as MainExpose[],
      isNew: form.mainExpose.includes("신상품"),
      fieldTest: form.fieldTest || undefined,
      bg: "bg-[#1A2B4A]",
      colors: form.colors,
      sizes: form.sizes,
      sizePrices: form.sizePrices.filter((sp) => form.sizes.includes(sp.size) && sp.price.trim()),
      sizeGuide: form.sizeGuide,
      detailInfo: form.detailInfo.filter((d) => d.label.trim() || d.value.trim()),
      relatedIds: form.relatedIds,
      metaTitle: form.metaTitle || undefined,
      metaDesc: form.metaDesc || undefined,
    };

    const url = isEdit ? `/api/admin/products/${initial!.id}` : "/api/admin/products";
    try {
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        alert(isEdit ? "수정이 완료되었습니다." : "제품이 등록되었습니다.");
        router.push("/admin/products");
        router.refresh();
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "저장 중 오류가 발생했습니다.");
      }
    } catch {
      setError("저장 중 네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSaving(false);   // 네트워크 실패 시에도 버튼 잠금 해제 (영구 "저장 중" 방지)
    }
  };

  const customColors = form.colors.filter((c) => !COLOR_PRESETS.some((p) => p.name === c.name));

  // ─── 렌더 ──────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="w-full">
      {error && (
        <div className="p-4 mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded">{error}</div>
      )}

      {/* ── 상단 저장 버튼 ── */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <p className="text-sm text-gray-500">{isEdit ? "상품 수정 중" : "새 상품 등록"}</p>
        <SaveBar saving={saving} isEdit={isEdit} onCancel={() => router.back()} status={form.status} onStatusChange={(s) => set("status", s)} />
      </div>

      <div className="grid grid-cols-2 gap-6 items-start">
        {/* ══════════ 왼쪽 컬럼 ══════════ */}
        <div className="flex flex-col gap-6 min-w-0">

          {/* ── 1. 기본 정보 ── */}
          <section className="bg-white border border-gray-200 p-7 rounded-xl">
            <SectionTitle>기본 정보</SectionTitle>
            <div className="space-y-5">
              <Field label="상품명" required>
                <input required value={form.name}
                  onChange={(e) => { set("name", e.target.value); if (!isEdit) set("id", slugify(e.target.value)); }}
                  className={INPUT_CLS} placeholder="예: 스트레치 카고 팬츠" />
              </Field>

              {/* 상품코드 · 제품 ID */}
              <div className="grid grid-cols-2 gap-5">
                <Field label="상품코드 (SKU)">
                  <input value={form.sku} onChange={(e) => set("sku", e.target.value)}
                    className={`${INPUT_CLS} font-mono`} placeholder="예: WU-S001" />
                </Field>
                <Field label="제품 ID">
                  <input value={form.id} onChange={(e) => set("id", e.target.value)}
                    className={`${INPUT_CLS} font-mono`} placeholder="자동 생성됨" disabled={isEdit} />
                </Field>
              </div>

              {/* 브랜드 · 제조사 · 원산지 */}
              <div className="grid grid-cols-3 gap-5">
                <Field label="브랜드">
                  <div className="flex gap-2 items-center">
                    <select value={form.brand} onChange={(e) => set("brand", e.target.value)} className={`${SELECT_CLS} flex-1`}>
                      <option value="">선택 안 함</option>
                      {brands.map((b) => <option key={b} value={b}>{b}</option>)}
                      {form.brand && !brands.includes(form.brand) && <option value={form.brand}>{form.brand}</option>}
                    </select>
                    <a href="/admin/brands" target="_blank" rel="noopener" className="text-xs text-[#1A2B4A] hover:underline whitespace-nowrap shrink-0">관리 ↗</a>
                  </div>
                </Field>
                <Field label="제조사">
                  <div className="flex gap-2 items-center">
                    <select value={form.manufacturer} onChange={(e) => set("manufacturer", e.target.value)} className={`${SELECT_CLS} flex-1`}>
                      <option value="">선택 안 함</option>
                      {manufacturers.map((m) => <option key={m} value={m}>{m}</option>)}
                      {form.manufacturer && !manufacturers.includes(form.manufacturer) && <option value={form.manufacturer}>{form.manufacturer}</option>}
                    </select>
                    <a href="/admin/manufacturers" target="_blank" rel="noopener" className="text-xs text-[#1A2B4A] hover:underline whitespace-nowrap shrink-0">관리 ↗</a>
                  </div>
                </Field>
                <Field label="원산지">
                  <input value={form.origin} onChange={(e) => set("origin", e.target.value)}
                    className={INPUT_CLS} placeholder="예: 대한민국" />
                </Field>
              </div>

              {/* 판매가 · 소비자가 · 공급가 */}
              <div className="grid grid-cols-3 gap-5">
                <Field label="판매가" required>
                  <input required value={form.price} onChange={(e) => set("price", formatPrice(e.target.value))}
                    inputMode="numeric" className={INPUT_CLS} placeholder="예: 39,000원" />
                </Field>
                <Field label="소비자가">
                  <input value={form.consumerPrice} onChange={(e) => set("consumerPrice", formatPrice(e.target.value))}
                    inputMode="numeric" className={INPUT_CLS} placeholder="예: 45,000원" />
                </Field>
                <Field label="공급가">
                  <input value={form.supplyPrice} onChange={(e) => set("supplyPrice", formatPrice(e.target.value))}
                    inputMode="numeric" className={INPUT_CLS} placeholder="예: 25,000원" />
                </Field>
              </div>

            </div>
          </section>

          {/* ── 카테고리 (최상단 박스) ── */}
          <section className="order-first bg-white border border-gray-200 p-7 rounded-xl">
            <div className="pt-1">
                <label className="block text-xs font-medium text-gray-500 mb-2">
                  카테고리 <span className="text-red-400">*</span>
                  <span className="text-gray-400 font-normal ml-1.5">— 여러 카테고리에 동시 등록 가능, 첫 번째 = 대표</span>
                  <a href="/admin/main/categories" target="_blank" rel="noopener" className="ml-2 text-[#1A2B4A] hover:underline">관리 ↗</a>
                </label>

                {/* 선택된 카테고리 칩 */}
                {form.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {form.categories.map((cat, idx) => (
                      <span key={idx}
                        className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded font-medium ${
                          idx === 0
                            ? "bg-[#1A2B4A] text-white"
                            : "bg-gray-100 text-gray-700 border border-gray-200"
                        }`}>
                        {idx === 0 && (
                          <span className="text-[10px] bg-white/20 text-white px-1 py-0.5 rounded leading-none">대표</span>
                        )}
                        {cat.main} &gt; {cat.sub}
                        <button type="button" onClick={() => removeCategory(idx)}
                          className="hover:opacity-70 ml-0.5 leading-none">×</button>
                      </span>
                    ))}
                  </div>
                )}

                {/* 드릴다운 피커 */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* 브레드크럼 */}
                  <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 text-xs text-gray-500 flex items-center gap-1">
                    {pickerMain ? (
                      <>
                        <span className="font-medium text-[#1A2B4A]">{pickerMain}</span>
                        <span className="text-gray-300">&gt;</span>
                        {pickerSub
                          ? <span className="font-medium text-[#1A2B4A]">{pickerSub}</span>
                          : <span className="text-gray-400">소분류 선택</span>
                        }
                      </>
                    ) : (
                      <span>카테고리를 선택하세요</span>
                    )}
                  </div>

                  {/* 2단 선택 */}
                  <div className="flex" style={{ height: "180px" }}>
                    {/* 왼쪽: 대분류 */}
                    <div className="w-1/2 border-r border-gray-100 overflow-y-auto">
                      {dynMainCats.map((cat) => (
                        <button key={cat} type="button"
                          onClick={() => { setPickerMain(cat); setPickerSub(""); }}
                          className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors border-b border-gray-50 last:border-0 ${
                            pickerMain === cat
                              ? "bg-blue-50 text-[#1A2B4A] font-semibold"
                              : "hover:bg-gray-50 text-gray-700"
                          }`}>
                          <span>{cat}</span>
                          <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      ))}
                    </div>

                    {/* 오른쪽: 소분류 */}
                    <div className="w-1/2 overflow-y-auto">
                      {pickerMain ? (
                        <>
                          {dynSubCats(pickerMain).map((sub) => (
                            <button key={sub} type="button"
                              onClick={() => setPickerSub(sub)}
                              className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors border-b border-gray-50 last:border-0 ${
                                pickerSub === sub
                                  ? "bg-blue-50 text-[#1A2B4A] font-semibold"
                                  : "hover:bg-gray-50 text-gray-700"
                              }`}>
                              <span>{sub}</span>
                              {pickerSub === sub && (
                                <svg className="w-4 h-4 text-[#1A2B4A]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                          ))}
                          {dynSubCats(pickerMain).length === 0 && (
                            <p className="text-xs text-gray-400 px-4 py-4">소분류가 없습니다.</p>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-xs text-gray-400">왼쪽에서 대분류를 선택하세요</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 적용 버튼 */}
                  <div className="border-t border-gray-200 px-4 py-2.5 flex items-center justify-between bg-gray-50">
                    <p className="text-xs text-gray-400">
                      {pickerMain && pickerSub
                        ? `"${pickerMain} > ${pickerSub}" 추가 가능`
                        : "대분류와 소분류를 모두 선택하세요"}
                    </p>
                    <button type="button" onClick={addCategory}
                      disabled={!pickerMain || !pickerSub}
                      className="px-5 py-1.5 text-xs font-semibold bg-[#1A2B4A] text-white hover:bg-[#243d5e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded">
                      + 적용
                    </button>
                  </div>
                </div>
                {form.categories.length === 0 && (
                  <p className="text-xs text-red-400 mt-1">카테고리를 하나 이상 선택해 주세요.</p>
                )}
              </div>
          </section>


          {/* ── 5. 연관 상품 ── */}
          <section className="bg-white border border-gray-200 p-6 rounded-xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h2 className="text-xs font-bold text-[#1A2B4A] uppercase tracking-widest">연관 상품</h2>
              <button type="button" onClick={() => setRelatedModalOpen(true)}
                className="px-3 py-1.5 text-xs font-semibold border border-[#1A2B4A] text-[#1A2B4A] hover:bg-[#1A2B4A] hover:text-white rounded transition-colors">
                + 연관 상품 추가
              </button>
            </div>
            {form.relatedIds.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {form.relatedIds.map((id) => {
                  const p = allProducts.find((ap) => ap.id === id);
                  return (
                    <span key={id} className="flex items-center gap-1.5 pl-1 pr-2.5 py-1 text-xs bg-[#1A2B4A] text-white rounded">
                      <span className="w-5 h-5 bg-white/20 rounded overflow-hidden flex-shrink-0">
                        {p?.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.imageUrl} alt={p?.name ?? ""} className="w-full h-full object-cover" />
                        )}
                      </span>
                      {p?.name ?? id}
                      <button type="button" onClick={() => toggleRelated(id)} className="hover:opacity-70">×</button>
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-400">아직 선택된 연관 상품이 없습니다. &quot;+ 연관 상품 추가&quot; 버튼으로 선택하세요.</p>
            )}
            <p className="text-xs text-gray-400 mt-3">
              {form.relatedIds.length > 0 ? `${form.relatedIds.length}개 선택됨 · ` : ""}
              제품 상세 페이지에 연관 상품으로 표시됩니다.
            </p>
          </section>

          {/* 연관 상품 선택 모달 — 카테고리별 + 검색 */}
          {relatedModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
              onClick={() => setRelatedModalOpen(false)}>
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}>
                {/* 헤더 */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">연관 상품 선택</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{form.relatedIds.length}개 선택됨</p>
                  </div>
                  <button type="button" onClick={() => setRelatedModalOpen(false)} className="text-gray-400 hover:text-gray-700 p-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* 검색 + 카테고리별 선택 */}
                <div className="px-6 py-3 border-b border-gray-100 flex-shrink-0 space-y-2.5">
                  <div className="relative">
                    <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input type="text" value={relatedSearch}
                      onChange={(e) => setRelatedSearch(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
                      placeholder="상품명 검색..."
                      className="w-full border border-gray-200 pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-[#1A2B4A] rounded" />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button type="button" onClick={() => setRelatedCatFilter("")}
                      className={`px-3 py-1 text-xs rounded-full border transition-colors ${relatedCatFilter === "" ? "bg-[#1A2B4A] text-white border-[#1A2B4A]" : "bg-white text-gray-600 border-gray-200 hover:border-[#1A2B4A]"}`}>
                      전체
                    </button>
                    {dynMainCats.map((c) => (
                      <button key={c} type="button" onClick={() => setRelatedCatFilter(c)}
                        className={`px-3 py-1 text-xs rounded-full border transition-colors ${relatedCatFilter === c ? "bg-[#1A2B4A] text-white border-[#1A2B4A]" : "bg-white text-gray-600 border-gray-200 hover:border-[#1A2B4A]"}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 상품 리스트 */}
                <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                  {filteredRelatedProducts.length === 0 ? (
                    <p className="text-xs text-gray-400 px-4 py-10 text-center">
                      {allProducts.length === 0 ? "등록된 상품이 없습니다." : "검색 결과가 없습니다."}
                    </p>
                  ) : (
                    filteredRelatedProducts.map((p) => (
                      <label key={p.id} className="flex items-center gap-3 px-6 py-2.5 hover:bg-gray-50 cursor-pointer">
                        <input type="checkbox" checked={form.relatedIds.includes(p.id)} onChange={() => toggleRelated(p.id)}
                          className="w-4 h-4 accent-[#1A2B4A]" />
                        <span className="w-9 h-9 bg-[#f4f4f4] rounded overflow-hidden flex-shrink-0">
                          {p.imageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                          )}
                        </span>
                        <span className="text-sm text-gray-800 flex-1">{p.name}</span>
                        <span className="text-xs text-gray-400 shrink-0">{p.category}</span>
                      </label>
                    ))
                  )}
                </div>

                {/* 푸터 */}
                <div className="px-6 py-3 border-t border-gray-200 flex justify-end flex-shrink-0">
                  <button type="button" onClick={() => setRelatedModalOpen(false)}
                    className="px-6 py-2 bg-[#1A2B4A] text-white text-sm font-semibold rounded hover:bg-[#243d5e] transition-colors">
                    완료 ({form.relatedIds.length})
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── 6. SEO ── */}
          <section className="bg-white border border-gray-200 p-6 rounded-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xs font-bold text-[#1A2B4A] uppercase tracking-widest">SEO</h2>
              <button type="button" onClick={autoGenSeo}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#1A2B4A] text-[#1A2B4A] hover:bg-[#1A2B4A] hover:text-white transition-colors rounded">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                자동 생성
              </button>
            </div>
            <div className="space-y-4">
              <Field label="메타 타이틀" hint="권장 60자 이내.">
                <input value={form.metaTitle} onChange={(e) => set("metaTitle", e.target.value)}
                  className={INPUT_CLS} placeholder="예: 스트레치 카고 팬츠 | WORKUP 작업복" />
                <div className="flex justify-end">
                  <span className={`text-xs mt-0.5 ${form.metaTitle.length > 60 ? "text-red-400" : "text-gray-400"}`}>
                    {form.metaTitle.length} / 60
                  </span>
                </div>
              </Field>
              <Field label="메타 설명" hint="권장 80~160자.">
                <textarea value={form.metaDesc} onChange={(e) => set("metaDesc", e.target.value)}
                  rows={3} className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1A2B4A] resize-none rounded"
                  placeholder="예: 현장 작업자를 위한 스트레치 카고 팬츠. 11개 포켓, 무릎 이중 보강..." />
                <div className="flex justify-end">
                  <span className={`text-xs ${form.metaDesc.length > 160 ? "text-red-400" : form.metaDesc.length < 80 && form.metaDesc.length > 0 ? "text-amber-400" : "text-gray-400"}`}>
                    {form.metaDesc.length} / 160
                  </span>
                </div>
              </Field>
            </div>
          </section>

          {/* ── 하단 저장 버튼 ── */}
          <div className="flex gap-3 pb-8">
            <SaveBar saving={saving} isEdit={isEdit} onCancel={() => router.back()} status={form.status} onStatusChange={(s) => set("status", s)} />
          </div>

        </div>{/* end left col */}

        {/* ══════════ 오른쪽 컬럼 ══════════ */}
        <div className="space-y-6 sticky top-6">

          {/* ── 이미지 ── */}
          <section className="bg-white border border-gray-200 p-6 rounded-xl">
            <SectionTitle>제품 이미지</SectionTitle>

            {/* ── 대표 이미지 ── */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-700">
                  대표 이미지 <span className="text-red-400">*</span>
                </p>
                <span className="text-[11px] text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded font-mono">
                  800 × 800 px · 1:1 비율 권장 · 최대 5 MB
                </span>
              </div>
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0">
                  {form.imageUrl ? (
                    <div className="relative w-28 h-28 border border-gray-200 rounded overflow-hidden">
                      <Image src={form.imageUrl} alt="대표 이미지" fill className="object-cover" />
                      <button type="button" onClick={() => set("imageUrl", "")}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600 rounded-full">×</button>
                    </div>
                  ) : (
                    <div className="w-28 h-28 bg-gray-100 flex items-center justify-center border border-dashed border-gray-300 rounded">
                      <span className="text-gray-300 text-xs">없음</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <input ref={mainInputRef} type="file" accept="image/*" onChange={handleMainFile} className="hidden" id="main-img-r" />
                  <label htmlFor="main-img-r"
                    className={`inline-flex items-center gap-2 px-4 py-2 border text-sm cursor-pointer transition-colors rounded ${
                      uploadingMain ? "border-gray-200 text-gray-400 cursor-not-allowed" : "border-[#1A2B4A] text-[#1A2B4A] hover:bg-[#1A2B4A] hover:text-white"
                    }`}>
                    {uploadingMain ? <><span className="w-4 h-4 border-2 border-gray-300 border-t-[#1A2B4A] rounded-full animate-spin" />업로드 중...</> : "이미지 업로드"}
                  </label>
                  <input type="url" value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)}
                    placeholder="또는 URL 직접 입력 (https://...)"
                    className="w-full border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:border-[#1A2B4A] rounded" />
                </div>
              </div>
            </div>

            {/* ── 추가 이미지 ── */}
            <div>
              {/* 헤더 */}
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-700">추가 이미지</p>
                <span className="text-[11px] text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded font-mono">
                  800 × 800 px · 최대 9장 · 5 MB/장
                </span>
              </div>

              {/* 여러 장 한번에 선택 */}
              <div className="flex items-center gap-2 mb-3">
                <input
                  ref={multiSubInputRef}
                  type="file" accept="image/*" multiple
                  onChange={handleMultiSubFiles}
                  className="hidden" id="multi-sub-img"
                  disabled={form.subImages.filter(Boolean).length >= 9}
                />
                <label htmlFor="multi-sub-img"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 border text-xs transition-colors rounded cursor-pointer ${
                    uploadingMulti || form.subImages.filter(Boolean).length >= 9
                      ? "border-gray-200 text-gray-400 cursor-not-allowed pointer-events-none"
                      : "border-[#1A2B4A] text-[#1A2B4A] hover:bg-[#1A2B4A] hover:text-white"
                  }`}>
                  {uploadingMulti ? (
                    <><span className="w-3 h-3 border-2 border-gray-300 border-t-[#1A2B4A] rounded-full animate-spin" />업로드 중...</>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      여러 장 한번에 선택
                    </>
                  )}
                </label>
                <span className="text-[11px] text-gray-400">
                  {form.subImages.filter(Boolean).length} / 9장
                  {form.subImages.filter(Boolean).length > 0 && " · 이미지를 드래그해 순서 변경"}
                </span>
              </div>

              {/* 이미지 목록 (가로 스크롤 · 드래그 순서 변경 가능) — 5장 초과 시 옆으로 스크롤 */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {Array.from({ length: 9 }).map((_, idx) => {
                  const url = form.subImages[idx];
                  const isUploading = uploadingSubIdx === idx;
                  const isDragging  = dragSubIdx === idx;
                  const isDragOver  = dragOverSubIdx === idx && dragSubIdx !== null && dragSubIdx !== idx;

                  return (
                    <div key={idx} className="flex flex-col gap-1 select-none w-[80px] flex-shrink-0"
                      draggable={!!url}
                      onDragStart={() => url && handleDragStart(idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDrop={(e) => handleDrop(e, idx)}
                      onDragEnd={handleDragEnd}>
                      <div className={`relative aspect-square border rounded overflow-hidden transition-all duration-150 ${
                        isDragOver
                          ? "border-violet-400 ring-2 ring-violet-300 scale-105 bg-violet-50"
                          : isDragging
                            ? "opacity-40 border-dashed border-gray-400 scale-95"
                            : url
                              ? "border-gray-200 cursor-grab active:cursor-grabbing"
                              : "border-dashed border-gray-300"
                      }`}>
                        {url ? (
                          <>
                            <Image src={url} alt={`추가 ${idx + 1}`} fill className="object-cover pointer-events-none" sizes="80px" />
                            {/* 삭제 버튼 */}
                            <button type="button" onClick={() => removeSubImage(idx)}
                              className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center hover:bg-red-600 z-10 rounded-full">×</button>
                            {/* 드래그 핸들 힌트 */}
                            <div className="absolute bottom-0.5 left-0.5 text-[11px] text-white/70 pointer-events-none leading-none select-none">⠿</div>
                          </>
                        ) : isUploading ? (
                          <div className="w-full h-full flex items-center justify-center bg-gray-50">
                            <span className="w-4 h-4 border-2 border-gray-300 border-t-[#1A2B4A] rounded-full animate-spin" />
                          </div>
                        ) : (
                          <label htmlFor={`sub-img-r-${idx}`}
                            className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                            </svg>
                          </label>
                        )}
                        <input ref={(el) => { subInputRefs.current[idx] = el; }} id={`sub-img-r-${idx}`}
                          type="file" accept="image/*" onChange={(e) => handleSubFile(e, idx)} className="hidden" />
                      </div>
                      <span className={`text-[10px] text-center ${isDragOver ? "text-violet-500 font-semibold" : "text-gray-400"}`}>
                        {idx + 1}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {uploadError && <p className="text-xs text-red-500 mt-3">{uploadError}</p>}

            {/* ── AI 이미지 생성 프롬프트 ── */}
            <div className="mt-5 pt-5 border-t border-gray-100">
              <button type="button" onClick={() => setPromptPanelOpen((v) => !v)}
                className="w-full flex items-center justify-between gap-2 text-left">
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-gray-700">AI 이미지 생성 프롬프트</span>
                  <span className="block text-[11px] text-gray-400">이미지 유형 선택 후 생성 — Midjourney · DALL·E 3 · Firefly 등에 붙여넣기</span>
                </span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${promptPanelOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {promptPanelOpen && (
              <div className="mt-3">
              {/* 이미지 유형 선택 */}
              <div className="grid grid-cols-3 gap-1.5 mb-3">
                {PROMPT_TYPES.map((pt) => {
                  const isModel = !["누끼컷", "원단컷"].includes(pt.key);
                  return (
                    <button key={pt.key} type="button"
                      onClick={() => { setPromptType(pt.key); setShowAiPrompt(false); }}
                      className={`py-2 px-1 text-xs font-medium border rounded transition-colors flex flex-col items-center gap-0.5 ${
                        promptType === pt.key
                          ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                          : "bg-white text-gray-600 border-gray-200 hover:border-violet-400 hover:text-violet-600"
                      }`}>
                      <span>{pt.label}</span>
                      <span className={`text-[10px] font-normal ${promptType === pt.key ? "text-violet-200" : "text-gray-400"}`}>
                        {isModel ? "착용컷" : pt.key === "누끼컷" ? "제품단독" : "소재클로즈업"}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* 선택 유형 안내 */}
              {promptType === "대표반신컷" && (
                <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-1.5 mb-3">
                  ⚠ 상하세트·원피스 상품에는 대표 반신컷을 생성하지 않습니다.
                </p>
              )}

              {/* 프롬프트 옵션 */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3 space-y-3">
                {/* 의류 유형 */}
                <div>
                  <p className="text-[11px] font-semibold text-gray-600 mb-1.5">의류 유형</p>
                  <div className="flex gap-1.5">
                    {(["작업복", "일상복"] as const).map(t => (
                      <button key={t} type="button"
                        onClick={() => setPromptClothingType(t)}
                        className={`px-3 py-1.5 text-[12px] rounded-full border font-medium transition-colors ${
                          promptClothingType === t
                            ? "bg-violet-600 text-white border-violet-600"
                            : "bg-white text-gray-600 border-gray-200 hover:border-violet-400 hover:text-violet-600"
                        }`}>{t}</button>
                    ))}
                  </div>
                </div>

                {/* 시즌 */}
                <div>
                  <p className="text-[11px] font-semibold text-gray-600 mb-1.5">시즌 <span className="text-gray-400 font-normal">(선택)</span></p>
                  <div className="flex gap-1.5 flex-wrap">
                    {["봄", "여름", "가을", "겨울", "전천후"].map(s => (
                      <button key={s} type="button"
                        onClick={() => setPromptSeason(promptSeason === s ? "" : s)}
                        className={`px-3 py-1.5 text-[12px] rounded-full border font-medium transition-colors ${
                          promptSeason === s
                            ? "bg-violet-600 text-white border-violet-600"
                            : "bg-white text-gray-600 border-gray-200 hover:border-violet-400 hover:text-violet-600"
                        }`}>{s}</button>
                    ))}
                  </div>
                </div>

                {/* 모델 연령대 — 착용컷 전용 */}
                {!["누끼컷", "원단컷"].includes(promptType) && (
                  <div>
                    <p className="text-[11px] font-semibold text-gray-600 mb-1.5">모델 연령대 <span className="text-gray-400 font-normal">(선택)</span></p>
                    <div className="flex gap-1.5 flex-wrap">
                      {["20대", "30대", "40대", "50대"].map(a => (
                        <button key={a} type="button"
                          onClick={() => setPromptModelAge(promptModelAge === a ? "" : a)}
                          className={`px-3 py-1.5 text-[12px] rounded-full border font-medium transition-colors ${
                            promptModelAge === a
                              ? "bg-violet-600 text-white border-violet-600"
                              : "bg-white text-gray-600 border-gray-200 hover:border-violet-400 hover:text-violet-600"
                          }`}>{a}</button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 착용 부위 — 착용컷 전용 (장갑·모자·안전용품 등 소품) */}
                {!["누끼컷", "원단컷"].includes(promptType) && (
                  <div>
                    <p className="text-[11px] font-semibold text-gray-600 mb-1.5">
                      착용 부위 <span className="text-gray-400 font-normal">(장갑·모자·안전용품 등 소품)</span>
                    </p>
                    <div className="flex gap-1.5 flex-wrap">
                      {["기본", "손·장갑", "머리·모자", "발·신발/양말", "허리·벨트", "상체·조끼/가방", "얼굴·고글/마스크"].map(w => (
                        <button key={w} type="button"
                          onClick={() => setPromptWornFocus(w)}
                          className={`px-3 py-1.5 text-[12px] rounded-full border font-medium transition-colors ${
                            promptWornFocus === w
                              ? "bg-violet-600 text-white border-violet-600"
                              : "bg-white text-gray-600 border-gray-200 hover:border-violet-400 hover:text-violet-600"
                          }`}>{w}</button>
                      ))}
                    </div>
                    {promptWornFocus !== "기본" && (
                      <p className="text-[10px] text-violet-500 mt-1.5">
                        선택한 부위 중심으로 착용컷이 생성됩니다. 제품 단독컷은 <b>누끼컷</b>을 사용하세요.
                      </p>
                    )}
                  </div>
                )}

                {/* 추가 옵션 */}
                <div>
                  <p className="text-[11px] font-semibold text-gray-600 mb-1.5">추가 옵션 <span className="text-gray-400 font-normal">(선택 · 복수가능)</span></p>
                  <div className="flex gap-1.5 flex-wrap mb-2">
                    {["남성", "여성", "한국인", "서양인", "캐주얼", "프로페셔널"].map(opt => (
                      <button key={opt} type="button"
                        onClick={() => setPromptExtras(prev =>
                          prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt]
                        )}
                        className={`px-2.5 py-1 text-[11px] rounded-full border transition-colors ${
                          promptExtras.includes(opt)
                            ? "bg-violet-100 text-violet-700 border-violet-300 font-semibold"
                            : "bg-white text-gray-500 border-gray-200 hover:border-violet-300 hover:text-violet-600"
                        }`}>{opt}</button>
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      value={promptCustomInput}
                      onChange={e => setPromptCustomInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter" && promptCustomInput.trim()) {
                          setPromptExtras(prev => [...prev, promptCustomInput.trim()]);
                          setPromptCustomInput("");
                        }
                      }}
                      placeholder="직접 입력 후 Enter..."
                      className="flex-1 text-[11px] border border-gray-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-violet-400 bg-white"
                    />
                    <button type="button"
                      onClick={() => {
                        if (promptCustomInput.trim()) {
                          setPromptExtras(prev => [...prev, promptCustomInput.trim()]);
                          setPromptCustomInput("");
                        }
                      }}
                      className="px-3 py-1.5 text-[11px] bg-gray-200 hover:bg-gray-300 text-gray-700 rounded font-medium">추가</button>
                  </div>
                  {promptExtras.length > 0 && (
                    <div className="flex gap-1 flex-wrap mt-2">
                      {promptExtras.map((opt, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-100 text-violet-700 text-[11px] rounded-full">
                          {opt}
                          <button type="button"
                            onClick={() => setPromptExtras(prev => prev.filter((_, idx) => idx !== i))}
                            className="text-violet-400 hover:text-violet-700 leading-none">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 생성 버튼 */}
              <button type="button" onClick={generateAIPrompt}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold bg-gradient-to-r from-violet-500 to-indigo-500 text-white hover:from-violet-600 hover:to-indigo-600 transition-all rounded shadow-sm">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z" />
                </svg>
                {PROMPT_TYPES.find((p) => p.key === promptType)?.label} 프롬프트 생성
              </button>

              {/* 생성된 프롬프트 출력 */}
              {showAiPrompt && (
                <div className="mt-3 bg-gray-900 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-gray-800">
                    <span className="text-xs text-gray-400 font-mono">
                      {PROMPT_TYPES.find((p) => p.key === promptType)?.label} — AI Image Prompt
                    </span>
                    <div className="flex gap-2">
                      <button type="button" onClick={copyPrompt}
                        className={`text-xs px-3 py-1 rounded transition-colors ${
                          promptCopied ? "bg-green-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}>
                        {promptCopied ? "복사됨 ✓" : "복사"}
                      </button>
                      <button type="button" onClick={() => setShowAiPrompt(false)}
                        className="text-xs text-gray-500 hover:text-gray-300 px-1">×</button>
                    </div>
                  </div>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    rows={12}
                    className="w-full bg-gray-900 text-green-400 text-xs font-mono px-4 py-3 focus:outline-none resize-y leading-relaxed"
                  />
                  <div className="px-3 py-2 bg-gray-800 text-[10px] text-gray-500">
                    영문 프롬프트를 AI 이미지 생성 도구에 붙여넣으세요 · 하단 한글 내용은 참고용
                  </div>
                </div>
              )}
              </div>
              )}
            </div>
          </section>

          {/* ── 옵션 ── */}
          <section className="bg-white border border-gray-200 p-6 rounded-xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-5">
              <h2 className="text-xs font-bold text-[#1A2B4A] uppercase tracking-widest">옵션</h2>
              <button type="button" onClick={() => { set("sizes", []); set("colors", []); }}
                disabled={form.sizes.length === 0 && form.colors.length === 0}
                className="px-3 py-1 text-[11px] border border-gray-300 text-gray-500 hover:border-red-300 hover:text-red-500 disabled:opacity-40 disabled:cursor-not-allowed rounded transition-colors">
                옵션 전체 해제
              </button>
            </div>
            <div className="mb-5">
              <Field label="기본 사이즈 (의류)" hint="클릭으로 포함/제외 전환. 취소선 = 제외">
                <div className="flex flex-wrap gap-2 mt-1">
                  {CLOTHING_SIZE_PRESETS.map((size) => {
                    const active = form.sizes.includes(size);
                    return (
                      <button key={size} type="button" onClick={() => toggleArr("sizes", size)}
                        className={`min-w-[48px] px-3 py-1.5 text-sm border font-semibold transition-colors rounded ${
                          active ? "bg-[#1A2B4A] text-white border-[#1A2B4A]" : "bg-white text-gray-300 border-gray-200 line-through"
                        }`}>
                        {size}
                      </button>
                    );
                  })}
                </div>
              </Field>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <label className="block text-xs font-medium text-gray-500 mb-1">직접 입력 사이즈</label>
                {/* 빠른 템플릿 — 클릭 시 해당 사이즈 세트로 교체 */}
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  <span className="text-[11px] text-gray-400 mr-0.5">템플릿:</span>
                  {SIZE_TEMPLATES.map((t) => (
                    <button key={t.label} type="button" onClick={() => set("sizes", [...t.sizes])}
                      className="px-2.5 py-1 text-[11px] border border-gray-200 text-gray-600 rounded-full hover:border-[#1A2B4A] hover:text-[#1A2B4A] transition-colors">
                      {t.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={form.customSizeInput} onChange={(e) => set("customSizeInput", e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomSize(); } }}
                    placeholder="사이즈 입력 후 Enter 또는 추가"
                    className="flex-1 border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1A2B4A] rounded" />
                  <button type="button" onClick={addCustomSize}
                    className="px-3 py-2 bg-[#1A2B4A] text-white text-xs hover:bg-[#243d5e] transition-colors rounded">추가</button>
                </div>
                {customSizes.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {customSizes.map((size) => (
                      <div key={size} className="flex items-center gap-1.5 border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs rounded">
                        {size}
                        <button type="button" onClick={() => set("sizes", form.sizes.filter((s) => s !== size))}
                          className="text-gray-400 hover:text-red-500">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {form.sizes.length > 0 && (
                <p className="text-xs text-gray-400 mt-3">선택된 사이즈 {form.sizes.length}개: {form.sizes.join(", ")}</p>
              )}
            </div>

            {/* 사이즈별 가격 (선택) */}
            {form.sizes.length > 0 && (
              <div className="mb-5 pt-4 border-t border-gray-100">
                <label className="block text-xs font-medium text-gray-500 mb-1">사이즈별 가격 (선택)</label>
                <p className="text-[11px] text-gray-400 mb-2">사이즈마다 가격이 다르면 입력하세요. 비워두면 기본 판매가{form.price ? ` (${form.price}원)` : ""}가 적용됩니다.</p>
                <div className="flex flex-wrap gap-2">
                  {form.sizes.map((size) => (
                    <div key={size} className="flex items-center gap-1.5 border border-gray-200 rounded px-2 py-1">
                      <span className="text-xs font-semibold text-[#1A2B4A] min-w-[36px] text-center">{size}</span>
                      <input type="text" inputMode="numeric" value={sizePriceOf(size)}
                        onChange={(e) => setSizePrice(size, e.target.value)}
                        placeholder={form.price || "기본가"}
                        className="w-24 border-b border-gray-200 px-1 py-0.5 text-sm focus:outline-none focus:border-[#1A2B4A]" />
                      <span className="text-xs text-gray-400">원</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">색상 옵션</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {COLOR_PRESETS.map((preset) => {
                  const selected = form.colors.some((c) => c.name === preset.name);
                  return (
                    <button key={preset.name} type="button" onClick={() => toggleColor(preset)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 border text-xs transition-all rounded ${
                        selected ? "border-[#ff550c] bg-orange-50 font-semibold text-gray-800" : "border-gray-200 text-gray-600 hover:border-gray-400"
                      }`}>
                      <span className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: preset.hex }} />
                      {preset.name}
                      {selected && <span className="text-[#ff550c] font-bold">✓</span>}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2 items-center mt-2">
                <input value={form.colorName} onChange={(e) => set("colorName", e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomColor(); } }}
                  placeholder="커스텀 색상명 (예: 형광그린)"
                  className="flex-1 border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1A2B4A] rounded" />
                <input type="color" value={form.colorHex} onChange={(e) => set("colorHex", e.target.value)}
                  className="w-10 h-9 border border-gray-200 cursor-pointer rounded p-0.5" />
                <button type="button" onClick={addCustomColor}
                  className="px-3 py-2 bg-[#1A2B4A] text-white text-xs hover:bg-[#243d5e] transition-colors rounded">추가</button>
              </div>
              {customColors.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {customColors.map((c, i) => (
                    <div key={i} className="flex items-center gap-1.5 border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs rounded">
                      <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: c.hex }} />
                      {c.name}
                      <button type="button" onClick={() => set("colors", form.colors.filter((fc) => fc.name !== c.name))}
                        className="text-gray-400 hover:text-red-500 ml-0.5">×</button>
                    </div>
                  ))}
                </div>
              )}
              {form.colors.length > 0 && (
                <p className="text-xs text-gray-400 mt-2">선택된 색상 {form.colors.length}개: {form.colors.map((c) => c.name).join(", ")}</p>
              )}
            </div>
          </section>

          {/* ── 사이즈 가이드 (사이즈 및 소재 탭) ── */}
          <section className="bg-white border border-gray-200 p-6 rounded-xl">
            <div className="flex items-center justify-between mb-5 gap-2 flex-wrap">
              <h2 className="text-xs font-bold text-[#1A2B4A] uppercase tracking-widest">사이즈 가이드</h2>
              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden text-xs">
                  {(["image", "table"] as const).map((m) => (
                    <button key={m} type="button" onClick={() => setSG({ mode: m })}
                      className={`px-3 py-1.5 transition-colors ${sg.mode === m ? "bg-[#1A2B4A] text-white" : "bg-white text-gray-500 hover:text-[#1A2B4A]"}`}>
                      {m === "image" ? "이미지" : "행·열 표"}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={sgClearAll}
                  className="px-3 py-1.5 text-[11px] border border-gray-300 text-gray-500 hover:border-red-300 hover:text-red-500 rounded transition-colors">전체 삭제</button>
              </div>
            </div>

            {sg.mode === "image" ? (
              <div className="flex gap-4 items-start">
                {sg.image ? (
                  <div className="relative w-44 border border-gray-200 rounded overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={sg.image} alt="사이즈 가이드" className="w-full h-auto block" />
                    <button type="button" onClick={() => setSG({ image: "" })}
                      className="absolute top-1 right-1 bg-black/60 text-white w-6 h-6 rounded-full text-xs leading-none">×</button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-44 h-44 border-2 border-dashed border-gray-200 rounded cursor-pointer text-gray-400 hover:border-[#1A2B4A] hover:text-[#1A2B4A] transition-colors">
                    <input type="file" accept="image/*" className="hidden" onChange={handleSizeGuideFile} />
                    <span className="text-xs">{uploadingSizeGuide ? "업로드 중…" : "＋ 이미지 등록"}</span>
                  </label>
                )}
                <p className="text-xs text-gray-400 leading-relaxed flex-1">사이즈표 이미지를 등록하면 &quot;사이즈 및 소재&quot; 탭에 그대로 표시됩니다.</p>
              </div>
            ) : (
              <div>
                {/* 무료 OCR — 표 구조는 직접 만들고, 수치 칸만 자동으로 채움 (브라우저 내 실행, 키 불필요) */}
                <div className="mb-3 p-3 bg-gray-50 border border-gray-100 rounded-lg">
                  <label className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded cursor-pointer transition-colors ${ocrBusy ? "bg-gray-200 text-gray-400 cursor-not-allowed pointer-events-none" : "bg-[#1A2B4A] text-white hover:bg-[#243d5e]"}`}>
                    <input type="file" accept="image/*" className="hidden" onChange={handleSizeOcr} disabled={ocrBusy} />
                    {ocrBusy ? (
                      <><span className="w-3 h-3 border-2 border-gray-300 border-t-white rounded-full animate-spin" />인식 중… {ocrProgress}%</>
                    ) : (
                      "📷 이미지에서 수치만 채우기 (무료)"
                    )}
                  </label>
                  <p className="text-[11px] text-gray-400 mt-1.5">먼저 <b>템플릿</b>이나 <b>행·열 추가</b>로 표 구조(항목·사이즈)를 만든 뒤 이미지를 올리면, <b>가운데 수치 칸만</b> 자동으로 채웁니다. (행·열 제목은 안 바뀜) 인식 오류는 확인·수정하세요.</p>
                </div>
                {/* 항목 템플릿 — 클릭 시 측정 항목(행) 자동 구성 */}
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  <span className="text-[11px] text-gray-400 mr-0.5">템플릿:</span>
                  {SIZE_GUIDE_ROW_TEMPLATES.map((t) => (
                    <button key={t.label} type="button" onClick={() => sgApplyTemplate(t)}
                      className="px-2.5 py-1 text-[11px] border border-gray-200 text-gray-600 rounded-full hover:border-[#1A2B4A] hover:text-[#1A2B4A] transition-colors">
                      {t.label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 mb-3 items-center">
                  <button type="button" onClick={sgAddColumn}
                    className="px-3 py-1.5 text-xs border border-[#1A2B4A] text-[#1A2B4A] hover:bg-[#1A2B4A] hover:text-white rounded transition-colors">+ 열 추가</button>
                  <button type="button" onClick={sgAddRow} disabled={sgCols.length === 0}
                    className="px-3 py-1.5 text-xs border border-[#1A2B4A] text-[#1A2B4A] hover:bg-[#1A2B4A] hover:text-white rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed">+ 행 추가</button>
                  <span className="w-px h-5 bg-gray-200 mx-1" />
                  <input value={bulkColInput} onChange={(e) => setBulkColInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); sgBulkAddColumns(); } }}
                    placeholder="XL, 2XL, 3XL (쉼표·공백 구분)"
                    className="w-48 border border-gray-200 px-2 py-1.5 text-xs rounded focus:outline-none focus:border-[#1A2B4A]" />
                  <button type="button" onClick={sgBulkAddColumns} disabled={!bulkColInput.trim()}
                    className="px-3 py-1.5 text-xs bg-[#1A2B4A] text-white rounded hover:bg-[#243d5e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">열 일괄 추가</button>
                </div>
                {sgCols.length === 0 ? (
                  <p className="text-xs text-gray-400">＋ 열 추가로 헤더(항목·S·M·L…)를 먼저 만들고, ＋ 행 추가로 값을 입력하세요.</p>
                ) : (
                  <div className="overflow-x-auto border border-gray-100 rounded">
                    <table className="text-xs">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="p-1.5 border-b border-r border-gray-100 w-8" />
                          {sgCols.map((c, ci) => (
                            <th key={ci} className="p-1.5 border-b border-r border-gray-100">
                              <div className="flex items-center gap-1">
                                <input value={c} onChange={(e) => sgSetColumn(ci, e.target.value)} placeholder={ci === 0 ? "항목" : "S"}
                                  className="w-20 border border-gray-200 px-1.5 py-1 rounded focus:outline-none focus:border-[#1A2B4A] font-semibold" />
                                <button type="button" onClick={() => sgRemoveColumn(ci)} className="text-gray-300 hover:text-red-500">×</button>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sgRows.map((r, ri) => (
                          <tr key={ri}>
                            <td className="p-1.5 border-r border-b border-gray-100 text-center">
                              <button type="button" onClick={() => sgRemoveRow(ri)} className="text-gray-300 hover:text-red-500" title="행 삭제">×</button>
                            </td>
                            {sgCols.map((_, ci) => (
                              <td key={ci} className="p-1.5 border-r border-b border-gray-100">
                                <input value={r.cells[ci] ?? ""} onChange={(e) => sgSetCell(ri, ci, e.target.value)} placeholder={ci === 0 ? "총장" : "69cm"}
                                  className="w-20 border border-gray-200 px-1.5 py-1 rounded focus:outline-none focus:border-[#1A2B4A]" />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-500 mb-1">안내 문구</label>
                  <input value={sg.note ?? ""} onChange={(e) => setSG({ note: e.target.value })} placeholder={SIZE_NOTE_DEFAULT}
                    className="w-full border border-gray-200 px-3 py-2 text-sm rounded focus:outline-none focus:border-[#1A2B4A]" />
                </div>
              </div>
            )}
          </section>

          {/* ── 상세 정보 (텍스트) ── */}
          <section className="bg-white border border-gray-200 p-6 rounded-xl">
            <div className="flex items-center justify-between mb-5 gap-2 flex-wrap">
              <h2 className="text-xs font-bold text-[#1A2B4A] uppercase tracking-widest">상세 정보</h2>
              <div className="flex items-center gap-2">
                <button type="button" onClick={diLoadDefaults}
                  className="px-3 py-1.5 text-xs border border-gray-300 text-gray-500 hover:border-[#1A2B4A] hover:text-[#1A2B4A] rounded transition-colors">기본 항목 불러오기</button>
                <button type="button" onClick={diClearAll} disabled={form.detailInfo.length === 0}
                  className="px-3 py-1.5 text-[11px] border border-gray-300 text-gray-500 hover:border-red-300 hover:text-red-500 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed">전체 삭제</button>
                <button type="button" onClick={diAdd}
                  className="px-3 py-1.5 text-xs border border-[#1A2B4A] text-[#1A2B4A] hover:bg-[#1A2B4A] hover:text-white rounded transition-colors">+ 항목 추가</button>
              </div>
            </div>
            {form.detailInfo.length === 0 ? (
              <p className="text-xs text-gray-400">&quot;기본 항목 불러오기&quot;로 품명·소재·색상·제조국 등 기본 라벨을 채우거나 &quot;+ 항목 추가&quot;로 직접 추가하세요. 값이 빈 항목은 노출되지 않습니다.</p>
            ) : (
              <div className="space-y-2">
                {form.detailInfo.map((it, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <input value={it.label} onChange={(e) => diSet(i, "label", e.target.value)} placeholder="항목명 (예: 소재)"
                      className="w-44 flex-shrink-0 border border-gray-200 px-3 py-2 text-sm rounded focus:outline-none focus:border-[#1A2B4A] font-medium" />
                    <textarea value={it.value} onChange={(e) => diSet(i, "value", e.target.value)} rows={1} placeholder="내용"
                      className="flex-1 border border-gray-200 px-3 py-2 text-sm rounded focus:outline-none focus:border-[#1A2B4A] resize-y" />
                    <button type="button" onClick={() => diRemove(i)}
                      className="flex-shrink-0 w-9 h-9 flex items-center justify-center text-gray-300 hover:text-red-500 border border-gray-200 rounded">×</button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── 상세 설명 ── */}
          <section className="bg-white border border-gray-200 p-6 rounded-xl">
            <div className="flex items-center justify-between mb-5 gap-2 flex-wrap">
              <h2 className="text-xs font-bold text-[#1A2B4A] uppercase tracking-widest">상세 설명</h2>
              <div className="flex items-center gap-2 flex-wrap">
                {/* 여러 장 업로드 — 선택한 이미지들이 각각 블록으로 추가 (이미지 중심 에디터) */}
                <label className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded cursor-pointer transition-colors ${uploadingBlocksMulti ? "bg-gray-200 text-gray-400 pointer-events-none" : "bg-[#1A2B4A] text-white hover:bg-[#243d5e]"}`}>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleBlocksMultiUpload} disabled={uploadingBlocksMulti} />
                  {uploadingBlocksMulti ? <><span className="w-3 h-3 border-2 border-gray-300 border-t-white rounded-full animate-spin" />업로드 중…</> : "+ 여러 장 업로드"}
                </label>
                {/* 착용컷 — 등록된 썸네일(대표·추가 이미지) 일괄 추가 */}
                <button type="button" onClick={addWornCutsFromThumbnails}
                  title="등록된 썸네일(대표·추가 이미지)을 착용컷으로 일괄 추가합니다"
                  className="px-3 py-1.5 text-xs border border-[#1A2B4A] text-[#1A2B4A] hover:bg-[#1A2B4A] hover:text-white transition-colors rounded">
                  + 착용컷 (썸네일 일괄)
                </button>
                <button type="button" onClick={() => addBlock("상품 소개")}
                  className="px-3 py-1.5 text-xs border border-[#1A2B4A] text-[#1A2B4A] hover:bg-[#1A2B4A] hover:text-white transition-colors rounded">
                  + 상품 소개
                </button>
                {/* 그 외 유형 — 드롭다운 */}
                <div className="relative">
                  <button type="button" onClick={() => setBlockMenuOpen((v) => !v)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-[#1A2B4A] text-white hover:bg-[#243d5e] transition-colors rounded">
                    블록 추가
                    <svg className={`w-3 h-3 transition-transform ${blockMenuOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {blockMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setBlockMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 shadow-lg rounded min-w-[140px] py-1">
                        <p className="px-3 pb-1 mb-1 text-[11px] text-gray-400 border-b border-gray-100">기타 블록 유형</p>
                        {DETAIL_BLOCK_TYPES.filter((t) => t !== "착용 컷" && t !== "상품 소개").map((t) => (
                          <button key={t} type="button"
                            onClick={() => { addBlock(t); setBlockMenuOpen(false); }}
                            className="block w-full text-left px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50">
                            + {t}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            {form.detailBlocks.length === 0 && (
              <p className="text-xs text-gray-400 py-6 text-center border border-dashed border-gray-200 rounded">
                블록을 추가해 상세 설명을 구성하세요.
              </p>
            )}
            <div className="space-y-3">
              {form.detailBlocks.map((block, idx) => (
                <div key={block.id}
                  onDragOver={(e) => onBlockDragOver(e, idx)} onDrop={(e) => onBlockDrop(e, idx)} onDragEnd={onBlockDragEnd}
                  className={`border p-4 space-y-3 rounded-lg transition-all ${
                    dragOverBlockIdx === idx && dragBlockIdx !== null && dragBlockIdx !== idx
                      ? "border-violet-400 ring-2 ring-violet-300 bg-violet-50"
                      : dragBlockIdx === idx ? "border-dashed border-gray-400 opacity-50 bg-gray-50" : "border-gray-200 bg-gray-50"
                  }`}>
                  <div className="flex items-center gap-2">
                    <span draggable onDragStart={() => setDragBlockIdx(idx)}
                      title="드래그해 순서 변경"
                      className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-[#1A2B4A] select-none px-1 text-base leading-none">⠿</span>
                    <span className="text-xs text-gray-400 font-mono w-5 text-center">{idx + 1}</span>
                    <select value={block.type} onChange={(e) => updateBlock(idx, "type", e.target.value)}
                      className="border border-gray-200 px-2 py-1.5 text-xs bg-white focus:outline-none focus:border-[#1A2B4A] rounded">
                      {DETAIL_BLOCK_TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                    <div className="ml-auto flex items-center gap-1">
                      <button type="button" onClick={() => moveBlock(idx, -1)} disabled={idx === 0}
                        className="px-2 py-1 text-xs border border-gray-200 bg-white text-gray-500 hover:bg-gray-100 disabled:opacity-30 rounded">↑</button>
                      <button type="button" onClick={() => moveBlock(idx, 1)} disabled={idx === form.detailBlocks.length - 1}
                        className="px-2 py-1 text-xs border border-gray-200 bg-white text-gray-500 hover:bg-gray-100 disabled:opacity-30 rounded">↓</button>
                      <button type="button" onClick={() => removeBlock(idx)}
                        className="px-2 py-1 text-xs border border-red-200 bg-white text-red-400 hover:bg-red-50 rounded">삭제</button>
                    </div>
                  </div>
                  <textarea value={block.content} onChange={(e) => updateBlock(idx, "content", e.target.value)}
                    rows={3} placeholder="내용을 입력하세요..."
                    className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1A2B4A] resize-none bg-white rounded" />
                  <div className="flex items-center gap-3">
                    <div className="relative w-16 h-16 border border-gray-200 flex-shrink-0 overflow-hidden rounded">
                      {block.imageUrl ? (
                        <>
                          <Image src={block.imageUrl} alt="블록 이미지" fill className="object-cover" sizes="64px" />
                          <button type="button" onClick={() => updateBlock(idx, "imageUrl", "")}
                            className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center hover:bg-red-600 z-10 rounded-full">×</button>
                        </>
                      ) : uploadingBlockIdx === idx ? (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50">
                          <span className="w-4 h-4 border-2 border-gray-300 border-t-[#1A2B4A] rounded-full animate-spin" />
                        </div>
                      ) : (
                        <label htmlFor={`block-img-r-${idx}`}
                          className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                          <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                          </svg>
                        </label>
                      )}
                      <input ref={(el) => { blockImgRefs.current[idx] = el; }} id={`block-img-r-${idx}`}
                        type="file" accept="image/*" onChange={(e) => handleBlockImgFile(e, idx)} className="hidden" />
                    </div>
                    <div className="flex-1">
                      <input type="url" value={block.imageUrl} onChange={(e) => updateBlock(idx, "imageUrl", e.target.value)}
                        placeholder="이미지 URL (선택)"
                        className="w-full border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:border-[#1A2B4A] rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>{/* end right col */}
      </div>{/* end grid */}
    </form>
  );
}
