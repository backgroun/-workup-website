"use client";
import { useEffect } from "react";

// 카탈로그 페이지 마운트 시 body에 catalog-page 클래스를 붙여 푸터를 숨긴다.
export default function CatalogBodyClass() {
  useEffect(() => {
    document.body.classList.add("catalog-page");
    return () => { document.body.classList.remove("catalog-page"); };
  }, []);
  return null;
}
