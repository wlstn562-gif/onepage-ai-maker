"use client";
import React from "react";
import { useVideoContext } from "../video/context/VideoContext";

export default function AutoPilotStatusModal() {
    const { autoPilotMode, setAutoPilotMode, status, currentStep } = useVideoContext();

    if (!autoPilotMode) return null;

    return (
        // Position: Bottom Left, near sidebar (Sidebar width is 64=16rem approx 256px)
        // Adjusting to not overlap with sidebar but stay close
        <div className="fixed bottom-4 left-72 z-[9999] flex flex-col justify-end items-start pointer-events-none">
            {/* Pointer events auto so inputs/buttons work */}
            <div className="pointer-events-auto bg-gray-900/95 border border-purple-500/50 text-white rounded-2xl shadow-2xl p-6 w-80 relative overflow-hidden transform transition-all scale-100 hover:scale-[1.02] animate-slide-up-fade">

                {/* Background Decor */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10 animate-pulse"></div>

                <div className="relative z-10 text-center">
                    <div className="flex flex-col items-center justify-center mb-6">
                        <div className="relative flex h-6 w-6 mb-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-6 w-6 bg-purple-500"></span>
                        </div>
                        <h3 className="font-black text-2xl text-white tracking-tight">Auto-Pilot 실행 중</h3>
                        <span className="text-sm font-mono text-purple-300 mt-1">Step {currentStep}/6 진행 중</span>
                    </div>

                    <div className="bg-black/80 rounded-xl p-4 mb-6 min-h-[80px] flex items-center justify-center text-center border border-white/10 shadow-inner">
                        <p className="text-lg text-gray-100 font-medium animate-pulse">{status || "작업 대기 중..."}</p>
                    </div>

                    <div className="space-y-3">
                        {/* Resume / Retry Button */}
                        <button
                            onClick={() => {
                                // Simple restart logic: Toggle Mode
                                setAutoPilotMode(false);
                                setTimeout(() => setAutoPilotMode(true), 200);
                            }}
                            className="w-full py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-green-900/50 transition-all flex items-center justify-center gap-2 group mb-2"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            다시 시도 / 계속 진행
                        </button>

                        <button
                            onClick={() => {
                                if (confirm("정말로 Auto-Pilot을 중단하시겠습니까? (현재 단계 완료 후 멈춥니다)")) {
                                    setAutoPilotMode(false);
                                }
                            }}
                            className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl font-bold text-sm shadow-inner transition-all flex items-center justify-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            작업 중단 (STOP)
                        </button>
                    </div>

                    <p className="text-xs text-gray-500 mt-4">
                        ⚠️ 현재 진행 중인 API 요청은 취소되지 않으며,<br />해당 단계가 완료된 후 멈춥니다.
                    </p>
                </div>
            </div>
        </div>
    );
}
