import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";

async function isAuthed() {
  const store = await cookies();
  return store.get("wu-auth")?.value === (process.env.AUTH_TOKEN ?? "wu-session-ok");
}

export async function POST(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY가 설정되지 않았습니다. Vercel 환경변수를 확인해주세요." },
      { status: 500 }
    );
  }

  const { productName, season, features, mood, target, style } = await req.json();

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `당신은 워크업(WORKUP) 브랜드의 마케터입니다.
워크업은 일하는 사람들을 위한 워크웨어 브랜드로, 오프라인 매장 방문을 유도하는 디지털 카탈로그 사이트를 운영합니다.

아래 정보를 바탕으로 두 가지를 생성해주세요.

[제품 정보]
- 제품명/종류: ${productName}
- 계절/테마: ${season}
- 핵심 특징: ${features}
- 분위기: ${mood}
- 타겟 고객: ${target}
- 스타일 방향: ${style}

[생성 요청 1] AI 이미지 생성 프롬프트 (영문)
Midjourney 또는 DALL-E에서 사용할 수 있는 상업용 제품 광고 이미지 프롬프트를 영어로 작성하세요.
- 실제 착용 또는 제품 연출 장면을 묘사
- 브랜드 분위기에 맞는 라이팅, 구도, 스타일 포함
- 100~150 단어 내외

[생성 요청 2] 팝업 문구 (한국어)
팝업 배너에 들어갈 짧고 강렬한 한국어 문구를 생성하세요.
- 소제목 (subtitle): 10자 이내, 제품의 핵심 감성을 한 줄로
- 메인 타이틀 (title): 2줄, 각 12자 이내, 매장 방문 욕구를 자극하는 문구
- CTA 텍스트: 5자 이내 (예: "지금 보러가기", "매장에서 만나기")

반드시 아래 JSON 형식으로만 응답하세요. 다른 설명은 쓰지 마세요.
{
  "imagePrompt": "...",
  "subtitle": "...",
  "title": "...(줄바꿈은 \\n 사용)...",
  "ctaText": "..."
}`;

  let text = "";
  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });
    text = message.content[0].type === "text" ? message.content[0].text : "";
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[popup/generate] Claude API error:", e);
    return NextResponse.json({ error: `AI 호출 실패: ${msg}` }, { status: 500 });
  }

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("JSON not found");
    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "AI 응답 파싱 실패", raw: text }, { status: 500 });
  }
}
