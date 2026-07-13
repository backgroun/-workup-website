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
    backgroundImage: "linear-gradient(180deg, rgba(226,152,58,0.26), rgba(150,92,30,0.18))",
  },
  "clear-night": {
    backgroundImage: "linear-gradient(180deg, rgba(28,42,104,0.62), rgba(10,16,52,0.52))",
  },
  cloudy: {
    backgroundImage: "linear-gradient(180deg, rgba(182,190,202,0.26), rgba(150,158,172,0.16))",
  },
  rain: {
    backgroundImage: "linear-gradient(180deg, rgba(52,82,122,0.5), rgba(20,40,76,0.46))",
  },
  snow: {
    backgroundImage: "linear-gradient(180deg, rgba(154,178,214,0.32), rgba(118,142,182,0.22))",
  },
  fog: {
    backgroundImage: "linear-gradient(180deg, rgba(196,202,212,0.28), rgba(160,168,182,0.18))",
  },
};

// 애니메이션 결. background-size로 타일 격자를 고정하고, 그 정수 배수만큼
// background-position을 이동시켜 이음매 없이(seamless) 반복되게 한다.
// 비·눈은 ::after(먼 층)+::before(가까운 층) 2겹으로 원근감·밀도를 준다.
const WEATHER_FX_CSS = `
  .wx::after{content:"";position:absolute;inset:0;pointer-events:none;}
  .wx-rain::before,.wx-snow::before{content:"";position:absolute;inset:0;pointer-events:none;}

  /* 비 — 촘촘한 빗줄기가 쏟아짐(먼 층 + 가까운 층) */
  .wx-rain::after{
    background-image:
      radial-gradient(1px 7px at 10% 20%, rgba(216,232,252,0.55), transparent 72%),
      radial-gradient(1px 8px at 30% 60%, rgba(216,232,252,0.48), transparent 72%),
      radial-gradient(1px 7px at 50% 30%, rgba(216,232,252,0.55), transparent 72%),
      radial-gradient(1px 8px at 70% 66%, rgba(216,232,252,0.5), transparent 72%),
      radial-gradient(1px 7px at 90% 40%, rgba(216,232,252,0.5), transparent 72%);
    background-size:24px 28px;
    animation:wx-rain-a 0.42s linear infinite;
  }
  .wx-rain::before{
    background-image:
      radial-gradient(1.4px 11px at 20% 15%, rgba(224,238,255,0.62), transparent 72%),
      radial-gradient(1.4px 12px at 62% 45%, rgba(224,238,255,0.58), transparent 72%),
      radial-gradient(1.4px 11px at 88% 70%, rgba(224,238,255,0.6), transparent 72%);
    background-size:30px 34px;
    animation:wx-rain-b 0.3s linear infinite;
  }
  @keyframes wx-rain-a{to{background-position:0 28px;}}
  @keyframes wx-rain-b{to{background-position:0 34px;}}

  /* 눈 — 눈송이가 함박눈처럼 내림(먼 층 + 가까운 층) */
  .wx-snow::after{
    background-image:
      radial-gradient(2.2px 2.2px at 12% 20%, rgba(255,255,255,0.95), transparent 62%),
      radial-gradient(1.8px 1.8px at 38% 44%, rgba(255,255,255,0.85), transparent 62%),
      radial-gradient(2px 2px at 60% 26%, rgba(255,255,255,0.92), transparent 62%),
      radial-gradient(1.7px 1.7px at 82% 52%, rgba(255,255,255,0.82), transparent 62%),
      radial-gradient(2px 2px at 26% 72%, rgba(255,255,255,0.9), transparent 62%),
      radial-gradient(1.8px 1.8px at 70% 82%, rgba(255,255,255,0.85), transparent 62%);
    background-size:40px 44px;
    animation:wx-snow-a 3.6s linear infinite;
  }
  .wx-snow::before{
    background-image:
      radial-gradient(3.4px 3.4px at 22% 30%, rgba(255,255,255,0.98), transparent 60%),
      radial-gradient(3px 3px at 66% 58%, rgba(255,255,255,0.95), transparent 60%),
      radial-gradient(3.2px 3.2px at 88% 24%, rgba(255,255,255,0.96), transparent 60%);
    background-size:64px 60px;
    animation:wx-snow-b 2.6s linear infinite;
  }
  @keyframes wx-snow-a{to{background-position:0 44px;}}
  @keyframes wx-snow-b{to{background-position:0 60px;}}

  /* 흐림 — 구름 덩어리가 또렷하게 옆으로 흐름 */
  .wx-cloudy::after{
    background-image:
      radial-gradient(58% 90% at 28% 42%, rgba(226,231,238,0.26), transparent 68%),
      radial-gradient(48% 78% at 68% 56%, rgba(226,231,238,0.18), transparent 70%);
    background-size:260px 100%;
    animation:wx-drift 18s linear infinite;
  }
  @keyframes wx-drift{to{background-position:-260px 0;}}

  /* 안개 — 뿌연 띠가 은은하지만 또렷하게 흐름 */
  .wx-fog::after{
    background-image:linear-gradient(90deg, transparent, rgba(216,221,227,0.26) 40%, rgba(216,221,227,0.26) 60%, transparent);
    background-size:320px 100%;
    animation:wx-drift-fog 22s linear infinite;
  }
  @keyframes wx-drift-fog{to{background-position:-320px 0;}}

  /* 맑음(낮) — 햇살 광채가 크고 또렷하게 맥동 */
  .wx-clear-day::after{
    background-image:radial-gradient(62% 170% at 50% -15%, rgba(255,216,140,0.5), transparent 60%);
    animation:wx-sun 4.5s ease-in-out infinite;
  }
  @keyframes wx-sun{0%,100%{opacity:0.55;transform:scale(1);}50%{opacity:1;transform:scale(1.16);}}

  /* 맑음(밤) — 촘촘한 별빛이 반짝(트윈클) */
  .wx-clear-night::after{
    background-image:
      radial-gradient(1.6px 1.6px at 12% 30%, rgba(210,222,255,1), transparent 60%),
      radial-gradient(1.2px 1.2px at 30% 62%, rgba(210,222,255,0.9), transparent 60%),
      radial-gradient(1.8px 1.8px at 46% 24%, rgba(210,222,255,1), transparent 60%),
      radial-gradient(1.2px 1.2px at 60% 66%, rgba(210,222,255,0.85), transparent 60%),
      radial-gradient(1.6px 1.6px at 74% 34%, rgba(210,222,255,0.95), transparent 60%),
      radial-gradient(1.2px 1.2px at 88% 58%, rgba(210,222,255,0.88), transparent 60%),
      radial-gradient(1.4px 1.4px at 20% 78%, rgba(210,222,255,0.9), transparent 60%);
    background-size:150px 100%;
    animation:wx-twinkle 2.6s ease-in-out infinite;
  }
  @keyframes wx-twinkle{0%,100%{opacity:0.4;}50%{opacity:1;}}

  @media(prefers-reduced-motion:reduce){
    .wx::after,.wx-rain::before,.wx-snow::before{animation:none;}
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
