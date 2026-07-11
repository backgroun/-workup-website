import { redirect } from "next/navigation";

// 브랜드 카탈로그는 /catalog 에 통합됨 — 옛 링크 호환을 위해 리다이렉트.
export default function BrandsPage() {
  redirect("/catalog");
}
