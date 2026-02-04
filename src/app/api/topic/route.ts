import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";

const BodySchema = z.object({
  keyword: z.string().min(1),
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

    const response = await client.responses.create({
      model: "gpt-5.2",
      input: `키워드: ${body.keyword}\n\n이 키워드로 숏폼/콘텐츠 주제 5개를 한국어로 제안해줘. 각 항목은 한 줄로 번호 매겨.`,
    });

    return NextResponse.json({ result: response.output_text });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 400 }
    );
  }
}
