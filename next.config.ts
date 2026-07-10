import type { NextConfig } from "next";

// 모든 응답에 적용할 보안 헤더.
// CSP는 외부 리소스(구글폰트·jsdelivr·Supabase·ImageKit·픽셀 등) 전수 점검이
// 필요해 오작동 위험이 있어 제외했다. 추후 별도 작업으로 도입 권장.
const securityHeaders = [
  // HTTPS 강제 (2년). 커스텀 도메인 preload 등록 전이므로 preload 지시어는 제외.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  // MIME 스니핑 차단
  { key: "X-Content-Type-Options", value: "nosniff" },
  // 클릭재킹 방지 (자사 도메인 내 iframe만 허용)
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // 리퍼러 최소 노출
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // 불필요한 브라우저 기능 차단 (geolocation은 길찾기용으로 기본값 유지)
  { key: "Permissions-Policy", value: "camera=(), microphone=(), payment=()" },
];

const nextConfig: NextConfig = {
  // 응답 헤더에서 x-powered-by 제거 (불필요한 정보 노출 차단)
  poweredByHeader: false,
  // 동적 페이지의 클라이언트 라우터 캐시 비활성화
  // → 관리자에서 탑바 높이 저장 후 새로고침 한 번으로 즉시 반영됨
  experimental: {
    staleTimes: {
      dynamic: 0,
    },
  },
  images: {
    // 최신 경량 포맷 우선 (원본 JPG/PNG → AVIF/WebP 자동 변환)
    formats: ["image/avif", "image/webp"],
    // 최적화 이미지 캐시 최소 유지시간 31일.
    // 이미지 교체 시 새 파일명을 쓰므로 URL이 바뀌어 캐시 충돌 없음.
    minimumCacheTTL: 2678400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "hovotcjzyzmcffusellp.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
