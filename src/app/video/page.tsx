"use client";
import React, { useState } from "react";
import { VideoProvider, useVideoContext, STORAGE_KEY } from "./context/VideoContext";

// Tab Components
import TopicScout from "./tabs/TopicScout";
import ScriptPlanning from "./tabs/ScriptPlanning";
import ScriptGeneration from "./tabs/ScriptGeneration";
import ImageGeneration from "./tabs/ImageGeneration";
import TTSGeneration from "./tabs/TTSGeneration";
import VideoRendering from "./tabs/VideoRendering";
import TitleDescription from "./tabs/TitleDescription";
import ThumbnailGenerator from "./tabs/ThumbnailGenerator";
import ShortsGenerator from "./tabs/ShortsGenerator";
import IntroGenerator from "./tabs/IntroGenerator";
// Modal
import AutoPilotStatusModal from "../components/AutoPilotStatusModal";

// Define 10 Steps
const STEPS = [
  { id: 1, name: "주제 추천", component: TopicScout },
  { id: 2, name: "대본 기획", component: ScriptPlanning },
  { id: 3, name: "대본 생성", component: ScriptGeneration },
  { id: 4, name: "이미지 생성", component: ImageGeneration },
  { id: 5, name: "TTS 생성", component: TTSGeneration },
  { id: 6, name: "영상 렌더링", component: VideoRendering },
  { id: 7, name: "제목/설명 생성", component: TitleDescription },
  { id: 8, name: "썸네일 생성기", component: ThumbnailGenerator },
  { id: 9, name: "숏스 생성기", component: ShortsGenerator },
  { id: 10, name: "인트로 생성기", component: IntroGenerator },
];

function VideoPageContent() {
  const {
    project, setProject,
    currentStep, setCurrentStep,
    saveProject, // Use context action
    autoPilotMode, setAutoPilotMode, status // Auto Pilot state for Sidebar
  } = useVideoContext();

  const [isEditing, setIsEditing] = useState(false);

  // Active Component resolution
  const activeStep = STEPS.find(s => s.id === currentStep) || STEPS[0];
  const ActiveComponent = activeStep.component;

  // Handlers
  const handleStepChange = (id: number) => {
    setCurrentStep(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNext = () => {
    if (currentStep < 10) handleStepChange(currentStep + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) handleStepChange(currentStep - 1);
  };

  const saveProjectManual = () => {
    saveProject();
    alert("프로젝트가 저장되었습니다!");
  };

  // Completion Check Helper
  const isStepComplete = (id: number) => {
    if (id === 1) return !!project.topic;
    if (id === 2) return project.scenes.some(s => s.kind === "hook");
    if (id === 3) return project.scenes.some(s => s.ko1 || s.ko2);
    if (id === 4) return project.scenes.some(s => s.imageUrl || s.videoUrl);
    if (id === 5) return project.scenes.some(s => s.audioUrl);
    if (id === 6) return false; // Rendering is usually final
    if (id === 7) return (project.generatedTitles?.length ?? 0) > 0;
    if (id === 8) return !!project.thumbnailUrl;
    if (id === 9) return false;
    if (id === 10) return !!project.introVideoUrl;
    return false;
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans text-slate-900 items-start">

      {/* 🔴 LEFT SIDEBAR - STICKY (Always Visible) */}
      <aside className="w-64 bg-[#0a0a0a] border-r border-white/5 flex-shrink-0 sticky top-0 h-screen z-40 flex flex-col overflow-y-auto">

        {/* Header */}
        <div className="p-5 border-b border-white/5">
          <h1 className="text-xl font-black bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent mb-1">
            딸깍 영상 생성기
          </h1>
          <p className="text-xs text-gray-500 font-medium">Auto Video Maker v4.0</p>
        </div>

        {/* Project Title Area & Auto Pilot */}
        <div className="px-5 py-4 border-b border-white/5 bg-[#0a0a0a] space-y-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Current Project</div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <input
                  type="text"
                  value={project.name}
                  onChange={e => setProject(p => ({ ...p, name: e.target.value }))}
                  onBlur={() => setIsEditing(false)}
                  onKeyDown={e => e.key === "Enter" && setIsEditing(false)}
                  autoFocus
                  className="w-full text-sm font-bold bg-[#1a1a1a] border border-red-500/30 text-white rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              ) : (
                <>
                  <div onClick={() => setIsEditing(true)} className="font-bold text-gray-200 text-sm truncate flex-1 cursor-pointer hover:text-red-500 transition-colors">
                    {project.name || "새 프로젝트"} 🖌️
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ⚡ Auto-Pilot Toggle (Moved Here) */}
          <div className="bg-[#1a1a1a] rounded-xl p-3 border border-gray-800">
            <label className="flex items-center justify-between cursor-pointer mb-2">
              <span className="text-xs font-bold text-gray-300 flex items-center gap-1">
                ⚡ Auto-Pilot
              </span>
              <input
                type="checkbox"
                checked={autoPilotMode}
                onChange={e => setAutoPilotMode(e.target.checked)}
                className="toggle toggle-sm toggle-accent"
              />
            </label>
            <div className="text-[10px] text-gray-500 font-mono truncate border-t border-gray-800 pt-2 mt-1">
              {status || "대기 중..."}
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {STEPS.map((step) => {
            const isActive = step.id === currentStep;
            const isDone = isStepComplete(step.id);

            return (
              <button
                key={step.id}
                onClick={() => handleStepChange(step.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all group relative
                  ${isActive
                    ? "bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg shadow-red-900/30 font-bold"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }
                `}
              >
                {/* Number Badge */}
                <div className={`
                  w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold border transition-colors
                  ${isActive
                    ? "bg-white/20 text-white border-transparent"
                    : isDone
                      ? "bg-green-500/10 text-green-500 border-green-500/30 group-hover:border-green-500"
                      : "bg-[#1a1a1a] text-gray-600 border-gray-800 group-hover:border-gray-700 group-hover:text-gray-400"
                  }
                `}>
                  {isDone && !isActive ? "✓" : step.id}
                </div>

                {/* Label */}
                <span>{step.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-800 bg-[#0a0a0a] space-y-3">
          <button
            onClick={saveProjectManual}
            className="w-full py-3 bg-[#1a1a1a] border border-gray-800 text-gray-400 font-bold text-xs rounded-xl shadow-sm hover:bg-gray-800 hover:text-white transition-all flex items-center justify-center gap-2"
          >
            💾 프로젝트 저장
          </button>
        </div>
      </aside>

      {/* 🟢 RIGHT MAIN CONTENT */}
      <main className="flex-1 min-w-0 flex flex-col bg-[#0a0a0a]">

        {/* Top Sticky Header */}
        <header className="sticky top-0 z-40 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 px-8 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">
              Step {currentStep} of 10
            </div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              {activeStep.name}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentStep === 1}
              className="px-4 py-2 rounded-lg text-sm font-bold text-gray-500 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              이전
            </button>

            <button
              onClick={handleNext}
              disabled={currentStep === 10}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 shadow-lg shadow-indigo-900/20"
            >
              다음 단계 →
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 p-8 max-w-5xl mx-auto w-full">
          <div className="min-h-[500px] animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* 🎯 Render Only Active Step */}
            <ActiveComponent />
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="p-8 border-t border-white/5 bg-[#0a0a0a] mt-auto">
          <div className="max-w-5xl mx-auto flex justify-between items-center">
            <button
              onClick={handlePrev}
              disabled={currentStep === 1}
              className={`
                px-6 py-3 rounded-xl font-bold border-2 transition-all
                ${currentStep === 1
                  ? "border-gray-800 text-gray-600 cursor-not-allowed hidden"
                  : "border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white"
                }
              `}
            >
              ← 이전 단계
            </button>

            {currentStep < 10 ? (
              <button
                onClick={handleNext}
                className="px-8 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl font-bold shadow-lg shadow-red-900/30 hover:shadow-red-900/50 hover:scale-105 transition-all"
              >
                다음 단계로 계속하기 →
              </button>
            ) : (
              <button
                className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg hover:bg-green-700 transition-all"
                onClick={() => alert("모든 단계가 완료되었습니다!")}
              >
                🎉 최종 완료
              </button>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}

export default function VideoPage() {
  return (
    <VideoProvider>
      <VideoPageContent />
      <AutoPilotStatusModal />
    </VideoProvider>
  );
}