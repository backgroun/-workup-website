import Link from "next/link";
import { Fragment, type ReactNode, type CSSProperties } from "react";
import { Oxanium } from "next/font/google";
import TopbarIcon from "./TopbarIcon";
import { DEFAULT_TOPBAR, safeHref, type TopbarConfig } from "@/lib/topbar";

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

export default function AnnouncementBanner({ config }: { config?: TopbarConfig | null }) {
  const c = config ?? DEFAULT_TOPBAR;
  if (!c.enabled) return null;

  const iconPx = Math.max(11, Math.round(c.height * 0.4));
  const textStyle = {
    fontSize: c.font_size,
    fontWeight: c.font_weight,
    letterSpacing: `${c.letter_spacing}em`,
  };

  const leftInner = (
    <>
      {c.left_icon !== "none" && <TopbarIcon name={c.left_icon} style={{ width: iconPx, height: iconPx }} className="flex-shrink-0" />}
      <span className={`${oxanium.className} whitespace-nowrap`} style={textStyle}>
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
        {c.left_link ? (
          <SmartLink href={c.left_link} className="flex items-center gap-1.5 min-w-0 hover:opacity-70 active:opacity-50 active:scale-95 touch-manipulation transition-[opacity,transform]">
            {leftInner}
          </SmartLink>
        ) : (
          <div className="flex items-center gap-1.5 min-w-0">{leftInner}</div>
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
                  style={textStyle}
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
