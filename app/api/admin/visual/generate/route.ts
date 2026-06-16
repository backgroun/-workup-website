import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import OpenAI from "openai";

async function isAuthed() {
  const store = await cookies();
  return store.get("wu-auth")?.value === (process.env.AUTH_TOKEN ?? "wu-session-ok");
}

export async function POST(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY가 설정되지 않았습니다. Vercel 환경변수를 확인해주세요." },
      { status: 500 }
    );
  }

  const { concept, target } = await req.json();
  if (!concept?.trim()) {
    return NextResponse.json({ error: "기획 컨셉(관리 타이틀)을 입력해주세요." }, { status: 400 });
  }

  // 노출 비율 (PC 1920×680 ≈ 2.8:1 / 모바일 750×695 ≈ 1:1)
  const formatCtx = target === "mobile"
    ? `Near-square vertical mobile hero banner, exact aspect ratio 750:695 (about 1:1), centered composition with clear negative space at top or bottom for text overlay. Target resolution 750×695px.`
    : `Ultra-wide horizontal hero banner, exact aspect ratio 1920:680 (about 2.8:1), cinematic wide composition with the model placed to one side and open negative space on the other for text overlay. Target resolution 1920×680px.`;

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const prompt = `당신은 워크업(WORKUP) 브랜드의 메인 비주얼 카피라이터이자 아트디렉터입니다.
워크업은 일하는 사람들을 위한 워크웨어 브랜드로, 오프라인 매장 방문을 유도하는 디지털 카탈로그 사이트를 운영합니다.
메인 페이지 상단의 히어로 슬라이드(대형 배너)에 들어갈 카피와 이미지 콘셉트를 만들어주세요.

[이 슬라이드의 기획 컨셉]
${concept}

위 컨셉을 바탕으로 아래 3가지를 생성하세요.

1) 타이틀 (title): 배너의 메인 카피. 강렬하고 짧게. 한국어, 최대 2줄(줄바꿈은 \\n). 한 줄당 12자 이내.
2) 서브타이틀 (subtitle): 타이틀을 보조하는 한 줄 카피. 한국어, 18자 이내. 감성과 방문 욕구를 자극.
3) 이미지 프롬프트 (imagePrompt): 이 배너 배경에 쓸 사진을 만들기 위한 영문 프롬프트.
   - 다음 포맷 지시를 반드시 포함: ${formatCtx}
   - 모델 착용 장면, 라이팅, 분위기, 구도를 묘사
   - 텍스트가 올라갈 여백(negative space)을 확보하도록 지시
   - 100~150 단어

반드시 아래 JSON 형식으로만 응답하세요.
{
  "title": "...(줄바꿈은 \\n)...",
  "subtitle": "...",
  "imagePrompt": "..."
}`;

  let text = "";
  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 1024,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    });
    text = completion.choices[0]?.message?.content ?? "";
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[visual/generate] OpenAI API error:", e);
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
