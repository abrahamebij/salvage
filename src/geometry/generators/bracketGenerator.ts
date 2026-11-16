import { getManifold } from "../manifoldCore";
import { manifoldToGeometry } from "../meshConverter";
import type { GeneratedGeometry } from "../types";

export interface BracketParameters {
  legALength: number;
  legBLength: number;
  width: number;
  thickness: number;
  holeDiameter: number;
  holeSpacing: number;
  filletRadius: number;
}

export async function generateBracketGeometry(
  params: BracketParameters
): Promise<GeneratedGeometry> {
  const { Manifold } = await getManifold();

  const legA = Math.max(12, params.legALength);
  const legB = Math.max(12, params.legBLength);
  const width = Math.max(8, params.width);
  const thickness = Math.max(1.5, params.thickness);
  const holeRadius = Math.max(1.0, params.holeDiameter / 2);
  const filletR = Math.max(0, Math.min(params.filletRadius, Math.min(legA, legB) * 0.4));

  // 1. Leg A (Vertical along Z axis)
  // X: width, Y: thickness, Z: legA
  const legABlock = Manifold.cube([width, thickness, legA], true)
    .translate([0, thickness / 2, legA / 2]);

  // 2. Leg B (Horizontal along Y axis)
  // X: width, Y: legB, Z: thickness
  const legBBlock = Manifold.cube([width, legB, thickness], true)
    .translate([0, legB / 2, thickness / 2]);

  let bracket = legABlock.add(legBBlock);

  // 3. Corner gusset / fillet for structural reinforcement
  if (filletR > 0.5) {
    // Cylinder in the inside corner
    const fillet = Manifold.cylinder(width, filletR, filletR, 32, true)
      .rotate([0, 90, 0])
      .translate([0, thickness + filletR, thickness + filletR]);

    // Box filling the corner gap
    const filletWedge = Manifold.cube([width, filletR * 2, filletR * 2], true)
      .translate([0, thickness + filletR, thickness + filletR])
      .intersect(fillet);

    bracket = bracket.add(filletWedge);
  }

  // 4. Mounting Holes
  // Hole in Leg A (through Y axis)
  const holeZ = Math.min(legA - holeRadius * 2, Math.max(thickness + holeRadius * 1.5, params.holeSpacing));
  const holeA = Manifold.cylinder(thickness * 4, holeRadius, holeRadius, 32, true)
    .rotate([90, 0, 0])
    .translate([0, thickness / 2, holeZ]);
  bracket = bracket.subtract(holeA);

  // Hole in Leg B (through Z axis)
  const holeY = Math.min(legB - holeRadius * 2, Math.max(thickness + holeRadius * 1.5, params.holeSpacing));
  const holeB = Manifold.cylinder(thickness * 4, holeRadius, holeRadius, 32, true)
    .translate([0, holeY, thickness / 2]);
  bracket = bracket.subtract(holeB);

  return manifoldToGeometry(bracket);
}
