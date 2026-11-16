import React from "react";
import { Download, AlertTriangle, ArrowLeft } from "lucide-react";

interface ExportScreenProps {
  onBack: () => void;
}

export const ExportScreen: React.FC<ExportScreenProps> = ({ onBack }) => {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-[#f4f4f6]">
          Export Binary STL
        </h1>
        <p className="mt-2 text-sm text-[#9ea3b0] max-w-2xl">
          Download your verified 3D printable replacement model ready for your slicer (Cura, PrusaSlicer, Bambu Studio).
        </p>
      </div>

      {/* Mandatory Limitations Notice */}
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 mb-6 flex items-start space-x-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-xs text-[#f4f4f6] space-y-1">
          <p className="font-semibold text-amber-400">Honest Limitations Notice</p>
          <p className="text-[#9ea3b0] leading-relaxed">
            Geometry checks passed. This is not a load-tested or mechanically verified part.
            Check fitment and material suitability (PETG/ABS/Nylon recommended for mechanical stress) before putting in service.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-[#2b2e37] bg-[#18191e] p-8 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#212329] text-amber-500 border border-[#2b2e37]">
          <Download className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-[#f4f4f6]">
            Binary STL Generation
          </h2>
          <p className="text-xs text-[#9ea3b0] font-mono mt-1">
            salvage_knob_verified.stl
          </p>
        </div>
        <button
          type="button"
          disabled
          className="px-6 py-2.5 text-xs font-semibold rounded bg-[#212329] text-[#6b7280] border border-[#2b2e37] cursor-not-allowed"
        >
          Download STL (Requires Geometry in Phase 7)
        </button>
      </div>

      <div className="mt-8 flex justify-start">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-medium rounded text-[#9ea3b0] hover:text-[#f4f4f6] bg-[#212329] border border-[#2b2e37] hover:bg-[#2b2e37] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Workbench</span>
        </button>
      </div>
    </div>
  );
};
