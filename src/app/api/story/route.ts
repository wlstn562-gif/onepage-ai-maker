import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";

const BodySchema = z.object({
  script: z.string().min(1),
  style: z.string().optional().default("Documentary style"),
});

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY가 설정되지 않았습니다 (.env.local 확인)" },
        { status: 500 }
      );
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const body = BodySchema.parse(await req.json());

    const prompt = `
너는 영상 대본을 "문장 단위"로 나누고, 각 문장마다 영어 이미지 프롬프트를 만들어준다.

요구사항:
- 입력 대본을 자연스러운 문장 단위로 분리 (최대 200문장)
- 각 문장에 대해 영어 이미지 프롬프트 1개 생성
- 스타일: ${body.style}
- 결과는 JSON 배열로만 출력:
[
  { "ko": "원문 문장", "en": "영어 이미지 프롬프트" },
  ...
]

대본:
${body.script}
`.trim();

    const response = await client.responses.create({
      model: "gpt-5.2",
      input: prompt,
    });

    const text = response.output_text?.trim() ?? "";

    return NextResponse.json({ result: text });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 400 }
    );
  }
}

