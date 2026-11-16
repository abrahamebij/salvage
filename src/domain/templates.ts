import type { TemplateId, Provenance } from "../types";

export interface ParameterMeta {
  id: string;
  name: string;
  unit: string;
  min: number;
  max: number;
  defaultValue: number;
  isMatingCritical: boolean;
  description: string;
  step?: number;
}

export interface TemplateDefinition {
  id: TemplateId;
  name: string;
  description: string;
  parameters: ParameterMeta[];
}

export const TEMPLATE_DEFINITIONS: Record<Exclude<TemplateId, "none">, TemplateDefinition> = {
  knob: {
    id: "knob",
    name: "Control Knob",
    description: "Appliance or equipment rotary knob with an internal D-flat or round shaft bore.",
    parameters: [
      {
        id: "outerDiameter",
        name: "Outer Diameter",
        unit: "mm",
        min: 12,
        max: 80,
        defaultValue: 32,
        isMatingCritical: false,
        description: "Maximum outer diameter of the knob grip skirt.",
        step: 0.5,
      },
      {
        id: "height",
        name: "Total Height",
        unit: "mm",
        min: 8,
        max: 50,
        defaultValue: 18,
        isMatingCritical: false,
        description: "Overall height from base to top face.",
        step: 0.5,
      },
      {
        id: "shaftBoreDiameter",
        name: "Shaft Bore Diameter",
        unit: "mm",
        min: 3,
        max: 16,
        defaultValue: 6.0,
        isMatingCritical: true,
        description: "Nominal diameter of the equipment shaft (standard 6.0mm / 1/4 inch).",
        step: 0.1,
      },
      {
        id: "shaftBoreDepth",
        name: "Shaft Bore Depth",
        unit: "mm",
        min: 5,
        max: 40,
        defaultValue: 12.0,
        isMatingCritical: true,
        description: "Depth of the internal shaft cavity.",
        step: 0.5,
      },
      {
        id: "dFlatWidth",
        name: "D-Flat Width",
        unit: "mm",
        min: 0,
        max: 10,
        defaultValue: 4.5,
        isMatingCritical: true,
        description: "Flat-to-round distance for D-shafts (set to 0 for circular shaft).",
        step: 0.1,
      },
      {
        id: "dFlatDepth",
        name: "D-Flat Depth",
        unit: "mm",
        min: 0,
        max: 30,
        defaultValue: 10.0,
        isMatingCritical: true,
        description: "Length of the flat engagement surface.",
        step: 0.5,
      },
      {
        id: "pointerNotch",
        name: "Pointer Notch",
        unit: "",
        min: 0,
        max: 1,
        defaultValue: 1,
        isMatingCritical: false,
        description: "Indicator pointer notch on top face (0 = off, 1 = on).",
        step: 1,
      },
      {
        id: "gripStyle",
        name: "Grip Style",
        unit: "",
        min: 0,
        max: 1,
        defaultValue: 1,
        isMatingCritical: false,
        description: "Exterior texture (0 = smooth, 1 = knurled ridges).",
        step: 1,
      },
    ],
  },
  clip: {
    id: "clip",
    name: "Snap Clip",
    description: "Flexible cantilever snap-fit clip with retaining hook.",
    parameters: [
      {
        id: "width",
        name: "Clip Width",
        unit: "mm",
        min: 4,
        max: 50,
        defaultValue: 12.0,
        isMatingCritical: false,
        description: "Width of the snap arm profile.",
        step: 0.5,
      },
      {
        id: "thickness",
        name: "Wall Thickness",
        unit: "mm",
        min: 1.2,
        max: 8.0,
        defaultValue: 2.2,
        isMatingCritical: false,
        description: "Cantilever beam thickness controlling flexural stiffness.",
        step: 0.1,
      },
      {
        id: "armLength",
        name: "Arm Length",
        unit: "mm",
        min: 10,
        max: 90,
        defaultValue: 32.0,
        isMatingCritical: true,
        description: "Reach length of the flex arm to the hook catch point.",
        step: 0.5,
      },
      {
        id: "hookDepth",
        name: "Hook Catch Depth",
        unit: "mm",
        min: 1.0,
        max: 12.0,
        defaultValue: 3.5,
        isMatingCritical: true,
        description: "Overhang depth of the snap barb.",
        step: 0.1,
      },
      {
        id: "hookAngle",
        name: "Hook Lead-in Angle",
        unit: "deg",
        min: 15,
        max: 75,
        defaultValue: 45.0,
        isMatingCritical: true,
        description: "Chamfer angle facilitating push-to-snap insertion.",
        step: 1,
      },
      {
        id: "gap",
        name: "Clearance Gap",
        unit: "mm",
        min: 2,
        max: 30,
        defaultValue: 8.0,
        isMatingCritical: true,
        description: "Throat clearance gap between arm and mating panel.",
        step: 0.5,
      },
    ],
  },
  bracket: {
    id: "bracket",
    name: "L-Bracket",
    description: "Rigid 90-degree right-angle mounting bracket with fastener holes.",
    parameters: [
      {
        id: "legALength",
        name: "Leg A Length",
        unit: "mm",
        min: 12,
        max: 150,
        defaultValue: 40.0,
        isMatingCritical: false,
        description: "Length of the primary vertical mounting leg.",
        step: 0.5,
      },
      {
        id: "legBLength",
        name: "Leg B Length",
        unit: "mm",
        min: 12,
        max: 150,
        defaultValue: 40.0,
        isMatingCritical: false,
        description: "Length of the secondary horizontal mounting leg.",
        step: 0.5,
      },
      {
        id: "width",
        name: "Bracket Width",
        unit: "mm",
        min: 8,
        max: 80,
        defaultValue: 22.0,
        isMatingCritical: false,
        description: "Face width across both bracket legs.",
        step: 0.5,
      },
      {
        id: "thickness",
        name: "Wall Thickness",
        unit: "mm",
        min: 1.5,
        max: 12.0,
        defaultValue: 3.2,
        isMatingCritical: false,
        description: "Structural wall thickness of the bracket flanges.",
        step: 0.1,
      },
      {
        id: "holeDiameter",
        name: "Mounting Hole Diameter",
        unit: "mm",
        min: 2.5,
        max: 16.0,
        defaultValue: 4.5,
        isMatingCritical: true,
        description: "Clearance diameter for M4/screw fasteners.",
        step: 0.1,
      },
      {
        id: "holeSpacing",
        name: "Hole Center Distance",
        unit: "mm",
        min: 6.0,
        max: 120.0,
        defaultValue: 24.0,
        isMatingCritical: true,
        description: "Distance from inside corner to mounting hole center.",
        step: 0.5,
      },
      {
        id: "filletRadius",
        name: "Corner Fillet Radius",
        unit: "mm",
        min: 0,
        max: 15.0,
        defaultValue: 4.0,
        isMatingCritical: false,
        description: "Internal corner radius for stress distribution.",
        step: 0.5,
      },
    ],
  },
};

/**
 * Returns default parameter values and provenances for a template
 */
export function getDefaultParameters(
  templateId: Exclude<TemplateId, "none">
): {
  values: Record<string, number>;
  provenances: Record<string, Provenance>;
} {
  const template = TEMPLATE_DEFINITIONS[templateId];
  const values: Record<string, number> = {};
  const provenances: Record<string, Provenance> = {};

  for (const param of template.parameters) {
    values[param.id] = param.defaultValue;
    provenances[param.id] = "default";
  }

  return { values, provenances };
}

/**
 * Validates whether a value is inside the defined sane bounds of a parameter
 */
export function isValueInSaneRange(
  templateId: Exclude<TemplateId, "none">,
  paramId: string,
  value: number
): boolean {
  const meta = TEMPLATE_DEFINITIONS[templateId]?.parameters.find(
    (p) => p.id === paramId
  );
  if (!meta) return false;
  return value >= meta.min && value <= meta.max;
}
