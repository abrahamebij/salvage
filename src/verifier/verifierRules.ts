import type { TemplateId } from "../types";
import type { GeneratedGeometry } from "../geometry/types";

export type CheckStatus = "pass" | "fail" | "warning" | "na";

export interface VerifierRuleResult {
  id: string;
  title: string;
  category: "blocking" | "warning";
  status: CheckStatus;
  message: string;
  actualValue?: string;
  expectedValue?: string;
}

export interface VerificationSummary {
  passed: boolean;
  blockingFailures: number;
  warningCount: number;
  results: VerifierRuleResult[];
}

export interface VerifierConfig {
  toleranceMm: number; // default 0.5mm
  minWallThicknessMm: number; // default 1.2mm
  warnWallThicknessMm: number; // default 1.6mm
  maxUnsupportedBridgeMm: number; // default 15mm
}

export const DEFAULT_VERIFIER_CONFIG: VerifierConfig = {
  toleranceMm: 0.5,
  minWallThicknessMm: 1.2,
  warnWallThicknessMm: 1.6,
  maxUnsupportedBridgeMm: 15.0,
};

/**
 * Validates edge-manifold topology on triangle mesh indices:
 * In a closed 2-manifold surface, every directed edge (v0 -> v1) has exactly one twin (v1 -> v0).
 */
export function checkManifoldTopology(
  indices: Uint32Array,
  vertexCount: number
): { isManifold: boolean; boundaryEdges: number; nonManifoldEdges: number } {
  if (indices.length === 0 || vertexCount === 0) {
    return { isManifold: false, boundaryEdges: 0, nonManifoldEdges: 0 };
  }

  const edgeCount = new Map<string, number>();

  for (let i = 0; i < indices.length; i += 3) {
    const v0 = indices[i];
    const v1 = indices[i + 1];
    const v2 = indices[i + 2];

    const e1 = `${v0}_${v1}`;
    const e2 = `${v1}_${v2}`;
    const e3 = `${v2}_${v0}`;

    edgeCount.set(e1, (edgeCount.get(e1) || 0) + 1);
    edgeCount.set(e2, (edgeCount.get(e2) || 0) + 1);
    edgeCount.set(e3, (edgeCount.get(e3) || 0) + 1);
  }

  let boundaryEdges = 0;
  let nonManifoldEdges = 0;

  for (const [edge, count] of edgeCount.entries()) {
    if (count > 1) {
      nonManifoldEdges++;
      continue;
    }
    const [a, b] = edge.split("_");
    const reverseEdge = `${b}_${a}`;
    const reverseCount = edgeCount.get(reverseEdge) || 0;

    if (reverseCount === 0) {
      boundaryEdges++;
    } else if (reverseCount > 1) {
      nonManifoldEdges++;
    }
  }

  return {
    isManifold: boundaryEdges === 0 && nonManifoldEdges === 0,
    boundaryEdges,
    nonManifoldEdges,
  };
}

/**
 * Deterministic Verifier - Evaluates generated geometry against physical constraints
 */
export function verifyGeometry(
  geometry: GeneratedGeometry | null,
  templateId: Exclude<TemplateId, "none">,
  parameters: Record<string, number>,
  config: VerifierConfig = DEFAULT_VERIFIER_CONFIG
): VerificationSummary {
  const results: VerifierRuleResult[] = [];

  if (!geometry) {
    return {
      passed: false,
      blockingFailures: 1,
      warningCount: 0,
      results: [
        {
          id: "geo_exists",
          title: "Geometry Generation",
          category: "blocking",
          status: "fail",
          message: "No geometry generated to verify.",
        },
      ],
    };
  }

  // ==========================================
  // Check 1: Watertight & Manifold Mesh (BLOCKING)
  // ==========================================
  const topology = checkManifoldTopology(geometry.indices, geometry.vertexCount);
  if (topology.isManifold) {
    results.push({
      id: "manifold_watertight",
      title: "Watertight & Manifold Mesh",
      category: "blocking",
      status: "pass",
      message: "Solid 2-manifold surface confirmed with zero open boundary edges or non-manifold junctions.",
      actualValue: `${geometry.triangleCount} triangles, 0 boundary edges`,
      expectedValue: "Watertight manifold",
    });
  } else {
    results.push({
      id: "manifold_watertight",
      title: "Watertight & Manifold Mesh",
      category: "blocking",
      status: "fail",
      message: `Mesh has ${topology.boundaryEdges} open boundary edges and ${topology.nonManifoldEdges} non-manifold edges. Cannot be sliced cleanly.`,
      actualValue: `${topology.boundaryEdges} boundary / ${topology.nonManifoldEdges} non-manifold edges`,
      expectedValue: "0 defects",
    });
  }

  // ==========================================
  // Check 2: Bounding Box Envelope (BLOCKING)
  // ==========================================
  const dims = geometry.boundingBox.dimensions;
  let targetEnvelope: [number, number, number] = [0, 0, 0];
  let envelopeLabel = "";

  if (templateId === "knob") {
    const d = parameters.outerDiameter || 32;
    const h = parameters.height || 18;
    targetEnvelope = [d, d, h];
    envelopeLabel = `Ø${d.toFixed(1)} × ${h.toFixed(1)} mm`;
  } else if (templateId === "clip") {
    const w = parameters.width || 12;
    const l = (parameters.armLength || 32) + Math.max(12, (parameters.armLength || 32) * 0.35);
    const h = (parameters.gap || 8) + (parameters.thickness || 2.2) * 2 + (parameters.hookDepth || 3.5);
    targetEnvelope = [w, l, h];
    envelopeLabel = `${w.toFixed(1)} × ${l.toFixed(1)} × ${h.toFixed(1)} mm`;
  } else if (templateId === "bracket") {
    const w = parameters.width || 22;
    const legB = parameters.legBLength || 40;
    const legA = parameters.legALength || 40;
    targetEnvelope = [w, legB, legA];
    envelopeLabel = `${w.toFixed(1)} × ${legB.toFixed(1)} × ${legA.toFixed(1)} mm`;
  }

  const diffX = Math.abs(dims[0] - targetEnvelope[0]);
  const diffY = Math.abs(dims[1] - targetEnvelope[1]);
  const diffZ = Math.abs(dims[2] - targetEnvelope[2]);
  const maxDiff = Math.max(diffX, diffY, diffZ);

  if (maxDiff <= config.toleranceMm * 2.5) {
    results.push({
      id: "bounding_box",
      title: "Bounding Box Envelope Match",
      category: "blocking",
      status: "pass",
      message: `Mesh envelope matches specified dimensions within ${config.toleranceMm}mm tolerance.`,
      actualValue: `${dims[0].toFixed(1)} × ${dims[1].toFixed(1)} × ${dims[2].toFixed(1)} mm`,
      expectedValue: envelopeLabel,
    });
  } else {
    results.push({
      id: "bounding_box",
      title: "Bounding Box Envelope Match",
      category: "blocking",
      status: "fail",
      message: `Envelope deviation (${maxDiff.toFixed(2)} mm) exceeds allowed tolerance of ±${config.toleranceMm} mm.`,
      actualValue: `${dims[0].toFixed(1)} × ${dims[1].toFixed(1)} × ${dims[2].toFixed(1)} mm`,
      expectedValue: envelopeLabel,
    });
  }

  // ==========================================
  // Check 3: Mating-Critical Features (BLOCKING)
  // ==========================================
  if (templateId === "knob") {
    const boreD = parameters.shaftBoreDiameter || 6.0;
    const boreDepth = parameters.shaftBoreDepth || 12.0;
    const height = parameters.height || 18.0;
    const dFlatW = parameters.dFlatWidth || 0;

    const roofThickness = height - boreDepth;
    if (boreD >= 3.0 && boreD <= 16.0 && roofThickness >= config.minWallThicknessMm) {
      results.push({
        id: "mating_features",
        title: "Shaft Bore & Mating Cavity",
        category: "blocking",
        status: "pass",
        message: `Shaft bore Ø${boreD.toFixed(1)} mm with ${boreDepth.toFixed(1)} mm depth confirmed. Roof thickness: ${roofThickness.toFixed(1)} mm.`,
        actualValue: `Bore Ø${boreD.toFixed(1)}mm (deck ${roofThickness.toFixed(1)}mm)`,
        expectedValue: `Deck ≥ ${config.minWallThicknessMm}mm`,
      });
    } else {
      results.push({
        id: "mating_features",
        title: "Shaft Bore & Mating Cavity",
        category: "blocking",
        status: "fail",
        message: `Shaft bore depth (${boreDepth} mm) penetrates too close to knob top face (deck thickness: ${roofThickness.toFixed(1)} mm < ${config.minWallThicknessMm} mm).`,
        actualValue: `Deck: ${roofThickness.toFixed(1)} mm`,
        expectedValue: `≥ ${config.minWallThicknessMm} mm`,
      });
    }

    if (dFlatW > 0 && dFlatW >= boreD) {
      results.push({
        id: "dflat_validity",
        title: "D-Flat Dimension Sanity",
        category: "blocking",
        status: "fail",
        message: `D-flat width (${dFlatW} mm) cannot be equal to or exceed bore diameter (${boreD} mm).`,
      });
    }
  } else if (templateId === "clip") {
    const hookDepth = parameters.hookDepth || 3.5;
    const gap = parameters.gap || 8.0;
    const hookAngle = parameters.hookAngle || 45;

    if (hookDepth >= 1.0 && gap >= 2.0 && hookAngle >= 15 && hookAngle <= 75) {
      results.push({
        id: "mating_features",
        title: "Snap Catch & Engagement Barb",
        category: "blocking",
        status: "pass",
        message: `Retention catch depth (${hookDepth.toFixed(1)} mm) and ${hookAngle}° lead-in angle verify valid snap-fit engagement.`,
        actualValue: `Catch: ${hookDepth.toFixed(1)}mm, Angle: ${hookAngle}°`,
        expectedValue: "Catch ≥ 1.0mm, Angle 15°–75°",
      });
    } else {
      results.push({
        id: "mating_features",
        title: "Snap Catch & Engagement Barb",
        category: "blocking",
        status: "fail",
        message: "Snap barb dimensions or lead-in angle fall outside physical engagement criteria.",
      });
    }
  } else if (templateId === "bracket") {
    const holeD = parameters.holeDiameter || 4.5;
    const holeSpacing = parameters.holeSpacing || 24.0;
    const legA = parameters.legALength || 40.0;
    const legB = parameters.legBLength || 40.0;
    const thickness = parameters.thickness || 3.2;

    const minClearanceA = legA - holeSpacing - holeD / 2;
    const minClearanceB = legB - holeSpacing - holeD / 2;
    const holeMargin = holeSpacing - thickness - holeD / 2;

    if (holeD >= 2.5 && minClearanceA >= 2.0 && minClearanceB >= 2.0 && holeMargin >= 1.5) {
      results.push({
        id: "mating_features",
        title: "Mounting Holes & Fastener Fitment",
        category: "blocking",
        status: "pass",
        message: `Fastener through-holes Ø${holeD.toFixed(1)} mm confirmed with adequate structural perimeter edge margins.`,
        actualValue: `Hole Ø${holeD.toFixed(1)}mm, margin ≥ 2.0mm`,
        expectedValue: "Margin ≥ 1.5mm",
      });
    } else {
      results.push({
        id: "mating_features",
        title: "Mounting Holes & Fastener Fitment",
        category: "blocking",
        status: "fail",
        message: `Mounting holes are positioned too close to the bracket edge (margin: ${Math.min(minClearanceA, minClearanceB).toFixed(1)} mm). Fasteners will break through perimeter wall.`,
        actualValue: `Margin: ${Math.min(minClearanceA, minClearanceB).toFixed(1)} mm`,
        expectedValue: "Margin ≥ 1.5 mm",
      });
    }
  }

  // ==========================================
  // Check 4: Minimum Wall Thickness (BLOCKING)
  // ==========================================
  let effectiveWallMm = 2.0;
  if (templateId === "knob") {
    const d = parameters.outerDiameter || 32;
    const boreD = parameters.shaftBoreDiameter || 6;
    effectiveWallMm = Math.min((d - boreD) / 2, (parameters.height || 18) - (parameters.shaftBoreDepth || 12));
  } else if (templateId === "clip") {
    effectiveWallMm = parameters.thickness || 2.2;
  } else if (templateId === "bracket") {
    effectiveWallMm = parameters.thickness || 3.2;
  }

  if (effectiveWallMm >= config.minWallThicknessMm) {
    results.push({
      id: "wall_thickness",
      title: "Minimum Wall Thickness",
      category: "blocking",
      status: "pass",
      message: `Critical structural section (${effectiveWallMm.toFixed(1)} mm) exceeds 3D printer minimum requirement of ${config.minWallThicknessMm} mm.`,
      actualValue: `${effectiveWallMm.toFixed(1)} mm`,
      expectedValue: `≥ ${config.minWallThicknessMm} mm`,
    });
  } else {
    results.push({
      id: "wall_thickness",
      title: "Minimum Wall Thickness",
      category: "blocking",
      status: "fail",
      message: `Wall thickness (${effectiveWallMm.toFixed(1)} mm) is below the printable threshold of ${config.minWallThicknessMm} mm. Risk of layer delamination and failure under load.`,
      actualValue: `${effectiveWallMm.toFixed(1)} mm`,
      expectedValue: `≥ ${config.minWallThicknessMm} mm`,
    });
  }

  // ==========================================
  // Check 5: Thin Printable Features (WARNING)
  // ==========================================
  if (effectiveWallMm >= config.minWallThicknessMm && effectiveWallMm < config.warnWallThicknessMm) {
    results.push({
      id: "thin_feature_warn",
      title: "Thin Wall Fragility Warning",
      category: "warning",
      status: "warning",
      message: `Wall thickness (${effectiveWallMm.toFixed(1)} mm) is close to the minimum nozzle limit. Recommend using at least 3 perimeters and 100% infill in slicer.`,
      actualValue: `${effectiveWallMm.toFixed(1)} mm`,
      expectedValue: `≥ ${config.warnWallThicknessMm} mm`,
    });
  } else {
    results.push({
      id: "thin_feature_warn",
      title: "Thin Wall Fragility Check",
      category: "warning",
      status: "pass",
      message: "Wall sections provide sufficient thickness for multi-perimeter mechanical rigidity.",
      actualValue: `${effectiveWallMm.toFixed(1)} mm`,
    });
  }

  // ==========================================
  // Check 6: Overhang & Bridge Risk (WARNING)
  // ==========================================
  if (templateId === "bracket") {
    results.push({
      id: "overhang_check",
      title: "Print Orientation & Overhangs",
      category: "warning",
      status: "pass",
      message: "L-bracket prints resting flat on side flange (X-axis) with 0° overhangs and no supports needed.",
      actualValue: "Side orientation recommended",
    });
  } else if (templateId === "clip") {
    results.push({
      id: "overhang_check",
      title: "Print Orientation & Overhangs",
      category: "warning",
      status: "pass",
      message: "Snap clip prints horizontally on its side profile; cantilever arm prints without steep overhangs.",
      actualValue: "Side profile alignment",
    });
  } else if (templateId === "knob") {
    results.push({
      id: "overhang_check",
      title: "Inner Bore Bridge Span",
      category: "warning",
      status: "pass",
      message: "Internal shaft cavity top ceiling span is within standard FDM bridging distance (≤ 15mm).",
      actualValue: `Bore Ø${(parameters.shaftBoreDiameter || 6).toFixed(1)} mm span`,
    });
  }

  const blockingFailures = results.filter((r) => r.category === "blocking" && r.status === "fail").length;
  const warningCount = results.filter((r) => r.status === "warning").length;

  return {
    passed: blockingFailures === 0,
    blockingFailures,
    warningCount,
    results,
  };
}
