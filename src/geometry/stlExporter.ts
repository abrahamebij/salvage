import type { GeneratedGeometry } from "./types";
import type { TemplateId } from "../types";

/**
 * Serializes GeneratedGeometry into a standard binary STL format.
 * Structure:
 * - 80 bytes: Header
 * - 4 bytes: Triangle count (uint32, little-endian)
 * - N * 50 bytes: Per triangle [Normal (3x float32), V1 (3x float32), V2 (3x float32), V3 (3x float32), attr (uint16)]
 */
export function geometryToBinaryStl(
  geometry: GeneratedGeometry,
  headerText: string = "Salvage 3D - Printable Replacement Part"
): Uint8Array {
  const triangleCount = geometry.triangleCount;
  const bufferSize = 84 + triangleCount * 50;
  const buffer = new ArrayBuffer(bufferSize);
  const dataView = new DataView(buffer);

  // 1. Write 80-byte header
  const encoder = new TextEncoder();
  const headerBytes = encoder.encode(headerText.slice(0, 80));
  const uint8View = new Uint8Array(buffer);
  uint8View.set(headerBytes, 0);

  // 2. Write triangle count (little-endian uint32 at offset 80)
  dataView.setUint32(80, triangleCount, true);

  // 3. Write triangles
  const positions = geometry.positions;
  const indices = geometry.indices;
  const normals = geometry.normals;

  let offset = 84;

  for (let i = 0; i < indices.length; i += 3) {
    const i0 = indices[i];
    const i1 = indices[i + 1];
    const i2 = indices[i + 2];

    // Normal vector
    const nx = normals[i0 * 3] || 0;
    const ny = normals[i0 * 3 + 1] || 0;
    const nz = normals[i0 * 3 + 2] || 0;
    dataView.setFloat32(offset, nx, true);
    dataView.setFloat32(offset + 4, ny, true);
    dataView.setFloat32(offset + 8, nz, true);
    offset += 12;

    // Vertex 1
    dataView.setFloat32(offset, positions[i0 * 3], true);
    dataView.setFloat32(offset + 4, positions[i0 * 3 + 1], true);
    dataView.setFloat32(offset + 8, positions[i0 * 3 + 2], true);
    offset += 12;

    // Vertex 2
    dataView.setFloat32(offset, positions[i1 * 3], true);
    dataView.setFloat32(offset + 4, positions[i1 * 3 + 1], true);
    dataView.setFloat32(offset + 8, positions[i1 * 3 + 2], true);
    offset += 12;

    // Vertex 3
    dataView.setFloat32(offset, positions[i2 * 3], true);
    dataView.setFloat32(offset + 4, positions[i2 * 3 + 1], true);
    dataView.setFloat32(offset + 8, positions[i2 * 3 + 2], true);
    offset += 12;

    // Attribute byte count (0)
    dataView.setUint16(offset, 0, true);
    offset += 2;
  }

  return uint8View;
}

/**
 * Triggers a client-side download of the binary STL file
 */
export function downloadStl(stlBytes: Uint8Array, filename: string): void {
  const blob = new Blob([stlBytes], { type: "application/sla" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates a deterministic, human-readable filename for the export
 */
export function generateStlFilename(
  templateId: TemplateId,
  dimensions: [number, number, number],
  isOverride: boolean = false
): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const [x, y, z] = dimensions.map((d) => Math.round(d));
  const tag = isOverride ? "_OVERRIDE" : "_verified";
  return `salvage_${templateId}_${x}x${y}x${z}mm_${dateStr}${tag}.stl`;
}
