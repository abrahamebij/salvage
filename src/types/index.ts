export type AppStep = "capture" | "analyse" | "measure" | "workbench" | "export";

export type Provenance = "measured" | "estimated" | "default";

export type TemplateId = "knob" | "clip" | "bracket" | "none";

export interface ParameterDefinition {
  id: string;
  name: string;
  unit: string;
  min: number;
  max: number;
  defaultValue: number;
  isMatingCritical: boolean;
  value: number;
  provenance: Provenance;
}

export interface RoutingLedgerEntry {
  id: string;
  task: "triage" | "identification" | "parameters";
  requestedMode: "PREFER_ON_DEVICE" | "PREFER_IN_CLOUD" | "ONLY_ON_DEVICE" | "ONLY_IN_CLOUD";
  actualSource?: "ON_DEVICE" | "IN_CLOUD" | "UNKNOWN";
  latencyMs: number;
  status: "accepted" | "escalated" | "failed";
  escalationReason?: string;
  timestamp: string;
}

export interface VerifierCheck {
  id: string;
  name: string;
  description: string;
  status: "pass" | "fail" | "na";
  isBlocking: boolean;
  message?: string;
}

export interface AppState {
  currentStep: AppStep;
  photos: Array<{ id: string; file: File; previewUrl: string }>;
  selectedTemplate: TemplateId;
  parameters: Record<string, number>;
  parameterProvenances: Record<string, Provenance>;
  routingLedger: RoutingLedgerEntry[];
  verifierChecks: VerifierCheck[];
  exportOverrideAcknowledged: boolean;
}
