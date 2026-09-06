import JSZip from "jszip";
import type { GDProject } from "./types";

export async function exportGameToZip(project: GDProject): Promise<Blob> {
  const zip = new JSZip();

  zip.file("project.json", JSON.stringify(project, null, 2));

  const htmlTemplate = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${project.name || "Nexus Game"}</title>
  <style>
    body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #000; display: flex; align-items: center; justify-content: center; }
    canvas { display: block; max-width: 100%; max-height: 100%; aspect-ratio: 16/9; background: #fff; }
  </style>
</head>
<body>
  <canvas id="gameCanvas" width="1280" height="720"></canvas>
  <script>
    const project = ${JSON.stringify(project)};
    console.log("Juego iniciado:", project.name);
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#7046EC";
    ctx.font = "bold 32px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(project.name + " - Listo para jugar", canvas.width / 2, canvas.height / 2);
  </script>
</body>
</html>`;

  zip.file("index.html", htmlTemplate);

  return await zip.generateAsync({ type: "blob" });
}
