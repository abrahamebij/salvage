import { test } from "node:test";
import assert from "node:assert/strict";
import { generateGeometry } from "../src/geometry";
import { getDefaultParameters } from "../src/domain/templates";
import { verifyGeometry, rayHits, checkManifoldTopology } from "../src/verifier";

const ids = ["knob", "clip", "bracket"] as const;
const byId = (s: ReturnType<typeof verifyGeometry>, id: string) => s.results.find((r) => r.id === id)!;

async function run(id: (typeof ids)[number], over: Record<string, number> = {}, opts = {}) {
  const params = { ...getDefaultParameters(id).values, ...over };
  const g = await generateGeometry(id, params);
  return { g, params, v: verifyGeometry(g, id, params, undefined, opts) };
}

for (const id of ids) {
  test(`${id}: default part passes every blocking check`, async () => {
    const { v } = await run(id);
    assert.equal(v.blockingFailures, 0, JSON.stringify(v.results.filter((r) => r.status === "fail")));
    assert.equal(byId(v, "measured_envelope").status, "na", "no measured size yet is n/a, never a pass");
  });
}

test("ray casting measures a cube", () => {
  // unit cube 0..1 as 12 triangles
  const p = new Float32Array([0,0,0, 1,0,0, 1,1,0, 0,1,0, 0,0,1, 1,0,1, 1,1,1, 0,1,1]);
  const i = new Uint32Array([0,2,1, 0,3,2, 4,5,6, 4,6,7, 0,1,5, 0,5,4, 1,2,6, 1,6,5, 2,3,7, 2,7,6, 3,0,4, 3,4,7]);
  const hits = rayHits({ positions: p, indices: i }, [0.5, 0.5, -3], [0, 0, 1]);
  assert.equal(hits.length, 2);
  assert.ok(Math.abs(hits[0] - 3) < 1e-3 && Math.abs(hits[1] - 4) < 1e-3);
});

test("topology check rejects a mesh with a missing triangle", async () => {
  const { g } = await run("bracket");
  const broken = g.indices.slice(3);
  assert.equal(checkManifoldTopology(broken, g.vertexCount).isManifold, false);
});

test("a second loose body fails the single-solid check", async () => {
  const { g, params } = await run("clip");
  const v = verifyGeometry({ ...g, componentCount: 2 }, "clip", params);
  assert.equal(byId(v, "single_solid").status, "fail");
  assert.equal(v.passed, false);
});

test("knob: bore too deep is flagged because the generator had to limit it", async () => {
  const { v } = await run("knob", { shaftBoreDepth: 40 });
  assert.equal(byId(v, "params_realised").status, "fail");
  assert.equal(v.passed, false);
});

test("knob: wall thinner than the printable minimum fails on the measured wall", async () => {
  const { v } = await run("knob", { outerDiameter: 12, shaftBoreDiameter: 10, gripStyle: 0 });
  assert.equal(byId(v, "wall_thickness").status, "fail");
});

test("knob: a D-flat as wide as the bore is flagged", async () => {
  const { v } = await run("knob", { dFlatWidth: 6 });
  assert.equal(v.passed, false);
});

test("clip: hook deeper than the gap is flagged", async () => {
  const { v } = await run("clip", { gap: 2, hookDepth: 6 });
  assert.equal(byId(v, "params_realised").status, "fail");
});

test("clip: the long unsupported arm underside is a warning, not a pass", async () => {
  const { v } = await run("clip");
  assert.equal(byId(v, "overhang_check").status, "warning");
});

test("bracket: hole too close to the side edge fails the margin check", async () => {
  const { v } = await run("bracket", { width: 8, holeDiameter: 7 });
  assert.equal(byId(v, "mating_features").status, "fail");
});

test("bracket: fillet is limited near the holes and that is reported", async () => {
  const { v } = await run("bracket", { holeSpacing: 12, filletRadius: 10 });
  assert.equal(byId(v, "params_realised").status, "fail");
});

test("measured overall size: wrong size fails, matching size passes", async () => {
  const bad = await run("bracket", {}, { measuredEnvelope: { x: 22, y: 40, z: 50 } });
  assert.equal(byId(bad.v, "measured_envelope").status, "fail");
  const good = await run("bracket", {}, { measuredEnvelope: { x: 22, y: 40, z: 40 } });
  assert.equal(byId(good.v, "measured_envelope").status, "pass");
});
