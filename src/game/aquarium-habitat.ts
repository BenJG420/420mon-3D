import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

/** All geometry is authored here; no fetched assets, lights or gameplay state. */
export function createAquariumHabitat(options: { compact?: boolean; immersive?: boolean } = {}) {
  const compact = options.compact === true;
  const immersive = options.immersive === true && !compact;
  const root = new THREE.Group(); root.name = "aquarium-habitat";
  root.userData.compact = compact;
  root.userData.immersive = immersive;
  root.userData.waterline = 3.9;
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  const instances = new Set<THREE.InstancedMesh>();
  const time = { value: 0 };
  let disposed = false;
  const random = (i: number) => { const n = Math.sin(i * 73.156 + 8.973) * 34781.239; return n - Math.floor(n); };
  const dummy = new THREE.Object3D(), tint = new THREE.Color();
  const own = <T extends THREE.Material>(material: T) => { materials.add(material); return material; };
  function add(shape: THREE.BufferGeometry, material: THREE.Material, name: string) {
    geometries.add(shape);
    const object = new THREE.Mesh(shape, material); object.name = name;
    object.castShadow = object.receiveShadow = false; root.add(object); return object;
  }
  function batch(shape: THREE.BufferGeometry, material: THREE.Material, count: number, name: string) {
    geometries.add(shape);
    const object = new THREE.InstancedMesh(shape, material, count); object.name = name;
    object.castShadow = object.receiveShadow = false; root.add(object); instances.add(object); return object;
  }
  function merge(parts: THREE.BufferGeometry[]) {
    const merged = mergeGeometries(parts, false)!; parts.forEach(part => part.dispose()); return merged;
  }
  function box(w: number, h: number, d: number, x: number, y: number, z: number) {
    const shape = new THREE.BoxGeometry(w, h, d); shape.translate(x, y, z); return shape;
  }
  function stoneTexture() {
    const width = 128, data = new Uint8Array(width * width * 4);
    for (let y = 0; y < width; y++) for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const grain = Math.floor(126 + random(x + y * width) * 100 + Math.sin(x * .34 + y * .17) * 15);
      data[i] = data[i + 1] = data[i + 2] = grain; data[i + 3] = 255;
    }
    const texture = new THREE.DataTexture(data, width, width, THREE.RGBAFormat);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(7, 3);
    texture.magFilter = THREE.LinearFilter; texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.generateMipmaps = true; texture.needsUpdate = true; textures.add(texture); return texture;
  }
  const grain = stoneTexture();
  // Two gently moving intersecting wave fields approximate focused surface light,
  // with a depth falloff. This adds light to existing surfaces, not another pass.
  function underwater(material: THREE.MeshStandardMaterial, sway = false) {
    const previous = material.onBeforeCompile;
    material.onBeforeCompile = (shader, renderer) => {
      previous.call(material, shader, renderer);
      shader.uniforms.aquariumTime = time;
      shader.vertexShader = `uniform float aquariumTime; varying vec3 aquariumPoint; ${immersive && sway ? "varying vec2 aquariumLeafUv;" : ""}\n${shader.vertexShader}`;
      shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>
        ${sway ? "float swayHeight = max(position.y, 0.0); transformed.x += sin(aquariumTime * .85 + position.y * 1.8 + position.z * 4.0) * swayHeight * swayHeight * .035; transformed.z += sin(aquariumTime * .62 + position.y * 2.1) * swayHeight * .018;" : ""}
        ${immersive && sway ? "aquariumLeafUv = uv;" : ""}
        vec4 aquariumLocal = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          aquariumLocal = instanceMatrix * aquariumLocal;
        #endif
        aquariumPoint = (modelMatrix * aquariumLocal).xyz;
      `);
      shader.fragmentShader = `uniform float aquariumTime; varying vec3 aquariumPoint; ${immersive && sway ? "varying vec2 aquariumLeafUv;" : ""}\n${shader.fragmentShader}`;
      shader.fragmentShader = shader.fragmentShader.replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
        vec2 aq = aquariumPoint.xz * 3.1 + aquariumPoint.y * .23;
        float a = sin(aq.x + aquariumTime * .41 + sin(aq.y * 1.22 - aquariumTime * .3));
        float b = sin(aq.y * 1.4 - aquariumTime * .34 + sin(aq.x * .87 + aquariumTime * .23));
        float caustic = pow(max(0.0, 1.0 - abs(a + b) * .72), 12.0);
        totalEmissiveRadiance += vec3(.16, .28, .23) * caustic * (.4 + .6 * max(normal.y, 0.0)) * ${immersive ? "1.85" : "1.0"};
      `);
      if (immersive && sway) shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>", `#include <color_fragment>
        float midrib = exp(-abs(aquariumLeafUv.x - .5) * 52.0);
        float veins = pow(max(0.0, cos(aquariumLeafUv.y * 67.0 - abs(aquariumLeafUv.x - .5) * 16.0)), 16.0);
        float margin = smoothstep(.25, .5, abs(aquariumLeafUv.x - .5));
        diffuseColor.rgb *= 1.0 + midrib * .26 + veins * .10 - margin * .15;
      `);
    };
    material.customProgramCacheKey = () => `aquarium-caustic-${immersive ? "v75-close" : "v74"}-${sway ? "sway" : "still"}`;
    return material;
  }
  const sand = own(underwater(new THREE.MeshStandardMaterial({ color: 0xb7a77d, roughness: .93, bumpMap: grain, bumpScale: .035, roughnessMap: grain })));
  const rock = own(underwater(new THREE.MeshStandardMaterial({ color: 0x697775, roughness: .84, bumpMap: grain, bumpScale: .11 })));
  const wood = own(underwater(new THREE.MeshStandardMaterial({ color: 0x65533b, roughness: .79, bumpMap: grain, bumpScale: .06 })));
  const metal = own(new THREE.MeshStandardMaterial({ color: 0x253939, roughness: .3, metalness: .65 }));
  const seal = own(new THREE.MeshStandardMaterial({ color: 0x142622, roughness: .5 }));
  const glow = own(new THREE.MeshBasicMaterial({ color: 0xc6f8ee, toneMapped: false }));

  const bed = new THREE.PlaneGeometry(9.94, 3.94, 48, 20); bed.rotateX(-Math.PI / 2);
  const position = bed.getAttribute("position");
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i), z = position.getZ(i);
    position.setY(i, .085 + .06 * Math.sin(x * .9 + z * 1.1) + .04 * (2 - z));
  }
  bed.computeVertexNormals(); add(bed, sand, "aquarium-sand-bed");
  add(box(10.1, .16, 4.1, 0, -.08, 0), metal, "aquarium-base");
  const back = own(underwater(new THREE.MeshStandardMaterial({ color: immersive ? 0x0d292c : 0x173936, roughness: .91, bumpMap: grain, bumpScale: .12 })));
  add(box(10, 4, .06, 0, 2, -2.04), back, "aquarium-depth-backdrop");

  const gravel = batch(new THREE.IcosahedronGeometry(1, 1), sand, compact ? 100 : immersive ? 620 : 380, "aquarium-gravel");
  for (let i = 0; i < gravel.count; i++) {
    const x = random(i + 10) * 9.65 - 4.825, z = random(i + 510) * 3.65 - 1.825;
    const size = .025 + random(i + 1010) * .055;
    dummy.position.set(x, .12 + .06 * Math.sin(x * .9 + z * 1.1) + .04 * (2 - z), z);
    dummy.rotation.set(random(i + 1510), random(i + 2010) * 6, random(i + 2510)); dummy.scale.set(size * 1.5, size * .62, size);
    dummy.updateMatrix(); gravel.setMatrixAt(i, dummy.matrix);
    tint.setHSL(.1 + random(i + 3010) * .06, .12 + random(i + 3510) * .16, .35 + random(i + 4010) * .35); gravel.setColorAt(i, tint);
  }
  gravel.computeBoundingSphere();
  const rockShape = immersive ? new THREE.SphereGeometry(1, 24, 16) : new THREE.IcosahedronGeometry(1, 2), rockPos = rockShape.getAttribute("position");
  for (let i = 0; i < rockPos.count; i++) {
    const x = rockPos.getX(i), y = rockPos.getY(i), z = rockPos.getZ(i);
    const f = .93 + .1 * Math.sin(x * 7 + z * 4) * Math.cos(y * 6 - x * 2);
    rockPos.setXYZ(i, x * f, y * f, z * f);
  }
  rockShape.computeVertexNormals();
  const rocks = batch(rockShape, rock, 11, "aquarium-rock-grotto");
  // A low cave on the left leaves the central and upper swimming corridor clear.
  const rockPositions = [[-3.8,.38,-.75,.62,.42,.62],[-2.55,.38,-1.1,.6,.42,.55],[-3.17,.93,-1.08,1.03,.28,.58],[-4.3,.28,.45,.46,.3,.45],[-2.05,.23,-1.52,.47,.26,.32],[3.1,.31,-1.15,.75,.32,.53],[4.05,.53,-1.25,.6,.56,.5],[3.7,.21,.1,.34,.23,.43],[1.95,.22,-1.6,.44,.25,.32],[-1.1,.18,-1.65,.25,.2,.28],[4.5,.19,.9,.28,.2,.25]];
  rockPositions.forEach(([x,y,z,sx,sy,sz],i) => {
    dummy.position.set(x,y,z); dummy.rotation.set(.1 * i,.4 * i,.06 * i); dummy.scale.set(sx,sy,sz); dummy.updateMatrix(); rocks.setMatrixAt(i,dummy.matrix);
    tint.setHSL(.39 + random(i + 50) * .12, .08, .48 + random(i + 90) * .18); rocks.setColorAt(i,tint);
  }); rocks.computeBoundingSphere();

  const branches: THREE.BufferGeometry[] = [];
  const branchPaths = [ [[1.8,.3,-1.1],[2.15,.55,-1.25],[2.5,1.2,-1.45],[3.6,1.42,-1.6]], [[2.15,.5,-1.2],[1.6,.9,-1.4],[.7,1.2,-1.65]], [[2.4,1.05,-1.4],[2.7,1.8,-1.65],[3.15,2.1,-1.75]], [[3.5,1.4,-1.6],[4,1.8,-1.7],[4.3,1.84,-1.8]] ];
  branchPaths.forEach((path, i) => {
    const curve = new THREE.CatmullRomCurve3(path.map(p => new THREE.Vector3(...p as [number,number,number])));
    const shape = new THREE.TubeGeometry(curve, 16, i === 0 ? .11 : .065, 7, false), attr = shape.getAttribute("position");
    // Taper terminal rings so the branches read as roots, not plumbing.
    for (let v = 0; v < attr.count; v++) {
      const t = Math.floor(v / 8) / 16, center = curve.getPointAt(t), taper = 1 - t * .83;
      attr.setXYZ(v, center.x + (attr.getX(v)-center.x)*taper, center.y + (attr.getY(v)-center.y)*taper, center.z + (attr.getZ(v)-center.z)*taper);
    }
    shape.computeVertexNormals(); branches.push(shape);
  });
  add(merge(branches), wood, "aquarium-driftwood");

  function blade(wide: boolean) {
    const positions: number[] = [], uv: number[] = [], indices: number[] = [];
    const steps = immersive ? 20 : 12;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps, width = (wide ? .18 : .065) * Math.sin(Math.PI * Math.pow(t,.68)) + .003;
      for (const side of [-1,0,1]) {
        positions.push(side * width + Math.sin(t * 2.1) * .12, t, t*t * .18 + (side === 0 ? -.035 * Math.sin(t * Math.PI) : 0)); uv.push((side+1)/2,t);
      }
      if (i < steps) for (let j=0;j<2;j++) { const a = i*3+j; indices.push(a,a+1,a+3,a+1,a+4,a+3); }
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position",new THREE.Float32BufferAttribute(positions,3)); geo.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2)); geo.setIndex(indices); geo.computeVertexNormals(); return geo;
  }
  const plantMaterial = own(underwater(new THREE.MeshStandardMaterial({ color:0x6c9c45, roughness:.62, side:THREE.DoubleSide }),true));
  const broadMaterial = own(underwater(new THREE.MeshStandardMaterial({ color:0x397746, roughness:.54, side:THREE.DoubleSide }),true));
  for (const broad of [false,true]) {
    const plants = batch(blade(broad), broad ? broadMaterial : plantMaterial, compact ? (broad?18:36) : immersive ? (broad?64:140) : (broad?40:92), broad ? "aquarium-broad-leaves" : "aquarium-ribbon-plants");
    for (let i=0;i<plants.count;i++) {
      const cluster = i%9, side = cluster<5 ? -1 : 1;
      const x = cluster<7 ? -4.2+cluster*1.32 + (random(i+191)-.5)*.55 : side*4.2;
      const z = cluster<7 ? -1.43+random(i+297)*.18 : -.6+random(i+611)*1.5;
      dummy.position.set(x,.18,z); dummy.rotation.set((random(i+807)-.5)*.12,random(i+91)*Math.PI*2,(random(i+577)-.5)*.12);
      const height = broad ? .45+random(i+991)*.75 : .9+random(i+677)*1.9;
      dummy.scale.set(1,height,1); dummy.updateMatrix(); plants.setMatrixAt(i,dummy.matrix);
      tint.setHSL(.24+random(i+477)*.12,.35+random(i+172)*.2,.48+random(i+81)*.22); plants.setColorAt(i,tint);
    }
    plants.computeBoundingSphere(); if(plants.boundingSphere)plants.boundingSphere.radius+=.4;
  }

  const frameParts: THREE.BufferGeometry[] = [], seams: THREE.BufferGeometry[] = [];
  for(const y of [-.03,4.04]) {
    for(const z of [-2.06,2.06]) frameParts.push(box(10.12,.1,.075,0,y,z));
    for(const x of [-5.03,5.03]) frameParts.push(box(.075,.1,4.18,x,y,0));
  }
  for(const x of [-5,5])for(const z of [-2,2])seams.push(box(.027,4,.027,x,2,z));
  add(merge(frameParts),metal,"aquarium-rim"); add(merge(seams),seal,"aquarium-silicone-seams");
  add(box(8.7,.045,.12,0,4.07,-.25),glow,"aquarium-overhead-light-strip");
  const glassMaterial = own(new THREE.MeshPhysicalMaterial(compact ? {
    color:0xb3d8d0,roughness:.08,metalness:.05,transparent:true,opacity:.075,depthWrite:false,
  } : {
    color:0xf0fffb,roughness:.035,metalness:0,transmission:1,thickness:.055,ior:1.5,depthWrite:false,
    attenuationColor: new THREE.Color(0xa2d9cb),attenuationDistance:12,envMapIntensity:.85,
  }));
  const glass = add(merge([box(10,4,.035,0,2,2.025),box(.035,4,4,-5.025,2,0),box(.035,4,4,5.025,2,0)]),glassMaterial,"aquarium-glass");
  glass.renderOrder = 8; glass.userData.refraction = !compact;

  const surfaceMaterial = own(new THREE.ShaderMaterial({
    uniforms:{aquariumTime:time},transparent:true,depthWrite:false,side:THREE.DoubleSide,
    vertexShader:`varying vec2 vUv; uniform float aquariumTime;
      void main(){vUv=uv; vec3 p=position; p.y+=sin(p.x*2.3+aquariumTime*.73)*.008+sin(p.z*3.4-aquariumTime*.9)*.006; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}`,
    fragmentShader:`varying vec2 vUv; uniform float aquariumTime;
      void main(){float wave=pow(max(0.0,sin(vUv.x*72.0+sin(vUv.y*34.0+aquariumTime*.7)+aquariumTime*.45)),18.0);
      float edge=pow(abs(vUv.y*2.0-1.0),12.0); gl_FragColor=vec4(vec3(.27,.62,.58)+wave*.28,.06+wave*.13+edge*.1);}`,
  }));
  const surface = new THREE.PlaneGeometry(9.94,3.94,40,16);surface.rotateX(-Math.PI/2);surface.translate(0,3.9,0);
  add(surface,surfaceMaterial,"aquarium-water-surface").renderOrder=9;
  const waterlineMaterial=own(new THREE.MeshBasicMaterial({color:0x9ddbd2,transparent:true,opacity:.28,depthWrite:false}));
  const waterline=add(merge([box(9.96,.018,.016,0,3.9,2.005),box(.016,.018,3.96,-5.005,3.9,0),box(.016,.018,3.96,5.005,3.9,0)]),waterlineMaterial,"aquarium-water-meniscus");waterline.renderOrder=10;
  // The filter and air hose are static, behind the swimming corridor.
  const filterParts=[box(.24,1.1,.18,4.55,2.86,-1.84),box(.38,.12,.26,4.55,3.46,-1.8)];
  for(let i=0;i<8;i++)filterParts.push(box(.28,.025,.2,4.55,2.38+i*.1,-1.83));
  add(merge(filterParts),seal,"aquarium-filter");
  const hoseCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(-4.3,3.95,-1.85),new THREE.Vector3(-4.45,2.4,-1.84),new THREE.Vector3(-4.1,.3,-1.5),new THREE.Vector3(-3.8,.2,-1.25)]);
  add(new THREE.TubeGeometry(hoseCurve,24,.022,6,false),seal,"aquarium-air-hose");
  const diffuser=add(new THREE.CylinderGeometry(.16,.16,.07,12),rock,"aquarium-air-stone");diffuser.position.set(-3.8,.22,-1.25);

  const bubbleMaterial=own(new THREE.MeshPhysicalMaterial({color:0xbdece6,roughness:.08,metalness:.15,transparent:true,opacity:.28,depthWrite:false,clearcoat:1}));
  const bubbles=batch(new THREE.SphereGeometry(1,8,6),bubbleMaterial,compact?14:immersive?54:36,"aquarium-air-bubbles");
  bubbles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);bubbles.renderOrder=11;
  // A fixed local sphere includes every animated position, avoiding per-frame bounds work.
  bubbles.boundingSphere=new THREE.Sphere(new THREE.Vector3(immersive ? -1.5 : -3.8,2,-1.25),immersive ? 4.6 : 2.2);
  const bubbleSeeds=Array.from({length:bubbles.count},(_,i)=>({phase:random(i+718),speed:.36+random(i+577)*.3,size:.018+random(i+922)*.027}));
  const moteMaterial=own(new THREE.MeshBasicMaterial({color:0xb9ddd0,transparent:true,opacity:.14,depthWrite:false}));
  const motes=batch(new THREE.IcosahedronGeometry(1,0),moteMaterial,compact?16:immersive?76:48,"aquarium-suspended-motes");
  motes.instanceMatrix.setUsage(THREE.DynamicDrawUsage);motes.renderOrder=11;
  motes.boundingSphere=new THREE.Sphere(new THREE.Vector3(0,2,0),5.8);
  const moteSeeds=Array.from({length:motes.count},(_,i)=>({x:random(i+871)*9.3-4.65,y:random(i+419)*3.6,z:random(i+211)*3.5-1.75,size:.006+random(i+927)*.007}));
  if (immersive) {
    // Dark irregular rear strata contrast with the bright fish, rather than a flat wall.
    // Rear relief and branching plants leave the open middle corridor clear; foreground plants stay low.
    const rearDiffuser=add(new THREE.CylinderGeometry(.12,.14,.07,12),rock,"aquarium-rear-air-stone");
    rearDiffuser.position.set(.85,.22,-1.25);
    const relief = batch(rockShape, rock, 25, "aquarium-rear-rock-relief");
    for (let i = 0; i < relief.count; i++) {
      const column = i % 9, row = Math.floor(i / 9);
      const x = -4.2 + column * 1.04 + (random(i + 617)-.5)*.24;
      const y = .28 + row * .66 + random(i + 172)*.17;
      dummy.position.set(x,y,-1.70);
      dummy.rotation.set(0,random(i+317)*.1,.2*(random(i+321)-.5));
      dummy.scale.set(.49+random(i+812)*.22,.30+random(i+521)*.12,.13+random(i+511)*.07);
      dummy.updateMatrix(); relief.setMatrixAt(i,dummy.matrix);
      tint.setHSL(.39,.11,.30+random(i+123)*.15); relief.setColorAt(i,tint);
    }
    relief.computeBoundingSphere();

    const riverStones = batch(rockShape, rock, 34, "aquarium-foreground-river-stones");
    for (let i = 0; i < riverStones.count; i++) {
      const size = .07+random(i+117)*.14;
      dummy.position.set(-4.5+random(i+313)*9,.10+size*.35,1.48+random(i+876)*.28);
      dummy.rotation.set(.15,random(i+667)*6,.1); dummy.scale.set(size*1.3,size*.58,size);
      dummy.updateMatrix(); riverStones.setMatrixAt(i,dummy.matrix);
      tint.setHSL(.11+random(i+266)*.09,.12,.56+random(i+292)*.20); riverStones.setColorAt(i,tint);
    }
    riverStones.computeBoundingSphere();

    const carpet = batch(blade(true), broadMaterial, 78, "aquarium-foreground-rosettes");
    for(let i=0;i<carpet.count;i++) {
      const clump=i%13, angle=i*.93, height=.22+random(i+541)*.33;
      // Two low planted banks frame a clear central sand entrance.
      const x=clump<6 ? -4.18+clump*.43 : 1.48+(clump-6)*.44;
      dummy.position.set(x+Math.cos(angle)*.045,.12,1.57+Math.sin(angle)*.06);
      dummy.rotation.set(.18,angle,.08);dummy.scale.set(.85,height,.85);dummy.updateMatrix();carpet.setMatrixAt(i,dummy.matrix);
      tint.setHSL(.23+random(i+871)*.08,.42,.58+random(i+482)*.12);carpet.setColorAt(i,tint);
    }
    carpet.computeBoundingSphere(); if(carpet.boundingSphere)carpet.boundingSphere.radius+=.08;

    // Branching stalks give the rear planting a second leaf silhouette and volume.
    const stems: THREE.BufferGeometry[] = [], leaves: THREE.BufferGeometry[] = [];
    for(let i=0;i<7;i++) {
      const x=-3.8+i*1.22, z=-1.35+(i%2)*.12, height=1.25+random(i+108)*1.35;
      const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(x,.18,z),new THREE.Vector3(x+.05,height*.55,z+.02),new THREE.Vector3(x-.06,height,z)]);
      stems.push(new THREE.TubeGeometry(curve,12,.012,5,false));
      for(let row=0;row<5;row++)for(const sign of [-1,1]) {
        const leaf=blade(true), scale=.28+(1-row/6)*.20;
        leaf.scale(.85,scale,.85);leaf.rotateZ(sign*(.67+row*.06));leaf.rotateY(i*.71+sign*.38);
        leaf.translate(x,.3+row*height/5,z);leaves.push(leaf);
      }
    }
    for (const [parts,name] of [[stems,"aquarium-branched-stems"],[leaves,"aquarium-branched-leaves"]] as const) {
      const geometry=merge(parts);geometry.computeBoundingSphere();geometry.boundingSphere!.radius+=.3;
      add(geometry,broadMaterial,name);
    }

    // Three soft cones are one translucent draw: a bounded volumetric-light cue,
    // not additional lights, shadow maps or full-screen postprocessing.
    const rays: THREE.BufferGeometry[]=[];
    for(const [x,tilt,width] of [[-2.8,.20,.7],[.2,-.11,.56],[2.65,-.18,.82]]) {
      const ray=new THREE.CylinderGeometry(.12,width,3.5,24,1,true);
      ray.translate(0,-1.75,0);ray.rotateZ(tilt);ray.translate(x,3.86,-.95);rays.push(ray);
    }
    const rayMaterial=own(new THREE.ShaderMaterial({
      uniforms:{aquariumTime:time},transparent:true,depthWrite:false,side:THREE.DoubleSide,
      blending:THREE.AdditiveBlending,
      vertexShader:`varying vec2 beamUv; varying vec3 beamNormal; varying vec3 beamView;
        void main(){beamUv=uv;vec4 p=modelViewMatrix*vec4(position,1.0);beamNormal=normalize(normalMatrix*normal);beamView=normalize(-p.xyz);gl_Position=projectionMatrix*p;}`,
      fragmentShader:`uniform float aquariumTime;varying vec2 beamUv;varying vec3 beamNormal;varying vec3 beamView;
        void main(){float edge=pow(abs(dot(normalize(beamNormal),normalize(beamView))),2.0);
        float ends=smoothstep(0.0,.18,beamUv.y)*(1.0-smoothstep(.92,1.0,beamUv.y));
        float flow=.72+.28*sin(beamUv.x*21.0+aquariumTime*.45+sin(beamUv.y*9.0-aquariumTime*.23));
        gl_FragColor=vec4(.31,.55,.43,edge*ends*flow*.052);}`,
    }));
    const shafts=add(merge(rays),rayMaterial,"aquarium-light-shafts");shafts.renderOrder=7;
  }
  root.userData.maxBubbles=bubbles.count;root.userData.gravelCount=gravel.count;
  function update(seconds:number){
    if(disposed)return;
    time.value=Number.isFinite(seconds)?seconds:0;
    const t=time.value;
    dummy.rotation.set(0,0,0);
    for(let i=0;i<bubbles.count;i++){
      const seed=bubbleSeeds[i],y=.25+((t*seed.speed+seed.phase*3.6)%3.6+3.6)%3.6;
      const spread=(y-.25)*.04;
      const sourceX = immersive && i%3===0 ? .85 : -3.8;
      dummy.position.set(sourceX+Math.sin(t*1.6+i*2.7)*(.035+spread),y,-1.25+Math.cos(t*1.2+i*1.8)*(.025+spread*.5));
      dummy.scale.setScalar(seed.size*(1+y*.12));dummy.updateMatrix();bubbles.setMatrixAt(i,dummy.matrix);
    }bubbles.instanceMatrix.needsUpdate=true;
    for(let i=0;i<motes.count;i++){
      const seed=moteSeeds[i];dummy.position.set(seed.x+Math.sin(t*.19+i)*.12,.25+((seed.y+t*.024)%3.5+3.5)%3.5,seed.z+Math.cos(t*.15+i)*.08);
      dummy.scale.setScalar(seed.size);dummy.updateMatrix();motes.setMatrixAt(i,dummy.matrix);
    }motes.instanceMatrix.needsUpdate=true;
  }
  function dispose(){
    if(disposed)return;disposed=true;root.removeFromParent();root.clear();
    instances.forEach(object=>object.dispose());geometries.forEach(value=>value.dispose());materials.forEach(value=>value.dispose());textures.forEach(value=>value.dispose());
    instances.clear();geometries.clear();materials.clear();textures.clear();
  }
  update(0);
  return {root,update,dispose};
}
