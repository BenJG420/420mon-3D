import * as THREE from "three";
import { MarchingCubes } from "three/addons/objects/MarchingCubes.js";
import type { MonsterModelData } from "./monster-models";
import { addMonsterSurfaceUvs } from "./monster-surface";

/** Rounded continuous source silhouette, with interpolated original colors.
 * Still a reconstruction; this does not invent 372 individually authored anatomies. */
export function buildSmoothMonsterGeometry(data:MonsterModelData) {
  const [w,h]=data.grid,depth=new Float32Array(w*h),rgb=new Float32Array(w*h*3);
  for(const [x,y,d,c]of data.columns){depth[y*w+x]=d;const color=new THREE.Color().setRGB(...data.palette[c].map(v=>v/255) as [number,number,number],THREE.SRGBColorSpace);rgb.set([color.r,color.g,color.b],(y*w+x)*3);}
  const sample=(x:number,y:number)=>{
    let d=0,r=0,g=0,b=0,weight=0;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      const xx=Math.floor(x)+dx,yy=Math.floor(y)+dy;
      if(xx<0||xx>=w||yy<0||yy>=h)continue;
      const factor=Math.exp(-((xx-x)**2+(yy-y)**2)/1.1),i=yy*w+xx;
      d+=depth[i]*factor;

    }
    // Smooth shape independently; bilinear colors retain small original eyes/markings.
    for(let dy=0;dy<=1;dy++)for(let dx=0;dx<=1;dx++){
      const xx=Math.floor(x)+dx,yy=Math.floor(y)+dy;
      if(xx<0||xx>=w||yy<0||yy>=h)continue;
      const i=yy*w+xx,factor=(dx?x-Math.floor(x):1-(x-Math.floor(x)))*(dy?y-Math.floor(y):1-(y-Math.floor(y)));
      if(depth[i]){weight+=factor;r+=rgb[i*3]*factor;g+=rgb[i*3+1]*factor;b+=rgb[i*3+2]*factor;}
    }
    return {d:d/3.4,r:weight?r/weight:0,g:weight?g/weight:0,b:weight?b/weight:0};
  };
  const resolution=36,maxDepth=Math.max(...data.columns.map(c=>c[2]))+2;
  const material=new THREE.MeshBasicMaterial();
  const volume=new MarchingCubes(resolution,material,false,true,24000);volume.isolation=0;
  const palette=volume.palette;
  for(let y=0;y<resolution;y++)for(let x=0;x<resolution;x++){
    const s=sample(x/(resolution-1)*(w+4)-2,y/(resolution-1)*(h+4)-2);
    for(let z=0;z<resolution;z++){
      const i=x+y*resolution+z*resolution*resolution;
      volume.field[i]=s.d-.5-Math.abs((z/(resolution-1)*2-1)*maxDepth);
      palette[i*3]=s.r;palette[i*3+1]=s.g;palette[i*3+2]=s.b;
    }
  }
  volume.update();const count=volume.geometry.drawRange.count;
  if(!count||count>72000){volume.geometry.dispose();material.dispose();throw new Error("Ungültiges glattes Monster-Volumen");}
  const geometry=new THREE.BufferGeometry();
  for(const name of ["position","normal","color"]){const attr=volume.geometry.getAttribute(name);geometry.setAttribute(name,new THREE.Float32BufferAttribute(Array.from(attr.array).slice(0,count*3),3));}
  geometry.scale((w+4)*data.cellSize/2,(h+4)*data.cellSize/2,maxDepth*data.cellSize);
  geometry.translate(0,h*data.cellSize/2-.8,0);geometry.normalizeNormals();
  geometry.computeBoundingBox();geometry.computeBoundingSphere();
  geometry.userData={speciesId:data.id,sourceSprite:data.sourceSprite,sourceHash:data.sourceHash,mode:"smooth-source-volume"};
  volume.geometry.dispose();material.dispose();
  return addMonsterSurfaceUvs(geometry);
}
