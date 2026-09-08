import type { Metadata } from "next";
import ArrivalTimeline from "./_components/ArrivalTimeline";

export const metadata: Metadata = {
  title: "26FW ARRIVAL — 입고 일정 | WORKUP",
  description: "WORKUP 2026 Fall/Winter 시즌 상품 입고 일정을 확인하세요.",
};

export default function ArrivalPage() {
  return <ArrivalTimeline />;
}
