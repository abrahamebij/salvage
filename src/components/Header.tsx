import React from "react";
import type { AppStep } from "../types";
import { Camera, Sparkles, Ruler, Box, Download, Activity } from "lucide-react";

interface HeaderProps {
  currentStep: AppStep;
  onSelectStep: (step: AppStep) => void;
  onOpenDiagnostics: () => void;
}

const STEPS: Array<{ id: AppStep; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "capture", label: "1. Capture", icon: Camera },
  { id: "analyse", label: "2. Analyse", icon: Sparkles },
  { id: "measure", label: "3. Measure", icon: Ruler },
  { id: "workbench", label: "4. Workbench", icon: Box },
  { id: "export", label: "5. Export", icon: Download },
];

export const Header: React.FC<HeaderProps> = ({
  currentStep,
  onSelectStep,
  onOpenDiagnostics,
}) => {
  return (
    <header className="border-b border-[#2b2e37] bg-[#18191e]/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-xl font-bold tracking-tight text-[#f4f4f6]">
            Salvage
          </span>
          <button
            type="button"
            onClick={onOpenDiagnostics}
            title="Open Hybrid AI Diagnostics"
            className="hidden sm:inline-flex items-center space-x-1.5 text-xs font-mono tracking-wider px-2 py-0.5 rounded bg-[#212329] text-amber-400 border border-amber-500/30 hover:bg-amber-500/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <Activity className="w-3 h-3 text-amber-400" />
            <span>Hybrid AI Diagnostics</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <nav className="flex items-center space-x-1 sm:space-x-2" aria-label="Workflow Steps">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              return (
                <button
                  key={step.id}
                  onClick={() => onSelectStep(step.id)}
                  aria-current={isActive ? "step" : undefined}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                    isActive
                      ? "bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30 font-semibold"
                      : "text-[#9ea3b0] hover:text-[#f4f4f6] hover:bg-[#212329] border border-transparent"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#f59e0b]" : "text-[#9ea3b0]"}`} />
                  <span className="hidden md:inline">{step.label}</span>
                  <span className="md:hidden">{step.label.split(". ")[1]}</span>
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={onOpenDiagnostics}
            className="sm:hidden p-1.5 rounded bg-[#212329] text-amber-400 border border-amber-500/30"
            title="Diagnostics"
          >
            <Activity className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
