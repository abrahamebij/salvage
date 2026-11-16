export interface BoundingBox {
  min: [number, number, number];
  max: [number, number, number];
  dimensions: [number, number, number];
}

export interface GeneratedGeometry {
  positions: Float32Array;
  indices: Uint32Array;
  normals: Float32Array;
  triangleCount: number;
  vertexCount: number;
  boundingBox: BoundingBox;
  volumeMm3: number;
  surfaceAreaMm2: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  manifoldMesh: any;
}
