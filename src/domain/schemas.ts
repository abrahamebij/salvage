import type { TemplateId, Provenance } from "../types";
import { TEMPLATE_DEFINITIONS, isValueInSaneRange } from "./templates";

// ==========================================
// Task A: Photo Triage Types & Validator
// ==========================================

export type PhotoAngle = "top" | "underside" | "profile" | "isometric" | "oblique" | "unknown";

export interface PhotoTriageResult {
  usable: boolean;
  blurScore: number; // 0.0 (sharp) to 1.0 (very blurry)
  framingScore: number; // 0.0 (poor) to 1.0 (well centered/framed)
  scaleReferenceVisible: boolean;
  angleCovered: PhotoAngle;
  notes: string;
}

export function validatePhotoTriageResult(data: unknown): {
  success: boolean;
  result?: PhotoTriageResult;
  error?: string;
} {
  if (!data || typeof data !== "object") {
    return { success: false, error: "Response is not a valid JSON object" };
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.usable !== "boolean") {
    return { success: false, error: "Missing or invalid 'usable' boolean field" };
  }

  const blurScore = typeof obj.blurScore === "number" ? Math.max(0, Math.min(1, obj.blurScore)) : 0.5;
  const framingScore = typeof obj.framingScore === "number" ? Math.max(0, Math.min(1, obj.framingScore)) : 0.5;
  const scaleReferenceVisible = Boolean(obj.scaleReferenceVisible);

  const validAngles: PhotoAngle[] = ["top", "underside", "profile", "isometric", "oblique", "unknown"];
  const angleCovered = typeof obj.angleCovered === "string" && validAngles.includes(obj.angleCovered as PhotoAngle)
    ? (obj.angleCovered as PhotoAngle)
    : "unknown";

  const notes = typeof obj.notes === "string" ? obj.notes : "";

  return {
    success: true,
    result: {
      usable: obj.usable,
      blurScore,
      framingScore,
      scaleReferenceVisible,
      angleCovered,
      notes,
    },
  };
}

// ==========================================
// Task B: Part Identification Types & Validator
// ==========================================

export interface PartIdentificationResult {
  partClass: string;
  chosenTemplate: TemplateId;
  confidence: number; // 0.0 to 1.0
  damageNotes: string;
  unknownGeometry: string[];
}

export function validatePartIdentificationResult(data: unknown): {
  success: boolean;
  result?: PartIdentificationResult;
  error?: string;
} {
  if (!data || typeof data !== "object") {
    return { success: false, error: "Response is not a valid JSON object" };
  }

  const obj = data as Record<string, unknown>;

  const validTemplates: TemplateId[] = ["knob", "clip", "bracket", "none"];
  const chosenTemplate =
    typeof obj.chosenTemplate === "string" && validTemplates.includes(obj.chosenTemplate as TemplateId)
      ? (obj.chosenTemplate as TemplateId)
      : null;

  if (!chosenTemplate) {
    return { success: false, error: "Missing or unrecognized 'chosenTemplate' (must be knob, clip, bracket, or none)" };
  }

  const confidence =
    typeof obj.confidence === "number" && !isNaN(obj.confidence)
      ? Math.max(0, Math.min(1, obj.confidence))
      : 0;

  const partClass = typeof obj.partClass === "string" ? obj.partClass : "Mechanical component";
  const damageNotes = typeof obj.damageNotes === "string" ? obj.damageNotes : "None reported";
  const unknownGeometry = Array.isArray(obj.unknownGeometry)
    ? obj.unknownGeometry.filter((x): x is string => typeof x === "string")
    : [];

  return {
    success: true,
    result: {
      partClass,
      chosenTemplate,
      confidence,
      damageNotes,
      unknownGeometry,
    },
  };
}

// ==========================================
// Task C: Parameter Extraction Types & Validator
// ==========================================

export interface ExtractedParameterEntry {
  value: number;
  confidence: number;
  provenance: Provenance;
}

export interface NeededMeasurement {
  parameterId: string;
  name: string;
  reason: string;
  isMatingCritical: boolean;
}

export interface ParameterExtractionResult {
  template: Exclude<TemplateId, "none">;
  parameters: Record<string, ExtractedParameterEntry>;
  measurementsStillNeeded: NeededMeasurement[];
  reasoning: string;
}

export function validateParameterExtractionResult(
  data: unknown,
  expectedTemplate: Exclude<TemplateId, "none">
): {
  success: boolean;
  result?: ParameterExtractionResult;
  error?: string;
  outOfRangeParameters?: string[];
} {
  if (!data || typeof data !== "object") {
    return { success: false, error: "Response is not a valid JSON object" };
  }

  const obj = data as Record<string, unknown>;
  const templateDef = TEMPLATE_DEFINITIONS[expectedTemplate];
  if (!templateDef) {
    return { success: false, error: `Invalid expected template: ${expectedTemplate}` };
  }

  const rawParams = (obj.parameters && typeof obj.parameters === "object")
    ? (obj.parameters as Record<string, unknown>)
    : {};

  const parameters: Record<string, ExtractedParameterEntry> = {};
  const outOfRangeParameters: string[] = [];

  for (const meta of templateDef.parameters) {
    const rawVal = rawParams[meta.id];
    let numVal: number = meta.defaultValue;
    let conf = 0.5;
    let prov: Provenance = "estimated";

    if (typeof rawVal === "number") {
      numVal = rawVal;
    } else if (rawVal && typeof rawVal === "object") {
      const entryObj = rawVal as Record<string, unknown>;
      if (typeof entryObj.value === "number") numVal = entryObj.value;
      if (typeof entryObj.confidence === "number") conf = Math.max(0, Math.min(1, entryObj.confidence));
      if (entryObj.provenance === "measured" || entryObj.provenance === "default") {
        prov = entryObj.provenance;
      }
    }

    // Sane range check
    if (!isValueInSaneRange(expectedTemplate, meta.id, numVal)) {
      outOfRangeParameters.push(
        `${meta.name} (${numVal} ${meta.unit}) is outside sane range [${meta.min}, ${meta.max}]`
      );
    }

    parameters[meta.id] = {
      value: numVal,
      confidence: conf,
      provenance: prov,
    };
  }

  // Parse measurements still needed
  const measurementsStillNeeded: NeededMeasurement[] = [];
  if (Array.isArray(obj.measurementsStillNeeded)) {
    for (const item of obj.measurementsStillNeeded) {
      if (typeof item === "string") {
        const meta = templateDef.parameters.find((p) => p.id === item);
        if (meta) {
          measurementsStillNeeded.push({
            parameterId: meta.id,
            name: meta.name,
            reason: "Required for mating verification",
            isMatingCritical: meta.isMatingCritical,
          });
        }
      } else if (item && typeof item === "object") {
        const it = item as Record<string, unknown>;
        const paramId = typeof it.parameterId === "string" ? it.parameterId : "";
        const meta = templateDef.parameters.find((p) => p.id === paramId);
        if (meta) {
          measurementsStillNeeded.push({
            parameterId: meta.id,
            name: meta.name,
            reason: typeof it.reason === "string" ? it.reason : "Measurement required",
            isMatingCritical: meta.isMatingCritical,
          });
        }
      }
    }
  }

  // Ensure all mating-critical parameters not measured are in the needed list
  for (const meta of templateDef.parameters) {
    if (meta.isMatingCritical && parameters[meta.id]?.provenance !== "measured") {
      if (!measurementsStillNeeded.some((m) => m.parameterId === meta.id)) {
        measurementsStillNeeded.push({
          parameterId: meta.id,
          name: meta.name,
          reason: "Mating-critical feature requires caliper measurement before export.",
          isMatingCritical: true,
        });
      }
    }
  }

  const reasoning = typeof obj.reasoning === "string" ? obj.reasoning : "";

  return {
    success: outOfRangeParameters.length === 0,
    result: {
      template: expectedTemplate,
      parameters,
      measurementsStillNeeded,
      reasoning,
    },
    outOfRangeParameters: outOfRangeParameters.length > 0 ? outOfRangeParameters : undefined,
  };
}
