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

export async function generateClipGeometry(
  params: ClipParameters
): Promise<GeneratedGeometry> {
  const { Manifold } = await getManifold();

  const width = Math.max(4, params.width);
  const thickness = Math.max(1.2, params.thickness);
  const armLength = Math.max(12, params.armLength);
  const hookDepth = Math.max(1.0, params.hookDepth);
  const gap = Math.max(2.0, params.gap);

  // 1. Base Mounting Pad (anchors the clip to the housing)
  const baseLength = Math.max(12, armLength * 0.35);
  const baseThickness = thickness * 1.5;
  const base = Manifold.cube([width, baseLength, baseThickness], true)
    .translate([0, -baseLength / 2, baseThickness / 2]);

  // Base screw/rivet hole for mounting
  const holeRadius = Math.min(width * 0.25, 2.0);
  const baseHole = Manifold.cylinder(baseThickness * 3, holeRadius, holeRadius, 24, true)
    .translate([0, -baseLength / 2, baseThickness / 2]);
  const anchor = base.subtract(baseHole);

  // 2. Upright Stanchion (creates clearance gap)
  const stanchionHeight = gap + thickness;
  const stanchionLength = thickness * 1.6;
  const stanchion = Manifold.cube([width, stanchionLength, stanchionHeight], true)
    .translate([0, 0, stanchionHeight / 2]);

  // 3. Cantilever Flex Arm
  const arm = Manifold.cube([width, armLength, thickness], true)
    .translate([0, armLength / 2, stanchionHeight - thickness / 2]);

  // 4. Retention Hook at the end of the flex arm
  const hookLength = Math.max(3, hookDepth * 1.5);
  const hookBlock = Manifold.cube([width, hookLength, hookDepth + thickness], true)
    .translate([
      0,
      armLength - hookLength / 2,
      stanchionHeight - (hookDepth + thickness) / 2 + thickness,
    ]);

  // Chamfer / lead-in ramp for push-in engagement
  const angleRad = (params.hookAngle * Math.PI) / 180;
  const cutSize = hookDepth * 2.5;
  const cutBlock = Manifold.cube([width * 1.5, cutSize, cutSize], true)
    .rotate([angleRad * (180 / Math.PI), 0, 0])
    .translate([0, armLength + cutSize * 0.2, stanchionHeight - hookDepth * 0.8]);

  const hook = hookBlock.subtract(cutBlock);

  // Combine into single watertight manifold
  const clip = anchor.add(stanchion).add(arm).add(hook);

  return manifoldToGeometry(clip);
}
