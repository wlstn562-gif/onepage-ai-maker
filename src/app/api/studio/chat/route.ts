import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { TEAM_PERSONAS, GLOBAL_CONTEXT } from '@/lib/agents';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const { teamId, message, history } = await req.json();

        if (!teamId || !message) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const persona = TEAM_PERSONAS[teamId];
        if (!persona) {
            return NextResponse.json({ error: 'Invalid team ID' }, { status: 400 });
        }

        // Format history for OpenAI
        const messages: any[] = [
            { role: 'system', content: `${persona.systemPrompt}\n\n${GLOBAL_CONTEXT}` },
            ...history.slice(-10).map((msg: any) => ({
                role: msg.role === 'assistant' ? 'assistant' : 'user',
                content: msg.text
            })),
            { role: 'user', content: message }
        ];

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: messages,
            temperature: 0.7,
            max_tokens: 1000,
        });

        const responseText = completion.choices[0].message.content || `[${persona.id}] 응답을 생성하지 못했습니다.`;

        return NextResponse.json({
            response: responseText,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('Studio Chat Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
