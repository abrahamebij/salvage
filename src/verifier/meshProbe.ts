/**
 * Small, dependency-free mesh probing helpers used by the verifier.
 * They measure the REAL triangle mesh (ray casts, point containment, overhang clusters),
 * so checks are not just arithmetic on the parameters that generated it.
 */
export interface ProbeMesh {
  positions: Float32Array;
  indices: Uint32Array;
}

export type Vec3 = [number, number, number];

// Tiny fixed tilt so axis-aligned rays do not graze mesh edges. Distance error is < 1e-8 relative.
const TILT: Vec3 = [1.3e-4, -0.9e-4, 0.7e-4];

function normalise(v: Vec3): Vec3 {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}

/** Sorted, de-duplicated ray parameters t > 0 where the ray crosses the surface (double sided). */
export function rayHits(mesh: ProbeMesh, origin: Vec3, direction: Vec3): number[] {
  const d = normalise([direction[0] + TILT[0], direction[1] + TILT[1], direction[2] + TILT[2]]);
  const { positions: p, indices: idx } = mesh;
  const hits: number[] = [];
  const EPS = 1e-9;

  for (let i = 0; i < idx.length; i += 3) {
    const a = idx[i] * 3;
    const b = idx[i + 1] * 3;
    const c = idx[i + 2] * 3;

    const e1x = p[b] - p[a], e1y = p[b + 1] - p[a + 1], e1z = p[b + 2] - p[a + 2];
    const e2x = p[c] - p[a], e2y = p[c + 1] - p[a + 1], e2z = p[c + 2] - p[a + 2];

    const px = d[1] * e2z - d[2] * e2y;
    const py = d[2] * e2x - d[0] * e2z;
    const pz = d[0] * e2y - d[1] * e2x;
    const det = e1x * px + e1y * py + e1z * pz;
    if (Math.abs(det) < EPS) continue;
    const inv = 1 / det;

    const tx = origin[0] - p[a], ty = origin[1] - p[a + 1], tz = origin[2] - p[a + 2];
    const u = (tx * px + ty * py + tz * pz) * inv;
    if (u < -EPS || u > 1 + EPS) continue;

    const qx = ty * e1z - tz * e1y;
    const qy = tz * e1x - tx * e1z;
    const qz = tx * e1y - ty * e1x;
    const v = (d[0] * qx + d[1] * qy + d[2] * qz) * inv;
    if (v < -EPS || u + v > 1 + EPS) continue;

    const t = (e2x * qx + e2y * qy + e2z * qz) * inv;
    if (t > 1e-7) hits.push(t);
  }

  hits.sort((x, y) => x - y);
  const out: number[] = [];
  for (const t of hits) {
    if (out.length === 0 || t - out[out.length - 1] > 1e-5) out.push(t);
  }
  return out;
}

/** Solid runs along a ray that starts OUTSIDE the part: [[enter, exit], ...] as ray parameters. */
export function solidSegments(hits: number[]): [number, number][] {
  const segs: [number, number][] = [];
  for (let i = 0; i + 1 < hits.length; i += 2) segs.push([hits[i], hits[i + 1]]);
  return segs;
}

/** Point containment by ray-parity, majority vote over three directions. */
export function pointInside(mesh: ProbeMesh, point: Vec3): boolean {
  const dirs: Vec3[] = [
    [0.577, 0.5775, 0.578],
    [-0.31, 0.83, 0.46],
    [0.12, -0.51, 0.85],
  ];
  let votes = 0;
  for (const dir of dirs) {
    if (rayHits(mesh, point, dir).length % 2 === 1) votes++;
  }
  return votes >= 2;
}

export interface OverhangCluster {
  areaMm2: number;
  spanMm: number;
}

/**
 * Finds regions of faces that point more than ~45 degrees past vertical toward the bed
 * (normal.z < -0.72), ignoring faces lying on the bed itself, and groups connected faces.
 * `spanMm` is the larger XY extent of a group: the unsupported bridging distance.
 */
export function findOverhangClusters(mesh: ProbeMesh, bedZ: number): OverhangCluster[] {
  const { positions: p, indices: idx } = mesh;
  const triCount = idx.length / 3;
  const parent = new Map<number, number>();
  const find = (x: number): number => {
    let r = x;
    while (parent.get(r) !== r) r = parent.get(r)!;
    let c = x;
    while (parent.get(c) !== r) {
      const n = parent.get(c)!;
      parent.set(c, r);
      c = n;
    }
    return r;
  };
  const union = (a: number, b: number) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };

  const overhangTris: number[] = [];
  const triArea: number[] = new Array(triCount).fill(0);

  for (let t = 0; t < triCount; t++) {
    const a = idx[t * 3] * 3, b = idx[t * 3 + 1] * 3, c = idx[t * 3 + 2] * 3;
    const e1: Vec3 = [p[b] - p[a], p[b + 1] - p[a + 1], p[b + 2] - p[a + 2]];
    const e2: Vec3 = [p[c] - p[a], p[c + 1] - p[a + 1], p[c + 2] - p[a + 2]];
    const nx = e1[1] * e2[2] - e1[2] * e2[1];
    const ny = e1[2] * e2[0] - e1[0] * e2[2];
    const nz = e1[0] * e2[1] - e1[1] * e2[0];
    const len = Math.hypot(nx, ny, nz);
    if (len < 1e-12) continue;
    triArea[t] = len / 2;
    if (nz / len >= -0.72) continue;
    const onBed =
      Math.abs(p[a + 2] - bedZ) < 0.01 && Math.abs(p[b + 2] - bedZ) < 0.01 && Math.abs(p[c + 2] - bedZ) < 0.01;
    if (onBed) continue;
    overhangTris.push(t);
  }

  // Union faces that share a vertex
  const vertexOwner = new Map<number, number>();
  for (const t of overhangTris) {
    parent.set(t, t);
  }
  for (const t of overhangTris) {
    for (let k = 0; k < 3; k++) {
      const v = idx[t * 3 + k];
      const owner = vertexOwner.get(v);
      if (owner === undefined) vertexOwner.set(v, t);
      else union(owner, t);
    }
  }

  const groups = new Map<number, { area: number; min: [number, number]; max: [number, number] }>();
  for (const t of overhangTris) {
    const r = find(t);
    let g = groups.get(r);
    if (!g) {
      g = { area: 0, min: [Infinity, Infinity], max: [-Infinity, -Infinity] };
      groups.set(r, g);
    }
    g.area += triArea[t];
    for (let k = 0; k < 3; k++) {
      const v = idx[t * 3 + k] * 3;
      g.min[0] = Math.min(g.min[0], p[v]);
      g.min[1] = Math.min(g.min[1], p[v + 1]);
      g.max[0] = Math.max(g.max[0], p[v]);
      g.max[1] = Math.max(g.max[1], p[v + 1]);
    }
  }

  return [...groups.values()].map((g) => ({
    areaMm2: g.area,
    spanMm: Math.max(g.max[0] - g.min[0], g.max[1] - g.min[1]),
  }));
}
