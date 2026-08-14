// Influencer Hub 사이드바 메뉴 정의 — 단일 소스.
export type IHNavItem = { label: string; href: string; icon: string };

export const IH_NAV: IHNavItem[] = [
  { label: "Dashboard", href: "/admin/influencer-hub/dashboard", icon: "dashboard" },
  { label: "인플루언서", href: "/admin/influencer-hub/influencers", icon: "influencers" },
  { label: "제품 협찬", href: "/admin/influencer-hub/sponsors", icon: "sponsors" },
  { label: "지점 마케팅", href: "/admin/influencer-hub/branch-marketing", icon: "branch" },
  { label: "지점 인플루언서 Pool", href: "/admin/influencer-hub/influencer-pool", icon: "pool" },
  { label: "브랜디드/PPL", href: "/admin/influencer-hub/branded-ppl", icon: "ppl" },
  { label: "설정", href: "/admin/influencer-hub/settings", icon: "settings" },
];

export function getIHNavLabel(pathname: string): string {
  const found = IH_NAV.find((item) => pathname === item.href || pathname.startsWith(item.href + "/"));
  return found?.label ?? "Influencer Hub";
}
