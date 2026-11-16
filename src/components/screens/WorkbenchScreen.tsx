import React, { useEffect, useState, useMemo } from "react";
import type { TemplateId, Provenance } from "../../types";
import { ParameterPanel } from "../workbench/ParameterPanel";
import { ThreeViewport } from "../workbench/ThreeViewport";
import { VerifierPanel } from "../workbench/VerifierPanel";
import { generateGeometry, type GeneratedGeometry } from "../../geometry";
import { verifyGeometry, type VerificationSummary } from "../../verifier";
import { Cpu, Activity } from "lucide-react";

interface WorkbenchScreenProps {
  selectedTemplate: Exclude<TemplateId, "none">;
  onSelectTemplate: (template: Exclude<TemplateId, "none">) => void;
  parameters: Record<string, number>;
  provenances: Record<string, Provenance>;
  onParameterChange: (paramId: string, value: number) => void;
  onResetDefaults: () => void;
  onBack: () => void;
  onContinue: () => void;
  onOpenDiagnostics?: () => void;
}

export const WorkbenchScreen: React.FC<WorkbenchScreenProps> = ({
  selectedTemplate,
  onSelectTemplate,
  parameters,
  provenances,
  onParameterChange,
  onResetDefaults,
  onBack,
  onContinue,
  onOpenDiagnostics,
}) => {
  const [geometry, setGeometry] = useState<GeneratedGeometry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Asynchronously generate geometry whenever template or parameters change
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setGeoError(null);

    const timer = setTimeout(async () => {
      try {
        const result = await generateGeometry(selectedTemplate, parameters);
        if (!isCancelled) {
          setGeometry(result);
        }
      } catch (err) {
        if (!isCancelled) {
          setGeoError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }, 40); // 40ms debounce for silky smooth slider scrubbing

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [selectedTemplate, parameters]);

  // Run deterministic verification whenever geometry or parameters change
  const verification: VerificationSummary | null = useMemo(() => {
    if (!geometry) return null;
    return verifyGeometry(geometry, selectedTemplate, parameters);
  }, [geometry, selectedTemplate, parameters]);

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden select-none">
      {/* 3-Column Tool Layout */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 bg-[#121316]">
        {/* Left Column: Parameters Panel */}
        <div className="md:col-span-3 min-h-0 flex flex-col">
          <ParameterPanel
            selectedTemplate={selectedTemplate}
            onSelectTemplate={onSelectTemplate}
            parameters={parameters}
            provenances={provenances}
            onParameterChange={onParameterChange}
            onResetDefaults={onResetDefaults}
          />
        </div>

        {/* Center Column: Interactive Three.js Viewport */}
        <div className="md:col-span-6 relative flex flex-col min-h-0 border-b md:border-b-0">
          <ThreeViewport
            geometry={geometry}
            isLoading={isLoading}
            error={geoError}
          />
        </div>

        {/* Right Column: Deterministic Verifier */}
        <div className="md:col-span-3 min-h-0 flex flex-col">
          <VerifierPanel
            verification={verification}
            onBack={onBack}
            onContinue={onContinue}
          />
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
          <span>Avg Latency: 0ms</span>
        </div>

        <div className="flex items-center space-x-2">
          {onOpenDiagnostics && (
            <button
              type="button"
              onClick={onOpenDiagnostics}
              className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#212329] hover:bg-[#2b2e37] text-amber-400 border border-amber-500/30 text-[11px] transition-colors"
            >
              <Activity className="w-3 h-3 text-amber-400" />
              <span>Test Hybrid Link</span>
            </button>
          )}
          <span className="text-[11px] text-[#6b7280]">
            Deterministic Verifier Active
          </span>
        </div>
      </div>
    </div>
  );
};
