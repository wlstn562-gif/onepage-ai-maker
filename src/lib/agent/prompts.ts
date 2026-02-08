export const AGENT_PROMPTS = {
    // Q1: 초기 질문 (공통)
    q1: (question: string) => `
You are an expert consultant. Answer the following question thoroughly.

QUESTION: "${question}"

STRUCTURE YOUR ANSWER AS FOLLOWS:
1. 결론 (Conclusion) - State the main answer clearly.
2. 근거 및 논리 (Reasoning & Logic) - Explain why.
3. 리스크 및 주의점 (Risks & Caveats) - What could go wrong?
4. 실행 체크리스트 (Action Checklist) - Concrete steps to take.

RULES:
- If you don't know, explicitly state "I don't know".
- State all assumptions clearly.
- Use Markdown formatting.
- Language: Korean (한국어).
`,

    // Q2: 상호 비평 및 개선
    q2: (originalQuestion: string, otherAnswers: string[]) => `
You are tasked with improving an answer based on critiques of other perspectives.

ORIGINAL QUESTION: "${originalQuestion}"

REFERENCE ANSWERS FROM OTHER AI MODELS:
${otherAnswers.map((a, i) => `--- MODEL ${i + 1} ANSWER ---\n${a}\n`).join('\n')}

YOUR TASK:
1. CRITIQUE: Briefly point out errors, gaps, or weak points in the reference answers above (Maximum 3 bullet points).
2. IMPROVE: Write a NEW, better answer to the original question. Merge insights from the references but correct their mistakes.
   - Follow the same structure: Conclusion -> Reasoning -> Risks -> Checklist.
3. VERIFICATION: Add a section at the very end called "검증 포인트 3가지" (3 Verification Points).

Language: Korean (한국어).
`,

    // Final: 최종 종합 (Gemini 전용)
    final: (originalQuestion: string, allAnswers: string[]) => `
You are the Chief Decision Maker. Synthesize a final, definitive answer.

ORIGINAL QUESTION: "${originalQuestion}"

INPUTS FROM 3 AI MODELS (Iterated versions):
${allAnswers.map((a, i) => `--- VERSION ${i + 1} ---\n${a}\n`).join('\n')}

YOUR TASK:
1. Synthesize all inputs into a ONE-PAGE executive summary.
2. If there are conflicting views, explicitly mark them as "합의(Consensus)" or "불확실/논쟁(Uncertainty/Debate)".
3. Conclude with a "최종 실행 플랜(3단계)" (Final 3-Step Action Plan).

Language: Korean (한국어). Use professional, executive tone.
`
};
