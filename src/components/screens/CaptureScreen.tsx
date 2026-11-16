import React from "react";
import { UploadCloud } from "lucide-react";

interface CaptureScreenProps {
  onContinue: () => void;
}

export const CaptureScreen: React.FC<CaptureScreenProps> = ({ onContinue }) => {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-[#f4f4f6]">
          Capture Broken Part
        </h1>
        <p className="mt-2 text-sm text-[#9ea3b0] max-w-2xl">
          Upload 3 to 6 clear photos of the broken part from multiple angles. Include a coin or ruler for scale reference when possible.
        </p>
      </div>

      <div className="border-2 border-dashed border-[#2b2e37] rounded-lg p-10 text-center bg-[#18191e] hover:border-amber-500/50 transition-colors">
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#212329] border border-[#2b2e37] flex items-center justify-center text-amber-500">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#f4f4f6]">
              Drop photos here, or click to browse
            </p>
            <p className="text-xs text-[#9ea3b0] mt-1 font-mono">
              PNG or JPEG • 3 to 6 photos • Max 20MB
            </p>
          </div>
          <div className="pt-2 flex flex-wrap gap-3 justify-center">
            <button
              type="button"
              className="px-4 py-2 text-xs font-semibold rounded bg-[#212329] text-[#f4f4f6] hover:bg-[#2a2c35] border border-[#2b2e37] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              Select Photos
            </button>
            <button
              type="button"
              className="px-4 py-2 text-xs font-semibold rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              Load Sample Part
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={onContinue}
          className="px-5 py-2 text-xs font-semibold rounded bg-[#f59e0b] text-[#121316] hover:bg-[#d97706] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 shadow-sm"
        >
          Proceed to Analyse →
        </button>
      </div>
    </div>
  );
};
