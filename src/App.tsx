import { useState } from "react";
import type { AppStep, CapturedPhoto } from "./types";
import { Header } from "./components/Header";
import { CaptureScreen } from "./components/screens/CaptureScreen";
import { AnalyseScreen } from "./components/screens/AnalyseScreen";
import { MeasureScreen } from "./components/screens/MeasureScreen";
import { WorkbenchScreen } from "./components/screens/WorkbenchScreen";
import { ExportScreen } from "./components/screens/ExportScreen";
import { DiagnosticsModal } from "./components/DiagnosticsModal";

export function App() {
  const [currentStep, setCurrentStep] = useState<AppStep>("capture");
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);

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
