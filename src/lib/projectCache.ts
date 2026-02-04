// src/lib/projectCache.ts
// - project를 localStorage에 자동 저장/복원
// - debounced save

export const PROJECT_CACHE_KEY = "ag_project_v1";

export function loadProjectFromLocal<T>(): T | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = window.localStorage.getItem(PROJECT_CACHE_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

export function saveProjectToLocal<T>(project: T): void {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(PROJECT_CACHE_KEY, JSON.stringify(project));
    } catch {
        // ignore quota
    }
}

export function clearProjectLocal(): void {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.removeItem(PROJECT_CACHE_KEY);
    } catch { }
}