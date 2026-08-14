// /admin/influencer-hub/mobile 전용 layout — 상위 influencer-hub/layout.tsx의 IHShell(3단 PC 레이아웃)을
// 그대로 통과시키지 않고, 여기서는 화면 전체를 모바일 페이지로 채운다.
// (Next.js는 상위 layout을 항상 감싸므로, 이 페이지는 route group 대신 아래처럼 전체화면 컨테이너로 덮는다.)
export default function IHMobileLayout({ children }: { children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 bg-white">{children}</div>;
}
