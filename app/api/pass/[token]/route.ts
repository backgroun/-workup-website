import { NextResponse } from "next/server";
import { getPassContextByToken, setPassStatus } from "@/lib/notices";

type Params = { params: Promise<{ token: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { token } = await params;
  const ctx = await getPassContextByToken(token);
  if (!ctx) return NextResponse.json({ error: "유효하지 않은 링크입니다." }, { status: 404 });
  return NextResponse.json(ctx);
}

// body: { noticeId: string, status: "출고" | "패스" } — 여러 상품이 동시에 공지된 경우
// 어느 공지에 대한 변경인지 noticeId로 지정한다. 마감된 공지는 setPassStatus가 서버측에서 거부한다.
export async function POST(req: Request, { params }: Params) {
  const { token } = await params;
  const ctx = await getPassContextByToken(token);
  if (!ctx) return NextResponse.json({ error: "유효하지 않은 링크입니다." }, { status: 404 });

  const body = await req.json();
  const noticeId = body.noticeId as string | undefined;
  const status = body.status === "패스" ? "패스" : "출고";
  if (!noticeId || !ctx.notices.some((n) => n.notice.id === noticeId)) {
    return NextResponse.json({ error: "유효하지 않은 공지입니다." }, { status: 400 });
  }

  try {
    const entry = await setPassStatus(noticeId, ctx.store.id, status);
    return NextResponse.json(entry);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "처리 중 오류가 발생했습니다." },
      { status: 403 }
    );
  }
}
