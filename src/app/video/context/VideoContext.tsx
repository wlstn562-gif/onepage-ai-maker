"use client";
import React, { createContext, useContext, useState, useRef, useEffect, useMemo, ReactNode, useCallback } from "react";

// ============ TYPES ============
export type SceneKind = "hook" | "body";
export type Scene = {
    lastGenHash?: string;
    lastRenderHash?: string;
    id: string;
    kind: SceneKind;
    ko1: string;
    ko2: string;
    ko3: string;
    ko4: string;
    promptEn: string;
    videoUrl: string;
    thumbUrl?: string;
    imageUrl: string;
    audioUrl: string;
    durationSec: number;
};
export type Settings = {
    voiceId: string;
    aspectRatio: "16:9" | "9:16";
    includeSubtitle: boolean;
    hookCount: number;
    hookSec: number;
    hookBgmUrl?: string;
    hookBgmGainDb?: number;
    hookBgmFadeSec?: number;
    hookDuckDb?: number;
    logoUrl: string;
    logoWidthPx: number;
    logoMarginPx: number;
    transitionSec: number;
    zoomEnabled: boolean;
    zoomSpeed: number;
    zoomMax: number;
    // 추가 설정
    imageStyle?: string;
    shortsLength?: number;
};
export type ShortClip = {
    id: string; // "S1", "S2"...
    status: "idle" | "generating" | "ready" | "error";
    title: string;
    hook: string;
    summary: string;
    duration: string; // Original estimate

    // Generated Content
    scriptKo?: string;
    captions?: { lines: string[]; emphasis?: string[] }[];
    scenes?: {
        type: "video" | "image";
        durationSec: number;
        promptEn: string;
        assetUrl?: string
    }[];
    audioPlan?: {
        voiceId: string;
        speed?: number;
        gainDb?: number;
        audioUrl?: string
    };

    // Thumbnail Text
    thumbnailTextCandidates?: string[];
    selectedThumbnailText?: string;

    // Render State
    renderStatus?: "idle" | "queued" | "rendering" | "done" | "error";
    renderProgress?: number;
    finalVideoUrl?: string;
};

export type Project = {
    name: string;
    topic: string;
    scenes: Scene[];
    settings: Settings;
    generatedTitles?: string[];
    generatedDescription?: string;
    thumbnailUrl?: string;
    introVideoUrl?: string;

    // 🆕 Deep Research Data
    researchFacts?: string[];
    researchSource?: string;

    // Shorts V4
    shortClips?: ShortClip[];
};

// ============ CONSTANTS ============
export const STORAGE_KEY = "video_project_v4";
export const ELEVEN_VOICES = [
    { id: "lMhMpbaSPdEbsN3s9eCY", name: "내 전용 목소리" },
    { id: "sDh3eviBhiuHKi0MjTNq", name: "유성민" },
    { id: "sKvyOExD5AK7Ru1EOYvx", name: "교육중 전용 목소리" },
    { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily (여성/차분함)" },
    { id: "FQ3MuLxZh0jHcZmA5vW1", name: "Roger (남성/내레이션)" },
    { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah (여성/뉴스)" },
];
export const IMAGE_STYLES = [
    { id: "stickman", name: "스틱맨 애니메이션", icon: "🎭" },
    { id: "realistic", name: "실사화", icon: "📷" },
    { id: "realistic2", name: "실사화2", icon: "🖼️" },
    { id: "anime", name: "애니메이션2", icon: "✨" },
    { id: "european", name: "유럽풍 그래픽 노블", icon: "🎨" },
];

// ============ UTILS ============
export function uid() {
    return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function defaultProject(): Project {
    return {
        name: "새 프로젝트",
        topic: "",
        scenes: [],
        settings: {
            voiceId: ELEVEN_VOICES[0].id,
            aspectRatio: "16:9",
            includeSubtitle: true,
            hookCount: 2,
            hookSec: 8,
            hookBgmUrl: "",
            hookBgmGainDb: -14,
            hookBgmFadeSec: 0.6,
            hookDuckDb: -10,
            logoUrl: "",
            logoWidthPx: 300,
            logoMarginPx: 30,
            transitionSec: 0.4,
            zoomEnabled: true,
            zoomSpeed: 0.0018,
            zoomMax: 1.12,
            imageStyle: "stickman",
            shortsLength: 60,
        },
    };
}

// ============ CONTEXT ============
type VideoContextType = {
    project: Project;
    setProject: React.Dispatch<React.SetStateAction<Project>>;
    projectRef: React.MutableRefObject<Project>;

    // Busy state
    busyMap: Record<string, boolean>;
    isBusy: (key: string) => boolean;
    setBusy: (key: string, on: boolean) => void;
    busyAny: boolean;

    // Status
    status: string;
    setStatus: (s: string) => void;

    // Hook/Body Scripts (for raw input)
    hookScript: string;
    setHookScript: (s: string) => void;
    bodyScript: string;
    setBodyScript: (s: string) => void;

    // Final videos
    hookFinalUrl: string;
    setHookFinalUrl: (s: string) => void;
    finalVideoUrl: string;
    setFinalVideoUrl: (s: string) => void;

    // Auto-Pilot
    autoPilotMode: boolean;
    setAutoPilotMode: (mode: boolean) => void;

    // Helpers
    patchScene: (id: string, patch: Partial<Scene>) => void;
    addScene: (kind: SceneKind) => void;
    removeScene: (id: string) => void;
    saveProject: () => void;
    saveProjectImmediately: () => void;
    resetProject: (keepTopic?: boolean) => void;

    // API endpoints
    API: {
        VEO: string;
        IMAGE: string;
        TTS: string;
        STORE: string;
        FILE: string;
        RENDER: string;
        OPENAI: string;
    };
    // Navigation stepper
    currentStep: number;
    setCurrentStep: (step: number) => void;
};

const VideoContext = createContext<VideoContextType | null>(null);

export function useVideoContext() {
    const ctx = useContext(VideoContext);
    if (!ctx) throw new Error("useVideoContext must be used within VideoProvider");
    return ctx;
}

export function VideoProvider({ children }: { children: ReactNode }) {
    const [project, setProject] = useState<Project>(defaultProject());
    const projectRef = useRef<Project>(project);

    const [busyMap, setBusyMap] = useState<Record<string, boolean>>({});
    const [status, setStatus] = useState("준비됨");

    const [hookScript, setHookScript] = useState("");
    const [bodyScript, setBodyScript] = useState("");

    const [hookFinalUrl, setHookFinalUrl] = useState("");
    const [finalVideoUrl, setFinalVideoUrl] = useState("");

    // Auto-Pilot State
    const [autoPilotMode, setAutoPilotMode] = useState(false);

    // Navigation stepper state
    const [currentStep, setCurrentStep] = useState(1);

    const API = useMemo(() => ({
        VEO: "/api/veo",
        IMAGE: "/api/image",
        TTS: "/api/tts",
        STORE: "/api/store",
        FILE: "/api/file",
        RENDER: "/api/render",
        OPENAI: "/api/openai",
    }), []);

    // Keep ref in sync
    useEffect(() => { projectRef.current = project; }, [project]);

    // Load from localStorage
    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed) {
                    setProject(parsed);
                    setHookScript(parsed?.hookScript ?? "");
                    setBodyScript(parsed?.bodyScript ?? "");
                    if (parsed.currentStep) setCurrentStep(parsed.currentStep);
                }
            }
        } catch { }
    }, []);

    // Save to localStorage (debounced)
    // ✅ User Request: Auto-save every 1 second
    // Save to localStorage (debounced)
    // ✅ User Request: Auto-save every 1 second
    const saveProjectImmediately = useCallback(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...projectRef.current, hookScript, bodyScript, currentStep }));
        } catch { }
    }, [hookScript, bodyScript, currentStep]);

    useEffect(() => {
        const t = setTimeout(saveProjectImmediately, 1000); // 1000ms Debounce
        return () => clearTimeout(t);
    }, [project, hookScript, bodyScript, currentStep, saveProjectImmediately]);

    // Cleanup blob URLs
    useEffect(() => {
        return () => {
            if (hookFinalUrl?.startsWith("blob:")) URL.revokeObjectURL(hookFinalUrl);
            if (finalVideoUrl?.startsWith("blob:")) URL.revokeObjectURL(finalVideoUrl);
        };
    }, [hookFinalUrl, finalVideoUrl]);

    const isBusy = (key: string) => !!busyMap[key];
    const busyAny = Object.values(busyMap).some(Boolean);
    const setBusy = (key: string, on: boolean) => setBusyMap(m => ({ ...m, [key]: on }));

    const patchScene = (id: string, patch: Partial<Scene>) => {
        setProject(p => ({
            ...p,
            scenes: p.scenes.map(s => s.id === id ? { ...s, ...patch } : s),
        }));
    };

    const addScene = (kind: SceneKind) => {
        const newScene: Scene = {
            id: uid(),
            kind,
            ko1: "", ko2: "", ko3: "", ko4: "",
            promptEn: "",
            videoUrl: "", imageUrl: "", audioUrl: "",
            durationSec: kind === "hook" ? project.settings.hookSec : 3,
        };
        setProject(p => {
            if (kind === "hook") {
                const hookIdx = p.scenes.findIndex(s => s.kind !== "hook");
                if (hookIdx === -1) return { ...p, scenes: [...p.scenes, newScene] };
                return { ...p, scenes: [...p.scenes.slice(0, hookIdx), newScene, ...p.scenes.slice(hookIdx)] };
            }
            return { ...p, scenes: [...p.scenes, newScene] };
        });
    };

    const saveProject = () => {
        try {
            const data = { ...project, hookScript, bodyScript, currentStep };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            console.log("Projects saved manually");
        } catch (e: any) {
            console.error("Save failed", e);
            if (e.name === 'QuotaExceededError') {
                alert("저장 공간이 부족하여 프로젝트를 저장할 수 없습니다! (이미지가 너무 많을 수 있습니다)");
            } else {
                alert("프로젝트 저장 중 오류가 발생했습니다.");
            }
        }
    };

    const removeScene = (id: string) => {
        setProject(p => ({ ...p, scenes: p.scenes.filter(s => s.id !== id) }));
    };

    const resetProject = (keepTopic = false) => {
        const msg = keepTopic
            ? "현재 주제는 유지하고, 생성된 대본과 데이터만 초기화하시겠습니까?"
            : "정말 모든 데이터를 초기화하고 처음부터 시작하시겠습니까?";

        if (confirm(msg)) {
            setProject(prev => {
                const def = defaultProject();
                if (keepTopic) {
                    return { ...def, topic: prev.topic, settings: prev.settings };
                }
                return def;
            });
            setHookScript("");
            setBodyScript("");
            setHookFinalUrl("");
            setFinalVideoUrl("");
            setCurrentStep(keepTopic ? 2 : 1);

            // Force save to overwrite storage immediately
            setTimeout(() => saveProjectImmediately(), 50);

            setStatus("프로젝트가 초기화되었습니다.");
        }
    };

    return (
        <VideoContext.Provider value={{
            project, setProject, projectRef,
            busyMap, isBusy, setBusy, busyAny,
            status, setStatus,
            hookScript, setHookScript,
            bodyScript, setBodyScript,
            hookFinalUrl, setHookFinalUrl,
            finalVideoUrl, setFinalVideoUrl,
            autoPilotMode, setAutoPilotMode,
            patchScene, addScene, removeScene, saveProject, saveProjectImmediately, resetProject,
            API,
            currentStep, setCurrentStep
        }}>
            {children}
        </VideoContext.Provider>
    );
}
