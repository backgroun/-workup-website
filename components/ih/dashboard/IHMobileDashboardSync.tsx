"use client";
import { useEffect } from "react";
import { useIHMobileSelection } from "../IHMobileSelectionContext";
import type { IHDashboardData } from "@/lib/ih/dashboard";

/** Dashboard 페이지 진입 시 Mobile Viewer를 대시보드 요약 화면으로 전환하고, 나가면 원복한다. */
export default function IHMobileDashboardSync({ data }: { data: IHDashboardData }) {
  const { setDashboardData } = useIHMobileSelection();

  useEffect(() => {
    setDashboardData(data);
    return () => setDashboardData(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
