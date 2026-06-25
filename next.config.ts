import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 동적 페이지의 클라이언트 라우터 캐시 비활성화
  // → 관리자에서 탑바 높이 저장 후 새로고침 한 번으로 즉시 반영됨
  experimental: {
    staleTimes: {
      dynamic: 0,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "hovotcjzyzmcffusellp.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
