import Link from "next/link";
import { createAdminClient } from "@/lib/supabase-server";

type QuickCategoryItem = {
  id: string;
  name: string;
  emoji: string;
  icon_url: string;
  bg_color: string;
  link: string;
  open_in_new_tab: boolean;
  is_visible: boolean;
};

type QuickCategoriesConfig = {
  is_section_visible: boolean;
  display_count: number;
  pc_columns?: number;
  pc_gap?: number;        // 구버전(단일 간격) — 하위호환 fallback
  pc_gap_x?: number;      // 가로(열) 간격
  pc_gap_y?: number;      // 세로(행) 간격
  mobile_columns?: number;
  mobile_gap?: number;    // 구버전(단일 간격) — 하위호환 fallback
  mobile_gap_x?: number;  // 가로(열) 간격
  mobile_gap_y?: number;  // 세로(행) 간격
  items: QuickCategoryItem[];
};

// 레이아웃 기본값 (기존 저장 데이터에 필드가 없을 때 사용)
const DEFAULT_PC_COLUMNS = 6;
const DEFAULT_PC_GAP = 32;
const DEFAULT_MOBILE_COLUMNS = 4;
const DEFAULT_MOBILE_GAP = 16;

const FALLBACK: QuickCategoriesConfig = {
  is_section_visible: true,
  display_count: 6,
  pc_columns: DEFAULT_PC_COLUMNS,
  pc_gap: DEFAULT_PC_GAP,
  mobile_columns: DEFAULT_MOBILE_COLUMNS,
  mobile_gap: DEFAULT_MOBILE_GAP,
  items: [
    { id: "1", name: "공용",  emoji: "👥", icon_url: "", bg_color: "#f0f0f0", link: "/products?category=공용", open_in_new_tab: false, is_visible: true },
    { id: "2", name: "남성",  emoji: "👔", icon_url: "", bg_color: "#f0f0f0", link: "/products?category=남성", open_in_new_tab: false, is_visible: true },
    { id: "3", name: "여성",  emoji: "👗", icon_url: "", bg_color: "#f0f0f0", link: "/products?category=여성", open_in_new_tab: false, is_visible: true },
    { id: "4", name: "소품",  emoji: "🎒", icon_url: "", bg_color: "#f0f0f0", link: "/products?category=소품", open_in_new_tab: false, is_visible: true },
    { id: "5", name: "현장",  emoji: "⛏️", icon_url: "", bg_color: "#f0f0f0", link: "/products?category=현장", open_in_new_tab: false, is_visible: true },
    { id: "6", name: "일상",  emoji: "👕", icon_url: "", bg_color: "#f0f0f0", link: "/products?category=일상", open_in_new_tab: false, is_visible: true },
  ],
};

async function getConfig(): Promise<QuickCategoriesConfig> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("site_settings")
      .select("config")
      .eq("section", "quick_categories")
      .maybeSingle();
    if (data?.config) return data.config as QuickCategoriesConfig;
  } catch {
    // DB 실패 시 fallback
  }
  return FALLBACK;
}

export default async function HomeCategoryGrid() {
  const cfg = await getConfig();

  if (!cfg.is_section_visible) return null;

  const visible = cfg.items
    .filter((c) => c.is_visible)
    .slice(0, cfg.display_count);

  // 관리자 레이아웃 설정 (값 없으면 기본값). 가로/세로 미설정 시 구버전 단일 간격 → 기본값 순으로 fallback
  const pcColumns = cfg.pc_columns ?? DEFAULT_PC_COLUMNS;
  const pcGapX = cfg.pc_gap_x ?? cfg.pc_gap ?? DEFAULT_PC_GAP;
  const pcGapY = cfg.pc_gap_y ?? cfg.pc_gap ?? DEFAULT_PC_GAP;
  const mobileColumns = cfg.mobile_columns ?? DEFAULT_MOBILE_COLUMNS;
  const mobileGapX = cfg.mobile_gap_x ?? cfg.mobile_gap ?? DEFAULT_MOBILE_GAP;
  const mobileGapY = cfg.mobile_gap_y ?? cfg.mobile_gap ?? DEFAULT_MOBILE_GAP;

  return (
    <section className="bg-white py-10 md:py-14">
      <div className="px-[15px] md:px-[70px]">

        {/* PC */}
        <div
          className="hidden md:grid items-start"
          style={{
            gridTemplateColumns: `repeat(${pcColumns}, max-content)`,
            justifyContent: "center",
            columnGap: `${pcGapX}px`,
            rowGap: `${pcGapY}px`,
          }}
        >
          {visible.map((cat) => (
            <Link
              key={cat.id}
              href={cat.link || "/products"}
              target={cat.open_in_new_tab ? "_blank" : undefined}
              rel={cat.open_in_new_tab ? "noopener noreferrer" : undefined}
              className="flex flex-col items-center gap-2.5 group"
            >
              <div
                className="w-[90px] h-[90px] rounded-full flex items-center justify-center transition-opacity group-hover:opacity-80 overflow-hidden"
                style={{ backgroundColor: cat.bg_color || "#f0f0f0" }}
              >
                {cat.icon_url && !cat.icon_url.startsWith("data:") ? (
                  <img
                    src={cat.icon_url}
                    alt={cat.name}
                    width={56}
                    height={56}
                    className="object-contain"
                  />
                ) : (
                  <span className="text-3xl leading-none select-none">{cat.emoji}</span>
                )}
              </div>
              <span className="text-[12px] text-[#1A2B4A] text-center leading-tight whitespace-pre-line">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>

        {/* 모바일 */}
        <div
          className="md:hidden grid"
          style={{
            gridTemplateColumns: `repeat(${mobileColumns}, minmax(0, 1fr))`,
            columnGap: `${mobileGapX}px`,
            rowGap: `${mobileGapY}px`,
          }}
        >
          {visible.map((cat) => (
            <Link
              key={cat.id}
              href={cat.link || "/products"}
              target={cat.open_in_new_tab ? "_blank" : undefined}
              rel={cat.open_in_new_tab ? "noopener noreferrer" : undefined}
              className="flex flex-col items-center gap-2 group"
            >
              <div
                className="w-[68px] h-[68px] rounded-full flex items-center justify-center transition-opacity group-hover:opacity-80 overflow-hidden"
                style={{ backgroundColor: cat.bg_color || "#f0f0f0" }}
              >
                {cat.icon_url && !cat.icon_url.startsWith("data:") ? (
                  <img
                    src={cat.icon_url}
                    alt={cat.name}
                    width={44}
                    height={44}
                    className="object-contain"
                  />
                ) : (
                  <span className="text-2xl leading-none select-none">{cat.emoji}</span>
                )}
              </div>
              <span className="text-[11px] text-[#1A2B4A] text-center leading-tight whitespace-pre-line">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
