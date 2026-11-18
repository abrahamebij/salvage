import React, { useEffect, useMemo, useState } from "react";
import type { TemplateId } from "../../types";
import {
  generateGeometry,
  geometryToBinaryStl,
  downloadStl,
  generateStlFilename,
  type GeneratedGeometry,
} from "../../geometry";
import { verifyGeometry, type VerifierRuleResult } from "../../verifier";
import { Download, AlertTriangle, ArrowLeft, CheckCircle2, Box, FileCode, Loader2, XCircle } from "lucide-react";

interface ExportScreenProps {
  selectedTemplate: Exclude<TemplateId, "none">;
  parameters: Record<string, number>;
  onBack: () => void;
}

export const ExportScreen: React.FC<ExportScreenProps> = ({
  selectedTemplate,
  parameters,
  onBack,
}) => {
  const [geometry, setGeometry] = useState<GeneratedGeometry | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overrideAccepted, setOverrideAccepted] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    setIsGenerating(true);
    setError(null);

    generateGeometry(selectedTemplate, parameters)
      .then((geo) => {
        if (!isCancelled) setGeometry(geo);
      })
      .catch((err) => {
        if (!isCancelled) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!isCancelled) setIsGenerating(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedTemplate, parameters]);

  // The verifier decides what this screen may claim. Nothing below is assumed.
  const verification = useMemo(
    () => (geometry ? verifyGeometry(geometry, selectedTemplate, parameters) : null),
    [geometry, selectedTemplate, parameters]
  );
  const checksPassed = verification?.passed ?? false;
  const blockingCount = verification?.blockingFailures ?? 0;
  const failedChecks: VerifierRuleResult[] =
    verification?.results.filter((r) => r.category === "blocking" && r.status === "fail") ?? [];
  const isOverride = !checksPassed;
  const canDownload = !!geometry && !!verification && (checksPassed || overrideAccepted);

  // Changing the model resets the override acknowledgement
  useEffect(() => {
    setOverrideAccepted(false);
  }, [selectedTemplate, parameters]);

  const handleDownload = () => {
    if (!geometry || !canDownload) return;
    try {
      const filename = generateStlFilename(
        selectedTemplate,
        geometry.boundingBox.dimensions,
        isOverride
      );
      const stlBytes = geometryToBinaryStl(
        geometry,
        `Salvage STL - ${selectedTemplate} - ${geometry.triangleCount} tris`
      );
      downloadStl(stlBytes, filename);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const filename = geometry
    ? generateStlFilename(selectedTemplate, geometry.boundingBox.dimensions, isOverride)
    : `salvage_${selectedTemplate}.stl`;

  const fileSizeKb = geometry ? ((84 + geometry.triangleCount * 50) / 1024).toFixed(1) : "0";

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-[#f4f4f6]">
          Export Binary STL
        </h1>
        <p className="mt-2 text-sm text-[#9ea3b0] max-w-2xl">
          Download your replacement part model. The binary STL file is scaled in millimeters and can be opened in Cura, PrusaSlicer, or Bambu Studio.
        </p>
      </div>

      {/* Mandatory Limitations Notice */}
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 mb-6 flex items-start space-x-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-xs text-[#f4f4f6] space-y-1">
          <p className="font-semibold text-amber-400">Honest Limitations Notice</p>
          <p className="text-[#9ea3b0] leading-relaxed">
            {!verification
              ? "Geometry checks are running."
              : checksPassed
              ? "Geometry checks passed."
              : `Geometry checks have not passed (${blockingCount} blocking).`}{" "}
            This is not a load-tested or mechanically verified part.
            Check fitment and material suitability (PETG, ABS, or Nylon recommended for functional mechanical stress) before putting in service.
          </p>
        </div>
      </div>

      {/* Failed checks and explicit override */}
      {failedChecks.length > 0 && (
        <div className="mb-6 p-4 rounded-lg bg-red-950/30 border border-red-500/30 text-xs space-y-3">
          <p className="font-semibold text-red-400">
            Export is blocked by {failedChecks.length} failed check{failedChecks.length === 1 ? "" : "s"}:
          </p>
          <ul className="space-y-2">
            {failedChecks.map((c) => (
              <li key={c.id} className="flex items-start space-x-2 text-red-200">
                <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                <span>
                  <span className="font-semibold">{c.title}.</span> {c.message}
                </span>
              </li>
            ))}
          </ul>
          <label className="flex items-start space-x-2 text-[#f4f4f6] cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={overrideAccepted}
              onChange={(e) => setOverrideAccepted(e.target.checked)}
              className="mt-0.5 accent-amber-500"
            />
            <span>
              I understand these checks failed. Export anyway. The file name will say OVERRIDE.
            </span>
          </label>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-950/40 border border-red-500/30 text-xs text-red-200">
          <p className="font-semibold text-red-400">Export Error:</p>
          <p className="mt-1 font-mono">{error}</p>
        </div>
      )}

      {/* Part Specifications & Download Card */}
      <div className="rounded-lg border border-[#2b2e37] bg-[#18191e] p-8 text-center space-y-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
          <FileCode className="w-7 h-7" />
        </div>

        <div>
          <h2 className="text-lg font-bold text-[#f4f4f6] capitalize">
            {selectedTemplate} Replacement Part
          </h2>
          <p className="text-xs text-[#9ea3b0] font-mono mt-1">
            {filename}
          </p>
        </div>

        {/* Geometry specs grid */}
        {geometry && (
          <div className="max-w-md mx-auto grid grid-cols-3 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded bg-[#121316] border border-[#2b2e37] text-left">
              <span className="text-[10px] text-[#6b7280] block">DIMENSIONS</span>
              <span className="text-amber-400 font-medium">
                {geometry.boundingBox.dimensions[0].toFixed(1)} × {geometry.boundingBox.dimensions[1].toFixed(1)} × {geometry.boundingBox.dimensions[2].toFixed(1)} mm
              </span>
            </div>
            <div className="p-2.5 rounded bg-[#121316] border border-[#2b2e37] text-left">
              <span className="text-[10px] text-[#6b7280] block">TRIANGLES</span>
              <span className="text-[#f4f4f6] font-medium">
                {geometry.triangleCount.toLocaleString()}
              </span>
            </div>
            <div className="p-2.5 rounded bg-[#121316] border border-[#2b2e37] text-left">
              <span className="text-[10px] text-[#6b7280] block">FILE SIZE</span>
              <span className="text-[#f4f4f6] font-medium">
                {fileSizeKb} KB
              </span>
            </div>
          </div>
        )}

        <div className="pt-2 flex flex-col items-center space-y-2">
          <button
            type="button"
            onClick={handleDownload}
            disabled={isGenerating || !canDownload}
            className="inline-flex items-center space-x-2 px-6 py-3 text-xs font-semibold rounded-md bg-[#f59e0b] text-[#121316] hover:bg-[#d97706] transition-all disabled:opacity-50 cursor-pointer shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : downloadSuccess ? (
              <CheckCircle2 className="w-4 h-4 text-[#121316]" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>
              {isGenerating
                ? "Compiling Binary STL..."
                : downloadSuccess
                ? "Downloaded Successfully!"
                : isOverride
                ? "Download Binary STL (override)"
                : "Download Binary STL (.stl)"}
            </span>
          </button>

          <span className="text-[11px] font-mono text-[#6b7280]">
            Format: Binary STL • Units: mm
          </span>
        </div>
      </div>

      <div className="mt-8 flex justify-between items-center">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-medium rounded text-[#9ea3b0] hover:text-[#f4f4f6] bg-[#212329] border border-[#2b2e37] hover:bg-[#2b2e37] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Workbench</span>
        </button>

        <span
          className={`text-xs font-mono flex items-center space-x-1 ${
            !verification ? "text-[#6b7280]" : checksPassed ? "text-emerald-400" : "text-red-400"
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          <span>
            {!verification
              ? "Checking geometry"
              : checksPassed
              ? "Geometry checks passed"
              : `${blockingCount} check${blockingCount === 1 ? "" : "s"} failed`}
          </span>
        </span>
      </div>
    </div>
  );
};
