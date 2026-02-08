import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AGENT_PROMPTS } from '@/lib/agent/prompts';
import { AIResponse, FinalResponse } from '@/lib/agent/types';

export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        const { question, a2 } = await req.json();

        if (!question || !a2) {
            return NextResponse.json({ error: 'Missing required inputs' }, { status: 400 });
        }

        const { openai: oA2, claude: cA2, gemini: gA2 } = a2;

        const promptFinal = AGENT_PROMPTS.final(question, [oA2, cA2, gA2]);

        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
        const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        const start = Date.now();
        let geminiRes: AIResponse = { text: "", ms: 0 };

        try {
            if (!process.env.GOOGLE_API_KEY) throw new Error("Google API Key missing");
            const result = await geminiModel.generateContent(promptFinal);
            const response = await result.response;
            geminiRes = { text: response.text(), ms: Date.now() - start };
        } catch (e: any) {
            geminiRes = { text: "", ms: Date.now() - start, error: e.message };
        }

        const response: FinalResponse = {
            final: {
                gemini: geminiRes
            }
        };

        return NextResponse.json(response);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
