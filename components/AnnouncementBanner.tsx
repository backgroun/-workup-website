import Link from "next/link";
import { Fragment, type ReactNode, type CSSProperties } from "react";
import { Oxanium } from "next/font/google";
import TopbarIcon from "./TopbarIcon";
import { DEFAULT_TOPBAR, safeHref, type TopbarConfig } from "@/lib/topbar";
import type { WeatherMood } from "@/lib/weather";

const oxanium = Oxanium({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

function SmartLink({ href, newTab, className, style, children }: {
  href: string; newTab?: boolean; className?: string; style?: CSSProperties; children: ReactNode;
}) {
  const h = safeHref(href) || "#";
  if (h.startsWith("/") || h.startsWith("#")) {
    return <Link href={h} className={className} style={style}>{children}</Link>;
  }
  return (
    <a href={h} target={newTab ? "_blank" : undefined} rel={newTab ? "noopener noreferrer" : undefined} className={className} style={style}>
      {children}
    </a>
  );
}

// 날씨를 아이콘/문구가 아니라 "탑바 배경 자체"의 색온도·분위기로 추측하게 한다.
// 2겹 구조:
//  1) TONE — 전체 폭에 깔리는 어두운 색온도 틴트. 흰 글자의 명도 대비를 지켜야 하므로
//     배경을 밝게 올리지 않고, 관리자가 정한 어두운 배경색 계열을 유지한 채 색조만 민다.
//     (맑음=따뜻함 / 밤=네이비 / 흐림=중성 회색 / 비=차가운 블루+빗줄기 결 / 눈=차가운 밝은 톤 / 안개=뿌연 회색)
//  2) ACCENT — 글자가 없는 가운데 여백에만 얹는 좀 더 또렷한 분위기 광채. 좌우 텍스트와
//     겹칠 수 있는 좁은 화면(lg 미만)에서는 노출하지 않아 대비 저하를 원천 차단한다.
const WEATHER_TONE: Record<WeatherMood, CSSProperties> = {
  "clear-day": {
    backgroundImage:
      "linear-gradient(180deg, rgba(214,150,70,0.16), rgba(150,96,36,0.12))",
  },
  "clear-night": {
    backgroundImage:
      "linear-gradient(180deg, rgba(30,42,92,0.5), rgba(12,18,48,0.42))",
  },
  cloudy: {
    backgroundImage:
      "linear-gradient(180deg, rgba(176,183,194,0.16), rgba(150,158,170,0.1))",
  },
  rain: {
    // 빗줄기 결(비스듬한 얇은 선) + 차가운 블루 틴트를 겹친다.
    backgroundImage:
      "repeating-linear-gradient(101deg, rgba(214,228,246,0.05) 0px, rgba(214,228,246,0.05) 1px, transparent 1px, transparent 11px), linear-gradient(180deg, rgba(58,84,120,0.34), rgba(26,44,76,0.32))",
  },
  snow: {
    backgroundImage:
      "linear-gradient(180deg, rgba(150,172,206,0.24), rgba(120,142,178,0.16))",
  },
  fog: {
    backgroundImage:
      "linear-gradient(180deg, rgba(190,196,205,0.18), rgba(162,170,182,0.12))",
  },
};

const WEATHER_ACCENT: Record<WeatherMood, CSSProperties> = {
  "clear-day": {
    backgroundImage:
      "radial-gradient(55% 150% at 50% -20%, rgba(255,206,120,0.3), transparent 62%)",
  },
  "clear-night": {
    backgroundImage:
      "radial-gradient(42% 130% at 50% -25%, rgba(184,198,255,0.18), transparent 58%)",
  },
  cloudy: {
    backgroundImage:
      "radial-gradient(70% 170% at 50% 0%, rgba(206,212,221,0.14), transparent 66%)",
  },
  rain: {
    backgroundImage:
      "radial-gradient(60% 150% at 50% -10%, rgba(150,178,214,0.16), transparent 62%)",
  },
  snow: {
    backgroundImage:
      "radial-gradient(60% 150% at 50% -10%, rgba(226,237,252,0.24), transparent 62%)",
  },
  fog: {
    backgroundImage:
      "radial-gradient(95% 210% at 50% 50%, rgba(216,221,227,0.16), transparent 72%)",
  },
};

export default function AnnouncementBanner({
  config,
  weatherMood,
}: {
  config?: TopbarConfig | null;
  weatherMood?: WeatherMood | null;
}) {
  const c = config ?? DEFAULT_TOPBAR;
  if (!c.enabled) return null;

  const pH = c.height;
  const mH = c.mobile_height;
  const pFS = c.font_size;
  const mFS = c.mobile_font_size;
  const pIcon = Math.max(11, Math.round(pH * 0.4));
  const mIcon = Math.max(10, Math.round(mH * 0.4));

  const sharedStyle: CSSProperties = {
    fontWeight: c.font_weight,
    letterSpacing: `${c.letter_spacing}em`,
  };

  const leftInner = (
    <>
      {c.left_icon !== "none" && (
        <TopbarIcon name={c.left_icon} className="wu-tb-icon flex-shrink-0" />
      )}
      <span className={`wu-tb-text ${oxanium.className} whitespace-nowrap`} style={sharedStyle}>
        {c.left_text}
      </span>
    </>
  );

  return (
    <>
      {/* PC/모바일 높이·글자 크기 분리 */}
      <style>{`
        .wu-tb{height:${mH}px}
        .wu-tb-icon{width:${mIcon}px;height:${mIcon}px}
        .wu-tb-text{font-size:${mFS}px}
        @media(min-width:768px){
          .wu-tb{height:${pH}px}
          .wu-tb-icon{width:${pIcon}px;height:${pIcon}px}
          .wu-tb-text{font-size:${pFS}px}
        }
      `}</style>
      <div
        className="wu-tb sticky top-0 z-[60] flex items-center flex-shrink-0 relative overflow-hidden"
        style={{ backgroundColor: c.bg_color, color: c.text_color }}
      >
        {weatherMood && (
          <>
            {/* 전체 폭 색온도 틴트(대비 안전) */}
            <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={WEATHER_TONE[weatherMood]} />
            {/* 가운데 여백 분위기 광채(글자와 겹치지 않는 넓은 화면에서만) */}
            <div aria-hidden="true" className="absolute inset-0 pointer-events-none hidden lg:block" style={WEATHER_ACCENT[weatherMood]} />
          </>
        )}
        <div className="relative z-10 px-[15px] md:px-[70px] w-full flex items-center justify-between gap-4">
          <SmartLink href={c.left_link || "/"} className="flex items-center gap-1.5 min-w-0 hover:opacity-70 active:opacity-50 active:scale-95 touch-manipulation transition-[opacity,transform]">
            {leftInner}
          </SmartLink>

          {c.items.length > 0 && (
            <div className="flex items-center gap-2 md:gap-2.5 flex-shrink-0">
              {c.items.map((it, idx) => (
                <Fragment key={it.id}>
                  {idx > 0 && <span className="text-[10px] opacity-40 select-none">|</span>}
                  <SmartLink
                    href={it.href}
                    newTab={it.newTab}
                    className="flex items-center gap-1 hover:opacity-60 active:opacity-50 active:scale-95 touch-manipulation transition-[opacity,transform] whitespace-nowrap"
                    style={sharedStyle}
                  >
                    {it.icon !== "none" && <TopbarIcon name={it.icon} className="wu-tb-icon flex-shrink-0" />}
                    <span className="wu-tb-text">{it.label}</span>
                  </SmartLink>
                </Fragment>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
