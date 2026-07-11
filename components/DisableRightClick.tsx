"use client";
import { useEffect } from "react";

// 이미지·콘텐츠 무단 저장/복제를 줄이기 위해 우클릭(컨텍스트 메뉴)을 막는다.
export default function DisableRightClick() {
  useEffect(() => {
    const onContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("contextmenu", onContextMenu);
    return () => document.removeEventListener("contextmenu", onContextMenu);
  }, []);
  return null;
}
