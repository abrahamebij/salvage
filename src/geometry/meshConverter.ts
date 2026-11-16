import type { GeneratedGeometry, BoundingBox } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function manifoldToGeometry(manifold: any): GeneratedGeometry {
  const mesh = manifold.getMesh();
  const numProp = mesh.numProp || 3;
  const numVerts = mesh.vertProperties.length / numProp;

  const positions = new Float32Array(numVerts * 3);
  for (let i = 0; i < numVerts; i++) {
    positions[i * 3] = mesh.vertProperties[i * numProp];
    positions[i * 3 + 1] = mesh.vertProperties[i * numProp + 1];
    positions[i * 3 + 2] = mesh.vertProperties[i * numProp + 2];
  }

  const indices = new Uint32Array(mesh.triVerts);

  // Compute normals for smooth/flat shading
  const normals = new Float32Array(numVerts * 3);
  for (let i = 0; i < indices.length; i += 3) {
    const i0 = indices[i];
    const i1 = indices[i + 1];
    const i2 = indices[i + 2];

    const ax = positions[i1 * 3] - positions[i0 * 3];
    const ay = positions[i1 * 3 + 1] - positions[i0 * 3 + 1];
    const az = positions[i1 * 3 + 2] - positions[i0 * 3 + 2];

    const bx = positions[i2 * 3] - positions[i0 * 3];
    const by = positions[i2 * 3 + 1] - positions[i0 * 3 + 1];
    const bz = positions[i2 * 3 + 2] - positions[i0 * 3 + 2];

    const nx = ay * bz - az * by;
    const ny = az * bx - ax * bz;
    const nz = ax * by - ay * bx;

    normals[i0 * 3] += nx;
    normals[i0 * 3 + 1] += ny;
    normals[i0 * 3 + 2] += nz;

    normals[i1 * 3] += nx;
    normals[i1 * 3 + 1] += ny;
    normals[i1 * 3 + 2] += nz;

    normals[i2 * 3] += nx;
    normals[i2 * 3 + 1] += ny;
    normals[i2 * 3 + 2] += nz;
  }

  // Normalize
  for (let i = 0; i < numVerts; i++) {
    const x = normals[i * 3];
    const y = normals[i * 3 + 1];
    const z = normals[i * 3 + 2];
    const len = Math.hypot(x, y, z);
    if (len > 0.000001) {
      normals[i * 3] = x / len;
      normals[i * 3 + 1] = y / len;
      normals[i * 3 + 2] = z / len;
    }
  }

  // Calculate bounding box
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (let i = 0; i < numVerts; i++) {
    const x = positions[i * 3];
    const y = positions[i * 3 + 1];
    const z = positions[i * 3 + 2];
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (z < minZ) minZ = z;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
    if (z > maxZ) maxZ = z;
  }

  const boundingBox: BoundingBox = {
    min: [minX, minY, minZ],
    max: [maxX, maxY, maxZ],
    dimensions: [maxX - minX, maxY - minY, maxZ - minZ],
  };

  const volumeMm3 = typeof manifold.volume === "function" ? manifold.volume() : 0;
  const surfaceAreaMm2 = typeof manifold.surfaceArea === "function" ? manifold.surfaceArea() : 0;

  return {
    positions,
    indices,
    normals,
    triangleCount: indices.length / 3,
    vertexCount: numVerts,
    boundingBox,
    volumeMm3,
    surfaceAreaMm2,
    manifoldMesh: manifold,
  };
}
