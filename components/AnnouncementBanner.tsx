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

// 날씨를 아이콘/문구가 아니라 "탑바 배경 자체"로 표현한다.
// 2겹 구조:
//  1) TONE(정적) — 전체 폭에 깔리는 어두운 색온도 틴트. 흰 글자 명도 대비를 지키려
//     배경을 밝게 올리지 않고 색조만 민다. 관리자가 정한 어두운 배경색 계열은 유지된다.
//  2) FX(애니메이션) — 그 위에서 실제로 움직이는 결(비 내림·눈 내림·구름/안개 흐름·
//     햇살 맥동·별 반짝임). 아래 WEATHER_FX_CSS의 .wx-<mood>::after 로 구현하며,
//     prefers-reduced-motion 사용자에겐 애니메이션을 끄고 정적 틴트만 남긴다.
//     빛 요소는 흰 글자보다 z-index가 낮아(본문 z-10) 글자 위를 덮지 않는다.
const WEATHER_TONE: Record<WeatherMood, CSSProperties> = {
  "clear-day": {
    backgroundImage: "linear-gradient(180deg, rgba(214,150,70,0.18), rgba(150,96,36,0.13))",
  },
  "clear-night": {
    backgroundImage: "linear-gradient(180deg, rgba(30,42,92,0.5), rgba(12,18,48,0.42))",
  },
  cloudy: {
    backgroundImage: "linear-gradient(180deg, rgba(176,183,194,0.18), rgba(150,158,170,0.11))",
  },
  rain: {
    backgroundImage: "linear-gradient(180deg, rgba(58,84,120,0.34), rgba(26,44,76,0.32))",
  },
  snow: {
    backgroundImage: "linear-gradient(180deg, rgba(150,172,206,0.24), rgba(120,142,178,0.16))",
  },
  fog: {
    backgroundImage: "linear-gradient(180deg, rgba(190,196,205,0.18), rgba(162,170,182,0.12))",
  },
};

// 애니메이션 결. background-size로 타일 격자를 고정하고, 그 정수 배수만큼
// background-position을 이동시켜 이음매 없이(seamless) 반복되게 한다.
const WEATHER_FX_CSS = `
  .wx::after{content:"";position:absolute;inset:0;pointer-events:none;}

  /* 비 — 가늘고 긴 빗방울(세로 타원)이 바 전체를 채우며 아래로 내림 */
  .wx-rain::after{
    background-image:
      radial-gradient(1px 6px at 12% 22%, rgba(214,230,250,0.5), transparent 70%),
      radial-gradient(1px 7px at 34% 60%, rgba(214,230,250,0.42), transparent 70%),
      radial-gradient(1px 6px at 56% 30%, rgba(214,230,250,0.5), transparent 70%),
      radial-gradient(1px 7px at 78% 66%, rgba(214,230,250,0.44), transparent 70%),
      radial-gradient(1px 6px at 24% 86%, rgba(214,230,250,0.4), transparent 70%),
      radial-gradient(1px 7px at 68% 92%, rgba(214,230,250,0.44), transparent 70%);
    background-size:38px 32px;
    animation:wx-rain 0.5s linear infinite;
  }
  @keyframes wx-rain{to{background-position:0 32px;}}

  /* 눈 — 눈송이가 크고 또렷하게 천천히 내림 */
  .wx-snow::after{
    background-image:
      radial-gradient(2.6px 2.6px at 15% 20%, rgba(255,255,255,0.95), transparent 62%),
      radial-gradient(2px 2px at 45% 42%, rgba(255,255,255,0.82), transparent 62%),
      radial-gradient(2.4px 2.4px at 72% 28%, rgba(255,255,255,0.92), transparent 62%),
      radial-gradient(1.9px 1.9px at 30% 64%, rgba(255,255,255,0.8), transparent 62%),
      radial-gradient(2.6px 2.6px at 62% 74%, rgba(255,255,255,0.94), transparent 62%),
      radial-gradient(1.8px 1.8px at 88% 60%, rgba(255,255,255,0.78), transparent 62%);
    background-size:52px 52px;
    animation:wx-snow 4.2s linear infinite;
  }
  @keyframes wx-snow{to{background-position:0 52px;}}

  /* 흐림 — 옅은 구름 덩어리가 옆으로 흐름 */
  .wx-cloudy::after{
    background-image:
      radial-gradient(60% 80% at 30% 40%, rgba(222,227,234,0.16), transparent 70%),
      radial-gradient(50% 70% at 72% 58%, rgba(222,227,234,0.11), transparent 70%);
    background-size:300px 100%;
    animation:wx-drift 26s linear infinite;
  }

  /* 안개 — 뿌연 띠가 더 느리고 은은하게 흐름 */
  .wx-fog::after{
    background-image:linear-gradient(90deg, transparent, rgba(214,219,225,0.17) 42%, rgba(214,219,225,0.17) 58%, transparent);
    background-size:360px 100%;
    animation:wx-drift 34s linear infinite;
  }
  @keyframes wx-drift{to{background-position:-360px 0;}}

  /* 맑음(낮) — 햇살 광채가 부드럽게 맥동 */
  .wx-clear-day::after{
    background-image:radial-gradient(52% 150% at 50% -20%, rgba(255,214,140,0.34), transparent 60%);
    animation:wx-sun 5.5s ease-in-out infinite;
  }
  @keyframes wx-sun{0%,100%{opacity:0.5;transform:scale(1);}50%{opacity:1;transform:scale(1.1);}}

  /* 맑음(밤) — 별빛이 반짝(트윈클) */
  .wx-clear-night::after{
    background-image:
      radial-gradient(1.4px 1.4px at 18% 32%, rgba(206,218,255,0.95), transparent 60%),
      radial-gradient(1px 1px at 58% 60%, rgba(206,218,255,0.8), transparent 60%),
      radial-gradient(1.6px 1.6px at 80% 26%, rgba(206,218,255,0.95), transparent 60%),
      radial-gradient(1px 1px at 40% 72%, rgba(206,218,255,0.7), transparent 60%),
      radial-gradient(1.2px 1.2px at 33% 20%, rgba(206,218,255,0.85), transparent 60%);
    background-size:200px 100%;
    animation:wx-twinkle 3.4s ease-in-out infinite;
  }
  @keyframes wx-twinkle{0%,100%{opacity:0.35;}50%{opacity:0.95;}}

  @media(prefers-reduced-motion:reduce){
    .wx::after{animation:none;}
  }
`;

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
        ${WEATHER_FX_CSS}
      `}</style>
      <div
        className="wu-tb sticky top-0 z-[60] flex items-center flex-shrink-0 relative overflow-hidden"
        style={{ backgroundColor: c.bg_color, color: c.text_color }}
      >
        {weatherMood && (
          // 정적 색온도 틴트(배경) + ::after 애니메이션 결(비/눈/구름/안개/햇살/별)
          <div
            aria-hidden="true"
            className={`wx wx-${weatherMood} absolute inset-0 pointer-events-none`}
            style={WEATHER_TONE[weatherMood]}
          />
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
