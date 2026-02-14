import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `
You are a financial data parser specializing in Korean bank SMS and mobile notifications.
Your goal is to parse raw text into a structured JSON object.

### Response Format:
{
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "summary": "Bank name and transaction type (e.g., '신한 입금', 'KB 출금')",
      "description": "Counterparty name or specific detail (e.g., '홍길동', '스타벅스')",
      "withdrawal": number (0 if deposit),
      "deposit": number (0 if withdrawal),
      "balance": number (current balance after transaction),
      "account_name": "Mapped account ID (e.g., '청주', '110', '086')",
      "memo": ""
    }
  ]
}

### Account Mapping Rules (CRITICAL):
Look for account numbers in the text and map to "account_name" as follows:
- End with **508** -> "청주"
- End with **110** -> "110"
- End with **086** -> "086"
- If none match, use the provided "accountName" context or leave as "Unknown".

### Parsing Rules:
1. Multiline Support: Often, the counterparty name appears at the very end on a new line or with leading spaces. Look for it carefully.
2. Format variants:
   - "[Web발신] 신한02/14 11:47 ... 구자현" -> Date: 2026-02-14, Summary: 신한 입금, Description: 구자현, Amount: extract from text.
3. If the year is missing (e.g., "02/14"), assume the current year (2026).
4. Remove commas from numbers before parsing as integers.
5. If multiple messages are pasted together, extract all of them as separate entries in the array.
6. Return ONLY the JSON object.
`;

export async function POST(req: Request) {
    try {
        console.log("--- SMS Parse Request Started ---");
        if (!process.env.OPENAI_API_KEY) {
            console.error("Missing OpenAI API Key");
            return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
        }

        const { text, accountName } = await req.json();
        console.log("Input Text:", text);

        if (!text || text.trim().length < 5) {
            return NextResponse.json({ error: "Text is too short" }, { status: 400 });
        }

        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const completion = await client.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: `Account: ${accountName || 'Unknown'}\nText to parse:\n${text}` }
            ],
            temperature: 0,
            response_format: { type: "json_object" }
        });

        const content = completion.choices[0]?.message?.content || "{\"transactions\": []}";
        console.log("GPT Response Content:", content);

        const parsed = JSON.parse(content);
        const transactions = parsed.transactions || [];
        console.log(`Successfully parsed ${transactions.length} transactions`);

        return NextResponse.json({ transactions });
    } catch (err: any) {
        console.error("SMS Parse Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
