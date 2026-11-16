import React from "react";
import { Box, Sliders, CheckCircle2, Cpu } from "lucide-react";

interface WorkbenchScreenProps {
  onBack: () => void;
  onContinue: () => void;
}

export const WorkbenchScreen: React.FC<WorkbenchScreenProps> = ({ onBack, onContinue }) => {
  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* 3-Column Tool Layout */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 bg-[#121316]">
        {/* Left Column: Parameters Panel */}
        <div className="md:col-span-3 border-r border-[#2b2e37] bg-[#18191e] flex flex-col min-h-0">
          <div className="p-3 border-b border-[#2b2e37] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#f4f4f6]">
                Parameters
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#9ea3b0] bg-[#212329] px-1.5 py-0.5 rounded border border-[#2b2e37]">
              Template: Knob
            </span>
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs text-[#9ea3b0]">
            <p className="italic">Parametric controls with live editing will populate here.</p>
          </div>
        </div>

        {/* Center Column: 3D Viewport */}
        <div className="md:col-span-6 bg-[#0f1013] relative flex items-center justify-center border-b md:border-b-0">
          <div className="text-center p-6 space-y-3">
            <div className="w-16 h-16 rounded-full bg-[#18191e] border border-[#2b2e37] flex items-center justify-center mx-auto text-amber-500">
              <Box className="w-8 h-8" />
            </div>
            <p className="text-xs font-medium text-[#f4f4f6]">Three.js Viewport</p>
            <p className="text-[11px] font-mono text-[#9ea3b0] max-w-xs">
              Interactive 3D mesh rendering, orbit controls, grid context, and unit scale.
            </p>
          </div>

          <div className="absolute top-3 left-3 bg-[#18191e]/80 backdrop-blur px-2.5 py-1 rounded border border-[#2b2e37] text-[11px] font-mono text-[#9ea3b0]">
            Grid: 1mm • Unit: mm
          </div>
        </div>

        {/* Right Column: Deterministic Verifier */}
        <div className="md:col-span-3 border-l border-[#2b2e37] bg-[#18191e] flex flex-col min-h-0">
          <div className="p-3 border-b border-[#2b2e37] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#f4f4f6]">
                Verifier
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#9ea3b0]">Deterministic</span>
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs text-[#9ea3b0]">
            <p className="italic">Watertight check, bounding box, mating features, and wall thickness validation.</p>
          </div>
          <div className="p-3 border-t border-[#2b2e37] flex space-x-2">
            <button
              onClick={onBack}
              className="flex-1 py-1.5 px-3 rounded text-xs text-[#9ea3b0] hover:text-[#f4f4f6] bg-[#212329] border border-[#2b2e37] transition-colors"
            >
              Back
            </button>
            <button
              onClick={onContinue}
              className="flex-1 py-1.5 px-3 rounded text-xs font-semibold bg-amber-500 text-[#121316] hover:bg-amber-400 transition-colors"
            >
              Export STL →
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Strip: Hybrid Routing Ledger */}
      <div className="h-12 border-t border-[#2b2e37] bg-[#18191e] px-4 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center space-x-3 text-[#9ea3b0]">
          <div className="flex items-center space-x-1.5 text-amber-500">
            <Cpu className="w-3.5 h-3.5" />
            <span className="font-semibold text-xs">Hybrid Routing Ledger:</span>
          </div>
          <span>On-device: 0</span>
          <span>•</span>
          <span>Escalated: 0</span>
          <span>•</span>
          <span>Latency: 0ms</span>
        </div>
        <div className="text-[11px] text-[#6b7280]">
          No AI calls executed yet
        </div>
      </div>
    </div>
  );
};
