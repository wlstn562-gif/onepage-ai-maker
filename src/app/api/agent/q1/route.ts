import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AGENT_PROMPTS } from '@/lib/agent/prompts';
import { AIResponse, Q1Response } from '@/lib/agent/types';

export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        const { question } = await req.json();

        if (!question) {
            return NextResponse.json({ error: 'Question is required' }, { status: 400 });
        }

        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || 'dummy' });
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
        // Use gemini-1.5-flash for speed/cost or pro for quality. User asked for high quality.
        const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        const prompt = AGENT_PROMPTS.q1(question);

        const [openaiRes, claudeRes, geminiRes] = await Promise.allSettled([
            // OpenAI
            (async (): Promise<AIResponse> => {
                const start = Date.now();
                try {
                    if (!process.env.OPENAI_API_KEY) throw new Error("OpenAI API Key missing");
                    const completion = await openai.chat.completions.create({
                        messages: [{ role: "user", content: prompt }],
                        model: process.env.OPENAI_MODEL || "gpt-4o",
                    });
                    return { text: completion.choices[0].message.content || "", ms: Date.now() - start };
                } catch (e: any) {
                    return { text: "", ms: Date.now() - start, error: e.message };
                }
            })(),

            // Claude
            (async (): Promise<AIResponse> => {
                const start = Date.now();
                try {
                    if (!process.env.ANTHROPIC_API_KEY) throw new Error("Anthropic API Key missing");
                    const msg = await anthropic.messages.create({
                        model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20240620",
                        max_tokens: 4096,
                        messages: [{ role: "user", content: prompt }],
                    });

                    let text = "";
                    if (msg.content && msg.content.length > 0 && msg.content[0].type === 'text') {
                        text = msg.content[0].text;
                    }
                    return { text, ms: Date.now() - start };
                } catch (e: any) {
                    return { text: "", ms: Date.now() - start, error: e.message };
                }
            })(),

            // Gemini
            (async (): Promise<AIResponse> => {
                const start = Date.now();
                try {
                    if (!process.env.GOOGLE_API_KEY) throw new Error("Google API Key missing");
                    const result = await geminiModel.generateContent(prompt);
                    const response = await result.response;
                    return { text: response.text(), ms: Date.now() - start };
                } catch (e: any) {
                    return { text: "", ms: Date.now() - start, error: e.message };
                }
            })()
        ]);

        const response: Q1Response = {
            question,
            answers: {
                openai: openaiRes.status === 'fulfilled' ? openaiRes.value : { text: "", ms: 0, error: "Internal Error" },
                claude: claudeRes.status === 'fulfilled' ? claudeRes.value : { text: "", ms: 0, error: "Internal Error" },
                gemini: geminiRes.status === 'fulfilled' ? geminiRes.value : { text: "", ms: 0, error: "Internal Error" }
            }
        };

        return NextResponse.json(response);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
