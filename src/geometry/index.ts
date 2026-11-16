import type { TemplateId } from "../types";
import type { GeneratedGeometry } from "./types";
import { generateKnobGeometry, type KnobParameters } from "./generators/knobGenerator";
import { generateClipGeometry, type ClipParameters } from "./generators/clipGenerator";
import { generateBracketGeometry, type BracketParameters } from "./generators/bracketGenerator";
import { TEMPLATE_DEFINITIONS, getDefaultParameters } from "../domain/templates";

export * from "./types";
export * from "./manifoldCore";
export * from "./meshConverter";
export * from "./generators/knobGenerator";
export * from "./generators/clipGenerator";
export * from "./generators/bracketGenerator";

export async function generateGeometry(
  templateId: Exclude<TemplateId, "none">,
  parameters: Record<string, number>
): Promise<GeneratedGeometry> {
  const meta = TEMPLATE_DEFINITIONS[templateId];
  if (!meta) {
    throw new Error(`Unsupported template: ${templateId}`);
  }

  // Merge with defaults so no undefined values exist
  const { values: defaultValues } = getDefaultParameters(templateId);
  const resolvedParams: Record<string, number> = { ...defaultValues, ...parameters };

  // Parameter boundary clamp
  for (const p of meta.parameters) {
    const raw = resolvedParams[p.id];
    if (typeof raw !== "number" || isNaN(raw)) {
      resolvedParams[p.id] = p.defaultValue;
    } else {
      // Clamp strictly within min and max
      resolvedParams[p.id] = Math.max(p.min, Math.min(p.max, raw));
    }
  }

  switch (templateId) {
    case "knob":
      return generateKnobGeometry(resolvedParams as unknown as KnobParameters);
    case "clip":
      return generateClipGeometry(resolvedParams as unknown as ClipParameters);
    case "bracket":
      return generateBracketGeometry(resolvedParams as unknown as BracketParameters);
    default:
      throw new Error(`Unknown template: ${templateId}`);
  }
}
