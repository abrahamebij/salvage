import React from "react";
import { Ruler, ArrowLeft, ArrowRight } from "lucide-react";

interface MeasureScreenProps {
  onBack: () => void;
  onContinue: () => void;
}

export const MeasureScreen: React.FC<MeasureScreenProps> = ({ onBack, onContinue }) => {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-[#f4f4f6]">
          Caliper Measurements & Provenance
        </h1>
        <p className="mt-2 text-sm text-[#9ea3b0] max-w-2xl">
          Review estimated parameters and enter caliper measurements for mating-critical dimensions (shaft bore, snap arm, mounting holes).
        </p>
      </div>

      <div className="rounded-lg border border-[#2b2e37] bg-[#18191e] p-8 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
          <Ruler className="w-6 h-6" />
        </div>
        <h2 className="text-base font-semibold text-[#f4f4f6]">
          Measurement Workflow
        </h2>
        <p className="text-xs text-[#9ea3b0] max-w-md mx-auto leading-relaxed">
          Each dimension will display its provenance chip (<span className="font-mono text-amber-400">Measured</span>, <span className="font-mono text-neutral-400">Estimated</span>, or <span className="font-mono text-neutral-500">Default</span>). Mating-critical parameters require user confirmation before export.
        </p>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-medium rounded text-[#9ea3b0] hover:text-[#f4f4f6] bg-[#212329] border border-[#2b2e37] hover:bg-[#2b2e37] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Analyse</span>
        </button>
        <button
          onClick={onContinue}
          className="inline-flex items-center space-x-1.5 px-5 py-2 text-xs font-semibold rounded bg-[#f59e0b] text-[#121316] hover:bg-[#d97706] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <span>Open Workbench</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
