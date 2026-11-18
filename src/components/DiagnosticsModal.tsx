import React, { useState } from "react";
import {
  runHelloHybridTest,
  InferenceMode,
  getAppCheckState,
  type HybridTestResult,
} from "../lib/firebase";
import {
  Activity,
  X,
  Play,
  Cpu,
  AlertTriangle,
  Terminal,
} from "lucide-react";

interface DiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DiagnosticsModal: React.FC<DiagnosticsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedMode, setSelectedMode] = useState<InferenceMode>(
    InferenceMode.PREFER_ON_DEVICE
  );
  const [isRunning, setIsRunning] = useState(false);
  const [testResult, setTestResult] = useState<HybridTestResult | null>(null);

  if (!isOpen) return null;

  const handleRun = async () => {
    setIsRunning(true);
    setTestResult(null);
    try {
      const result = await runHelloHybridTest(selectedMode);
      setTestResult(result);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-xl border border-[#2b2e37] bg-[#18191e] shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#2b2e37] flex items-center justify-between bg-[#121316]">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#f4f4f6]">
                Firebase AI Logic Diagnostics
              </h2>
              <p className="text-[11px] text-[#9ea3b0]">
                Stage 0 Hello Hybrid Verification Gate
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#9ea3b0] hover:text-[#f4f4f6] hover:bg-[#212329] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Target Architecture Notice */}
          <div className="p-3.5 rounded-lg bg-[#121316] border border-[#2b2e37] text-xs text-[#9ea3b0] space-y-1.5">
            <div className="flex items-center space-x-2 text-amber-400 font-semibold">
              <Cpu className="w-3.5 h-3.5" />
              <span>Hybrid Mode Strategy:</span>
            </div>
            <p className="leading-relaxed">
              Requests target <span className="text-[#f4f4f6] font-mono">PREFER_ON_DEVICE</span>.
              If Chrome Desktop 139+ Gemini Nano is available, it executes locally. If unsupported, offline, or unavailable, it routes to <span className="text-[#f4f4f6] font-mono">{import.meta.env.VITE_FIREBASE_CLOUD_MODEL || "(VITE_FIREBASE_CLOUD_MODEL not set)"}</span> in the cloud.
            </p>
          </div>

          {/* Test Controls */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#9ea3b0] block">
              Select Inference Mode to Test
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                {
                  id: InferenceMode.PREFER_ON_DEVICE,
                  label: "PREFER_ON_DEVICE",
                  desc: "Hybrid (Nano with Flash fallback)",
                },
                {
                  id: InferenceMode.ONLY_ON_DEVICE,
                  label: "ONLY_ON_DEVICE",
                  desc: "Strictly Chrome Gemini Nano",
                },
                {
                  id: InferenceMode.ONLY_IN_CLOUD,
                  label: "ONLY_IN_CLOUD",
                  desc: "Direct Cloud Gemini Flash",
                },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedMode(item.id as InferenceMode)}
                  className={`p-2.5 rounded-lg text-left border transition-all text-xs flex flex-col justify-between ${
                    selectedMode === item.id
                      ? "border-amber-500 bg-amber-500/10 text-[#f4f4f6]"
                      : "border-[#2b2e37] bg-[#121316] text-[#9ea3b0] hover:border-[#3e424f]"
                  }`}
                >
                  <span className="font-mono font-semibold text-amber-400">
                    {item.label}
                  </span>
                  <span className="text-[10px] text-[#9ea3b0] mt-1">
                    {item.desc}
                  </span>
                </button>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleRun}
                disabled={isRunning}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-md bg-amber-500 text-[#121316] hover:bg-amber-400 font-semibold text-xs transition-colors disabled:opacity-50 cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                <Play className={`w-3.5 h-3.5 fill-current ${isRunning ? "animate-spin" : ""}`} />
                <span>{isRunning ? "Executing Test..." : "Run Hello Hybrid Call"}</span>
              </button>
            </div>
          </div>

          {/* Test Result View */}
          {testResult && (
            <div className="space-y-3 pt-3 border-t border-[#2b2e37]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#9ea3b0]">
                  Execution Diagnostics
                </span>
                <span className="text-[10px] font-mono text-[#6b7280]">
                  Tested at {testResult.timestamp}
                </span>
              </div>

              {/* Status Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
                <div className="p-2 rounded bg-[#121316] border border-[#2b2e37]">
                  <span className="text-[10px] text-[#6b7280] block">STATUS</span>
                  <span className={testResult.success ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                    {testResult.success ? "SUCCESS" : "FAILED"}
                  </span>
                </div>

                <div className="p-2 rounded bg-[#121316] border border-[#2b2e37]">
                  <span className="text-[10px] text-[#6b7280] block">ACTUAL SOURCE</span>
                  <span className={`font-bold ${
                    testResult.actualSource === "ON_DEVICE"
                      ? "text-emerald-400"
                      : testResult.actualSource === "IN_CLOUD"
                      ? "text-sky-400"
                      : "text-red-400"
                  }`}>
                    {testResult.actualSource}
                  </span>
                </div>

                <div className="p-2 rounded bg-[#121316] border border-[#2b2e37]">
                  <span className="text-[10px] text-[#6b7280] block">LATENCY</span>
                  <span className="text-amber-400 font-bold">
                    {testResult.latencyMs} ms
                  </span>
                </div>

                <div className="p-2 rounded bg-[#121316] border border-[#2b2e37]">
                  <span className="text-[10px] text-[#6b7280] block">REQUESTED</span>
                  <span className="text-[#9ea3b0] truncate block">
                    {testResult.requestedMode}
                  </span>
                </div>

                <div className="p-2 rounded bg-[#121316] border border-[#2b2e37]">
                  <span className="text-[10px] text-[#6b7280] block">APP CHECK</span>
                  <span className={testResult.appCheck === "inactive" ? "text-red-400 font-bold" : "text-[#9ea3b0]"}>
                    {(testResult.appCheck ?? getAppCheckState()).toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Output or Error */}
              {testResult.success ? (
                <div className="p-3 rounded-lg bg-[#121316] border border-[#2b2e37] space-y-1">
                  <div className="flex items-center space-x-1.5 text-[11px] text-[#9ea3b0] font-mono">
                    <Terminal className="w-3.5 h-3.5 text-amber-500" />
                    <span>Raw Structured Model Output:</span>
                  </div>
                  <pre className="text-xs font-mono text-emerald-300 whitespace-pre-wrap overflow-x-auto p-2 bg-[#0d0e11] rounded border border-[#23252c]">
                    {testResult.output}
                  </pre>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/30 text-xs text-red-200 space-y-1">
                  <div className="flex items-center space-x-1.5 font-semibold text-red-400">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Inference Error Details:</span>
                  </div>
                  <p className="font-mono text-[11px] leading-relaxed break-words">
                    {testResult.error}
                  </p>
                  <p className="text-[11px] text-neutral-400 pt-1">
                    Tip: If testing on-device, ensure you are running Chrome Desktop 139+ with <code className="text-amber-300 font-mono">chrome://flags/#prompt-api-for-gemini-nano-multimodal-input</code> enabled. For cloud calls, confirm your App Check debug token is registered.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[#2b2e37] flex items-center justify-between bg-[#121316] text-[11px] text-[#9ea3b0]">
          <span>Stage 0 gate: Verifies real execution source & latency</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-[#212329] text-[#f4f4f6] hover:bg-[#2b2e37] border border-[#2b2e37] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
