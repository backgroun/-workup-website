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

// 무드별로 관리자가 지정한 배경색(bg_color) 위에 얹는 아주 옅은 결 — 배경 밝기와 무관하게
// 자연스럽게 섞이도록 mix-blend-mode를 사용한다. 색상 자체는 바꾸지 않고 은은한 톤만 더한다.
const WEATHER_OVERLAY: Record<WeatherMood, CSSProperties> = {
  "clear-day": {
    backgroundImage: "linear-gradient(135deg, rgba(255,255,255,0.16), rgba(255,255,255,0) 55%)",
    mixBlendMode: "soft-light",
  },
  "clear-night": {
    backgroundImage: "linear-gradient(135deg, rgba(10,15,40,0.03), rgba(10,15,40,0.18))",
    mixBlendMode: "multiply",
  },
  cloudy: {
    backgroundImage: "linear-gradient(135deg, rgba(200,205,215,0.14), rgba(200,205,215,0.02))",
    mixBlendMode: "soft-light",
  },
  rain: {
    backgroundImage: "linear-gradient(160deg, rgba(255,255,255,0.02), rgba(60,90,130,0.18))",
    mixBlendMode: "multiply",
  },
  snow: {
    backgroundImage: "linear-gradient(135deg, rgba(255,255,255,0.22), rgba(255,255,255,0.03))",
    mixBlendMode: "soft-light",
  },
  fog: {
    backgroundImage: "linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.05))",
    mixBlendMode: "soft-light",
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
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={WEATHER_OVERLAY[weatherMood]} />
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
