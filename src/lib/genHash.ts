
// src/lib/genHash.ts
// - 동기 해시(FNV-1a 32bit)로 lastGenHash 비교용
// - 입력 객체를 안정적으로 문자열로 만드는 stableStringify 포함

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

function stableStringify(v: any): string {
    const seen = new WeakSet<object>();

    const walk = (x: any): Json => {
        if (x === null) return null;
        const t = typeof x;

        if (t === "string" || t === "number" || t === "boolean") return x as any;
        if (t === "bigint") return String(x);
        if (t === "undefined" || t === "function" || t === "symbol") return null;

        if (Array.isArray(x)) return x.map(walk);

        if (t === "object") {
            if (seen.has(x)) return "[Circular]";
            seen.add(x);

            const out: { [k: string]: Json } = {};
            const keys = Object.keys(x).sort();
            for (const k of keys) {
                const vv = x[k];
                if (typeof vv === "undefined" || typeof vv === "function") continue;
                out[k] = walk(vv);
            }
            return out;
        }

        return String(x);
    };

    return JSON.stringify(walk(v));
}

function fnv1a32(str: string): string {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return ("00000000" + h.toString(16)).slice(-8);
}

export function makeSceneGenHash(args: {
    model: string;
    // 씬 입력
    ko1?: string;
    ko2?: string;
    ko3?: string;
    ko4?: string;
    ko?: string; // 기존 구조가 ko 한 덩어리면 이걸 쓰면 됨
    promptEn: string;

    // 전역/설정값
    settings: Record<string, any>;
}): string {
    const payload = {
        kind: "sceneGen",
        model: args.model,
        ko1: args.ko1 ?? null,
        ko2: args.ko2 ?? null,
        ko3: args.ko3 ?? null,
        ko4: args.ko4 ?? null,
        ko: args.ko ?? null,
        promptEn: args.promptEn,
        settings: args.settings,
    };
    return fnv1a32(stableStringify(payload));
}

export function makeRenderHash(args: {
    model: string;
    settings: Record<string, any>;
    // 합성 입력: 씬별로 videoUrl/audioUrl/subtitleText 등
    items: Array<{
        id: string;
        videoUrl?: string;
        imageUrl?: string;
        audioUrl?: string;
        subtitle?: string;
        durationSec?: number;
    }>;
}): string {
    const payload = {
        kind: "render",
        model: args.model,
        settings: args.settings,
        items: args.items.map((it) => ({
            id: it.id,
            videoUrl: it.videoUrl ?? null,
            imageUrl: it.imageUrl ?? null,
            audioUrl: it.audioUrl ?? null,
            subtitle: it.subtitle ?? null,
            durationSec: it.durationSec ?? null,
        })),
    };
    return fnv1a32(stableStringify(payload));
}