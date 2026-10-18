import type * as THREE from "three";
import { Sculpt } from "./model-sculpt";

type P = [number,number,number];
const ball=(s:Sculpt,c:string,p:P,r:P)=>s.ellipsoid(c,...p,...r);
const line=(s:Sculpt,c:string,a:P,b:P,r=.025)=>s.rod(c,a,b,r);
function eye(s:Sculpt,x:number,y:number,z:number,iris:string,size=.065){
  ball(s,'#231c1d',[x,y,z],[size*1.3,size,.035]);
  ball(s,'#e8d9a0',[x,y,z+.025],[size,size*.68,.024]);
  ball(s,iris,[x,y,z+.045],[size*.45,size*.6,.015]);
  ball(s,'#0e1214',[x,y,z+.057],[size*.16,size*.5,.01]);
  ball(s,'#fff3cf',[x-.012,y+.015,z+.066],[.01,.012,.008]);
}

/** #49: upright orange trader fox, pointed muzzle, gold neck rings, torn purple mantle. */
function hawkerfox(){
 const s=new Sculpt(),fur='#bd6529',light='#e5a54b',cream='#e9c591',cape='#65516c',gold='#dcae42';
 ball(s,fur,[0,.58,0],[.29,.45,.23]);ball(s,light,[0,.65,.19],[.18,.3,.065]);
 for(const a of [-1,1]){
  line(s,fur,[a*.16,.36,0],[a*.17,.11,.03],.09);ball(s,fur,[a*.18,.08,.12],[.115,.07,.16]);
  for(let i=0;i<3;i++)line(s,'#81502b',[a*.18+(i-1)*.04,.08,.23],[a*.18+(i-1)*.04,.06,.26],.012);
  line(s,fur,[a*.24,.88,0],[a*.34,.53,.08],.07);ball(s,light,[a*.34,.48,.11],[.07,.09,.07]);
  s.panel(cape,[[a*.1,.99,-.2],[a*.36,.91,-.22],[a*.48,.43,-.24],[a*.31,.51,-.26],[a*.35,.32,-.26],[a*.12,.49,-.28]],.035);
  for(let i=0;i<3;i++)line(s,'#a17c83',[a*(.18+i*.06),.86,-.19],[a*(.25+i*.075),.49,-.25],.012);
 }
 // Segmented tail curls to the fox's right; cream flame-shaped end is fur, not fire.
 line(s,fur,[.12,.3,-.14],[.48,.24,-.3],.13);line(s,fur,[.48,.24,-.3],[.69,.31,-.22],.11);
 ball(s,cream,[.75,.35,-.18],[.13,.075,.07]);s.cone(cream,.84,.39,-.15,.085,.2,0,0,-.8);
 ball(s,fur,[0,1.2,.035],[.31,.29,.25]);
 for(const a of [-1,1]){
  s.panel(fur,[[a*.14,1.35,0],[a*.3,1.7,-.015],[a*.35,1.27,.01]],.1);
  s.panel(cream,[[a*.205,1.37,.065],[a*.29,1.59,.06],[a*.3,1.35,.065]],.012);
  for(let i=0;i<3;i++)s.cone(light,a*(.28+i*.015),1.16-i*.06,.09,.085,.22,0,0,a*1.15);
  eye(s,a*.135,1.25,.258,'#8e923b',.065);
  line(s,'#583324',[a*.065,1.32,.255],[a*.23,1.34,.2],.027);
  ball(s,cream,[a*.075,1.13,.28],[.11,.075,.1]);
 }
 ball(s,'#2d2823',[0,1.17,.369],[.055,.035,.035]);line(s,'#442a24',[-.13,1.08,.31],[.13,1.08,.31],.012);
 // Neck collar made from actual paired gold links and a hanging amulet.
 for(let ring=0;ring<2;ring++)for(let i=0;i<14;i++){
  const t=i*Math.PI*2/14;ball(s,gold,[Math.cos(t)*.22,1.005-ring*.055,Math.sin(t)*.2],[.04,.026,.028]);
 }
 s.panel(gold,[[0,.92,.25],[.075,.85,.27],[0,.75,.28],[-.075,.85,.27]],.035);
 ball(s,'#c8793a',[0,.85,.302],[.025,.033,.013]);return s.finish();
}

/** #50: heavy, low moss hound. Fur ridges and red eyes, no upright fox anatomy. */
function kiefhound(){
 const s=new Sculpt(),moss='#58602b',dark='#303b22',tip='#92904b';
 ball(s,dark,[0,.51,-.12],[.38,.32,.6]);ball(s,moss,[0,.66,-.2],[.37,.25,.46]);
 for(const a of [-1,1])for(const z of [-.47,.3]){
  ball(s,moss,[a*.3,.33,z],[.14,.24,.16]);line(s,dark,[a*.31,.27,z],[a*.34,.1,z+.07],.085);
  ball(s,moss,[a*.34,.08,z+.13],[.14,.075,.17]);
  for(let i=0;i<3;i++)s.cone('#aaa173',a*.34+(i-1)*.065,.055,z+.28,.025,.12,Math.PI/2);
 }
 for(let row=0;row<7;row++)for(let i=-2;i<=2;i++){
  const x=i*.13,z=-.68+row*.15,y=.78-Math.abs(i)*.035;
  line(s,tip,[x,y-.08,z],[x*.9,y+.12,z-.12],.035);
  s.cone(moss,x,y+.08,z-.09,.045,.18,-.5,0,i*.12);
 }
 ball(s,moss,[0,.45,.55],[.3,.24,.3]);ball(s,dark,[0,.31,.73],[.23,.12,.21]);
 ball(s,moss,[0,.38,.77],[.25,.13,.21]);ball(s,'#4a3028',[0,.42,.945],[.095,.055,.04]);
 for(const a of [-1,1]){
  ball(s,dark,[a*.26,.53,.39],[.11,.13,.06]);eye(s,a*.17,.53,.75,'#bd3d22',.052);
  line(s,dark,[a*.07,.6,.74],[a*.27,.62,.63],.046);
  for(let i=0;i<4;i++)line(s,tip,[a*.21,.5-i*.045,.7],[a*.27,.45-i*.045,.55],.013);
  s.cone('#bdb48b',a*.16,.29,.81,.025,.09,Math.PI);
 }
 line(s,dark,[-.19,.29,.88],[.19,.29,.88],.016);
 line(s,moss,[0,.5,-.62],[.09,.48,-.85],.075);line(s,tip,[.09,.48,-.85],[.17,.58,-.93],.04);return s.finish();
}

/** #51: skull-faced cloud with curling smoke arms and a tapering wisp, never legs. */
function puffwraith(){
 const s=new Sculpt(),smoke='#99ad91',shade='#697f70',pale='#c2cfad';
 ball(s,smoke,[0,.9,0],[.32,.34,.22]);ball(s,pale,[0,1.27,.01],[.37,.33,.24]);
 for(const [x,y,z,r]of [[-.28,1.46,0,.17],[0,1.6,-.06,.22],[.28,1.43,-.03,.18],[-.37,1.19,0,.14],[.38,1.2,0,.14]])ball(s,smoke,[x,y,z],[r,r*.9,r*.8]);
 for(const a of [-1,1]){
  ball(s,shade,[a*.14,1.25,.233],[.095,.115,.04]);ball(s,'#253838',[a*.14,1.24,.26],[.067,.078,.022]);
  ball(s,pale,[a*.155,1.28,.278],[.02,.025,.01]);
  line(s,smoke,[a*.26,.99,0],[a*.49,.91,.05],.07);line(s,pale,[a*.49,.91,.05],[a*.56,1.05,.07],.055);
  line(s,smoke,[a*.56,1.05,.07],[a*.46,1.12,.09],.045);
  ball(s,smoke,[a*.23,.65,0],[.14,.11,.14]);
 }
 ball(s,'#37473e',[0,1.12,.258],[.04,.028,.02]);ball(s,'#34443d',[0,1.02,.23],[.1,.045,.025]);
 for(let i=-1;i<=1;i++)s.box(pale,i*.047,1.04,.255,.028,.034,.018);
 ball(s,smoke,[0,.6,0],[.21,.21,.15]);line(s,smoke,[0,.5,0],[.13,.32,.04],.095);line(s,pale,[.13,.32,.04],[.02,.18,.09],.055);
 ball(s,pale,[0,.11,.1],[.045,.05,.035]);return s.finish();
}

/** #52: scaled green lizard, orange jaw and toes, a raised layered flame tail. */
function blazetail(){
 const s=new Sculpt(),green='#56772a',yellow='#b4a438',orange='#b66b25';
 ball(s,green,[0,.38,-.02],[.22,.2,.48]);ball(s,orange,[0,.26,.13],[.17,.08,.34]);
 for(const a of [-1,1])for(const z of [-.26,.22]){
  line(s,green,[a*.16,.38,z],[a*.34,.21,z-.03],.07);line(s,orange,[a*.34,.21,z-.03],[a*.33,.08,z+.16],.045);
  for(let i=0;i<3;i++)line(s,orange,[a*.33,.08,z+.16],[a*.33+(i-1)*.065,.05,z+.28],.019);
 }
 ball(s,green,[0,.37,.49],[.2,.16,.25]);ball(s,green,[0,.3,.73],[.18,.09,.21]);
 ball(s,orange,[0,.23,.74],[.18,.045,.2]);line(s,'#343421',[-.15,.265,.88],[.15,.265,.88],.011);
 for(const a of [-1,1]){eye(s,a*.12,.43,.63,'#ae5d22',.045);for(let i=0;i<4;i++)s.cone('#d6c891',a*.13,.245,.64+i*.06,.012,.037,Math.PI);}
 for(let row=0;row<8;row++)for(let col=-1;col<=1;col++){
  const z=-.39+row*.12;ball(s,col?green:yellow,[col*.12,.55-Math.abs(col)*.045,z],[.065,.025,.075]);
 }
 for(let i=0;i<6;i++)s.cone(yellow,0,.62,-.4+i*.16,.05,.13,.25);
 line(s,green,[0,.37,-.43],[.12,.48,-.75],.11);line(s,orange,[.12,.48,-.75],[.21,.76,-.93],.055);
 // Fire is closed layered geometry; silhouette leans up and away from the back.
 for(const [color,width,height,z]of [['#cd391b',.2,.62,-.92],['#ee7b1c',.13,.48,-.88],['#f5cf3b',.065,.32,-.84]] as [string,number,number,number][]){
  s.panel(color,[[.21-width,.73,z],[.19-width*.45,.94,z],[.14,.98+height*.42,z],[.24,1.02,z],[.3,.79+height,z],[.3+width*.3,1,z],[.21+width,.84,z]],.025);
 }
 return s.finish();
}

/** #53: domed ribbed shell, six cable legs, purple ports and green compound eyes. */
function rootroach(){
 const s=new Sculpt(),shell='#716854',rim='#a18f72',dark='#323936',purple='#785f8e';
 ball(s,dark,[0,.25,0],[.34,.15,.54]);
 for(let i=0;i<8;i++){
  const z=-.44+i*.125,width=.33*Math.sqrt(Math.max(.2,1-((z+.02)/.65)**2));
  ball(s,shell,[0,.37,z],[width,.17,.09]);line(s,rim,[-width*.88,.43,z],[width*.88,.43,z],.012);
  s.box(dark,0,.535,z,.016,.015,.105);
 }
 for(const a of [-1,1]){
  for(let i=0;i<3;i++){
   const z=-.3+i*.3;line(s,dark,[a*.25,.25,z],[a*.49,.2,z-.11],.035);line(s,shell,[a*.49,.2,z-.11],[a*.59,.045,z+.05],.025);
   for(let j=0;j<3;j++)ball(s,rim,[a*(.5+j*.03),.18-j*.05,z-.08+j*.04],[.033,.025,.027]);
  }
  for(const z of [-.26,.16]){
   s.box(dark,a*.32,.34,z,.04,.15,.16,0,0,a*.3);s.box(purple,a*.345,.35,z,.025,.1,.11,0,0,a*.3);
   for(let i=0;i<3;i++)line(s,'#242c2c',[a*.36,.32+i*.025,z-.045],[a*.36,.32+i*.025,z+.045],.007);
  }
 }
 ball(s,dark,[0,.25,.57],[.21,.12,.19]);
 for(const a of [-1,1]){
  ball(s,'#53633b',[a*.1,.31,.71],[.065,.065,.03]);ball(s,'#a3d76d',[a*.1,.32,.735],[.042,.043,.016]);
  line(s,shell,[a*.1,.35,.59],[a*.17,.53,.75],.016);line(s,rim,[a*.17,.53,.75],[a*.28,.65,.83],.012);
  line(s,rim,[a*.065,.18,.7],[a*.13,.16,.78],.015);
 }
 for(let i=-2;i<=2;i++)line(s,rim,[i*.09,.4,-.47],[i*.11,.59,-.61],.014);
 return s.finish();
}

/** #54: a split luminous heart in a dark fractured veil and angular lightning. */
function crackveil(){
 const s=new Sculpt(),dark='#31213e',purple='#782a91',pink='#ce76d4',bright='#efb4df',spark='#e8c84e';
 ball(s,dark,[0,.87,0],[.29,.39,.13]);
 // Two separate lobes and asymmetrical pointed halves preserve the central crack.
 ball(s,pink,[-.13,1.15,.06],[.19,.2,.095]);ball(s,bright,[.14,1.15,.06],[.18,.2,.09]);
 s.panel(pink,[[-.28,1.18,.09],[-.055,1.21,.1],[-.015,1.03,.12],[-.08,.94,.12],[.005,.76,.12],[-.27,1.02,.1]],.06);
 s.panel(bright,[[.065,1.23,.1],[.3,1.15,.09],[.25,1.01,.1],[.04,.78,.12],[.08,.98,.12],[.015,1.08,.12]],.06);
 for(const a of [-1,1]){
  s.panel(dark,[[a*.2,1.3,0],[a*.41,1.43,-.03],[a*.32,1.18,-.07],[a*.54,1.04,-.08],[a*.32,.99,-.1],[a*.48,.72,-.06],[a*.19,.79,-.04]],.035);
  for(let i=0;i<5;i++){
   const y=.67+i*.14;line(s,purple,[a*.22,y,-.05],[a*(.4+(i%2)*.09),y-.16,-.04],.018);
  }
  s.panel(spark,[[a*.2,1.16,.175],[a*.08,1.09,.18],[a*.18,1.03,.18],[a*.055,.96,.18],[a*.12,1.06,.18],[a*.025,1.12,.18]],.012);
  for(let i=0;i<3;i++){
   const x=a*(.16+i*.14),y=.72-i*.08;
   line(s,purple,[x,y,-.04],[x+a*.08,y-.16,0],.024);
   line(s,spark,[x+a*.08,y-.16,0],[x-a*.01,y-.23,.015],.014);
   line(s,spark,[x-a*.01,y-.23,.015],[x+a*.07,y-.34,.02],.012);
  }
  for(let i=0;i<3;i++)s.cone(purple,a*(.12+i*.095),1.38+i%2*.08,-.03,.03,.2,0,0,-a*.25);
 }
 return s.finish();
}
export const SCULPTS_D:Record<string,()=>THREE.BufferGeometry>={mon_hawkerfox:hawkerfox,mon_kiefhound:kiefhound,mon_puffwraith:puffwraith,mon_blazetail:blazetail,mon_rootroach:rootroach,mon_crackveil:crackveil};
