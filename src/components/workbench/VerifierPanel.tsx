import React from "react";
import type { VerificationSummary, VerifierRuleResult } from "../../verifier";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Download,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";

interface VerifierPanelProps {
  verification: VerificationSummary | null;
  onBack: () => void;
  onContinue: () => void;
}

export const VerifierPanel: React.FC<VerifierPanelProps> = ({
  verification,
  onBack,
  onContinue,
}) => {
  const isPassed = verification?.passed ?? false;
  const blockingCount = verification?.blockingFailures ?? 0;
  const warningCount = verification?.warningCount ?? 0;

  const renderStatusIcon = (status: VerifierRuleResult["status"]) => {
    switch (status) {
      case "pass":
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case "fail":
        return <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />;
      case "warning":
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case "na":
      default:
        return <span className="w-3.5 h-3.5 rounded-full bg-[#3e424f] inline-block" />;
    }
  };

  const getStatusBadge = (status: VerifierRuleResult["status"]) => {
    switch (status) {
      case "pass":
        return (
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            PASS
          </span>
        );
      case "fail":
        return (
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/30">
            FAIL
          </span>
        );
      case "warning":
        return (
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
            WARN
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#18191e] border-l border-[#2b2e37] min-h-0 select-none">
      {/* Panel Header */}
      <div className="p-3.5 border-b border-[#2b2e37] flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isPassed ? (
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          )}
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#f4f4f6]">
            Deterministic Verifier
          </h2>
        </div>

        <span
          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
            isPassed
              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
              : "bg-red-500/15 text-red-400 border-red-500/30"
          }`}
        >
          {isPassed ? "EXPORT READY" : `BLOCKED (${blockingCount})`}
        </span>
      </div>

      {/* Verification Rules List */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5">
        {verification?.results.map((rule) => {
          const isFail = rule.status === "fail";
          const isWarn = rule.status === "warning";

          return (
            <div
              key={rule.id}
              className={`p-3 rounded-lg border transition-all text-xs space-y-1.5 ${
                isFail
                  ? "bg-red-950/20 border-red-500/40"
                  : isWarn
                  ? "bg-amber-950/15 border-amber-500/30"
                  : "bg-[#141519] border-[#23252c]"
              }`}
            >
              {/* Check Header */}
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center space-x-1.5">
                  {renderStatusIcon(rule.status)}
                  <span className="font-semibold text-[#f4f4f6] text-[11px]">
                    {rule.title}
                  </span>
                </div>
                {getStatusBadge(rule.status)}
              </div>

              {/* Message */}
              <p className="text-[11px] text-[#9ea3b0] leading-relaxed">
                {rule.message}
              </p>

              {/* Actual vs Expected */}
              {(rule.actualValue || rule.expectedValue) && (
                <div className="pt-1 flex flex-wrap gap-2 text-[10px] font-mono">
                  {rule.actualValue && (
                    <span className="text-[#6b7280]">
                      Actual: <span className="text-[#f4f4f6]">{rule.actualValue}</span>
                    </span>
                  )}
                  {rule.expectedValue && (
                    <span className="text-[#6b7280]">
                      Req: <span className="text-amber-400">{rule.expectedValue}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Warning Summary banner if warnings present */}
        {warningCount > 0 && (
          <div className="p-2.5 rounded bg-amber-500/5 border border-amber-500/20 text-[10px] text-amber-300 font-mono flex items-center space-x-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>{warningCount} non-blocking warning flagged (inspect slicer orientation).</span>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="p-3.5 border-t border-[#2b2e37] flex space-x-2 bg-[#141519]">
        <button
          onClick={onBack}
          className="inline-flex items-center justify-center space-x-1.5 flex-1 py-2 px-3 rounded text-xs text-[#9ea3b0] hover:text-[#f4f4f6] bg-[#212329] border border-[#2b2e37] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>
        <button
          onClick={onContinue}
          className="inline-flex items-center justify-center space-x-1.5 flex-1 py-2 px-3 rounded text-xs font-semibold bg-amber-500 text-[#121316] hover:bg-amber-400 transition-colors shadow-sm cursor-pointer"
        >
          <span>Export STL</span>
          <Download className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
