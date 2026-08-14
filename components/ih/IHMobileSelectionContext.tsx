"use client";
import { createContext, useContext, useState, useCallback, useMemo } from "react";
import type { IHInfluencerMobileSummary, IHInfluencerListItem } from "@/lib/ih/influencers";

export type IHListMeta = { total: number; hasActiveFilters: boolean };

type IHMobileSelectionValue = {
  selectedInfluencer: IHInfluencerMobileSummary | null;
  selectInfluencer: (summary: IHInfluencerMobileSummary | null) => void;
  /** 인플루언서 목록 페이지의 현재 필터 결과 — Mobile Viewer가 별도 조회 없이 그대로 재사용한다. */
  listItems: IHInfluencerListItem[] | null;
  listMeta: IHListMeta | null;
  setListState: (items: IHInfluencerListItem[] | null, meta: IHListMeta | null) => void;
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

  const selectInfluencer = useCallback((summary: IHInfluencerMobileSummary | null) => {
    setSelectedInfluencer(summary);
  }, []);
  const setListState = useCallback((items: IHInfluencerListItem[] | null, meta: IHListMeta | null) => {
    setListItems(items);
    setListMeta(meta);
  }, []);

  const value = useMemo(
    () => ({ selectedInfluencer, selectInfluencer, listItems, listMeta, setListState }),
    [selectedInfluencer, selectInfluencer, listItems, listMeta, setListState]
  );

  return <IHMobileSelectionContext.Provider value={value}>{children}</IHMobileSelectionContext.Provider>;
}

export function useIHMobileSelection(): IHMobileSelectionValue {
  const ctx = useContext(IHMobileSelectionContext);
  if (!ctx) throw new Error("useIHMobileSelection must be used within <IHMobileSelectionProvider>");
  return ctx;
}
