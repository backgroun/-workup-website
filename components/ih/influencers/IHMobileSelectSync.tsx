"use client";
import { useEffect } from "react";
import { useIHMobileSelection } from "../IHMobileSelectionContext";
import type { IHInfluencerMobileSummary } from "@/lib/ih/influencers";

/** 인플루언서 상세 페이지 진입 시 Mobile Viewer를 이 인플루언서 화면으로 전환하고, 나가면 원복한다. */
export default function IHMobileSelectSync({ summary }: { summary: IHInfluencerMobileSummary }) {
  const { selectInfluencer } = useIHMobileSelection();

  useEffect(() => {
    selectInfluencer(summary);
    return () => selectInfluencer(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary.id]);

  return null;
}
