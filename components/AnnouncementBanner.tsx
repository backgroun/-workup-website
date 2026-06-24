"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Fragment, type ReactNode, type CSSProperties } from "react";
import TopbarIcon from "./TopbarIcon";
import { DEFAULT_TOPBAR, safeHref, normalizeTopbar, type TopbarConfig } from "@/lib/topbar";

const OXANIUM: CSSProperties = { fontFamily: "'Oxanium', sans-serif" };

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

// 상단 탑바(공지바).
// SSR 초기값(serverConfig)으로 즉시 렌더링 → 마운트 후 API에서 최신값을 가져와 반영.
// 이렇게 하면 Next.js 클라이언트 라우터 캐시나 iOS Safari 캐시와 무관하게
// 관리자 저장 직후 새로고침 한 번으로 반영됨.
export default function AnnouncementBanner({ config: serverConfig }: { config?: TopbarConfig | null }) {
  const [c, setC] = useState<TopbarConfig>(serverConfig ?? DEFAULT_TOPBAR);

  useEffect(() => {
    fetch("/api/admin/site-settings/topbar", { cache: "no-store" })
      .then(r => r.ok ? r.json() : null)
      .then(raw => {
        if (!raw) return;
        const fresh = normalizeTopbar(raw);
        setC(fresh);
        // 헤더 sticky 오프셋이 참조하는 CSS 변수도 클라이언트에서 갱신
        document.documentElement.style.setProperty(
          "--wu-topbar-h",
          fresh.enabled ? `${fresh.height}px` : "0px"
        );
      })
      .catch(() => {});
  }, []);

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
      <span className="whitespace-nowrap" style={{ ...OXANIUM, ...textStyle }}>
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
