"use client";
import React, { useState } from "react";
import { useVideoContext, uid, Scene } from "../context/VideoContext";

// Parsing utilities
function cleanPrefix(s: string) {
    return s.replace(/^\s*(문장|프롬프트|sentence|prompt)\s*0*\d+\s*[:：,]?\s*/i, "").trim();
}

function looksEnglishPrompt(s: string) {
    return !/[가-힣]/.test(s) && /[A-Za-z]/.test(s);
}

// Helper for file reading
async function readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ""));
        r.onerror = reject;
        r.readAsDataURL(file);
    });
}

function parseBodyScript(script: string): Scene[] {
    const raw = script || "";
    // Match === SCENE X ===
    const sceneRe = /===\s*SCENE\s*0*(\d+)\s*===/gi;
    const matches = Array.from(raw.matchAll(sceneRe));

    if (matches.length > 0) {
        const out: Scene[] = [];
        for (let i = 0; i < matches.length; i++) {
            const start = (matches[i].index ?? 0) + matches[i][0].length;
            const end = i + 1 < matches.length ? (matches[i + 1].index ?? raw.length) : raw.length;
            const chunk = raw.slice(start, end);
            const lines = chunk.split("\n").map(v => v.trim()).filter(Boolean);
            let ko1 = "", ko2 = "", ko3 = "", ko4 = "", promptEn = "";
            for (const line of lines) {
                if (/^ko1\s*:/i.test(line)) ko1 = line.replace(/^ko1\s*:\s*/i, "").trim();
                else if (/^ko2\s*:/i.test(line)) ko2 = line.replace(/^ko2\s*:\s*/i, "").trim();
                else if (/^ko3\s*:/i.test(line)) ko3 = line.replace(/^ko3\s*:\s*/i, "").trim();
                else if (/^ko4\s*:/i.test(line)) ko4 = line.replace(/^ko4\s*:\s*/i, "").trim();
                else if (/^promptEn\s*:/i.test(line)) promptEn = line.replace(/^promptEn\s*:\s*/i, "").trim();
            }
            if (!ko1 && !ko2 && !ko3 && !ko4 && !promptEn) continue;
            out.push({
                id: uid(), kind: "body",
                ko1, ko2, ko3, ko4, promptEn,
                imageUrl: "", videoUrl: "", audioUrl: "",
                durationSec: 3.0,
            });
        }
        return out;
    }

    // Fallback
    const lines = raw.split("\n").map(v => v.trim()).filter(Boolean);
    const koRe = /^(?:문장|sentence)\s*0*(\d+)\s*[:：,]?\s*(.+)$/i;
    const prRe = /^(?:프롬프트|prompt)\s*0*(\d+)\s*[:：,]?\s*(.+)$/i;
    const koMap = new Map<number, string>();
    const prMap = new Map<number, string>();

    for (const line of lines) {
        let m = line.match(koRe);
        if (m) { koMap.set(Number(m[1]), cleanPrefix(m[2])); continue; }
        m = line.match(prRe);
        if (m) { prMap.set(Number(m[1]), cleanPrefix(m[2])); continue; }
    }

    if (koMap.size === 0) {
        const only = lines.map(cleanPrefix);
        const out: Scene[] = [];
        let bufKo: string[] = [];
        let lastPrompt = "";
        for (const l of only) {
            if (looksEnglishPrompt(l)) { lastPrompt = l; continue; }
            bufKo.push(l);
            if (bufKo.length === 2) {
                out.push({
                    id: uid(), kind: "body",
                    ko1: bufKo[0], ko2: bufKo[1], ko3: "", ko4: "",
                    promptEn: lastPrompt,
                    imageUrl: "", videoUrl: "", audioUrl: "",
                    durationSec: 3.0,
                });
                bufKo = [];
                lastPrompt = "";
            }
        }
        if (bufKo.length === 1) {
            out.push({
                id: uid(), kind: "body",
                ko1: bufKo[0], ko2: "", ko3: "", ko4: "",
                promptEn: lastPrompt,
                imageUrl: "", videoUrl: "", audioUrl: "",
                durationSec: 3.0,
            });
        }
        return out;
    }

    const keys = Array.from(koMap.keys()).sort((a, b) => a - b);
    const out: Scene[] = [];
    for (let i = 0; i < keys.length; i += 2) {
        const k1 = keys[i];
        const k2 = keys[i + 1];
        out.push({
            id: uid(), kind: "body",
            ko1: koMap.get(k1) ?? "",
            ko2: k2 ? koMap.get(k2) ?? "" : "",
            ko3: "", ko4: "",
            promptEn: prMap.get(k1) ?? prMap.get(k2 ?? -1) ?? "",
            imageUrl: "", videoUrl: "", audioUrl: "",
            durationSec: 3.0,
        });
    }
    return out;
}

function parseHookMemo(memo: string) {
    const txt = memo || "";
    // Simple parser for Hook Memo
    const pick = (block: string) => {
        const ko1 = (block.match(/^\s*ko1:\s*(.*)\s*$/im)?.[1] || "").trim();
        const ko2 = (block.match(/^\s*ko2:\s*(.*)\s*$/im)?.[1] || "").trim();
        const ko3 = (block.match(/^\s*ko3:\s*(.*)\s*$/im)?.[1] || "").trim();
        let ko4 = (block.match(/^\s*ko4:\s*(.*)\s*$/im)?.[1] || "").trim();
        let promptEn = (block.match(/^\s*promptEn:\s*(.*)\s*$/im)?.[1] || "").trim();
        if (/^promptEn\s*[:：]/i.test(ko4)) {
            if (!promptEn) promptEn = ko4.replace(/^promptEn\s*[:：]\s*/i, "").trim();
            ko4 = "";
        }
        return { ko1, ko2, ko3, ko4, promptEn };
    };

    // Support both 'HOOK_VIDEO' and 'SCENE H' headers
    // Old: === HOOK_VIDEO 1 ===
    // New: === SCENE H01 ===
    const re = /===\s*(?:HOOK_VIDEO|SCENE\s*H)\s*0*(\d+)\s*===/gi;
    const ms = Array.from(txt.matchAll(re));
    if (ms.length > 0) {
        return ms.map((m, i) => {
            const start = (m.index ?? 0) + m[0].length;
            const end = i + 1 < ms.length ? (ms[i + 1].index ?? txt.length) : txt.length;
            return pick(txt.slice(start, end));
        }).filter(v => v.ko1 || v.ko2 || v.ko3 || v.ko4 || v.promptEn);
    }
    return [];
}

export default function ScriptPlanning() {
    const {
        project, setProject,
        hookScript, setHookScript,
        bodyScript, setBodyScript,
        setStatus,
        busyAny, API, setBusy,
        setCurrentStep,
        setAutoPilotMode, // Used to trigger downstream auto-actions
        resetProject
    } = useVideoContext();

    const [generating, setGenerating] = useState(false);
    const [duration, setDuration] = useState<number>(20); // Default 20 mins
    const [isAutoPilot, setIsAutoPilot] = useState(true); // Default to True for convenience

    // Moved up to fix scope
    const [hookTopicInput, setHookTopicInput] = useState(project.topic || "");

    // 🆕 NotebookLM Integration State
    const [useKnowledgeBase, setUseKnowledgeBase] = useState(false);
    const [knowledgeBaseConnected, setKnowledgeBaseConnected] = useState<boolean | null>(null);
    const [fetchingFacts, setFetchingFacts] = useState(false);
    const [knowledgeFacts, setKnowledgeFacts] = useState<string>("");

    // Check NotebookLM connection on mount
    React.useEffect(() => {
        fetch("/api/notebooklm?action=status")
            .then(res => res.json())
            .then(data => setKnowledgeBaseConnected(data.connected === true))
            .catch(() => setKnowledgeBaseConnected(false));
    }, []);

    // 🆕 지식 베이스에서 팩트 가져오기
    const fetchFactsFromNotebook = async (topic: string): Promise<string> => {
        if (!useKnowledgeBase || !knowledgeBaseConnected) return "";

        setFetchingFacts(true);
        try {
            const res = await fetch("/api/notebooklm", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "get_facts",
                    notebookId: "default",
                    topic: topic
                })
            });
            const data = await res.json();
            if (data.success && data.facts) {
                const factsText = typeof data.facts === "string"
                    ? data.facts
                    : JSON.stringify(data.facts);
                setKnowledgeFacts(factsText);
                return factsText;
            }
        } catch (e: any) {
            console.error("Facts fetch error:", e);
        } finally {
            setFetchingFacts(false);
        }
        return "";
    };

    // 🆕 NotebookLM Custom Query
    const [notebookQuery, setNotebookQuery] = useState("");
    const [notebookResponse, setNotebookResponse] = useState("");
    const [isQueryingNotebook, setIsQueryingNotebook] = useState(false);
    const [showNotebookChat, setShowNotebookChat] = useState(false);

    const handleNotebookQuery = async () => {
        if (!notebookQuery.trim()) return;
        setIsQueryingNotebook(true);
        setNotebookResponse("");
        try {
            const res = await fetch("/api/notebooklm", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "query",
                    notebookId: "default",
                    query: notebookQuery
                })
            });
            const data = await res.json();
            if (data.success && data.result) {
                setNotebookResponse(data.result);
            } else {
                setNotebookResponse("응답이 없습니다.");
            }
        } catch (e: any) {
            setNotebookResponse("에러: " + e.message);
        } finally {
            setIsQueryingNotebook(false);
        }
    };

    // 🆕 팩트 체크 결과 state
    const [factCheckResult, setFactCheckResult] = useState<string>("");
    const [isFactChecking, setIsFactChecking] = useState(false);

    // 🆕 대본 팩트 체크 함수 (NotebookLM 대신 Research API 사용)
    const handleFactCheck = async () => {
        if (!bodyScript.trim()) {
            alert("대본을 먼저 작성해주세요.");
            return;
        }

        setIsFactChecking(true);
        setFactCheckResult("");

        try {
            const res = await fetch("/api/research", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "fact_check",
                    query: bodyScript.slice(0, 1500)
                })
            });

            const data = await res.json();
            if (data.success && data.result) {
                setFactCheckResult(data.result);
            } else {
                setFactCheckResult("팩트 체크 실패: " + (data.error || "알 수 없는 오류"));
            }
        } catch (e: any) {
            setFactCheckResult("팩트 체크 오류: " + e.message);
        } finally {
            setIsFactChecking(false);
        }
    };

    // 🆕 주제 관련 팩트 검색 함수
    const handleSearchFacts = async () => {
        if (!project.topic) {
            alert("주제를 먼저 선택해주세요.");
            return;
        }

        if (useKnowledgeBase) {
            const facts = await fetchFactsFromNotebook(project.topic);
            if (facts) alert("✅ NotebookLM에서 팩트를 가져왔습니다!");
            else alert("NotebookLM에서 정보를 찾지 못했습니다.");
            return;
        }

        setFetchingFacts(true);
        setKnowledgeFacts("");

        try {
            const res = await fetch("/api/research", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "search_facts",
                    topic: project.topic
                })
            });

            const data = await res.json();
            if (data.success && data.facts) {
                setKnowledgeFacts(data.facts);
                alert("✅ 팩트 검색 완료! 대본 생성 시 자동 반영됩니다.");
            } else {
                alert("팩트 검색 실패: " + (data.error || "알 수 없는 오류"));
            }
        } catch (e: any) {
            alert("팩트 검색 오류: " + e.message);
        } finally {
            setFetchingFacts(false);
        }
    };

    // Helper: Delay function
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    const handleAutoGeneration = async (targetDuration: number) => {
        if (!project.topic) {
            alert("주제를 먼저 선택해주세요.");
            return;
        }

        if (confirm(`${targetDuration}분 영상 [완전 자동 생성]을 시작하시겠습니까?\n대본 -> 훅 -> 이미지 -> TTS -> 렌더링까지 한 번에 진행됩니다.`)) {
            // 1. Set Global Auto-Pilot Mode
            setAutoPilotMode(true);
            setGenerating(true);

            try {
                // 2. Generate Script
                const generatedScript = await generateScript(targetDuration, true); // Pass true to skip manual alerts if any
                await delay(1000);

                // 3. Generate Hooks
                // Ensure hook topic is set
                if (!hookTopicInput) setHookTopicInput(project.topic);
                await generateAIHooks(true);
                await delay(1000);

                // 4. Analyze Body & Move to Next Step
                await analyzeBody(true, generatedScript);

                // The analyzeBody function sets CurrentStep(3) or (4), where ImageGeneration will pick up 'autoPilotMode'

            } catch (e: any) {
                alert("자동 생성 중단: " + e.message);
                setAutoPilotMode(false); // Stop if error
            } finally {
                setGenerating(false);
            }
        }
    };

    // Refactored generateScript to optionally suppress alerts or be awaitable
    const generateScript = async (targetDuration: number, isAuto = false) => {
        if (!project.topic) return;

        setGenerating(true);
        setDuration(targetDuration);
        setBusy("scriptGen", true);

        try {
            let fullScript = "";
            let totalParts = 6;
            if (targetDuration === 5) totalParts = 3;
            else if (targetDuration === 10) totalParts = 4;
            else if (targetDuration === 15) totalParts = 5;

            for (let i = 1; i <= totalParts; i++) {
                const partName = getPartName(i, targetDuration);
                let previousContext = "없음 (첫 시작)";
                if (i > 1 && fullScript.length > 0) previousContext = "..." + fullScript.slice(-800);

                let success = false;
                let retryCount = 0;
                const maxRetries = 3;

                while (!success && retryCount < maxRetries) {
                    try {
                        const statusMsg = retryCount === 0
                            ? `${targetDuration}분 대본 생성 중... (${i}/${totalParts}단계: ${partName})`
                            : `생성 지연 중... (${i}/${totalParts}: ${partName}) - 재시도 ${retryCount}회`;
                        setStatus(statusMsg);

                        // 🆕 Deep Research 결과 반영 (Step 1에서 가져온 팩트)
                        let factsContext = "";
                        if (project.researchFacts && project.researchFacts.length > 0) {
                            factsContext = "관련 팩트 및 심층 리서치 자료:\n- " + project.researchFacts.join("\n- ");
                        } else if (knowledgeFacts) {
                            factsContext = knowledgeFacts;
                        }

                        const response = await fetch(API.OPENAI, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                mode: "script",
                                topic: project.topic,
                                part: i,
                                duration: targetDuration,
                                previousContext: previousContext,
                                knowledgeFacts: factsContext
                            }),
                        });

                        if (response.status === 429) throw new Error("TPM Limit");
                        const data = await response.json();
                        if (data.error) throw new Error(data.error);

                        if (data.result) {
                            fullScript += `\n\n=== Part ${i}: ${partName} ===\n\n` + data.result;
                            setBodyScript(fullScript); // Concurrent state update
                            success = true;
                        } else {
                            throw new Error("No result");
                        }
                    } catch (e: any) {
                        retryCount++;
                        if (retryCount >= maxRetries) throw e;
                        const waitTime = retryCount * 3000;
                        setStatus(`API 사용량 초과. ${waitTime / 1000}초 후 재시도합니다...`);
                        await delay(waitTime);
                    }
                }
            }
            setStatus(`✨ ${targetDuration}분 롱폼 대본 완성!`);
            return fullScript;
        } catch (e: any) {
            throw e; // Rethrow for Auto-Pilot to catch
        } finally {
            if (!isAuto) setGenerating(false);
            setBusy("scriptGen", false);
        }
    };


    const generateAIHooks = async (isAuto = false) => {
        const topic = hookTopicInput || project.topic;
        if (!topic.trim()) throw new Error("훅 주제가 없습니다.");

        if (!isAuto) setGenerating(true);
        setStatus("AI가 훅 시나리오를 생성하고 있습니다...");

        try {
            const response = await fetch(API.OPENAI, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mode: "generate_hook", topic: topic }),
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error);

            if (data.result) {
                const rawResult = data.result;
                setHookScript(rawResult);
                const parsedHooks = parseHookMemo(rawResult);
                if (parsedHooks.length === 0) throw new Error("훅 파싱 실패");

                setProject(p => {
                    const bodyScenes = p.scenes.filter(s => s.kind !== "hook");
                    const newHooks: Scene[] = parsedHooks.map(h => ({
                        id: uid(), kind: "hook",
                        ko1: h.ko1, ko2: h.ko2, ko3: h.ko3, ko4: h.ko4,
                        promptEn: h.promptEn,
                        videoUrl: "", imageUrl: "", audioUrl: "",
                        durationSec: p.settings.hookSec || 8,
                    }));
                    return {
                        ...p,
                        scenes: [...newHooks, ...bodyScenes],
                        settings: { ...p.settings, hookCount: newHooks.length }
                    };
                });
                setStatus(`✅ ${parsedHooks.length}개의 훅 시나리오 적용 완료`);
            }
        } catch (e) {
            throw e;
        } finally {
            if (!isAuto) setGenerating(false);
        }
    };

    const analyzeBody = async (isAuto = false, scriptOverride?: string) => {
        const targetScript = scriptOverride || bodyScript;
        if (!targetScript.trim()) {
            alert("본문 대본이 없습니다. 먼저 대본을 생성해주세요!");
            return;
        }

        setBusy("scriptGen", true);
        setStatus("AI가 대본을 씬으로 변환하고 있습니다...");

        try {
            const lines = targetScript.split("\n");
            const chunks = [];
            let currentChunk = "";
            const MAX_CHUNK_LINES = 25;
            for (let i = 0; i < lines.length; i++) {
                currentChunk += lines[i] + "\n";
                if ((i + 1) % MAX_CHUNK_LINES === 0 || i === lines.length - 1) {
                    chunks.push(currentChunk); currentChunk = "";
                }
            }

            let fullConvertedVideo = "";
            for (let i = 0; i < chunks.length; i++) {
                if (!chunks[i].trim()) continue;
                setStatus(`대본 변환 중... (${i + 1}/${chunks.length} 구간)`);
                const response = await fetch(API.OPENAI, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ mode: "convert_body", script: chunks[i] }),
                });
                const data = await response.json();
                if (data.error) throw new Error(data.error);
                if (data.result) fullConvertedVideo += data.result + "\n\n";
            }

            const scenes = parseBodyScript(fullConvertedVideo);
            setProject(p => ({ ...p, scenes: [...p.scenes.filter(s => s.kind === "hook"), ...scenes] }));

            setStatus(`총 ${scenes.length}개의 BODY 씬 생성 완료!`);

            // Auto Navigate:
            if (isAuto) {
                setCurrentStep(4);
            } else {
                setCurrentStep(3);
            }
        } catch (e) {
            throw e;
        } finally {
            setBusy("scriptGen", false);
        }
    };

    const getPartName = (part: number, duration: number) => `Part ${part}`;

    const analyzeHookManual = () => {
        const parsed = parseHookMemo(hookScript);
        if (parsed.length === 0) { alert("형식 오류"); return; }
        setProject(p => {
            const bodyScenes = p.scenes.filter(s => s.kind !== "hook");
            const newHooks = parsed.map(h => ({
                id: uid(), kind: "hook" as const, // Fix TS
                ko1: h.ko1, ko2: h.ko2, ko3: h.ko3, ko4: h.ko4, promptEn: h.promptEn,
                videoUrl: "", imageUrl: "", audioUrl: "", durationSec: p.settings.hookSec || 8
            }));
            return { ...p, scenes: [...newHooks, ...bodyScenes], settings: { ...p.settings, hookCount: newHooks.length } };
        });
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header / Topic Display */}
            <div className="bg-gray-900 rounded-3xl border border-gray-800 p-8 shadow-2xl relative overflow-hidden group">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-purple-500/10 to-transparent rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
                    <div>
                        <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
                            📌 선택된 주제
                        </h2>
                        <p className="text-gray-400 text-sm">대본 기획의 핵심이 되는 주제입니다.</p>
                        {/* Auto Pilot Toggle Moved to Sidebar */}
                        {/* Auto Pilot Toggle Moved to Sidebar */}
                    </div>
                    <div className="flex flex-wrap gap-3 items-center">
                        {[5, 10, 15, 20].map((min) => (
                            <button
                                key={min}
                                onClick={() => isAutoPilot ? handleAutoGeneration(min) : generateScript(min)}
                                disabled={generating || !project.topic}
                                className={`
                                    flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm shadow-lg transition-all active:scale-95 disabled:opacity-50
                                    ${min === 20
                                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 shadow-purple-900/50'
                                        : 'bg-gray-800 text-white border border-gray-700 hover:bg-gray-700 hover:text-white'}
                                `}
                            >
                                {generating && duration === min ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <span>✨ {min}분 생성</span>
                                )}
                            </button>
                        ))}

                        {/* 🆕 팩트 검색 버튼 (NotebookLM 없이 동작) */}
                        <button
                            onClick={handleSearchFacts}
                            disabled={fetchingFacts || !project.topic}
                            className={`ml-4 px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${fetchingFacts
                                ? "bg-cyan-700/50 text-cyan-300 animate-pulse"
                                : knowledgeFacts
                                    ? "bg-green-600 hover:bg-green-500 text-white"
                                    : "bg-cyan-600 hover:bg-cyan-500 text-white"
                                }`}
                        >
                            {fetchingFacts ? "검색 중..." : knowledgeFacts ? "✓ 팩트 수집됨" : "🔍 팩트 검색"}
                        </button>

                        {/* 🆕 NotebookLM Toggle */}
                        <button
                            onClick={() => setUseKnowledgeBase(!useKnowledgeBase)}
                            className={`ml-2 px-3 py-2 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 ${useKnowledgeBase
                                ? "bg-indigo-600 text-white border-indigo-500"
                                : "bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500"
                                }`}
                            title={knowledgeBaseConnected ? "NotebookLM 연결됨" : "NotebookLM 연결 필요"}
                        >
                            <span className={knowledgeBaseConnected ? "text-green-400" : "text-gray-500"}>●</span>
                            {useKnowledgeBase ? "NotebookLM ON" : "NotebookLM OFF"}
                        </button>
                        <button
                            onClick={() => setShowNotebookChat(!showNotebookChat)}
                            className={`ml-2 p-2 rounded-lg border transition-all ${showNotebookChat ? "bg-indigo-100 border-indigo-300 text-indigo-700" : "bg-gray-800 border-gray-700 text-gray-400 hover:text-white"}`}
                            title="NotebookLM 채팅"
                        >
                            💬
                        </button>
                    </div>

                    {/* NotebookLM Chat UI */}
                    {showNotebookChat && (
                        <div className="mt-4 p-4 bg-gray-900/80 rounded-xl border border-indigo-500/30">
                            <h3 className="text-white font-bold text-sm mb-2 flex items-center gap-2">
                                💬 NotebookLM에게 질문하기
                                <span className="text-xs font-normal text-gray-400">(예: 우리 조직도가 어떻게 돼?)</span>
                            </h3>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={notebookQuery}
                                    onChange={e => setNotebookQuery(e.target.value)}
                                    placeholder="NotebookLM에 물어볼 내용을 입력하세요..."
                                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                                    onKeyDown={e => e.key === 'Enter' && handleNotebookQuery()}
                                />
                                <button
                                    onClick={handleNotebookQuery}
                                    disabled={isQueryingNotebook}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold disabled:opacity-50"
                                >
                                    {isQueryingNotebook ? "..." : "전송"}
                                </button>
                            </div>
                            {notebookResponse && (
                                <div className="bg-gray-800 rounded-lg p-3 text-sm text-gray-300 whitespace-pre-wrap max-h-60 overflow-y-auto border border-gray-700">
                                    {notebookResponse}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {project.topic ? (
                    <div className="p-6 bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-white/5 relative group-hover:border-purple-500/30 transition-colors flex justify-between items-center group/card">
                        <div>
                            <span className="absolute -top-3 left-6 px-3 py-1 bg-gray-900 border border-gray-700 text-purple-400 text-xs font-bold rounded-full uppercase tracking-wider">
                                SELECTED TOPIC
                            </span>
                            <p className="text-white font-bold text-xl leading-relaxed mt-2">{project.topic}</p>
                        </div>
                        <button
                            onClick={() => resetProject(true)}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-lg flex items-center gap-1 transition-all"
                            title="현재 주제 유지, 대본/데이터만 초기화"
                        >
                            🔄 대본/데이터 초기화 (주제 유지)
                        </button>
                    </div>
                ) : (
                    <div className="p-6 bg-gray-800/50 rounded-2xl border border-dashed border-gray-700 text-gray-500 text-center flex flex-col items-center justify-center py-10 relative">
                        <span className="text-4xl mb-3">👈</span>
                        <p>주제를 먼저 선택해주세요 (Step 1)</p>
                        <button
                            onClick={() => resetProject(false)}
                            className="absolute top-4 right-4 text-xs text-gray-600 hover:text-red-400 underline"
                        >
                            강제 초기화 (Step 1로 이동)
                        </button>
                    </div>
                )}
            </div>



            {/* ⚙️ 기본 설정 (Logo, BGM) - Moved to Step 2 */}
            <div className="bg-gray-900 rounded-3xl border border-gray-800 p-8 shadow-2xl">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    ⚙️ 기본 설정 (미리 세팅)
                </h2>
                <div className="grid md:grid-cols-2 gap-8">
                    {/* 로고 설정 */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2">
                            🖼️ 로고 이미지 (선택)
                        </h3>
                        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                            <div className="flex gap-4 items-center">
                                <div className="w-16 h-16 bg-black/50 rounded-lg flex items-center justify-center border border-gray-600 overflow-hidden shrink-0">
                                    {project.settings.logoUrl ? (
                                        <img src={project.settings.logoUrl} className="w-full h-full object-contain" alt="Logo" />
                                    ) : (
                                        <span className="text-2xl opacity-30">🖼️</span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={async e => {
                                            const f = e.target.files?.[0];
                                            if (!f) return;
                                            try {
                                                const dataUrl = await readFileAsDataURL(f);
                                                // Create a fake event-like object for consistency if needed, but direct store preferred
                                                // We will just store locally in settings for now, actual upload might happen in render or here.
                                                // For auto-pilot consistency, let's just keep dataURL or upload immediately.
                                                // Let's use the API.STORE if we assume it exists in context, but here we don't have it destructured.
                                                // Wait, we need to check if API is available.
                                                // Yes, API is destructured above.

                                                // Upload immediately to consistent URL
                                                const res = await fetch(API.STORE, {
                                                    method: "POST",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({ dataUrl, filename: f.name }),
                                                });
                                                const data = await res.json();
                                                const url = data.url || dataUrl; // fallback

                                                setProject(p => ({ ...p, settings: { ...p.settings, logoUrl: url } }));
                                            } catch (err) {
                                                console.error(err);
                                                alert("이미지 로로드 실패");
                                            }
                                        }}
                                        className="text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 mb-2"
                                    />
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            placeholder="Width (px)"
                                            value={project.settings.logoWidthPx}
                                            onChange={e => setProject(p => ({ ...p, settings: { ...p.settings, logoWidthPx: Number(e.target.value) } }))}
                                            className="w-20 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Margin"
                                            value={project.settings.logoMarginPx}
                                            onChange={e => setProject(p => ({ ...p, settings: { ...p.settings, logoMarginPx: Number(e.target.value) } }))}
                                            className="w-20 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* BGM 설정 */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2">
                            🎵 훅 파트 BGM (선택)
                        </h3>
                        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                            <div className="space-y-3">
                                <input
                                    type="file"
                                    accept="audio/*"
                                    onChange={async e => {
                                        const f = e.target.files?.[0];
                                        if (!f) return;
                                        try {
                                            const dataUrl = await readFileAsDataURL(f);
                                            // Upload immediately
                                            const res = await fetch(API.STORE, {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ dataUrl, filename: f.name }),
                                            });
                                            const data = await res.json();
                                            const url = data.url || dataUrl;

                                            setProject(p => ({ ...p, settings: { ...p.settings, hookBgmUrl: url } }));
                                        } catch (err) {
                                            console.error(err);
                                            alert("오디오 로드 실패");
                                        }
                                    }}
                                    className="block w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                                />
                                {project.settings.hookBgmUrl && (
                                    <div className="text-xs text-blue-400 flex items-center gap-1">
                                        ✓ 설정됨 ({project.settings.hookBgmUrl.slice(-15)})
                                    </div>
                                )}
                                <div className="flex gap-4 items-center">
                                    <div className="flex-1">
                                        <label className="text-[10px] text-gray-500 uppercase font-bold">Volume (dB)</label>
                                        <input
                                            type="number"
                                            value={project.settings.hookBgmGainDb ?? -14}
                                            onChange={e => setProject(p => ({ ...p, settings: { ...p.settings, hookBgmGainDb: Number(e.target.value) } }))}
                                            className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-[10px] text-gray-500 uppercase font-bold">Fade (Sec)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={project.settings.hookBgmFadeSec ?? 0.6}
                                            onChange={e => setProject(p => ({ ...p, settings: { ...p.settings, hookBgmFadeSec: Number(e.target.value) } }))}
                                            className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* HOOK Text Planner */}
                <div className="bg-gray-900 rounded-3xl border border-gray-800 p-8 shadow-2xl flex flex-col h-full">
                    <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                        🎬 HOOK 기획
                    </h2>
                    <p className="text-gray-500 text-sm mb-6">시청자의 시선을 사로잡는 오프닝을 기획합니다.</p>

                    {/* Hook Topic Input */}
                    <div className="mb-6 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2 pl-1">훅 주제 / 핵심 메시지</label>
                            <input
                                type="text"
                                value={hookTopicInput}
                                onChange={e => setHookTopicInput(e.target.value)}
                                className="w-full px-5 py-4 bg-gray-800 border-gray-700 text-white rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors outline-none placeholder-gray-600"
                                placeholder="예: AI 공포, 돈 버는 법 (공란 시 주제기반 자동)"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2 pl-1">훅 개수</label>
                                <div className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-gray-400 font-mono text-center">
                                    {project.settings.hookCount}개 (자동)
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2 pl-1">길이 (초)</label>
                                <input
                                    type="number"
                                    value={project.settings.hookSec}
                                    onChange={e => setProject(p => ({ ...p, settings: { ...p.settings, hookSec: Number(e.target.value) } }))}
                                    className="w-full px-4 py-3 bg-gray-800 border-gray-700 text-white rounded-xl focus:border-purple-500 outline-none text-center font-mono"
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => generateAIHooks()}
                            disabled={generating}
                            className="w-full py-4 bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 rounded-xl font-bold transition-all flex items-center justify-center gap-2 group"
                        >
                            <span className="group-hover:scale-110 transition-transform">✨</span>
                            {generating ? "생성 중..." : "AI 시나리오 생성"}
                        </button>
                    </div>

                    <div className="flex-1 flex flex-col">
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2 pl-1">생성된 훅 시나리오</label>
                        <textarea
                            value={hookScript}
                            onChange={e => setHookScript(e.target.value)}
                            className="flex-1 w-full px-5 py-4 bg-black/30 border border-gray-700/50 rounded-xl font-mono text-sm text-gray-300 resize-none focus:border-purple-500/50 outline-none min-h-[200px]"
                            placeholder="AI가 생성한 훅 시나리오가 여기에 표시됩니다."
                        />
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-800">
                        <button
                            onClick={analyzeHookManual}
                            disabled={busyAny}
                            className="w-full py-3 text-gray-400 hover:text-white text-sm font-medium transition-colors"
                        >
                            수동 메모 적용 (수정사항 반영)
                        </button>
                    </div>
                </div>

                {/* BODY Text Planner */}
                <div className="bg-gray-900 rounded-3xl border border-gray-800 p-8 shadow-2xl flex flex-col h-full relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-32 h-1 bg-gradient-to-r from-blue-500 to-transparent"></div>

                    <h2 className="text-xl font-bold text-white mb-1">📝 BODY 대본 작성</h2>
                    <p className="text-gray-500 text-sm mb-6">영상 본론을 구성하는 메인 대본입니다.</p>

                    <textarea
                        value={bodyScript}
                        onChange={e => setBodyScript(e.target.value)}
                        className="flex-1 w-full px-6 py-5 bg-black/30 border border-gray-700/50 rounded-2xl font-mono text-sm text-gray-300 leading-relaxed resize-none focus:border-blue-500/50 outline-none min-h-[400px]"
                        placeholder="20분 분량의 대본이 여기에 생성됩니다. 직접 수정할 수도 있습니다."
                    />

                    {/* 🆕 팩트 체크 섹션 - NotebookLM 없이도 동작 */}
                    {bodyScript.trim() && (
                        <div className="mt-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold text-gray-400 uppercase">📋 팩트 체크</span>
                                <button
                                    onClick={handleFactCheck}
                                    disabled={isFactChecking}
                                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${isFactChecking
                                        ? "bg-yellow-600/50 text-yellow-300 animate-pulse"
                                        : "bg-yellow-600 hover:bg-yellow-500 text-white"
                                        }`}
                                >
                                    {isFactChecking ? "검증 중..." : "🔍 팩트 검증하기"}
                                </button>
                            </div>
                            {factCheckResult && (
                                <div className="mt-3 p-3 bg-gray-900/50 rounded-lg border border-gray-700/30">
                                    <p className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed max-h-[200px] overflow-y-auto">
                                        {factCheckResult}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="mt-6">
                        <button
                            onClick={() => analyzeBody()}
                            disabled={busyAny}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-900/30 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 group"
                        >
                            {busyAny ? "분석 중..." : (
                                <>
                                    AI 바디 분석 & 씬 생성
                                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                                </>
                            )}
                        </button>
                        <p className="text-center text-xs text-gray-600 mt-3">
                            대본을 씬 단위로 자동 분할하고 시각화합니다 (Step 3로 이동)
                        </p>
                    </div>
                </div>
            </div>
        </div >
    );
}
