import IHShell from "@/components/ih/IHShell";

// 인증은 상위 app/admin/layout.tsx의 getAdminMember()에서 이미 처리됨.
// IH 전용 권한(ADMIN/MARKETING/BRANCH/VIEWER)은 Phase 12에서 추가한다.
export default function InfluencerHubLayout({ children }: { children: React.ReactNode }) {
  return <IHShell>{children}</IHShell>;
}
