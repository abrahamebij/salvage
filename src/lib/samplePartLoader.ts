import type { CapturedPhoto } from "../types";

function createCanvasImage(
  title: string,
  subtitle: string,
  drawDetails: (ctx: CanvasRenderingContext2D) => void
): Promise<CapturedPhoto> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get canvas context");

    // Background: industrial workbench surface
    ctx.fillStyle = "#1e2025";
    ctx.fillRect(0, 0, 800, 600);

    // Subtle measurement grid
    ctx.strokeStyle = "#2b2e37";
    ctx.lineWidth = 1;
    for (let x = 0; x < 800; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 600);
      ctx.stroke();
    }
    for (let y = 0; y < 600; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(800, y);
      ctx.stroke();
    }

    // Custom part drawing
    drawDetails(ctx);

    // Metadata label in corner
    ctx.fillStyle = "rgba(18, 19, 22, 0.85)";
    ctx.fillRect(20, 20, 320, 70);
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 1;
    ctx.strokeRect(20, 20, 320, 70);

    ctx.fillStyle = "#f59e0b";
    ctx.font = "bold 16px monospace";
    ctx.fillText("SAMPLE PART: APPLIANCE KNOB", 35, 45);

    ctx.fillStyle = "#9ea3b0";
    ctx.font = "12px monospace";
    ctx.fillText(title, 35, 63);
    ctx.fillText(subtitle, 35, 78);

    canvas.toBlob(
      (blob) => {
        if (!blob) throw new Error("Failed to export blob");
        const filename = `${title.toLowerCase().replace(/[^a-z0-9]/g, "_")}.jpg`;
        const file = new File([blob], filename, { type: "image/jpeg" });
        const previewUrl = URL.createObjectURL(blob);
        resolve({
          id: `sample-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          file,
          previewUrl,
          name: filename,
          size: blob.size,
          type: "image/jpeg",
        });
      },
      "image/jpeg",
      0.92
    );
  });
}

export async function generateSampleKnobPhotos(): Promise<CapturedPhoto[]> {
  const photo1 = await createCanvasImage(
    "knob_top_view",
    "Angle 1: Top face with pointer notch and surface crack",
    (ctx) => {
      // Outer knob body
      ctx.fillStyle = "#2e323b";
      ctx.beginPath();
      ctx.arc(400, 320, 160, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#4b5161";
      ctx.lineWidth = 4;
      ctx.stroke();

      // Knurled grip ridges
      ctx.strokeStyle = "#23262d";
      ctx.lineWidth = 3;
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 18) {
        const x1 = 400 + Math.cos(angle) * 145;
        const y1 = 320 + Math.sin(angle) * 145;
        const x2 = 400 + Math.cos(angle) * 160;
        const y2 = 320 + Math.sin(angle) * 160;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Pointer notch at 12 o'clock
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.moveTo(392, 160);
      ctx.lineTo(408, 160);
      ctx.lineTo(400, 190);
      ctx.closePath();
      ctx.fill();

      // Visible crack
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(400, 320);
      ctx.lineTo(470, 240);
      ctx.lineTo(520, 230);
      ctx.stroke();

      ctx.fillStyle = "#ef4444";
      ctx.font = "12px monospace";
      ctx.fillText("[FRACTURE: TOP RIM]", 480, 220);
    }
  );

  const photo2 = await createCanvasImage(
    "knob_underside_shaft",
    "Angle 2: Underside showing 6.0mm D-shaft bore",
    (ctx) => {
      // Outer rim underside
      ctx.fillStyle = "#262931";
      ctx.beginPath();
      ctx.arc(400, 320, 160, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#3e4350";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Shaft stem collar
      ctx.fillStyle = "#333742";
      ctx.beginPath();
      ctx.arc(400, 320, 60, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#4d5364";
      ctx.lineWidth = 2;
      ctx.stroke();

      // D-Shaft Bore (6mm bore with flat)
      ctx.fillStyle = "#121316";
      ctx.beginPath();
      ctx.arc(400, 320, 28, -Math.PI * 0.65, Math.PI * 0.65);
      ctx.lineTo(390, 320 + 20);
      ctx.lineTo(390, 320 - 20);
      ctx.closePath();
      ctx.fill();

      // Crack across D-flat wall
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(390, 320);
      ctx.lineTo(340, 320);
      ctx.stroke();

      ctx.fillStyle = "#ef4444";
      ctx.font = "12px monospace";
      ctx.fillText("[SHEARED D-FLAT SHAFT WALL]", 200, 310);

      // Dimension indicator
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(400, 235);
      ctx.lineTo(400, 260);
      ctx.stroke();
      ctx.fillStyle = "#f59e0b";
      ctx.font = "11px monospace";
      ctx.fillText("Bore: 6.0mm D-shaft", 350, 230);
    }
  );

  const photo3 = await createCanvasImage(
    "knob_side_profile_scale",
    "Angle 3: Side elevation with 20mm scale reference coin",
    (ctx) => {
      // Side profile of knob
      ctx.fillStyle = "#2e323b";
      // Knob top skirt
      ctx.fillRect(280, 240, 240, 80);
      // Shaft extension
      ctx.fillStyle = "#23262d";
      ctx.fillRect(360, 320, 80, 60);

      // Pointer mark profile
      ctx.fillStyle = "#f59e0b";
      ctx.fillRect(280, 240, 10, 80);

      // Height dimension line
      ctx.strokeStyle = "#9ea3b0";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(540, 240);
      ctx.lineTo(540, 380);
      ctx.moveTo(535, 240);
      ctx.lineTo(545, 240);
      ctx.moveTo(535, 380);
      ctx.lineTo(545, 380);
      ctx.stroke();

      ctx.fillStyle = "#f4f4f6";
      ctx.font = "12px monospace";
      ctx.fillText("Overall Height: ~25mm", 555, 315);

      // Scale reference coin (20mm reference)
      ctx.fillStyle = "#b45309";
      ctx.beginPath();
      ctx.arc(180, 330, 45, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#d97706";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = "#fef3c7";
      ctx.font = "bold 13px monospace";
      ctx.fillText("REF COIN", 150, 328);
      ctx.font = "11px monospace";
      ctx.fillText("Ø 20.0 mm", 147, 345);
    }
  );

  return [photo1, photo2, photo3];
}
