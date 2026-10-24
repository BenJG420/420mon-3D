import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const seeded = (i: number) => { const n = Math.sin(i * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };
type ArtKind = "graffiti" | "sticker" | "poster";

/** One locally painted atlas for the world's lifetime, shared by all wall batches. */
export function createWallArt() {
  const canvas = document.createElement("canvas"); canvas.width = 1024; canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  for (let tile = 0; tile < 8; tile++) {
    ctx.save(); ctx.translate((tile % 4) * 256, Math.floor(tile / 4) * 256);
    ctx.beginPath(); ctx.rect(8, 8, 240, 240); ctx.clip();
    if (tile < 3) {
      const color = ["#b4c38f", "#d4a26c", "#86acb5"][tile];
      ctx.translate(128, 126); ctx.rotate(-.065 + tile * .045);
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = "italic 900 154px cursive"; ctx.lineJoin = "round";
      ctx.lineWidth = 9; ctx.strokeStyle = "#263b39";
      ctx.strokeText(["420", "KIEZ", "GROW"][tile], 0, 0, 224);
      ctx.fillStyle = color; ctx.fillText(["420", "KIEZ", "GROW"][tile], 0, 0, 224);
      ctx.strokeStyle = color; ctx.lineWidth = 7; ctx.beginPath();
      ctx.moveTo(-105, 76); ctx.quadraticCurveTo(-20, 94, 106, 59); ctx.stroke();
      ctx.lineWidth = 2;
      for (let drip = 0; drip < 8; drip++) {
        const x = -100 + seeded(tile * 21 + drip) * 200;
        ctx.beginPath(); ctx.moveTo(x, 64); ctx.lineTo(x + 1, 78 + seeded(drip + 43) * 23); ctx.stroke();
      }
      for (let spot = 0; spot < 40; spot++) {
        ctx.globalAlpha = .35 + seeded(spot + 8) * .5;
        ctx.fillRect(-112 + seeded(spot * 7 + tile) * 224, -105 + seeded(spot * 3 + tile) * 210, 1.6, 1.6);
      }
    } else if (tile < 5) {
      ctx.fillStyle = tile === 3 ? "#d8c896" : "#acc7b5";
      ctx.beginPath(); ctx.arc(128, 128, 105, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#2c443d"; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.arc(128, 128, 92, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = "#2c443d"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = "900 74px sans-serif"; ctx.fillText(tile === 3 ? "420" : "♥", 128, 113, 170);
      ctx.font = "bold 25px sans-serif"; ctx.fillText(tile === 3 ? "KIEZ" : "BLEIBT", 128, 174, 170);
    } else {
      ctx.fillStyle = ["#c8bea2", "#aebfb3", "#cab18f"][tile - 5];
      ctx.beginPath(); ctx.moveTo(16, 12); ctx.lineTo(237, 17); ctx.lineTo(243, 224);
      for (let x = 237; x > 12; x -= 13) ctx.lineTo(x, 231 + seeded(x + tile) * 12);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#33463e"; ctx.fillRect(28, 32, 200, 9);
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = "900 37px sans-serif";
      const words = [["NACHT", "SCHICHT"], ["KEIN", "SIGNAL"], ["KIEZ", "BLEIBT"]][tile - 5];
      ctx.fillText(words[0], 128, 84, 198); ctx.fillText(words[1], 128, 128, 198);
      ctx.font = "bold 19px sans-serif"; ctx.fillText("420 · HINTERHOF", 128, 174, 196);
      for (let line = 0; line < 3; line++) ctx.fillRect(38, 197 + line * 7, 181 - line * 17, 2);
      ctx.globalAlpha = .2; ctx.fillStyle = "#ece2c1";
      ctx.fillRect(17, 10, 43, 24); ctx.fillRect(193, 13, 43, 24);
    }
    ctx.restore();
  }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  texture.name = "district-wall-art-atlas";
  const material = new THREE.MeshStandardMaterial({ map: texture, alphaTest: .3, roughness: .92,
    metalness: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  material.name = "shared-wall-art";
  let disposed = false;
  return {
    material,
    geometry(w: number, d: number, h: number, seed: number, bandHeight = .6) {
      const parts: THREE.BufferGeometry[] = [], types = new Set<ArtKind>();
      const band = Math.min(bandHeight, h - .08);
      if (band < .22) return undefined;
      for (let side = 0; side < 4; side++) {
        const cross = side >= 2, length = cross ? d : w;
        if (length < 1.8) continue;
        const clusters = Math.min(2, Math.max(1, Math.floor(length / 5))), bay = length / clusters;
        for (let cluster = 0; cluster < clusters; cluster++) {
          const height = Math.min(.95, band - .1);
          const factor = Math.min(1, (bay - .7) / (height * 3.65 + .22));
          const artHeight = height * factor, gap = .11 * factor;
          const widths = [artHeight * 2.4, artHeight * .7, artHeight * .55];
          const total = widths.reduce((sum, width) => sum + width, gap * 2);
          let u = -length / 2 + bay * (cluster + .5) - total / 2;
          for (let kind = 0; kind < 3; kind++) {
            const tile = kind === 0 ? Math.floor(seeded(seed * 19 + side * 7 + cluster) * 3)
              : kind === 1 ? 5 + (seed + side + cluster) % 3 : 3 + (seed + side + cluster) % 2;
            const width = widths[kind], height = kind === 2 ? artHeight * .55 : artHeight;
            const plane = new THREE.PlaneGeometry(width, height), uv = plane.getAttribute("uv");
            for (let i = 0; i < uv.count; i++) uv.setXY(i, ((tile % 4) * 256 + 8 + uv.getX(i) * 240) / 1024,
              1 - (Math.floor(tile / 4) * 256 + 248 - uv.getY(i) * 240) / 512);
            const along = u + width / 2, y = .08 + height / 2;
            plane.rotateY(side === 0 ? 0 : side === 1 ? Math.PI : side === 2 ? Math.PI / 2 : -Math.PI / 2);
            plane.translate(cross ? (side === 2 ? 1 : -1) * (w / 2 + .09) : along, y,
              cross ? along : (side === 0 ? 1 : -1) * (d / 2 + .09));
            parts.push(plane); types.add(kind === 0 ? "graffiti" : kind === 1 ? "poster" : "sticker");
            u += width + gap;
          }
        }
      }
      if (!parts.length) return undefined;
      const geometry = mergeGeometries(parts, false)!; for (const part of parts) part.dispose();
      geometry.userData.wallArtTypes = [...types]; return geometry;
    },
    dispose() { if (disposed) return; disposed = true; material.dispose(); texture.dispose(); },
  };
}
