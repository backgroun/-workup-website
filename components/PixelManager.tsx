import Script from "next/script";
import { createAdminClient } from "@/lib/supabase-server";

interface PixelRow {
  platform: string;
  pixel_id: string;
  enabled: boolean;
}

async function getPixels(): Promise<PixelRow[]> {
  try {
    const sb = createAdminClient();
    const { data } = await sb.from("pixel_settings").select("platform, pixel_id, enabled");
    return data ?? [];
  } catch {
    return [];
  }
}

function px(p: PixelRow | undefined) {
  return p?.enabled && p.pixel_id.trim() ? p.pixel_id.trim() : null;
}

export default async function PixelManager() {
  const rows = await getPixels();
  const byPlatform = Object.fromEntries(rows.map(r => [r.platform, r]));

  const gtmId   = px(byPlatform.gtm);
  const ga4Id   = px(byPlatform.ga4);
  const metaId  = px(byPlatform.meta);
  const naverId = px(byPlatform.naver);
  const kakaoId = px(byPlatform.kakao);

  return (
    <>
      {/* ── Google Tag Manager ── */}
      {gtmId && (
        <>
          <Script id="gtm-head" strategy="afterInteractive">{`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtmId}');
          `}</Script>
          {/* GTM noscript은 <body> 직후에 위치해야 하나, Next.js Script로 근사 적용 */}
        </>
      )}

      {/* ── Google Analytics 4 (GTM 미사용 시 직접 삽입) ── */}
      {ga4Id && !gtmId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${ga4Id}');
          `}</Script>
        </>
      )}

      {/* ── Meta (Facebook/Instagram) Pixel ── */}
      {metaId && (
        <Script id="meta-pixel" strategy="afterInteractive">{`
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
          n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
          document,'script','https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${metaId}');
          fbq('track', 'PageView');
        `}</Script>
      )}

      {/* ── Naver 전환추적 ── */}
      {naverId && (
        <>
          <Script src="//wcs.naver.net/wcslog.js" strategy="afterInteractive" />
          <Script id="naver-wcs" strategy="afterInteractive">{`
            if(!wcs_add) var wcs_add={};
            wcs_add["wa"]="${naverId}";
            if(window.wcs) wcs_do();
          `}</Script>
        </>
      )}

      {/* ── Kakao Pixel ── */}
      {kakaoId && (
        <>
          <Script src="//t1.daumcdn.net/kas/static/kp.js" strategy="afterInteractive" />
          <Script id="kakao-pixel" strategy="afterInteractive">{`
            kakaoPixel('${kakaoId}').pageView();
          `}</Script>
        </>
      )}
    </>
  );
}
