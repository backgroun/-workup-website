// MATE ZONE — /people 하단 릴스(짧은 세로 영상) 섹션 데이터
// 관리자가 site_settings("mate_zone")에서 등록/수정. 미설정·릴스 0개면 공개 페이지에서 섹션을 숨긴다.

export type Reel = {
  id: string;
  video_url: string;    // ImageKit 등 업로드된 영상 URL (mp4)
  caption?: string;     // 영상 설명(선택)
  link?: string;        // 인스타그램 등 원본 링크(선택)
};

export type MateZoneConfig = {
  title: string;
  subtitle: string;
  reels: Reel[];
};

export const DEFAULT_MATE_ZONE: MateZoneConfig = {
  title: "MATE ZONE",
  subtitle: "현장의 순간들 — 워크업 메이트들의 짧은 영상.",
  reels: [],
};

// 저장된 JSON(부분/구버전 가능)을 안전한 완전체로 보정한다.
export function normalizeMateZone(raw: Partial<MateZoneConfig> | null | undefined): MateZoneConfig {
  const c = raw ?? {};
  const reels = Array.isArray(c.reels)
    ? c.reels
        .filter((r): r is Reel => !!r && typeof r === "object" && typeof r.video_url === "string" && r.video_url.trim() !== "")
        .map((r, i) => ({
          id: typeof r.id === "string" && r.id ? r.id : `reel-${i}`,
          video_url: r.video_url.trim(),
          caption: typeof r.caption === "string" ? r.caption.trim() : undefined,
          link: typeof r.link === "string" ? r.link.trim() : undefined,
        }))
    : [];

  return {
    title: typeof c.title === "string" && c.title.trim() ? c.title.trim() : DEFAULT_MATE_ZONE.title,
    subtitle: typeof c.subtitle === "string" ? c.subtitle : DEFAULT_MATE_ZONE.subtitle,
    reels,
  };
}
