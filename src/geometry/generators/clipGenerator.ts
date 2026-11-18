import { getManifold } from "../manifoldCore";
import { manifoldToGeometry } from "../meshConverter";
import type { GeneratedGeometry } from "../types";

export interface ClipParameters {
  width: number;
  thickness: number;
  armLength: number;
  hookDepth: number;
  hookAngle: number;
  gap: number;
}

/**
 * Coordinate conventions (mm): base pad lies on Z = 0 and extends toward -Y, the flex arm
 * runs toward +Y with its tip at Y = armLength, X is centred on 0.
 * The arm underside is at Z = gap and its top at Z = gap + thickness.
 * The snap barb hangs DOWN from the arm tip into the gap: a ramp rises from the barb apex
 * (hookDepth below the arm underside) to the arm tip at the lead-in angle, and a vertical
 * catch shoulder faces the base.
 */
export async function generateClipGeometry(
  params: ClipParameters
): Promise<GeneratedGeometry> {
  const { Manifold } = await getManifold();

  const width = Math.max(4, params.width);
  const thickness = Math.max(1.2, params.thickness);
  const armLength = Math.max(10, params.armLength);
  const gap = Math.max(2.0, params.gap);
  // The barb must fit inside the gap with at least 0.5 mm to spare
  const hookDepth = Math.min(Math.max(1.0, params.hookDepth), gap - 0.5);

  // 1. Base mounting pad
  const baseLength = Math.max(12, armLength * 0.35);
  const baseThickness = thickness * 1.5;
  const base = Manifold.cube([width, baseLength, baseThickness], true)
    .translate([0, -baseLength / 2, baseThickness / 2]);

  const holeRadius = Math.min(width * 0.25, 2.0);
  const baseHole = Manifold.cylinder(baseThickness * 3, holeRadius, holeRadius, 24, true)
    .translate([0, -baseLength / 2, baseThickness / 2]);
  const anchor = base.subtract(baseHole);

  // 2. Upright stanchion
  const stanchionHeight = gap + thickness;
  const stanchionLength = thickness * 1.6;
  const stanchion = Manifold.cube([width, stanchionLength, stanchionHeight], true)
    .translate([0, 0, stanchionHeight / 2]);

  // 3. Cantilever flex arm
  const arm = Manifold.cube([width, armLength, thickness], true)
    .translate([0, armLength / 2, stanchionHeight - thickness / 2]);

  // 4. Snap barb: triangular profile in the YZ plane, extruded across the width
  const armBottomZ = stanchionHeight - thickness; // = gap
  const apexZ = armBottomZ - hookDepth;
  const requestedRamp = hookDepth / Math.tan((params.hookAngle * Math.PI) / 180);
  const maxRamp = Math.max(0.5, armLength - stanchionLength / 2 - 2);
  const ramp = Math.min(requestedRamp, maxRamp);
  const yStart = armLength - ramp;
  // Counter-clockwise (Y, Z) profile; the top edge is buried half-way into the arm
  const profile: [number, number][] = [
    [yStart, armBottomZ + thickness / 2], // shoulder top (inside arm)
    [yStart, apexZ], //                       barb apex
    [armLength, armBottomZ], //               tip of the ramp, flush with arm underside
    [armLength, armBottomZ + thickness / 2], // tip top (inside arm)
  ];
  // Extrude along local Z, then map local (x, y, z) -> world (Y, Z, X)
  const barb = Manifold.extrude([profile], width)
    // column-major 4x4: local x -> world Y, local y -> world Z, local z -> world X
    .transform([0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1])
    .translate([-width / 2, 0, 0]);

  const clip = anchor.add(stanchion).add(arm).add(barb);

  const builtAngle = (Math.atan2(hookDepth, ramp) * 180) / Math.PI;
  const meta: Record<string, number> = {
    width,
    thickness,
    armLength,
    gap,
    baseLength,
    baseThickness,
    stanchionLength,
    hookDepth,
    ramp,
    yStart,
    apexZ,
    armBottomZ,
    leadInAngle: builtAngle,
    built_width: width,
    built_thickness: thickness,
    built_armLength: armLength,
    built_hookDepth: hookDepth,
    built_hookAngle: builtAngle,
    built_gap: gap,
  };

  return manifoldToGeometry(clip, meta);
}
