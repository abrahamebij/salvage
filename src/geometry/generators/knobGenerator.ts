import { getManifold } from "../manifoldCore";
import { manifoldToGeometry } from "../meshConverter";
import type { GeneratedGeometry } from "../types";

export interface KnobParameters {
  outerDiameter: number;
  height: number;
  shaftBoreDiameter: number;
  shaftBoreDepth: number;
  dFlatWidth: number; // flat-to-round distance of the D-shaft, mm (0 = round shaft)
  dFlatDepth: number; // axial length of the flat, mm
  pointerNotch: number; // 0 or 1
  gripStyle: number; // 0 (smooth) or 1 (knurled)
}

/** Minimum solid left above the end of the shaft bore, mm. */
export const KNOB_MIN_ROOF_MM = 1.5;

/**
 * Coordinate conventions (mm): knob axis is +Z, base sits on Z = 0, pointer notch toward +Y.
 * The shaft bore opens at Z = 0 and ends (blind) at Z = boreDepth.
 * D-shaft convention: the round side of the bore is on -Y. The flat is the plane
 * Y = -boreRadius + dFlatWidth, so `dFlatWidth` is the flat-to-round distance
 * (a full circle is dFlatWidth = 2 x boreRadius). The flat runs for `dFlatDepth` at the
 * deep end of the bore, because the flatted part of a shaft is its tip.
 */
export async function generateKnobGeometry(
  params: KnobParameters
): Promise<GeneratedGeometry> {
  const { Manifold } = await getManifold();

  const outerRadius = Math.max(5, params.outerDiameter / 2);
  const height = Math.max(4, params.height);
  const boreRadius = Math.max(1, params.shaftBoreDiameter / 2);
  const boreDepth = Math.min(height - KNOB_MIN_ROOF_MM, Math.max(3, params.shaftBoreDepth));

  // 1. Main body with a slight taper for ergonomics
  let knob = Manifold.cylinder(height, outerRadius, outerRadius * 0.94, 48, false);

  // 2. Knurling ridges. Ridge centres sit one ridge-radius inside the nominal radius so the
  //    outer envelope stays at the requested diameter.
  const gripOn = params.gripStyle > 0.5;
  if (gripOn) {
    const ridgeCount = Math.max(16, Math.round(outerRadius * 1.5));
    const ridgeRadius = 0.75;
    const ridgeCentre = outerRadius - ridgeRadius;
    for (let i = 0; i < ridgeCount; i++) {
      const angle = (i * 2 * Math.PI) / ridgeCount;
      const ridge = Manifold.cylinder(height * 0.85, ridgeRadius, ridgeRadius, 12, false)
        .translate([Math.cos(angle) * ridgeCentre, Math.sin(angle) * ridgeCentre, 0]);
      knob = knob.add(ridge);
    }
  }

  // 3. Pointer notch on the top face at 12 o'clock (+Y)
  const notchOn = params.pointerNotch > 0.5;
  if (notchOn) {
    const notchWidth = Math.max(2, outerRadius * 0.14);
    const notchLength = outerRadius * 0.45;
    const notchDepth = 1.6;
    const notch = Manifold.cube([notchWidth, notchLength, notchDepth * 2], true)
      .translate([0, outerRadius * 0.7, height]);
    knob = knob.subtract(notch);
  }

  // 4. Shaft bore: a blind cylinder from Z = 0 up to Z = boreDepth
  const bore = Manifold.cylinder(boreDepth, boreRadius, boreRadius, 36, false);
  let cavity = bore;

  const flatActive =
    params.dFlatWidth > 0 && params.dFlatDepth > 0 && params.dFlatWidth < boreRadius * 2;
  const flatLen = flatActive ? Math.min(boreDepth, params.dFlatDepth) : 0;
  const flatY = -boreRadius + params.dFlatWidth;
  if (flatActive) {
    // Material kept inside the bore on the +Y side of the flat plane
    const flatBlock = Manifold.cube([boreRadius * 3, boreRadius * 2 + 2, flatLen + 1], false)
      .translate([-boreRadius * 1.5, flatY, boreDepth - flatLen]);
    cavity = bore.subtract(flatBlock);
  }
  knob = knob.subtract(cavity);

  const meta: Record<string, number> = {
    outerRadius,
    height,
    boreRadius,
    boreDepth,
    flatToRound: flatActive ? params.dFlatWidth : 0,
    flatLen,
    flatY: flatActive ? flatY : 0,
    // What each template parameter was realised with
    built_outerDiameter: outerRadius * 2,
    built_height: height,
    built_shaftBoreDiameter: boreRadius * 2,
    built_shaftBoreDepth: boreDepth,
    built_dFlatWidth: flatActive ? params.dFlatWidth : params.dFlatWidth > 0 ? 0 : params.dFlatWidth,
    built_dFlatDepth: flatActive ? flatLen : params.dFlatDepth,
    built_pointerNotch: notchOn ? 1 : 0,
    built_gripStyle: gripOn ? 1 : 0,
  };

  return manifoldToGeometry(knob, meta);
}
