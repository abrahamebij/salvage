import React from "react";
import type { AppStep } from "../types";
import { Camera, Sparkles, Ruler, Box, Download } from "lucide-react";

interface HeaderProps {
  currentStep: AppStep;
  onSelectStep: (step: AppStep) => void;
}

const STEPS: Array<{ id: AppStep; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "capture", label: "1. Capture", icon: Camera },
  { id: "analyse", label: "2. Analyse", icon: Sparkles },
  { id: "measure", label: "3. Measure", icon: Ruler },
  { id: "workbench", label: "4. Workbench", icon: Box },
  { id: "export", label: "5. Export", icon: Download },
];

export const Header: React.FC<HeaderProps> = ({ currentStep, onSelectStep }) => {
  return (
    <header className="border-b border-[#2b2e37] bg-[#18191e]/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-xl font-bold tracking-tight text-[#f4f4f6]">
            Salvage
          </span>
          <span className="hidden sm:inline-block text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#212329] text-[#9ea3b0] border border-[#2b2e37]">
            Hybrid AI
          </span>
        </div>

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
      </div>
    </header>
  );
};
