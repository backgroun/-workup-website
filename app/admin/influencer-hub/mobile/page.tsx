import IHMobileShell from "@/components/ih/mobile/IHMobileShell";
import { getIHMobileHomeSummary } from "@/lib/ih/dashboard";

// 실제 모바일 Viewer 페이지 — PC 우측 Mobile Viewer(IHMobilePreview)와
// 동일한 IHMobileShell 컴포넌트 + 같은 DB 요약을 사용한다(기획서 9번 원칙: 동일 데이터 소스).
export default async function IHMobilePage() {
  const summary = await getIHMobileHomeSummary();
  return (
    <div className="max-w-md mx-auto h-full">
      <IHMobileShell activeLabel="홈" summary={summary} />
    </div>
  );
}
