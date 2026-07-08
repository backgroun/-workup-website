import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // 관리자·API·개인/기능 페이지는 검색 노출에서 제외
      disallow: [
        "/admin",
        "/api",
        "/cart",
        "/mypage",
        "/member",
        "/register",
        "/report",
        "/products/preview",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
