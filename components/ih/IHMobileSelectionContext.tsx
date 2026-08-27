"use client";
import { createContext, useContext, useState, useCallback, useMemo } from "react";
import type { IHInfluencerMobileSummary, IHInfluencerListItem } from "@/lib/ih/influencers";
import type { IHSponsorListRow, IHBranchMarketingListRow, IHBrandedPplListRow } from "@/lib/ih/collabs";
import type { IHDashboardData, IHIntegratedDashboardData } from "@/lib/ih/dashboard";

export type IHListMeta = { total: number; hasActiveFilters: boolean };

type IHMobileSelectionValue = {
  selectedInfluencer: IHInfluencerMobileSummary | null;
  selectInfluencer: (summary: IHInfluencerMobileSummary | null) => void;
  /** 인플루언서 목록 페이지의 현재 필터 결과 — Mobile Viewer가 별도 조회 없이 그대로 재사용한다. */
  listItems: IHInfluencerListItem[] | null;
  listMeta: IHListMeta | null;
  setListState: (items: IHInfluencerListItem[] | null, meta: IHListMeta | null) => void;
  /** 제품 협찬 목록 페이지가 열려있을 때 그 필터 결과 — 우선순위상 인플루언서 목록보다 위(협찬 페이지에 있는 동안은 협찬 목록을 보여준다). */
  sponsorListItems: IHSponsorListRow[] | null;
  setSponsorListState: (items: IHSponsorListRow[] | null) => void;
  /** 지점 마케팅 목록 페이지가 열려있을 때 그 필터 결과 — 협찬 목록과 동일한 우선순위로 인플루언서 목록보다 위에 표시된다. */
  branchMarketingListItems: IHBranchMarketingListRow[] | null;
  setBranchMarketingListState: (items: IHBranchMarketingListRow[] | null) => void;
  /** 브랜디드 PPL 목록 페이지가 열려있을 때 그 필터 결과 — 다른 목록들과 동일한 우선순위. */
  brandedPplListItems: IHBrandedPplListRow[] | null;
  setBrandedPplListState: (items: IHBrandedPplListRow[] | null) => void;
  /** Dashboard 페이지가 열려있을 때 그 집계 데이터 — Mobile Viewer가 대시보드 요약 화면을 보여준다. */
  dashboardData: IHDashboardData | null;
  setDashboardData: (data: IHDashboardData | null) => void;
  /** Phase 9 통합 대시보드 — PC에서 고른 기간 필터 결과를 그대로 Mobile Viewer에도 반영한다(별도 조회 없음). */
  integratedDashboardData: IHIntegratedDashboardData | null;
  setIntegratedDashboardData: (data: IHIntegratedDashboardData | null) => void;
};

const IHMobileSelectionContext = createContext<IHMobileSelectionValue | null>(null);

/**
 * PC 목록/상세에서 인플루언서를 선택하면, 우측 Mobile Viewer가 홈 요약 대신
 * 그 인플루언서 화면(또는 목록 페이지에서는 같은 필터 결과 목록)을 보여주도록 연결하는 Context.
 * IHShell(레이아웃)에서 감싼다.
 */
export function IHMobileSelectionProvider({ children }: { children: React.ReactNode }) {
  const [selectedInfluencer, setSelectedInfluencer] = useState<IHInfluencerMobileSummary | null>(null);
  const [listItems, setListItems] = useState<IHInfluencerListItem[] | null>(null);
  const [listMeta, setListMeta] = useState<IHListMeta | null>(null);
  const [sponsorListItems, setSponsorListItems] = useState<IHSponsorListRow[] | null>(null);
  const [branchMarketingListItems, setBranchMarketingListItems] = useState<IHBranchMarketingListRow[] | null>(null);
  const [brandedPplListItems, setBrandedPplListItems] = useState<IHBrandedPplListRow[] | null>(null);
  const [dashboardData, setDashboardDataState] = useState<IHDashboardData | null>(null);
  const [integratedDashboardData, setIntegratedDashboardDataState] = useState<IHIntegratedDashboardData | null>(null);

  const selectInfluencer = useCallback((summary: IHInfluencerMobileSummary | null) => {
    setSelectedInfluencer(summary);
  }, []);
  const setListState = useCallback((items: IHInfluencerListItem[] | null, meta: IHListMeta | null) => {
    setListItems(items);
    setListMeta(meta);
  }, []);
  const setSponsorListState = useCallback((items: IHSponsorListRow[] | null) => {
    setSponsorListItems(items);
  }, []);
  const setBranchMarketingListState = useCallback((items: IHBranchMarketingListRow[] | null) => {
    setBranchMarketingListItems(items);
  }, []);
  const setBrandedPplListState = useCallback((items: IHBrandedPplListRow[] | null) => {
    setBrandedPplListItems(items);
  }, []);
  const setDashboardData = useCallback((data: IHDashboardData | null) => {
    setDashboardDataState(data);
  }, []);
  const setIntegratedDashboardData = useCallback((data: IHIntegratedDashboardData | null) => {
    setIntegratedDashboardDataState(data);
  }, []);

  const value = useMemo(
    () => ({
      selectedInfluencer,
      selectInfluencer,
      listItems,
      listMeta,
      setListState,
      sponsorListItems,
      setSponsorListState,
      branchMarketingListItems,
      setBranchMarketingListState,
      brandedPplListItems,
      setBrandedPplListState,
      dashboardData,
      setDashboardData,
      integratedDashboardData,
      setIntegratedDashboardData,
    }),
    [
      selectedInfluencer,
      selectInfluencer,
      listItems,
      listMeta,
      setListState,
      sponsorListItems,
      setSponsorListState,
      branchMarketingListItems,
      setBranchMarketingListState,
      brandedPplListItems,
      setBrandedPplListState,
      dashboardData,
      setDashboardData,
      integratedDashboardData,
      setIntegratedDashboardData,
    ]
  );

  return <IHMobileSelectionContext.Provider value={value}>{children}</IHMobileSelectionContext.Provider>;
}

export function useIHMobileSelection(): IHMobileSelectionValue {
  const ctx = useContext(IHMobileSelectionContext);
  if (!ctx) throw new Error("useIHMobileSelection must be used within <IHMobileSelectionProvider>");
  return ctx;
}
