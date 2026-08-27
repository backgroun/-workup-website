// Influencer Hub 사이드바 메뉴 정의 — 단일 소스.
export type IHNavItem = { label: string; href: string; icon: string };

export const IH_NAV: IHNavItem[] = [
  { label: "Dashboard", href: "/admin/influencer-hub/dashboard", icon: "dashboard" },
  { label: "인플루언서", href: "/admin/influencer-hub/influencers", icon: "influencers" },
  { label: "제품 협찬", href: "/admin/influencer-hub/sponsors", icon: "sponsors" },
  { label: "지점 마케팅", href: "/admin/influencer-hub/branch-marketing", icon: "branch" },
  { label: "브랜디드/PPL", href: "/admin/influencer-hub/branded-ppl", icon: "ppl" },
  // 설정 메뉴는 당장 쓸 일이 없어 메뉴에서만 제외한다(페이지/기능은 그대로 남겨둠 — 필요해지면 이 줄만 복구).
];

export function getIHNavLabel(pathname: string): string {
  const found = IH_NAV.find((item) => pathname === item.href || pathname.startsWith(item.href + "/"));
  return found?.label ?? "Influencer Hub";
}
