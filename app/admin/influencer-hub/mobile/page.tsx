import IHPageHeader from "@/components/ih/IHPageHeader";
import IHMobileViewerLinkManager from "@/components/ih/mobile/IHMobileViewerLinkManager";
import { getIHMobileViewerTokenInfo } from "@/lib/ih/mobile-viewer";

export default async function IHMobilePage() {
  const info = await getIHMobileViewerTokenInfo();

  return (
    <div>
      <IHPageHeader
        breadcrumb={["Influencer Hub", "모바일 뷰어"]}
        title="모바일 뷰어"
        description="관리자가 로그인 없이 휴대폰에서 인플루언서 허브를 볼 수 있는 공유 링크를 관리합니다."
      />
      <IHMobileViewerLinkManager initialToken={info?.token ?? null} initialIssuedAt={info?.issuedAt ?? null} />
    </div>
  );
}
