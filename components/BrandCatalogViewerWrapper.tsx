"use client";
import { useState, useEffect, type ComponentType } from "react";
import type { BrandTocItem } from "@/types/catalog";

type ViewerProps = {
  pdfUrl: string;
  pageCount: number;
  brandName: string;
  accentColor: string;
  toc?: BrandTocItem[];
};

function Skeleton({ pageCount }: { pageCount: number }) {
  return (
    <div style={{
      height: "80vh",
      backgroundColor: "#F0F0F0",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: 12,
    }}>
      <div style={{
        width: 32, height: 32,
        border: "3px solid #ccc", borderTopColor: "#888",
        borderRadius: "50%", animation: "bcv-spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes bcv-spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{ fontSize: 12, color: "#999" }}>{pageCount}페이지 카탈로그 로딩 중…</span>
    </div>
  );
}

// useEffect 안에서 import — SSR에서 react-pdf 모듈 자체가 평가되지 않음
export default function BrandCatalogViewerWrapper(props: ViewerProps) {
  const [Viewer, setViewer] = useState<ComponentType<ViewerProps> | null>(null);

  useEffect(() => {
    import("./BrandCatalogViewer").then((m) => {
      setViewer(() => m.default);
    });
  }, []);

  if (!Viewer) return <Skeleton pageCount={props.pageCount} />;
  return <Viewer {...props} />;
}
