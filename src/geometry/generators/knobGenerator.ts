import { getManifold } from "../manifoldCore";
import { manifoldToGeometry } from "../meshConverter";
import type { GeneratedGeometry } from "../types";

export interface KnobParameters {
  outerDiameter: number;
  height: number;
  shaftBoreDiameter: number;
  shaftBoreDepth: number;
  dFlatWidth: number;
  dFlatDepth: number;
  pointerNotch: number; // 0 or 1
  gripStyle: number; // 0 (smooth) or 1 (knurled)
}

export async function generateKnobGeometry(
  params: KnobParameters
): Promise<GeneratedGeometry> {
  const { Manifold } = await getManifold();

  const outerRadius = Math.max(5, params.outerDiameter / 2);
  const height = Math.max(4, params.height);
  const boreRadius = Math.max(1, params.shaftBoreDiameter / 2);
  const boreDepth = Math.min(height - 1.5, Math.max(3, params.shaftBoreDepth));

  // 1. Main cylindrical body with slight taper for ergonomics
  // cylinder(height, radiusLow, radiusHigh, circularSegments, center)
  let knob = Manifold.cylinder(height, outerRadius, outerRadius * 0.94, 48, false);

  // 2. Knurling / Grip ridges if gripStyle is enabled
  if (params.gripStyle > 0.5) {
    const ridgeCount = Math.max(16, Math.round(outerRadius * 1.5));
    const ridgeRadius = 0.75;
    for (let i = 0; i < ridgeCount; i++) {
      const angle = (i * 2 * Math.PI) / ridgeCount;
      const x = Math.cos(angle) * (outerRadius * 0.97);
      const y = Math.sin(angle) * (outerRadius * 0.97);
      const ridge = Manifold.cylinder(height * 0.85, ridgeRadius, ridgeRadius, 12, false)
        .translate([x, y, 0]);
      knob = knob.add(ridge);
    }
  }

  // 3. Pointer notch if enabled
  if (params.pointerNotch > 0.5) {
    // Cut a small triangular/rectangular pointer notch on the top face at 12 o'clock (Y > 0)
    const notchWidth = Math.max(2, outerRadius * 0.14);
    const notchLength = outerRadius * 0.45;
    const notchDepth = 1.6;
    const notch = Manifold.cube([notchWidth, notchLength, notchDepth * 2], true)
      .translate([0, outerRadius * 0.7, height]);
    knob = knob.subtract(notch);
  }

  // 4. Shaft Bore (cavity starting from bottom Z = 0)
  const shaftHole = Manifold.cylinder(boreDepth * 2, boreRadius, boreRadius, 36, true)
    .translate([0, 0, boreDepth]);

  // If D-flat is present, add the flat chord into the bore cavity
  if (params.dFlatWidth > 0 && params.dFlatDepth > 0) {
    const flatOffset = boreRadius - (boreRadius * 2 - params.dFlatWidth);
    const blockWidth = boreRadius * 3;
    const flatBlock = Manifold.cube([blockWidth, boreRadius * 2, Math.min(boreDepth, params.dFlatDepth) * 2], true)
      .translate([0, boreRadius + flatOffset, Math.min(boreDepth, params.dFlatDepth)]);

    // The bore with D-flat is circular bore minus the flat insert
    const dBore = shaftHole.subtract(flatBlock);
    knob = knob.subtract(dBore);
  } else {
    knob = knob.subtract(shaftHole);
  }

  return manifoldToGeometry(knob);
}
