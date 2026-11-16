import { useState, useCallback } from "react";
import type { AppStep, CapturedPhoto, TemplateId, Provenance } from "./types";
import { Header } from "./components/Header";
import { CaptureScreen } from "./components/screens/CaptureScreen";
import { AnalyseScreen } from "./components/screens/AnalyseScreen";
import { MeasureScreen } from "./components/screens/MeasureScreen";
import { WorkbenchScreen } from "./components/screens/WorkbenchScreen";
import { ExportScreen } from "./components/screens/ExportScreen";
import { DiagnosticsModal } from "./components/DiagnosticsModal";
import { getDefaultParameters } from "./domain/templates";

export function App() {
  const [currentStep, setCurrentStep] = useState<AppStep>("capture");
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);

  // Active Template & Parameter State
  const [selectedTemplate, setSelectedTemplate] = useState<Exclude<TemplateId, "none">>("knob");

  // Initial parameters for Knob
  const initialParams = getDefaultParameters("knob");
  const [parameters, setParameters] = useState<Record<string, number>>(initialParams.values);
  const [provenances, setProvenances] = useState<Record<string, Provenance>>(initialParams.provenances);

  // Switch template handler (loads default parameters for the newly selected template)
  const handleSelectTemplate = useCallback((newTemplate: Exclude<TemplateId, "none">) => {
    setSelectedTemplate(newTemplate);
    const defaults = getDefaultParameters(newTemplate);
    setParameters(defaults.values);
    setProvenances(defaults.provenances);
  }, []);

  // Update a single parameter (marks provenance as "measured" per provenance rules)
  const handleParameterChange = useCallback((paramId: string, value: number) => {
    setParameters((prev) => ({ ...prev, [paramId]: value }));
    setProvenances((prev) => ({ ...prev, [paramId]: "measured" }));
  }, []);

  // Reset to template defaults
  const handleResetDefaults = useCallback(() => {
    const defaults = getDefaultParameters(selectedTemplate);
    setParameters(defaults.values);
    setProvenances(defaults.provenances);
  }, [selectedTemplate]);

  return (
    <div className="min-h-screen bg-[#121316] text-[#f4f4f6] flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-200">
      <Header
        currentStep={currentStep}
        onSelectStep={setCurrentStep}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
      />

      <main className="flex-1 flex flex-col">
        {currentStep === "capture" && (
          <CaptureScreen
            photos={photos}
            onPhotosChange={setPhotos}
            onContinue={() => setCurrentStep("analyse")}
          />
        )}
        {currentStep === "analyse" && (
          <AnalyseScreen
            onBack={() => setCurrentStep("capture")}
            onContinue={() => setCurrentStep("measure")}
          />
        )}
        {currentStep === "measure" && (
          <MeasureScreen
            onBack={() => setCurrentStep("analyse")}
            onContinue={() => setCurrentStep("workbench")}
          />
        )}
        {currentStep === "workbench" && (
          <WorkbenchScreen
            selectedTemplate={selectedTemplate}
            onSelectTemplate={handleSelectTemplate}
            parameters={parameters}
            provenances={provenances}
            onParameterChange={handleParameterChange}
            onResetDefaults={handleResetDefaults}
            onBack={() => setCurrentStep("measure")}
            onContinue={() => setCurrentStep("export")}
            onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
          />
        )}
        {currentStep === "export" && (
          <ExportScreen onBack={() => setCurrentStep("workbench")} />
        )}
      </main>

      <DiagnosticsModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
      />
    </div>
  );
}

export default App;
