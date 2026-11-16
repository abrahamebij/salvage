import React from "react";
import { Sparkles, ArrowLeft, ArrowRight } from "lucide-react";

interface AnalyseScreenProps {
  onBack: () => void;
  onContinue: () => void;
}

export const AnalyseScreen: React.FC<AnalyseScreenProps> = ({ onBack, onContinue }) => {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-[#f4f4f6]">
          AI Analysis & Part Identification
        </h1>
        <p className="mt-2 text-sm text-[#9ea3b0] max-w-2xl">
          Hybrid inference checks photo triage on-device, classifies the part against parametric templates (Knob, Clip, Bracket), and extracts initial dimensions.
        </p>
      </div>

      <div className="rounded-lg border border-[#2b2e37] bg-[#18191e] p-8 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-base font-semibold text-[#f4f4f6]">
          Analysis Pipeline Ready
        </h2>
        <p className="text-xs text-[#9ea3b0] max-w-md mx-auto leading-relaxed">
          Photo triage, template matching, and parameter proposals will be executed here with Firebase AI Logic (on-device with cloud escalation).
        </p>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-medium rounded text-[#9ea3b0] hover:text-[#f4f4f6] bg-[#212329] border border-[#2b2e37] hover:bg-[#2b2e37] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Capture</span>
        </button>
        <button
          onClick={onContinue}
          className="inline-flex items-center space-x-1.5 px-5 py-2 text-xs font-semibold rounded bg-[#f59e0b] text-[#121316] hover:bg-[#d97706] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <span>Continue to Measure</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
