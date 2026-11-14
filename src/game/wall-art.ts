import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { districtGraffiti, paintGraffiti } from "./graffiti-catalog";

type ArtKind = "graffiti" | "sticker" | "poster";
type WallArtOptions = { faces?: readonly number[]; motifStart?: number };

/** One reusable district atlas: thirty murals plus a local poster and sticker. */
export function createWallArt() {
  const tileSize = typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches ? 128 : 256;
  const canvas = document.createElement("canvas"); canvas.width = tileSize * 8; canvas.height = tileSize * 4;
  const ctx = canvas.getContext("2d")!;
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  texture.name = "district-wall-art-atlas";
  const material = new THREE.MeshStandardMaterial({ map: texture, alphaTest: .3, roughness: .92,
    metalness: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  material.name = "shared-wall-art";
  let motifs = districtGraffiti("alley"), district = "", disposed = false;
  function setDistrict(id: string) {
    const selected = districtGraffiti(id);
    if (district === selected[0].district || disposed) return;
    motifs = selected; district = selected[0].district;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let tile = 0; tile < 32; tile++) {
      ctx.save(); ctx.translate((tile % 8) * tileSize, Math.floor(tile / 8) * tileSize);
      // Transparent gutters prevent neighbouring designs bleeding into mip levels.
      const inset = tileSize / 32, size = tileSize - inset * 2;
      ctx.translate(inset, inset);
      if (tile < 30) paintGraffiti(ctx, motifs[tile], size, size);
      else {
        ctx.scale(size / 240, size / 240);
        const [dark, paper, accent] = motifs[0].palette;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        if (tile === 30) {
          ctx.fillStyle = paper; ctx.beginPath(); ctx.moveTo(7, 6); ctx.lineTo(230, 12); ctx.lineTo(234, 218);
          for (let x = 234; x > 5; x -= 15) ctx.lineTo(x, 224 + (x % 7));
          ctx.closePath(); ctx.fill(); ctx.fillStyle = dark; ctx.fillRect(20, 30, 200, 8);
          ctx.font = "900 29px sans-serif"; ctx.fillText("KIEZKULTUR", 120, 75, 200);
          ctx.font = "bold 22px sans-serif"; ctx.fillText(motifs[0].phrase, 120, 122, 204);
          ctx.fillStyle = accent; ctx.fillRect(22, 157, 196, 21);
          ctx.fillStyle = dark; ctx.font = "bold 17px sans-serif"; ctx.fillText("420 · NACHTSCHICHT", 120, 202, 200);
        } else {
          ctx.fillStyle = paper; ctx.beginPath(); ctx.arc(120, 120, 108, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = accent; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(120, 120, 94, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = dark; ctx.font = "900 76px sans-serif"; ctx.fillText("420", 120, 108, 176);
          ctx.font = "bold 21px sans-serif"; ctx.fillText(motifs[0].tag, 120, 166, 178);
        }
      }
      ctx.restore();
    }
    texture.userData.district = district; texture.needsUpdate = true;
  }
  setDistrict("alley");
  return {
    material, setDistrict,
    geometry(w: number, d: number, h: number, seed: number, bandHeight = .6, options: WallArtOptions = {}) {
      const parts: THREE.BufferGeometry[] = [], types = new Set<ArtKind>(), graffitiIds: number[] = [];
      const band = Math.min(bandHeight, h - .08);
      if (band < .22) return undefined;
      const faces = options.faces ?? [0, 1, 2, 3];
      for (const side of faces) {
        const cross = side >= 2, length = cross ? d : w;
        if (length < 1.8) continue;
        const clusters = Math.min(32, Math.max(1, Math.floor(length / 3))), bay = length / clusters;
        for (let cluster = 0; cluster < clusters; cluster++) {
          const height = Math.min(1.4, band - .1), ratio = 5 / 3 + .7 + .55;
          const factor = Math.min(1, (bay - .7) / (height * ratio + .22));
          const artHeight = height * factor, gap = .11 * factor;
          const widths = [artHeight * 5 / 3, artHeight * .7, artHeight * .55];
          const total = widths.reduce((sum, width) => sum + width, gap * 2);
          let u = -length / 2 + bay * (cluster + .5) - total / 2;
          // Interleave the three subject families; every thirty consecutive murals are unique.
          const ordinal = ((options.motifStart ?? seed) + graffitiIds.length) % 30;
          const motifTile = (ordinal % 3) * 10 + Math.floor(ordinal / 3);
          graffitiIds.push(motifs[motifTile].id);
          for (let kind = 0; kind < 3; kind++) {
            const tile = kind === 0 ? motifTile : kind === 1 ? 30 : 31;
            const width = widths[kind], height = kind === 2 ? artHeight * .55 : artHeight;
            const plane = new THREE.PlaneGeometry(width, height), uv = plane.getAttribute("uv");
            for (let i = 0; i < uv.count; i++) uv.setXY(i, ((tile % 8) + 1 / 32 + uv.getX(i) * 30 / 32) / 8,
              1 - (Math.floor(tile / 8) + 31 / 32 - uv.getY(i) * 30 / 32) / 4);
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
      geometry.userData.wallArtTypes = [...types]; geometry.userData.graffitiIds = graffitiIds;
      geometry.userData.district = district; return geometry;
    },
    dispose() { if (disposed) return; disposed = true; material.dispose(); texture.dispose(); },
  };
}
