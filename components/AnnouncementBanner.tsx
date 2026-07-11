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

// 무드별로 관리자가 지정한 배경색(bg_color) 위에 얹는 옅은 톤 그라데이션.
// mix-blend-mode는 배경이 아주 어둡거나 채도가 높으면 효과가 거의 사라지므로,
// 배경 밝기와 무관하게 항상 일정하게 보이는 일반 알파 블렌딩을 사용한다.
const WEATHER_OVERLAY: Record<WeatherMood, CSSProperties> = {
  "clear-day": {
    backgroundImage: "linear-gradient(135deg, rgba(255,196,102,0.16), rgba(255,196,102,0) 60%)",
  },
  "clear-night": {
    backgroundImage: "linear-gradient(135deg, rgba(12,18,58,0.32), rgba(12,18,58,0.06))",
  },
  cloudy: {
    backgroundImage: "linear-gradient(135deg, rgba(190,196,206,0.2), rgba(190,196,206,0.04))",
  },
  rain: {
    backgroundImage: "linear-gradient(160deg, rgba(90,120,160,0.1), rgba(50,80,125,0.26))",
  },
  snow: {
    backgroundImage: "linear-gradient(135deg, rgba(255,255,255,0.28), rgba(255,255,255,0.06))",
  },
  fog: {
    backgroundImage: "linear-gradient(135deg, rgba(225,228,232,0.22), rgba(225,228,232,0.06))",
  },
};

// 톤 그라데이션만으로는 "무슨 날씨인지" 형태가 안 읽혀서, TopbarIcon과 동일한
// 얇은 선 스타일의 작은 날씨 모티프를 함께 얹는다 — 여전히 장식용(aria-hidden)이며
// 데스크톱 여백에만 노출해 좁은 화면에서 겹침·혼잡을 피한다.
const WEATHER_MOTIF_PATHS: Record<WeatherMood, ReactNode> = {
  "clear-day": (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2.5 12h2M19.5 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </>
  ),
  "clear-night": <path d="M20.5 14.7A8.2 8.2 0 019.3 3.5a8.2 8.2 0 1011.2 11.2z" />,
  cloudy: <path d="M6.5 18a4 4 0 01-.5-7.97 5 5 0 019.6-2.03A4 4 0 0118 18H6.5z" />,
  rain: (
    <>
      <path d="M6.5 14a4 4 0 01-.5-7.97 5 5 0 019.6-2.03A4 4 0 0118 14H6.5z" />
      <path d="M8 17.5l-1 3M12 17.5l-1 3M16 17.5l-1 3" />
    </>
  ),
  snow: <path d="M12 3v18M4.5 7.5l15 9M4.5 16.5l15-9" />,
  fog: <path d="M3 9h14M6 13h15M3 17h11" />,
};

function WeatherMotif({ mood, style }: { mood: WeatherMood; style?: CSSProperties }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {WEATHER_MOTIF_PATHS[mood]}
    </svg>
  );
}

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
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={WEATHER_OVERLAY[weatherMood]} />
        )}
        <div className="relative z-10 px-[15px] md:px-[70px] w-full flex items-center justify-between gap-4">
          <SmartLink href={c.left_link || "/"} className="flex items-center gap-1.5 min-w-0 hover:opacity-70 active:opacity-50 active:scale-95 touch-manipulation transition-[opacity,transform]">
            {leftInner}
          </SmartLink>

          {weatherMood && (
            <div aria-hidden="true" className="hidden lg:flex flex-1 items-center justify-center gap-5 overflow-hidden">
              <WeatherMotif mood={weatherMood} style={{ width: 18, height: 18, opacity: 0.55 }} />
              <WeatherMotif mood={weatherMood} style={{ width: 13, height: 13, opacity: 0.35 }} />
            </div>
          )}

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
