import * as THREE from "three";

/** Owned, deterministic PBR tiles; no sprite pixels or external texture downloads. */
export function createMonsterSurface(size = 512) {
  const normal = new Uint8Array(size * size * 4), rough = new Uint8Array(size * size * 4);
  const noise = (x: number, y: number) => {
    const a = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return a - Math.floor(a);
  };
  for (let y=0;y<size;y++) for(let x=0;x<size;x++) {
    const i=(y*size+x)*4, grain=noise(x,y);
    normal.set([Math.round(128+(noise((x+1)%size,y)-grain)*17),Math.round(128+(noise(x,(y+1)%size)-grain)*17),255,255],i);
    const value=Math.round(185+grain*38);rough.set([value,value,value,255],i);
  }
  const texture=(data:Uint8Array)=>{const t=new THREE.DataTexture(data,size,size);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;};
  const normalMap=texture(normal),roughnessMap=texture(rough);
  const material=new THREE.MeshStandardMaterial({vertexColors:true,flatShading:false,roughness:.88,metalness:.08,normalMap,roughnessMap,normalScale:new THREE.Vector2(.38,.38)});
  material.name="original-monster-pbr";
  const metal=material.clone();metal.name="monster-oxidized-metal";metal.metalness=.62;metal.roughness=.55;
  const wet=material.clone();wet.name="monster-wet-skin";wet.metalness=.03;wet.roughness=.48;wet.normalScale.setScalar(.2);
  return {material,metal,wet,normalMap,roughnessMap,dispose(){material.dispose();metal.dispose();wet.dispose();normalMap.dispose();roughnessMap.dispose();}};
}

/** Per-triangle dominant-axis UVs avoid stretching on eyes, plates and membranes. */
export function addMonsterSurfaceUvs(geometry:THREE.BufferGeometry) {
  const p=geometry.getAttribute("position"),n=geometry.getAttribute("normal");
  const uv=new Float32Array(p.count*2);
  for(let start=0;start<p.count;start+=3){
    const normal=new THREE.Vector3();for(let k=0;k<3;k++)normal.add(new THREE.Vector3(n.getX(start+k),n.getY(start+k),n.getZ(start+k)));
    const axis=Math.abs(normal.x)>Math.abs(normal.y)&&Math.abs(normal.x)>Math.abs(normal.z)?0:Math.abs(normal.y)>Math.abs(normal.z)?1:2;
    for(let k=0;k<3;k++){const i=start+k;uv[i*2]=(axis===0?p.getZ(i):p.getX(i))*2;uv[i*2+1]=(axis===1?p.getZ(i):p.getY(i))*2;}
  }
  geometry.setAttribute("uv",new THREE.BufferAttribute(uv,2));
  geometry.userData.surface="smooth-pbr";
  return geometry;
}
