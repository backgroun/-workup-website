import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { Oxanium } from "next/font/google";
import TopbarIcon from "./TopbarIcon";
import { DEFAULT_TOPBAR, safeHref, type TopbarConfig } from "@/lib/topbar";

const oxanium = Oxanium({ subsets: ["latin"], weight: ["600"] });

// 내부 경로(/·#)는 next/link, 그 외(tel:·mailto:·http…)는 일반 <a>.
// safeHref 로 한 번 더 스킴 검증(javascript:/data: 등 차단).
function SmartLink({ href, newTab, className, children }: {
  href: string; newTab?: boolean; className?: string; children: ReactNode;
}) {
  const h = safeHref(href) || "#";
  if (h.startsWith("/") || h.startsWith("#")) {
    return <Link href={h} className={className}>{children}</Link>;
  }
  return (
    <a href={h} target={newTab ? "_blank" : undefined} rel={newTab ? "noopener noreferrer" : undefined} className={className}>
      {children}
    </a>
  );
}

// 상단 탑바(공지바). 설정은 app/layout.tsx 가 서버에서 읽어 prop 으로 내려준다.
// 높이가 바뀌면 layout 이 <html> 의 --wu-topbar-h 도 함께 갱신 → 헤더 sticky 오프셋이 따라온다.
export default function AnnouncementBanner({ config }: { config?: TopbarConfig | null }) {
  const c = config ?? DEFAULT_TOPBAR;
  if (!c.enabled) return null;

  const iconPx = Math.max(11, Math.round(c.height * 0.4));

  const leftInner = (
    <>
      {c.left_icon !== "none" && <TopbarIcon name={c.left_icon} style={{ width: iconPx, height: iconPx }} className="flex-shrink-0" />}
      <span className={`${oxanium.className} text-[9px] md:text-[11px] font-semibold tracking-[0.14em] whitespace-nowrap`}>
        {c.left_text}
      </span>
    </>
  );

  return (
    <div
      className="sticky top-0 z-[60] flex items-center"
      style={{ height: c.height, backgroundColor: c.bg_color, color: c.text_color }}
    >
      <div className="px-[15px] md:px-[70px] w-full flex items-center justify-between gap-4">
        {/* 좌측 슬로건 */}
        {c.left_link ? (
          <SmartLink href={c.left_link} className="flex items-center gap-1.5 min-w-0 hover:opacity-70 transition-opacity">
            {leftInner}
          </SmartLink>
        ) : (
          <div className="flex items-center gap-1.5 min-w-0">{leftInner}</div>
        )}

        {/* 우측 링크들(텍스트 + 아이콘) */}
        {c.items.length > 0 && (
          <div className="flex items-center gap-2 md:gap-2.5 flex-shrink-0">
            {c.items.map((it, idx) => (
              <Fragment key={it.id}>
                {idx > 0 && <span className="text-[10px] opacity-40 select-none">|</span>}
                <SmartLink
                  href={it.href}
                  newTab={it.newTab}
                  className="flex items-center gap-1 text-[11px] font-bold hover:opacity-60 transition-opacity whitespace-nowrap"
                >
                  {it.icon !== "none" && <TopbarIcon name={it.icon} style={{ width: iconPx, height: iconPx }} className="flex-shrink-0" />}
                  {it.label}
                </SmartLink>
              </Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
