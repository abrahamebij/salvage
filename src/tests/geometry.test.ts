import { test } from "node:test";
import assert from "node:assert/strict";
import { generateGeometry } from "../src/geometry";
import { getDefaultParameters } from "../src/domain/templates";

const ids = ["knob", "clip", "bracket"] as const;

for (const id of ids) {
  test(`${id}: defaults build one watertight solid`, async () => {
    const g = await generateGeometry(id, getDefaultParameters(id).values);
    assert.equal(g.componentCount, 1);
    assert.ok(g.volumeMm3 > 0);
    assert.equal(g.manifoldMesh.status?.() ?? "NoError", "NoError");
  });
}

test("knob: shaft bore is blind and stops at its stated depth (regression: it used to cut through)", async () => {
  const base = { ...getDefaultParameters("knob").values, gripStyle: 0, pointerNotch: 0, dFlatWidth: 0, dFlatDepth: 0 };
  const g = await generateGeometry("knob", base);
  const r = 16 - (0.96 * 17.9) / 18; // tapered outer radius near the top
  const solidTop = Math.PI * r * r;
  const top = g.manifoldMesh.slice(17.9).area();
  // a 48-sided body is ~0.15% below a true circle, so allow 4 mm2; the 6 mm bore would be 28 mm2
  assert.ok(Math.abs(top - solidTop) < 4, `top section ${top.toFixed(1)} should be a solid disc ${solidTop.toFixed(1)}`);
  const boreArea = Math.PI * 3 * 3;
  const mid = g.manifoldMesh.slice(6).area();
  const rMid = 16 - (0.96 * 6) / 18;
  assert.ok(Math.abs(mid - (Math.PI * rMid * rMid - boreArea)) < 4, "section below bore end shows the bore");
});

test("knob: knurled envelope stays at the requested diameter", async () => {
  const g = await generateGeometry("knob", { ...getDefaultParameters("knob").values, gripStyle: 1 });
  assert.ok(Math.abs(g.boundingBox.dimensions[0] - 32) < 0.1);
});

test("clip: barb hangs below the arm and the part stays within gap + thickness", async () => {
  const g = await generateGeometry("clip", getDefaultParameters("clip").values);
  assert.ok(Math.abs(g.boundingBox.max[2] - (8 + 2.2)) < 0.01);
  assert.ok(Math.abs(g.boundingBox.min[2]) < 0.01);
});

test("bracket: fillet is a real concave web joined to both legs (regression: it was a loose rod)", async () => {
  const withFillet = await generateGeometry("bracket", getDefaultParameters("bracket").values);
  const noFillet = await generateGeometry("bracket", { ...getDefaultParameters("bracket").values, filletRadius: 0 });
  assert.equal(withFillet.componentCount, 1);
  const added = withFillet.volumeMm3 - noFillet.volumeMm3;
  const expected = (1 - Math.PI / 4) * 4 * 4 * 22; // quarter-round web, R = 4, width 22
  assert.ok(Math.abs(added - expected) < 5, `fillet adds ${added.toFixed(1)} mm3, expected about ${expected.toFixed(1)}`);
});
