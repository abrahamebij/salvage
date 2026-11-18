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

/**
 * Coordinate conventions (mm): the inside corner is at Y = thickness, Z = thickness.
 * Leg A rises along +Z (occupies Y 0..thickness), leg B runs along +Y (occupies Z 0..thickness),
 * X is centred on 0 with extent +/- width/2. Hole A passes through leg A along Y at
 * Z = holeZ; hole B passes through leg B along Z at Y = holeY.
 * `holeSpacing` is the distance from the inside corner region to each hole centre
 * (measured from the outer face line, as before), limited so each hole stays on its leg.
 */
export async function generateBracketGeometry(
  params: BracketParameters
): Promise<GeneratedGeometry> {
  const { Manifold } = await getManifold();

  const legA = Math.max(12, params.legALength);
  const legB = Math.max(12, params.legBLength);
  const width = Math.max(8, params.width);
  const thickness = Math.max(1.5, params.thickness);
  const holeRadius = Math.max(1.0, params.holeDiameter / 2);

  // Hole centres (limited so a hole cannot run off the end of its leg)
  const holeZ = Math.min(legA - holeRadius * 2, Math.max(thickness + holeRadius * 1.5, params.holeSpacing));
  const holeY = Math.min(legB - holeRadius * 2, Math.max(thickness + holeRadius * 1.5, params.holeSpacing));

  // Fillet radius is limited so the fillet never reaches the fastener holes (0.5 mm clearance)
  const fastenerLimit = Math.min(holeZ, holeY) - holeRadius - thickness - 0.5;
  const filletRequested = Math.max(0, params.filletRadius);
  let filletR = Math.min(filletRequested, Math.min(legA, legB) * 0.4, fastenerLimit);
  if (!(filletR > 0.5)) filletR = 0;

  // 1. Legs
  const legABlock = Manifold.cube([width, thickness, legA], true)
    .translate([0, thickness / 2, legA / 2]);
  const legBBlock = Manifold.cube([width, legB, thickness], true)
    .translate([0, legB / 2, thickness / 2]);
  let bracket = legABlock.add(legBBlock);

  // 2. Concave inside-corner fillet: a square block in the corner minus a cylinder whose
  //    axis sits at the far corner of the square (leaves the quarter-round web).
  if (filletR > 0) {
    const square = Manifold.cube([width, filletR, filletR], false)
      .translate([-width / 2, thickness, thickness]);
    const cutter = Manifold.cylinder(width + 2, filletR, filletR, 48, true)
      .rotate([0, 90, 0])
      .translate([0, thickness + filletR, thickness + filletR]);
    bracket = bracket.add(square.subtract(cutter));
  }

  // 3. Mounting holes (through the leg only, 1 mm overshoot each side)
  const holeA = Manifold.cylinder(thickness + 2, holeRadius, holeRadius, 32, true)
    .rotate([90, 0, 0])
    .translate([0, thickness / 2, holeZ]);
  bracket = bracket.subtract(holeA);

  const holeB = Manifold.cylinder(thickness + 2, holeRadius, holeRadius, 32, true)
    .translate([0, holeY, thickness / 2]);
  bracket = bracket.subtract(holeB);

  // The single `holeSpacing` parameter drives both holes; report whichever one deviates most
  const builtSpacing =
    Math.abs(holeZ - params.holeSpacing) >= Math.abs(holeY - params.holeSpacing) ? holeZ : holeY;

  const meta: Record<string, number> = {
    legA,
    legB,
    width,
    thickness,
    holeRadius,
    holeZ,
    holeY,
    filletR,
    built_legALength: legA,
    built_legBLength: legB,
    built_width: width,
    built_thickness: thickness,
    built_holeDiameter: holeRadius * 2,
    built_holeSpacing: builtSpacing,
    built_filletRadius: filletR,
  };

  return manifoldToGeometry(bracket, meta);
}
