export interface AIResponse {
    text: string;
    ms: number;
    error?: string;
}

export interface Q1Response {
    question: string;
    answers: {
        openai: AIResponse;
        claude: AIResponse;
        gemini: AIResponse;
    };
}

export interface Q2Response {
    q2: {
        openai: string;
        claude: string;
        gemini: string;
    };
    answers: {
        openai: AIResponse;
        claude: AIResponse;
        gemini: AIResponse;
    };
}

export interface FinalResponse {
    final: {
        gemini: AIResponse;
    };
}
