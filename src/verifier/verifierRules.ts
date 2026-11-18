import type { TemplateId } from "../types";
import type { GeneratedGeometry } from "../geometry/types";
import { TEMPLATE_DEFINITIONS } from "../domain/templates";
import {
  rayHits,
  solidSegments,
  pointInside,
  findOverhangClusters,
  type ProbeMesh,
  type Vec3,
} from "./meshProbe";

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
  /** Allowed difference between the mesh envelope and the specified or measured size, mm. */
  toleranceMm: number;
  /** Allowed difference between a measured feature (bore, hole, hook) and its requested size, mm. */
  featureToleranceMm: number;
  /** Allowed difference between the measured and requested lead-in angle, degrees. */
  angleToleranceDeg: number;
  minWallThicknessMm: number;
  warnWallThicknessMm: number;
  maxUnsupportedBridgeMm: number;
  /** Minimum solid between a fastener hole and the edge of its leg or flange, mm. */
  minEdgeMarginMm: number;
}

export const DEFAULT_VERIFIER_CONFIG: VerifierConfig = {
  toleranceMm: 0.5,
  featureToleranceMm: 0.15,
  angleToleranceDeg: 1.0,
  minWallThicknessMm: 1.2,
  warnWallThicknessMm: 1.6,
  maxUnsupportedBridgeMm: 15.0,
  minEdgeMarginMm: 1.5,
};

export interface VerifierOptions {
  /**
   * Overall size the user measured on the broken part, in model axes
   * (x = width, y = length, z = height), mm. Supplied by the Measure step (Phase 9).
   * When absent the "measured size" check is reported as not applicable, never as a pass.
   */
  measuredEnvelope?: { x: number; y: number; z: number };
}

/**
 * Validates edge-manifold topology on triangle mesh indices:
 * in a closed 2-manifold surface every directed edge (v0 -> v1) has exactly one twin (v1 -> v0).
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type TemplateKey = Exclude<TemplateId, "none">;

interface Finding {
  label: string;
  measured: number | null;
  expected: number;
  tol: number;
  unit: string;
}

const BINARY_PARAMS = new Set(["pointerNotch", "gripStyle"]);

function requested(templateId: TemplateKey, parameters: Record<string, number>, id: string): number {
  const v = parameters[id];
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  const def = TEMPLATE_DEFINITIONS[templateId].parameters.find((p) => p.id === id);
  return def ? def.defaultValue : 0;
}

function fmt(n: number | null, digits = 2): string {
  return n === null ? "not found" : n.toFixed(digits);
}

function findingOk(f: Finding): boolean {
  return f.measured !== null && Math.abs(f.measured - f.expected) <= f.tol;
}

function describeFindings(findings: Finding[]): { actual: string; expected: string; failures: string[] } {
  const failures: string[] = [];
  const actual: string[] = [];
  const expected: string[] = [];
  for (const f of findings) {
    actual.push(`${f.label} ${fmt(f.measured)}${f.unit}`);
    expected.push(`${f.label} ${fmt(f.expected)}${f.unit} (±${f.tol})`);
    if (!findingOk(f)) {
      failures.push(
        f.measured === null
          ? `${f.label}: feature not found in the mesh`
          : `${f.label}: built ${fmt(f.measured)}${f.unit}, requested ${fmt(f.expected)}${f.unit}`
      );
    }
  }
  return { actual: actual.join(", "), expected: expected.join(", "), failures };
}

interface WallSample {
  label: string;
  valueMm: number | null;
}

const ORIGIN_FAR = 100;

/** Distance along +Z of ray hits starting below the part (z = -5). */
function zHits(mesh: ProbeMesh, x: number, y: number): number[] {
  return rayHits(mesh, [x, y, -5], [0, 0, 1]).map((t) => -5 + t);
}

// ---------------------------------------------------------------------------
// Template probes: measure the real mesh at the features that matter
// ---------------------------------------------------------------------------

interface ProbeResult {
  findings: Finding[];
  walls: WallSample[];
  /** Extra hard problems found while probing (feature missing, wrong shape, too little margin). */
  problems: string[];
}

function probeKnob(
  mesh: ProbeMesh,
  g: GeneratedGeometry,
  req: (id: string) => number,
  cfg: VerifierConfig
): ProbeResult {
  const m = g.meta;
  const R = m.outerRadius;
  const r = m.boreRadius;
  const bd = m.boreDepth;
  const H = m.height;
  const w = m.flatToRound;
  const fl = m.flatLen;
  const flatY = m.flatY;

  const findings: Finding[] = [];
  const walls: WallSample[] = [];
  const problems: string[] = [];
  const tol = cfg.featureToleranceMm;

  // A point inside the bore on the round (-Y) side, clear of any D-flat material
  const y0 = -r + 0.25 * (w > 0 ? w : 2 * r);

  // Bore diameter, measured across the round side
  const zp = bd * 0.5;
  const radial = rayHits(mesh, [0, y0, zp], [0, -1, 0]);
  findings.push({
    label: "Bore diameter",
    measured: radial.length ? 2 * (radial[0] - y0) : null,
    expected: req("shaftBoreDiameter"),
    tol,
    unit: " mm",
  });

  // Bore depth and the solid left above it, measured along the bore axis
  const axis = zHits(mesh, 0, y0);
  if (axis.length >= 2) {
    findings.push({ label: "Bore depth", measured: axis[0], expected: req("shaftBoreDepth"), tol, unit: " mm" });
    walls.push({ label: "Roof above bore", valueMm: axis[1] - axis[0] });
  } else {
    findings.push({ label: "Bore depth", measured: null, expected: req("shaftBoreDepth"), tol, unit: " mm" });
    problems.push("The shaft bore does not end inside the knob (through-hole or missing bore).");
    walls.push({ label: "Roof above bore", valueMm: null });
  }

  // D-flat: measured flat-to-round distance and flat length
  const wantFlat = req("dFlatWidth") > 0 && req("dFlatDepth") > 0;
  if (wantFlat) {
    if (fl > 0) {
      const zf = bd - 0.5 * fl;
      const toFlat = rayHits(mesh, [0, y0, zf], [0, 1, 0]);
      findings.push({
        label: "D-flat width (flat to round)",
        measured: toFlat.length ? y0 + toFlat[0] + r : null,
        expected: req("dFlatWidth"),
        tol,
        unit: " mm",
      });
      if (flatY + 0.3 < r) {
        const along = zHits(mesh, 0, flatY + 0.3);
        findings.push({
          label: "D-flat length",
          measured: along.length ? bd - along[0] : null,
          expected: req("dFlatDepth"),
          tol,
          unit: " mm",
        });
      }
    } else {
      findings.push({ label: "D-flat width (flat to round)", measured: null, expected: req("dFlatWidth"), tol, unit: " mm" });
      problems.push("A D-flat was requested but could not be built (width must be less than the bore diameter).");
    }
  } else if (bd > 0) {
    // Round shaft: the bore must be fully circular at its deep end
    if (pointInside(mesh, [0, r * 0.5, bd * 0.9])) {
      problems.push("A round shaft was requested but material intrudes into the bore.");
    }
  }

  // Pointer notch present exactly when requested
  const wantNotch = req("pointerNotch") > 0.5;
  const notchEmpty = !pointInside(mesh, [0, R * 0.7, H - 0.8]);
  if (wantNotch !== notchEmpty) {
    problems.push(wantNotch ? "Pointer notch requested but not found." : "Pointer notch found but not requested.");
  }

  // Radial wall around the bore, measured on four diameters at mid-bore height
  for (const deg of [0, 45, 90, 135]) {
    const a = (deg * Math.PI) / 180;
    const dir: Vec3 = [Math.cos(a), Math.sin(a), 0];
    const hits = rayHits(mesh, [-dir[0] * ORIGIN_FAR, -dir[1] * ORIGIN_FAR, zp], dir);
    const segs = solidSegments(hits);
    const min = segs.length ? Math.min(...segs.map(([s, e]) => e - s)) : null;
    walls.push({ label: `Side wall at ${deg} deg`, valueMm: min });
  }

  return { findings, walls, problems };
}

function probeClip(
  mesh: ProbeMesh,
  g: GeneratedGeometry,
  req: (id: string) => number,
  cfg: VerifierConfig
): ProbeResult {
  const m = g.meta;
  const findings: Finding[] = [];
  const walls: WallSample[] = [];
  const problems: string[] = [];
  const tol = cfg.featureToleranceMm;

  // Flex arm, probed between the stanchion and the start of the barb
  const yMid = (m.stanchionLength / 2 + m.yStart) / 2;
  const arm = zHits(mesh, 0, yMid);
  let armUnderside: number | null = null;
  if (arm.length >= 2) {
    armUnderside = arm[0];
    walls.push({ label: "Flex arm", valueMm: arm[1] - arm[0] });
  } else {
    walls.push({ label: "Flex arm", valueMm: null });
  }
  findings.push({ label: "Clearance gap", measured: armUnderside, expected: req("gap"), tol, unit: " mm" });

  // Snap barb: two probes on the lead-in ramp give its depth and angle
  const s1 = 0.25 * m.ramp;
  const s2 = 0.75 * m.ramp;
  const h1 = zHits(mesh, 0, m.yStart + s1);
  const h2 = zHits(mesh, 0, m.yStart + s2);
  let depth: number | null = null;
  let angle: number | null = null;
  if (h1.length && h2.length && armUnderside !== null && s2 > s1) {
    const slope = (h2[0] - h1[0]) / (s2 - s1);
    angle = (Math.atan(slope) * 180) / Math.PI;
    const apex = h1[0] - slope * s1;
    depth = armUnderside - apex;
  }
  findings.push({ label: "Hook depth", measured: depth, expected: req("hookDepth"), tol, unit: " mm" });
  findings.push({
    label: "Lead-in angle",
    measured: angle,
    expected: req("hookAngle"),
    tol: cfg.angleToleranceDeg,
    unit: " deg",
  });

  // Base pad
  const base = zHits(mesh, 0, -m.baseLength * 0.85);
  walls.push({ label: "Base pad", valueMm: base.length >= 2 ? base[1] - base[0] : null });

  // Stanchion, measured front to back above the base pad
  const zs = (m.baseThickness + m.gap) / 2;
  if (m.gap - m.baseThickness >= 1) {
    const hits = rayHits(mesh, [0, -ORIGIN_FAR, zs], [0, 1, 0]);
    const segs = solidSegments(hits);
    walls.push({ label: "Stanchion", valueMm: segs.length ? segs[0][1] - segs[0][0] : null });
  }

  return { findings, walls, problems };
}

function probeBracket(
  mesh: ProbeMesh,
  g: GeneratedGeometry,
  req: (id: string) => number,
  cfg: VerifierConfig
): ProbeResult {
  const m = g.meta;
  const findings: Finding[] = [];
  const walls: WallSample[] = [];
  const problems: string[] = [];
  const tol = cfg.featureToleranceMm;
  const r = m.holeRadius;
  const t = m.thickness;

  // Leg thickness, measured above / beyond each hole where the leg is plain
  const legA = rayHits(mesh, [0, -ORIGIN_FAR, m.legA - r / 2], [0, 1, 0]);
  const legASegs = solidSegments(legA);
  walls.push({ label: "Leg A", valueMm: legASegs.length ? legASegs[0][1] - legASegs[0][0] : null });
  const legB = zHits(mesh, 0, m.legB - r / 2);
  walls.push({ label: "Leg B", valueMm: legB.length >= 2 ? legB[1] - legB[0] : null });

  // Hole in leg A (axis along Y): diameter, centre position, margins
  const aCentre: Vec3 = [0, t / 2, m.holeZ];
  if (pointInside(mesh, aCentre)) {
    problems.push("Mounting hole in leg A not found.");
    findings.push({ label: "Hole A diameter", measured: null, expected: req("holeDiameter"), tol, unit: " mm" });
  } else {
    const east = rayHits(mesh, aCentre, [1, 0, 0]);
    const up = rayHits(mesh, aCentre, [0, 0, 1]);
    const down = rayHits(mesh, aCentre, [0, 0, -1]);
    findings.push({
      label: "Hole A diameter",
      measured: east.length ? 2 * east[0] : null,
      expected: req("holeDiameter"),
      tol,
      unit: " mm",
    });
    if (up.length && down.length) {
      findings.push({
        label: "Hole A centre",
        measured: m.holeZ + (up[0] - down[0]) / 2,
        expected: req("holeSpacing"),
        tol,
        unit: " mm",
      });
    }
    const sideMargin = east.length >= 2 ? east[1] - east[0] : null;
    const topMargin = up.length >= 2 ? up[1] - up[0] : null;
    for (const [label, v] of [["Hole A side margin", sideMargin], ["Hole A end margin", topMargin]] as const) {
      if (v === null || v < cfg.minEdgeMarginMm) {
        problems.push(`${label} is ${fmt(v)} mm (needs at least ${cfg.minEdgeMarginMm} mm).`);
      }
    }
  }

  // Hole in leg B (axis along Z)
  const bCentre: Vec3 = [0, m.holeY, t / 2];
  if (pointInside(mesh, bCentre)) {
    problems.push("Mounting hole in leg B not found.");
    findings.push({ label: "Hole B diameter", measured: null, expected: req("holeDiameter"), tol, unit: " mm" });
  } else {
    const east = rayHits(mesh, bCentre, [1, 0, 0]);
    const far = rayHits(mesh, bCentre, [0, 1, 0]);
    const near = rayHits(mesh, bCentre, [0, -1, 0]);
    findings.push({
      label: "Hole B diameter",
      measured: east.length ? 2 * east[0] : null,
      expected: req("holeDiameter"),
      tol,
      unit: " mm",
    });
    if (far.length && near.length) {
      findings.push({
        label: "Hole B centre",
        measured: m.holeY + (far[0] - near[0]) / 2,
        expected: req("holeSpacing"),
        tol,
        unit: " mm",
      });
    }
    const sideMargin = east.length >= 2 ? east[1] - east[0] : null;
    const endMargin = far.length >= 2 ? far[1] - far[0] : null;
    for (const [label, v] of [["Hole B side margin", sideMargin], ["Hole B end margin", endMargin]] as const) {
      if (v === null || v < cfg.minEdgeMarginMm) {
        problems.push(`${label} is ${fmt(v)} mm (needs at least ${cfg.minEdgeMarginMm} mm).`);
      }
    }
  }

  return { findings, walls, problems };
}

// ---------------------------------------------------------------------------
// Verifier
// ---------------------------------------------------------------------------

/**
 * Deterministic verifier. Every check measures the generated mesh itself.
 * Nothing here uses AI, and nothing is reported as passed unless it was actually measured.
 */
export function verifyGeometry(
  geometry: GeneratedGeometry | null,
  templateId: TemplateKey,
  parameters: Record<string, number>,
  config: VerifierConfig = DEFAULT_VERIFIER_CONFIG,
  options: VerifierOptions = {}
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

  const req = (id: string) => requested(templateId, parameters, id);
  const mesh: ProbeMesh = { positions: geometry.positions, indices: geometry.indices };
  const dims = geometry.boundingBox.dimensions;
  const bmin = geometry.boundingBox.min;
  const bmax = geometry.boundingBox.max;

  // ---- 1. Watertight & manifold (blocking) ----
  const topology = checkManifoldTopology(geometry.indices, geometry.vertexCount);
  results.push(
    topology.isManifold
      ? {
          id: "manifold_watertight",
          title: "Watertight & Manifold Mesh",
          category: "blocking",
          status: "pass",
          message: "Closed surface: no open boundary edges and no non-manifold junctions.",
          actualValue: `${geometry.triangleCount} triangles, 0 boundary edges`,
          expectedValue: "Watertight manifold",
        }
      : {
          id: "manifold_watertight",
          title: "Watertight & Manifold Mesh",
          category: "blocking",
          status: "fail",
          message: `Mesh has ${topology.boundaryEdges} open boundary edges and ${topology.nonManifoldEdges} non-manifold edges. It cannot be sliced cleanly.`,
          actualValue: `${topology.boundaryEdges} boundary / ${topology.nonManifoldEdges} non-manifold edges`,
          expectedValue: "0 defects",
        }
  );

  // ---- 2. Single solid (blocking) ----
  results.push(
    geometry.componentCount === 1
      ? {
          id: "single_solid",
          title: "Single Connected Solid",
          category: "blocking",
          status: "pass",
          message: "The part is one connected body.",
          actualValue: "1 body",
          expectedValue: "1 body",
        }
      : {
          id: "single_solid",
          title: "Single Connected Solid",
          category: "blocking",
          status: "fail",
          message: `The model is ${geometry.componentCount} separate bodies. A loose piece will not print as one part.`,
          actualValue: `${geometry.componentCount} bodies`,
          expectedValue: "1 body",
        }
  );

  // ---- 3. Parameters realised as requested (blocking) ----
  const mismatches: string[] = [];
  for (const p of TEMPLATE_DEFINITIONS[templateId].parameters) {
    const built = geometry.meta[`built_${p.id}`];
    if (built === undefined) continue;
    let want = req(p.id);
    if (BINARY_PARAMS.has(p.id)) want = want > 0.5 ? 1 : 0;
    const tol = p.unit === "deg" ? 0.05 : 0.001;
    if (Math.abs(built - want) > tol) {
      mismatches.push(`${p.name}: requested ${want.toFixed(2)}${p.unit ? " " + p.unit : ""}, built ${built.toFixed(2)}${p.unit ? " " + p.unit : ""}`);
    }
  }
  results.push(
    mismatches.length === 0
      ? {
          id: "params_realised",
          title: "Parameters Built As Requested",
          category: "blocking",
          status: "pass",
          message: "Every parameter was built exactly as requested, with nothing silently limited.",
        }
      : {
          id: "params_realised",
          title: "Parameters Built As Requested",
          category: "blocking",
          status: "fail",
          message: `The generator had to limit ${mismatches.length} parameter(s) to keep the part buildable: ${mismatches.join("; ")}.`,
        }
  );

  // ---- 4. Model matches its parameters: measured mesh envelope vs requested size (blocking) ----
  const specs: Finding[] = [];
  const t = config.toleranceMm;
  if (templateId === "knob") {
    specs.push(
      { label: "Width", measured: dims[0], expected: req("outerDiameter"), tol: t, unit: " mm" },
      { label: "Depth", measured: dims[1], expected: req("outerDiameter"), tol: t, unit: " mm" },
      { label: "Height", measured: bmax[2], expected: req("height"), tol: t, unit: " mm" },
      { label: "Base z", measured: bmin[2], expected: 0, tol: t, unit: " mm" }
    );
  } else if (templateId === "clip") {
    specs.push(
      { label: "Width", measured: dims[0], expected: req("width"), tol: t, unit: " mm" },
      { label: "Arm tip y", measured: bmax[1], expected: req("armLength"), tol: t, unit: " mm" },
      { label: "Arm top z", measured: bmax[2], expected: req("gap") 