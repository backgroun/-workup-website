import { NextRequest, NextResponse } from "next/server";

// R2 PDF를 서버사이드로 프록시해 브라우저 CORS 문제를 우회한다.
// react-pdf는 Range 요청으로 청크 단위 로딩을 하므로 Range/Content-Range 헤더를 그대로 전달한다.

function r2Base() {
  return (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");
}

function isAllowedUrl(url: string) {
  const base = r2Base();
  return base.length > 0 && url.startsWith(base + "/");
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return new NextResponse("Missing url", { status: 400 });
  if (!isAllowedUrl(url)) return new NextResponse("Forbidden", { status: 403 });

  try {
    const upstreamHeaders: HeadersInit = {};
    const range = req.headers.get("range");
    if (range) upstreamHeaders["Range"] = range;

    const upstream = await fetch(url, { headers: upstreamHeaders });

    const res = new Headers();
    res.set("Content-Type", upstream.headers.get("content-type") ?? "application/pdf");
    res.set("Accept-Ranges", "bytes");
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Cache-Control", "public, max-age=3600");

    const cl = upstream.headers.get("content-length");
    if (cl) res.set("Content-Length", cl);
    const cr = upstream.headers.get("content-range");
    if (cr) res.set("Content-Range", cr);

    return new NextResponse(upstream.body, { status: upstream.status, headers: res });
  } catch (err) {
    console.error("[pdf-proxy] GET error:", err);
    return new NextResponse("Proxy error", { status: 502 });
  }
}

export async function HEAD(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return new NextResponse(null, { status: 400 });
  if (!isAllowedUrl(url)) return new NextResponse(null, { status: 403 });

  try {
    const upstream = await fetch(url, { method: "HEAD" });
    const res = new Headers();
    res.set("Content-Type", upstream.headers.get("content-type") ?? "application/pdf");
    res.set("Accept-Ranges", "bytes");
    res.set("Access-Control-Allow-Origin", "*");
    const cl = upstream.headers.get("content-length");
    if (cl) res.set("Content-Length", cl);
    return new NextResponse(null, { status: upstream.status, headers: res });
  } catch (err) {
    console.error("[pdf-proxy] HEAD error:", err);
    return new NextResponse(null, { status: 502 });
  }
}
