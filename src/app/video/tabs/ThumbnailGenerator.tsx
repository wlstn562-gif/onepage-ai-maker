"use client";
import React, { useState } from "react";
import { useVideoContext } from "../context/VideoContext";

export default function ThumbnailGenerator() {
    const { project, setProject, API, setStatus, setBusy } = useVideoContext();
    const [analyzing, setAnalyzing] = useState(false);
    const [generating, setGenerating] = useState(false);

    // Strategy State
    const [strategy, setStrategy] = useState<any>(null);
    const [selectedConceptId, setSelectedConceptId] = useState<string>("A_fact");

    // Editable State
    const [finalPrompt, setFinalPrompt] = useState("");
    const [overlayLine1, setOverlayLine1] = useState("");
    const [overlayLine2, setOverlayLine2] = useState("");
    const [highlightWordsOverride, setHighlightWordsOverride] = useState(""); // Comma separated
    const [protagonist, setProtagonist] = useState(""); // Protagonist Override

    const [thumbnails, setThumbnails] = useState<string[]>([]);

    // Model Selection State
    const [modelProvider, setModelProvider] = useState<"openai" | "google" | "gpt4o">("gpt4o"); // Default to GPT-4o (ChatGPT)
    const [useSafetyMode, setUseSafetyMode] = useState(true);
    // 📸 Real Photo Composite State
    const [protagonistImage, setProtagonistImage] = useState<string | null>(null);

    // ✅ Helper to Apply Master Prompt based on Concept ID & Protagonist
    const getMasterPrompt = (conceptId: string, protagonistName: string, safeMode: boolean = true) => {
        let cleanName = protagonistName.trim() || "Protagonist";

        // 🚨 SAFETY BYPASS: DALL-E 3 blocks "Jensen Huang" as a real person.
        if (safeMode) {
            if (/jensen/i.test(cleanName) || /huang/i.test(cleanName)) {
                cleanName = "a confident older man resembling Jensen Huang (grey hair, glasses, iconic black leather jacket)";
            } else if (/elon/i.test(cleanName)) {
                cleanName = "a middle-aged Tech Billionaire resembling Elon Musk, wearing black t-shirt, athletic build";
            } else if (/zuck/i.test(cleanName)) {
                cleanName = "a young Tech CEO resembling Mark Zuckerberg, wearing grey t-shirt, short curly hair";
            } else if (/sam/i.test(cleanName) && /altman/i.test(cleanName)) {
                cleanName = "a Tech CEO resembling Sam Altman, wearing suit, blue eyes";
            }
        }

        // 🏆 다양한 스타일의 프롬프트들
        const STYLES = [
            // 스타일 1: 클로즈업 드라마틱
            `Photorealistic extreme close-up portrait of ${cleanName}, facing camera, confident intense expression, dramatic studio lighting with strong contrast, dark gradient background, shallow depth of field, sharp focus on eyes, leave negative space on the right for text overlay. 4K quality, cinematic.`,

            // 스타일 2: 중앙 위치 호기심 유발
            `Photorealistic thumbnail, center portrait of ${cleanName} with slightly intrigued expression, clean dark studio background, colorful futuristic AI graphics swirling around (holograms, circuits, neural network visualization), vibrant neon accents, leave empty space at top for text overlay. High contrast, modern.`,

            // 스타일 3: 측면 프로필 시네마틱
            `Cinematic photorealistic thumbnail, ${cleanName} in three-quarter profile view on the left side, stern focused expression, harsh spotlight creating dramatic rim light, smoky dark background with abstract tech elements, high contrast vignette effect. Professional YouTube thumbnail quality.`,

            // 스타일 4: 미니멀 모던
            `Clean minimalist YouTube thumbnail, ${cleanName} close-up on the left third of frame, natural confident smile, solid dark background gradient, subtle geometric tech patterns, plenty of clean negative space on right for text. Modern professional aesthetic, 16:9.`,

            // 스타일 5: 다이나믹 액션
            `Dynamic photorealistic thumbnail, ${cleanName} in the center with confident hand gesture, dramatic lighting with blue and orange color grading, abstract futuristic background with glowing data streams and holographic interfaces, high energy composition. Leave space for text overlay.`,

            // 스타일 6: 미스터리 무드
            `Mysterious cinematic thumbnail, close-up of ${cleanName} with knowing expression, half face in shadow dramatic lighting, dark moody atmosphere with subtle tech particle effects, vignette, high contrast, empty space on one side for text. 4K quality.`,
        ];

        const key = conceptId || "";

        // 특정 키워드에 따른 스타일 매칭
        if (key.includes("fear") || key.includes("B_fear")) {
            // 공포/경고 스타일
            return `Photorealistic cinematic thumbnail, ${cleanName} with serious concerned expression, harsh dramatic lighting, dark ominous background with red warning accents, high contrast shadows. Leave space for text overlay. Urgent mood.`;
        }
        if (key.includes("curiosity") || key.includes("twist") || key.includes("C_")) {
            // 호기심 스타일
            return `Photorealistic thumbnail, ${cleanName} with intrigued knowing smile, clean studio setup, colorful futuristic elements around (glowing icons, holographic displays), inviting bright mood, leave empty space for text. Modern professional.`;
        }

        // 🆕 기본: 랜덤하게 다양한 스타일 선택
        const randomIndex = Math.floor(Math.random() * STYLES.length);
        return STYLES[randomIndex];
    };

    // React to Safety Mode Toggle
    const toggleSafetyMode = () => {
        const newMode = !useSafetyMode;
        setUseSafetyMode(newMode);

        // Regenerate prompt immediately with new setting
        if (protagonist) {
            let richPrompt = getMasterPrompt(selectedConceptId, protagonist, newMode);
            // Append title if in safe mode or raw mode needs context
            // actually if RAW mode (newMode=false), we want the name. 
            // The helper returns raw name in prompt if safeMode=false.
            // But if safeMode=false, we might want to append Title "Nvidia CEO Jensen Huang" if missing.
            if (/jensen/i.test(protagonist) && !/ceo/i.test(richPrompt) && !newMode) {
                richPrompt = richPrompt.replace(protagonist, `Nvidia CEO ${protagonist}`);
            }
            setFinalPrompt(richPrompt);
        }
    };

    const analyzeStrategy = async () => {
        if (!project.topic && project.scenes.length === 0) {
            alert("주제 또는 대본이 필요합니다.");
            return;
        }

        setAnalyzing(true);
        setStatus("AI가 3가지 썸네일 전략을 분석중 (15자 이상, Strict Mode)...");

        try {
            const scriptContent = project.scenes
                .map((s: any) => [s.ko1, s.ko2, s.ko3, s.ko4].filter(Boolean).join(" "))
                .join("\n");

            const response = await fetch(API.OPENAI, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode: "generate_thumbnail_plan",
                    topic: project.topic,
                    script: scriptContent,
                    // Context to force protagonist
                    extraInstruction: "CRITICAL: If the script mentions a specific famous person (e.g. Jensen Huang, Elon Musk) or a distinct character, you MUST identify them as 'protagonist'. Provide 'protagonistDescription' strictly in ENGLISH (e.g. 'Jensen Huang wearing leather jacket, close up'). Do not leave it empty if a name appears. Also provide 'highlightWords' for text emphasis."
                }),
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error);

            console.log("Thumbnail Strategy Data:", data);

            if (data.result) {
                setStrategy(data.result);

                // Robust Fallback for Concept Array Key
                const concepts = data.result.concepts || data.result.thumbnailOptions || data.result.thumbnailConcepts || [];

                if (concepts.length === 0) {
                    throw new Error("전략 컨셉이 생성되지 않았습니다. (데이터 형식 오류)");
                }

                // Default Select: First Concept
                const first = concepts[0];
                if (first) {
                    setSelectedConceptId(first.id);

                    // ✅ Protagonist Logic - Just set the state, don't auto-merge into finalPrompt to keep them editable separately
                    let protoDesc = "";
                    if (first.protagonistDescription) protoDesc = first.protagonistDescription;
                    else if (data.result.protagonistDescription) protoDesc = data.result.protagonistDescription;

                    setProtagonist(protoDesc);

                    // ✅ Apply Master Prompt Immediately (Initial Load)
                    if (protoDesc.trim()) {
                        let richPrompt = getMasterPrompt(first.id, protoDesc, true);
                        if (/jensen/i.test(protoDesc) && !/ceo/i.test(richPrompt)) richPrompt = richPrompt.replace(protoDesc, `Nvidia CEO ${protoDesc}`);
                        setFinalPrompt(richPrompt);
                    } else {
                        setFinalPrompt(first.bgPromptEn || first.imagePromptEn || "");
                    }

                    // Handle Text Structure Variations
                    if (first.overlayText && typeof first.overlayText === 'object' && !Array.isArray(first.overlayText)) {
                        setOverlayLine1(first.overlayText.line1 || "");
                        setOverlayLine2(first.overlayText.line2 || "");
                    } else if (Array.isArray(first.overlayText)) {
                        setOverlayLine1(first.overlayText[0] || "");
                        setOverlayLine2(first.overlayText[1] || "");
                    }

                    // Handle Highlight Variations
                    const highlights = first.highlightWords || [];
                    setHighlightWordsOverride(highlights.join(", "));
                }
                setStatus("분석 완료! 3가지 전략이 도출되었습니다.");
            }
        } catch (err: any) {
            console.error(err);
            alert(err.message || "분석 실패");
            setStatus("분석 실패: " + err.message);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleSelectConcept = (concept: any) => {
        setSelectedConceptId(concept.id);

        // ✅ Protagonist Logic for Selection
        let protoDesc = "";
        if (concept.protagonistDescription) protoDesc = concept.protagonistDescription;
        else if (strategy?.protagonistDescription) protoDesc = strategy.protagonistDescription;
        setProtagonist(protoDesc);

        // ✅ Apply Master Prompt Immediately (Tab Switch)
        if (protoDesc.trim()) {
            let richPrompt = getMasterPrompt(concept.id, protoDesc, useSafetyMode);
            if (/jensen/i.test(protoDesc) && !/ceo/i.test(richPrompt)) richPrompt = richPrompt.replace(protoDesc, `Nvidia CEO ${protoDesc}`);
            setFinalPrompt(richPrompt);
        } else {
            setFinalPrompt(concept.bgPromptEn || concept.imagePromptEn || "");
        }

        if (concept.overlayText && typeof concept.overlayText === 'object' && !Array.isArray(concept.overlayText)) {
            setOverlayLine1(concept.overlayText.line1 || "");
            setOverlayLine2(concept.overlayText.line2 || "");
        } else if (Array.isArray(concept.overlayText)) {
            setOverlayLine1(concept.overlayText[0] || "");
            setOverlayLine2(concept.overlayText[1] || "");
        }

        const highlights = concept.highlightWords || [];
        setHighlightWordsOverride(highlights.join(", "));
    };

    const generateThumbnail = async () => {
        if (!finalPrompt.trim()) {
            alert("생성 프롬프트가 비어있습니다.");
            return;
        }

        setGenerating(true);
        setBusy("thumbnailGen", true);
        setStatus(`배경 이미지 생성중 (${modelProvider === 'gpt4o' ? 'GPT-4o (ChatGPT)' : modelProvider === 'openai' ? 'DALL-E 3' : 'Google Imagen'})...`);

        try {
            // ✅ Prepare Prompt
            let promptToSend = finalPrompt;

            // 📸 If Real Photo is Uploaded, we only need BACKGROUND.
            if (protagonistImage) {
                // Remove Person Description if possible, or force background focus
                // Simple hack: Prepend "Empty Background only, NO HUMANS, NO PEOPLE, "
                promptToSend = `(Empty Scenery Only, NO HUMANS, NO PEOPLE, Negative Space on the Left). ${promptToSend.replace(/portrait of .*,/i, "background of")}`;
                setStatus(`📸 실사 합성 모드: 배경만 생성중...`);
            } else {
                // Standard Mode
            }

            const safePrompt = `${promptToSend}, high quality, 8k. CRITICAL: ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS, NO NUMBERS, NO WATERMARK, NO LOGO, NO TYPOGRAPHY, NO CAPTIONS, NO SUBTITLES - completely text-free image only${protagonistImage ? ", NO HUMANS, NO FACES" : ""}`;

            let bgUrl = "";

            // 🚀 Generation based on User Selection
            if (modelProvider === "gpt4o") {
                // ✅ GPT-4o (ChatGPT) Image Generation
                const gptResponse = await fetch("/api/gpt-image", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        prompt: safePrompt,
                        size: "1536x1024", // 16:9 landscape
                    }),
                });
                const gptData = await gptResponse.json();
                if (!gptResponse.ok) throw new Error(gptData?.error || "GPT-4o 생성 실패");
                bgUrl = gptData?.imageUrl || "";
            } else if (modelProvider === "google") {
                try {
                    const bgResponse = await fetch(API.IMAGE, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            prompt: safePrompt,
                            aspectRatio: "16:9",
                        }),
                    });
                    const bgData = await bgResponse.json();
                    if (!bgResponse.ok) throw new Error(bgData?.error || "Google Imagen 생성 실패");
                    bgUrl = bgData?.imageUrl || bgData?.url;
                } catch (googleErr: any) {
                    console.warn("Google Imagen failed, falling back to DALL-E...", googleErr);
                    setStatus("⚠️ Google 실패 -> DALL-E 3로 전환 (Fallback)...");
                    const res2 = await fetch(API.OPENAI, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            mode: "generate_image",
                            prompt: safePrompt,
                            aspectRatio: "16:9",
                            style: "natural",
                        }),
                    });
                    const data2 = await res2.json();
                    if (!res2.ok) throw new Error(data2?.error || "DALL-E 생성 실패");
                    bgUrl = data2?.imageUrl || "";
                }
            } else {
                // OpenAI DALL-E 3
                const res2 = await fetch(API.OPENAI, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        mode: "generate_image",
                        prompt: safePrompt,
                        aspectRatio: "16:9",
                        style: "natural",
                    }),
                });
                const data2 = await res2.json();
                if (!res2.ok) throw new Error(data2?.error || "DALL-E 생성 실패");
                bgUrl = data2?.imageUrl || "";
            }

            if (!bgUrl) throw new Error("이미지 URL을 받지 못했습니다.");

            // Step 2: Render Text + Composite
            setStatus(protagonistImage ? "실사 인물 합성 및 텍스트 렌더링..." : "텍스트 합성중...");

            const highlights = highlightWordsOverride.split(",").map(w => w.trim()).filter(Boolean);

            const renderResponse = await fetch("/api/thumbnail/render", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    imageUrl: bgUrl,
                    overlayText: [overlayLine1, overlayLine2],
                    highlightWords: highlights,
                    overlayImage: protagonistImage,
                    overlayShape: (protagonistImage?.includes("jensen.jpg") || protagonistImage?.includes("elon.jpg")) ? "circle" : "none", // ✅ Apply Circle Crop for Presets
                }),
            });
            // ...

            const renderData = await renderResponse.json();
            if (!renderResponse.ok) throw new Error(renderData?.error || "합성 실패");

            setThumbnails(prev => [renderData.url, ...prev]);
            setProject((p: any) => ({ ...p, thumbnailUrl: renderData.url }));
            setStatus("썸네일 완성!");

        } catch (err: any) {
            console.error(err);
            alert(err.message || "생성 실패");
            setStatus("생성 실패");
        } finally {
            setGenerating(false);
            setBusy("thumbnailGen", false);
        }
    };

    // Helper to get robust list
    const getConcepts = () => {
        if (!strategy) return [];
        return strategy.concepts || strategy.thumbnailOptions || strategy.thumbnailConcepts || [];
    };

    const concepts = getConcepts();

    // 📸 Image Upload Handle
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProtagonistImage(reader.result as string);
                setProtagonist("User Uploaded Image"); // Optional: Auto-fill text
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">📊 AI 썸네일 전략 분석</h2>
                        <p className="text-gray-500 text-sm">대본을 분석하여 클릭률 높은 3가지(팩트/공포/호기심) 컨셉을 제안합니다.</p>
                    </div>
                    <button
                        onClick={analyzeStrategy}
                        disabled={analyzing}
                        className="px-6 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50 shadow-lg"
                    >
                        {analyzing ? "분석중..." : "🔍 전략 분석 실행"}
                    </button>
                </div>

                {/* Strategy Cards */}
                {strategy && concepts.length > 0 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
                        <div className="flex gap-4 mb-4">
                            <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-600">
                                💡 핵심: {strategy.headline || strategy.coreClaim}
                            </span>
                            <span className="px-3 py-1 bg-red-100 rounded-full text-xs font-bold text-red-600">
                                ⚡ 충격: {strategy.shockFact || strategy.shock}
                            </span>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4">
                            {concepts.map((concept: any, idx: number) => {
                                const isSelected = selectedConceptId === concept.id;
                                const badgeColor = (concept.id || "").includes("fact") ? "bg-blue-600" :
                                    (concept.id || "").includes("fear") ? "bg-red-600" : "bg-purple-600";

                                // Robust Text Getter
                                let line1 = "", line2 = "";
                                if (concept.overlayText && typeof concept.overlayText === 'object' && !Array.isArray(concept.overlayText)) {
                                    line1 = concept.overlayText.line1;
                                    line2 = concept.overlayText.line2;
                                } else if (Array.isArray(concept.overlayText)) {
                                    line1 = concept.overlayText[0];
                                    line2 = concept.overlayText[1];
                                } else if (concept.overlayTextKo) {
                                    line1 = concept.overlayTextKo[0];
                                    line2 = concept.overlayTextKo[1];
                                }

                                return (
                                    <div
                                        key={concept.id || idx}
                                        onClick={() => handleSelectConcept(concept)}
                                        className={`
                                            cursor-pointer relative rounded-xl border-2 p-4 transition-all
                                            ${isSelected
                                                ? "border-blue-600 bg-blue-50/30 ring-2 ring-blue-500"
                                                : "border-gray-200 hover:border-blue-300"
                                            }
                                        `}
                                    >
                                        <div className="flex justify-between mb-2">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded text-white ${badgeColor}`}>
                                                {concept.label || concept.conceptName || "Concept"}
                                            </span>
                                            {isSelected && <span className="text-blue-600 font-bold text-xs">✔ 선택됨</span>}
                                        </div>

                                        {/* Mock Preview */}
                                        <div className="bg-gray-900 rounded-lg p-3 my-3 text-center border-2 border-gray-800 relative overflow-hidden aspect-video flex flex-col justify-center items-center">
                                            <div className="text-yellow-400 font-black text-sm leading-tight mb-1" style={{ textShadow: "0 2px 4px black" }}>
                                                {line1}
                                            </div>
                                            <div className="text-white font-black text-xs leading-tight" style={{ textShadow: "0 2px 4px black" }}>
                                                {line2}
                                            </div>
                                        </div>

                                        <p className="text-xs text-gray-500 line-clamp-2">
                                            <strong>구도:</strong> {concept.layoutPlan || concept.layout?.subject}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Generation Form */}
                {strategy && concepts.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mt-8">
                        <div className="grid md:grid-cols-2 gap-6 mb-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">배경 프롬프트 (수정 가능)</label>
                                <textarea
                                    value={finalPrompt}
                                    onChange={e => setFinalPrompt(e.target.value)}
                                    className="w-full h-24 p-3 text-sm border border-gray-300 rounded-lg bg-white mb-2"
                                />
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-xs font-bold text-blue-600">👤 등장 인물 (주인공)</label>
                                    <label className="flex items-center space-x-1 cursor-pointer">
                                        <input type="checkbox" checked={useSafetyMode} onChange={toggleSafetyMode} className="form-checkbox text-blue-600 h-3 w-3" />
                                        <span className="text-xs text-gray-600 font-bold">안전 우회 적용 (실명 대신 묘사)</span>
                                    </label>
                                </div>
                                <input
                                    value={protagonist}
                                    onChange={e => setProtagonist(e.target.value)}
                                    className="w-full p-2 text-sm border-2 border-blue-100 rounded bg-blue-50 text-blue-900 font-bold mb-2"
                                    placeholder="예: Jensen Huang, grey hair, black leather jacket..."
                                />

                                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <label className="block text-xs font-bold text-yellow-800 mb-2">📸 실사 인물 합성 (누끼 따진 PNG 권장)</label>

                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                        <button
                                            onClick={() => {
                                                setProtagonistImage("/protagonists/jensen.jpg");
                                                setProtagonist("Jensen Huang (Official)");
                                            }}
                                            className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-full hover:bg-green-700 flex items-center gap-1 shadow-sm transition-colors"
                                        >
                                            ⚡ 젠슨 황 (Official)
                                        </button>
                                        <button
                                            onClick={() => {
                                                setProtagonistImage("/protagonists/elon.jpg");
                                                setProtagonist("Elon Musk (Official)");
                                            }}
                                            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-full hover:bg-blue-700 flex items-center gap-1 shadow-sm transition-colors"
                                        >
                                            🚀 일론 머스크 (Official)
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="file"
                                            accept="image/png, image/jpeg"
                                            onChange={handleImageUpload}
                                            className="block w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                                        />
                                        {protagonistImage && (
                                            <button onClick={() => setProtagonistImage(null)} className="text-xs text-red-500 font-bold underline">삭제</button>
                                        )}
                                    </div>
                                    {protagonistImage && (
                                        <div className="mt-2 text-xs text-green-400 font-bold bg-gray-900/50 p-2 rounded">
                                            ✅ 설정됨: {protagonistImage.includes("jensen.jpg") ? "젠슨 황 (Circle Crop)" : protagonistImage.includes("elon.jpg") ? "일론 머스크 (Circle Crop)" : "사용자 업로드"}
                                            <br /><span className="text-gray-400 font-normal">배경만 생성 후 합성합니다.</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">텍스트 오버레이</label>
                                <div className="space-y-2">
                                    <input
                                        value={overlayLine1}
                                        onChange={e => setOverlayLine1(e.target.value)}
                                        className="w-full p-2 text-sm border rounded font-bold bg-white text-yellow-600"
                                        placeholder="메인 문구 (15자 이상 권장)"
                                    />
                                    <input
                                        value={overlayLine2}
                                        onChange={e => setOverlayLine2(e.target.value)}
                                        className="w-full p-2 text-sm border rounded font-bold bg-white text-gray-700"
                                        placeholder="서브 문구"
                                    />
                                    <input
                                        value={highlightWordsOverride}
                                        onChange={e => setHighlightWordsOverride(e.target.value)}
                                        className="w-full p-2 text-xs border rounded bg-white text-red-500 font-bold"
                                        placeholder="강조할 단어 (쉼표로 구분: 의사, 3배)"
                                    />
                                </div>
                                <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                                    <div>
                                        <span className="text-yellow-400 text-xs">🎨 이미지 생성 모델 선택</span>
                                        <div className="flex gap-4 mt-1 flex-wrap">
                                            <label className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="modelProvider"
                                                    checked={modelProvider === "gpt4o"}
                                                    onChange={() => setModelProvider("gpt4o")}
                                                    className="form-radio text-purple-600"
                                                />
                                                <span className="text-sm font-bold text-purple-400">🔥 GPT-4o (ChatGPT 동일)</span>
                                            </label>
                                            <label className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="modelProvider"
                                                    checked={modelProvider === "openai"}
                                                    onChange={() => setModelProvider("openai")}
                                                    className="form-radio text-blue-600"
                                                />
                                                <span className="text-sm font-bold">OpenAI DALL-E 3</span>
                                            </label>
                                            <label className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="modelProvider"
                                                    checked={modelProvider === "google"}
                                                    onChange={() => setModelProvider("google")}
                                                    className="form-radio text-green-600"
                                                />
                                                <span className="text-sm font-bold">Google Imagen 3</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={generateThumbnail}
                                disabled={generating}
                                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 shadow-lg text-lg flex justify-center items-center gap-2"
                            >
                                {generating ? "생성중..." : "🎨 썸네일 생성하기"}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Gallery */}
            {(thumbnails.length > 0 || project.thumbnailUrl) && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">갤러리</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {project.thumbnailUrl && !thumbnails.includes(project.thumbnailUrl) && (
                            <div className="relative aspect-video rounded-xl overflow-hidden border-4 border-blue-600">
                                <img src={project.thumbnailUrl} className="w-full h-full object-cover" />
                                <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">Current</div>
                            </div>
                        )}
                        {thumbnails.map((url, idx) => (
                            <div key={idx} onClick={() => setProject((p: any) => ({ ...p, thumbnailUrl: url }))}
                                className="relative aspect-video rounded-xl overflow-hidden border-2 hover:border-blue-400 cursor-pointer">
                                <img src={url} className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

