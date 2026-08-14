import IHSidebar from "./IHSidebar";
import IHMobilePreview from "./IHMobilePreview";
import { IHMobileSelectionProvider } from "./IHMobileSelectionContext";
import { searchInfluencers } from "@/lib/ih/influencers";

/**
 * Influencer Hub 전용 3단 레이아웃 — Sidebar + Admin Workspace + Mobile Viewer.
 * 기존 관리자(AdminShell)의 2단 사이드바 구조 대신 별도 Shell을 사용한다(Phase 1 결정사항).
 * Mobile Viewer는 "인플루언서 목록 + 상세" 구조라, 특정 인플루언서가 선택되지 않은 기본 상태에서
 * 보여줄 목록을 여기서 한 번 조회해 내려준다(인플루언서 목록 PC 페이지가 자체 필터 결과를
 * Context에 채워주면 그쪽이 우선 사용되고, 그 전까지는 이 기본 목록이 fallback으로 쓰인다).
 * IHMobileSelectionProvider로 감싸, 하위 페이지(인플루언서 상세 등)가 Mobile Viewer에
 * "지금 이 인플루언서를 보여줘"라고 알릴 수 있게 한다.
 */
export default async function IHShell({ children }: { children: React.ReactNode }) {
  const defaultList = await searchInfluencers({ pageSize: 20 });

  return (
    <IHMobileSelectionProvider>
      <div className="flex-1 min-w-0 flex overflow-hidden">
        <IHSidebar />
        <main className="flex-1 min-w-0 overflow-y-auto bg-[#f1f5f9]">
          <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-10">{children}</div>
        </main>
        <IHMobilePreview defaultItems={defaultList.items} defaultTotal={defaultList.total} />
      </div>
    </IHMobileSelectionProvider>
  );
}
