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
  /** Number of disconnected solid bodies in the mesh. A printable part must be 1. */
  componentCount: number;
  /**
   * What the generator actually built, in mm (after any internal limits), plus the
   * positions of key features. Keys named `built_<paramId>` hold the value each template
   * parameter was realised with, so the verifier can compare it to what was requested.
   */
  meta: Record<string, number>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  manifoldMesh: any;
}
