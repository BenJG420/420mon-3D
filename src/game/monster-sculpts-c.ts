import type { BufferGeometry } from 'three';
import { Sculpt } from './model-sculpt';
type P = [number, number, number];
const TAU = Math.PI * 2;
// Original Dex 25–48. Details below are observed in each retained 2D sheet;
// hidden backs are conservative authored interpretations, never claimed source views.
function ring(s: Sculpt, color: number, center: P, rx: number, ry: number, radius = .025) {
  for (let i=0;i<16;i++) { const a=i*TAU/16,b=(i+1)*TAU/16;
    s.rod(color,[center[0]+Math.cos(a)*rx,center[1]+Math.sin(a)*ry,center[2]],[center[0]+Math.cos(b)*rx,center[1]+Math.sin(b)*ry,center[2]],radius); }
}
function eyes(s: Sculpt, y: number, z: number, x: number, iris: number, radius=.09) {
  for(const sign of [-1,1]) {
    s.ellipsoid(0x29231e,sign*x,y,z,radius*1.35,radius*1.22,.045);
    s.ellipsoid(iris,sign*x,y,z+.035,radius,radius,.025);
    s.ellipsoid(0x17141b,sign*x,y,z+.058,radius*.32,radius*.7,.018);
    s.ellipsoid(0xf3e8bb,sign*x-.02,y+.025,z+.072,.017,.019,.009);
  }
}
function fangs(s: Sculpt, x: number, y: number, z: number, count: number, width: number, height=.12) {
  for(let i=0;i<count;i++)s.cone(0xddcfac,x+(i-(count-1)/2)*width/count,y,z,width/count*.38,height,Math.PI);
}
function paw(s: Sculpt, color: number, x: number, z: number, y=.11) {
  s.ellipsoid(color,x,y,z,.145,.12,.22);
  for(const dx of [-.065,0,.065])s.cone(0xbdb395,x+dx,y-.01,z+.19,.025,.1,Math.PI/2);
}
function batWing(s: Sculpt, sign: number, color: number, edge: number, scale=1, y=1) {
  const points: P[]=[[.2,.85,0],[.38,1.58,0],[.78,1.9,0],[.72,1.46,0],[1.17,1.2,0],[.85,1.18,0],[.72,.96,0],[.54,1.01,0],[.38,.72,0]];
  const p=points.map(([x,h,z])=>[sign*x*scale,(h-1)*scale+y,z] as P);
  s.panel(color,p,.035);
  for(const end of [2,4,6,8])s.rod(edge,p[0],p[end],.025);
  for(let i=0;i<p.length;i++)s.rod(edge,p[i],p[(i+1)%p.length],.018);
}
function coin(s:Sculpt,x:number,y:number,z:number,r=.22) {
  s.ellipsoid(0xb97724,x,y,z,r,r,.055);ring(s,0xe4b850,[x,y,z+.05],r*.83,r*.83,.015);ring(s,0x74421e,[x,y,z+.058],r*.55,r*.55,.01);
}
function coinbat() {
  const s=new Sculpt();s.ellipsoid(0x9d662c,0,.7,0,.36,.35,.25);
  for(const sign of [-1,1]){coin(s,sign*.68,.95,0,.37);s.rod(0x8b592b,[sign*.21,.72,0],[sign*.7,.99,0],.05);s.cone(0xb27d39,sign*.22,1.13,0,.09,.37,0,0,-sign*.2);paw(s,0xa66e2a,sign*.18,.06,.37);}
  eyes(s,.8,.23,.14,0xe2c83d);s.ellipsoid(0xc89548,0,.6,.24,.13,.085,.06);
  for(let i=0;i<3;i++)coin(s,-.2+i*.09,1.45+i*.17,.04,.075);
  return s.finish();
}
function dumpsterpup() {
  const s=new Sculpt(),fur=0x685135;s.ellipsoid(fur,0,.7,-.13,.38,.43,.62);s.ellipsoid(0x80623d,0,.9,.43,.35,.35,.29);
  for(const sign of [-1,1]) {s.ellipsoid(fur,sign*.31,.88,.37,.14,.3,.11);paw(s,fur,sign*.26,.36);paw(s,fur,sign*.27,-.49);s.rod(fur,[sign*.24,.6,.38],[sign*.26,.16,.37],.1);}
  eyes(s,1,.67,.13,0xab8a4b);s.ellipsoid(0x241e18,0,.85,.77,.1,.08,.06);s.ellipsoid(0xc66c71,.07,.7,.77,.08,.15,.025);
  s.ellipsoid(0x696b66,0,1.18,-.14,.52,.09,.68);ring(s,0x393d3d,[0,1.19,.37],.45,.055,.025);
  for(const x of [-.3,-.1,.1,.3])s.rod(0x93958c,[x,1.23,-.65],[x,1.24,.31],.018);
  for(let i=0;i<8;i++)s.cone(i%2?0x887149:fur,(i%4-.5)*.13,.7-(i%3)*.08,-.53+(i%2)*.6,.08,.25,Math.PI);
  s.rod(fur,[.23,.8,-.65],[.43,1.04,-.86],.065);return s.finish();
}
function harzling() {
  const s=new Sculpt();s.ellipsoid(0xf2a618,0,.95,0,.43,.52,.33);s.ellipsoid(0xffc52b,-.1,1.25,.1,.29,.31,.22);
  for(const sign of [-1,1]){s.ellipsoid(0xe9970c,sign*.4,.74,.04,.12,.19,.16);s.rod(0xb89826,[sign*.3,1.02,0],[sign*.65,1.13,0],.03);s.ellipsoid(0x83a333,sign*.59,1.15,.03,.16,.065,.055);s.ellipsoid(0x98b43b,sign*.66,1.08,.025,.12,.05,.045);}
  s.rod(0xe59b0d,[0,.62,0],[.06,.27,.07],.075);s.ellipsoid(0xffb324,.06,.2,.07,.11,.13,.1);
  eyes(s,.92,.31,.17,0x86550b,.085);s.ellipsoid(0xffe48c,-.19,1.28,.3,.08,.14,.035);
  return s.finish();
}
function wiremite() {
  const s=new Sculpt();s.ellipsoid(0x653821,0,.76,-.16,.43,.48,.43);
  for(let i=0;i<5;i++)ring(s,i%2?0xc77b4a:0x874526,[0,.78,.12+i*.04],.42-i*.07,.43-i*.07,.05);
  s.ellipsoid(0xa45b31,0,.48,.4,.26,.24,.2);eyes(s,.5,.56,.13,0x88d541,.07);
  for(const sign of [-1,1]){for(let i=0;i<3;i++){const z=.33-i*.31;const x=sign*(.35+i*.05);s.rod(0x7a5d43,[sign*.2,.57,z],[x,.39,z+.08],.04);s.rod(0xa9a395,[x,.39,z+.08],[sign*(.51+i*.04),.12,z+.15],.025);}
  s.rod(0xb77a38,[sign*.19,1.09,-.19],[sign*.3,1.5,-.18],.025);s.ellipsoid(0xf7dc51,sign*.31,1.53,-.18,.06,.06,.06);}
  return s.finish();
}
function gluthmoth() {
  const s=new Sculpt();s.ellipsoid(0x292633,0,.93,.08,.18,.48,.2);s.ellipsoid(0x35303c,0,1.35,.12,.22,.23,.18);
  for(const sign of [-1,1]){
    s.panel(0x9f4119,[[sign*.12,1.23,0],[sign*.8,1.7,0],[sign*1.1,1.5,0],[sign*.8,1.03,0],[sign*1.04,.75,0],[sign*.44,.39,0],[sign*.16,.76,0]]);
    for(let i=0;i<4;i++){s.rod(0xef8820,[sign*.25,.87,.025],[sign*(.48+i*.12),.48+i*.27,.025],.035);s.cone(0xf4a323,sign*(.44+i*.17),.55+i*.28,.03,.07,.25,0,0,-sign*.35);}
    s.rod(0x78482c,[sign*.1,1.49,.08],[sign*.39,1.96,.05],.019);s.ellipsoid(0x993426,sign*.11,1.35,.29,.043,.055,.025);
  }return s.finish();
}
function rohrling(){
  const s=new Sculpt(),steel=0x7f8990,edge=0xb2bdbe;
  const path:P[]=[[-.34,1.66,0],[-.34,1.4,0],[-.07,1.21,0],[.14,.99,0],[.14,.61,0]];
  for(let i=0;i<path.length-1;i++){s.rod(steel,path[i],path[i+1],.2);s.ellipsoid(edge,...path[i],.215,.215,.215);}
  for(const sign of [-1,1]){s.rod(steel,[.14,.65,0],[.14+sign*.23,.43,0],.1);s.rod(steel,[.14+sign*.23,.43,0],[.14+sign*.23,.14,.03],.09);s.ellipsoid(0x62b5e3,.14+sign*.23,.065,.04,.05,.08,.05);}
  s.ellipsoid(steel,-.1,.98,.2,.25,.25,.075);ring(s,edge,[-.1,.98,.28],.23,.23,.025);
  for(let i=0;i<6;i++){const a=i*TAU/6;s.ellipsoid(0x414b50,-.1+Math.cos(a)*.17,.98+Math.sin(a)*.17,.29,.035,.035,.025);}
  return s.finish();
}
function fumemoth(){
  const s=new Sculpt();s.ellipsoid(0xbda521,0,.86,0,.29,.47,.25);
  for(let i=0;i<11;i++){const a=i*2.4;s.ellipsoid(i%2?0xe5d044:0xb7a327,Math.sin(a)*.22,.46+i*.065,.12+Math.cos(a)*.1,.13,.15,.14);}
  for(const sign of [-1,1]){s.panel(0x8cb83c,[[sign*.18,.7,-.07],[sign*.76,.41,-.07],[sign*.65,.84,-.07],[sign*.93,1.2,-.07],[sign*.63,1.43,-.07],[sign*.35,1.2,-.07]]);
    for(let i=0;i<4;i++){const x=sign*(.4+i*.13),y=.55+i*.24;s.ellipsoid(0xbedb61,x,y,-.035,.14,.1,.04);s.rod(0x91bc43,[x,y,0],[x+sign*.16,y+.15,0],.045);}
    s.rod(0xdcc443,[sign*.1,1.23,0],[sign*.31,1.58,.03],.025);s.ellipsoid(0x2e3432,sign*.115,1.12,.23,.1,.12,.07);s.ellipsoid(0x777f74,sign*.115,1.13,.29,.06,.07,.02);
  }return s.finish();
}
function knuckrat(){
  const s=new Sculpt(),fur=0x4b4a56;s.ellipsoid(fur,0,.68,0,.3,.4,.23);s.ellipsoid(fur,0,1.17,.07,.34,.3,.25);
  for(const sign of [-1,1]){s.ellipsoid(fur,sign*.27,1.43,.03,.14,.2,.08);s.ellipsoid(0xa36571,sign*.28,1.45,.09,.08,.12,.025);s.rod(fur,[sign*.2,.9,.02],[sign*.47,.83,.22],.11);s.ellipsoid(0xe0d4bd,sign*.47,.87,.31,.15,.17,.14);
    for(let i=0;i<4;i++)s.rod(0x918977,[sign*.35,.78+i*.048,.42],[sign*.58,.78+i*.048,.4],.012);
    s.rod(fur,[sign*.16,.48,0],[sign*.25,.19,.06],.13);paw(s,fur,sign*.25,.15);
  }
  eyes(s,1.23,.3,.14,0xa93c39,.07);s.ellipsoid(0xb1847e,0,1.08,.37,.16,.11,.11);s.ellipsoid(0x3c2529,0,1.14,.46,.06,.045,.04);fangs(s,0,1.02,.42,2,.12,.09);
  s.rod(0xa16a75,[0,.48,-.15],[-.48,.4,-.36],.04);s.rod(0xbd8a87,[-.48,.4,-.36],[-.64,.5,-.19],.025);
  for(let i=0;i<4;i++)s.cone(fur,(i-1.5)*.11,1.49,.02,.075,.18,0,0,(i-1.5)*.2);return s.finish();
}
function shadefox(){
  const s=new Sculpt(),fur=0x29164d;s.ellipsoid(fur,0,.6,-.12,.3,.32,.48);s.ellipsoid(fur,0,.92,.33,.29,.3,.25);
  for(const sign of [-1,1]){s.cone(0x482878,sign*.22,1.25,.27,.12,.43,0,0,-sign*.21);s.cone(0x8965b9,sign*.22,1.25,.33,.055,.29,0,0,-sign*.21);s.rod(fur,[sign*.21,.56,.22],[sign*.23,.15,.32],.085);paw(s,fur,sign*.23,.32);paw(s,fur,sign*.22,-.39);}
  eyes(s,.96,.55,.12,0xb8a6d7,.055);s.cone(0x3c215b,0,.82,.64,.15,.28,Math.PI/2);s.rod(0x583085,[.08,.65,-.48],[.46,.87,-.76],.12);s.rod(0x7850ad,[.46,.87,-.76],[.58,1.16,-.73],.085);
  for(let i=0;i<4;i++)s.cone(0x654096,.54+(i%2)*.1,.98+i*.08,-.77,.055,.19,0,0,-.4);return s.finish();
}
function lacebat(){
  const s=new Sculpt();s.ellipsoid(0xcfc1a2,0,.72,.05,.33,.32,.25);
  for(const sign of [-1,1]){batWing(s,sign,0xb45aa2,0xe7b5cd,.82,.92);s.cone(0xb79e7b,sign*.21,1.04,.08,.1,.29,0,0,-sign*.24);
    for(let i=0;i<6;i++){const a=i*TAU/6;s.ellipsoid(0xeacddf,sign*(.45+.13*Math.cos(a)),1.15+.13*Math.sin(a),.035,.028,.028,.022);}
  }eyes(s,.76,.28,.14,0x8f5381,.065);s.ellipsoid(0x564138,0,.59,.3,.11,.06,.03);fangs(s,0,.61,.33,2,.13,.09);
  for(let i=0;i<12;i++){const a=i*TAU/12;s.cone(0xdbceb0,Math.cos(a)*.29,.73+Math.sin(a)*.29,.02,.065,.18,0,0,-a+Math.PI/2);}return s.finish();
}
function slagpup(){
  const s=new Sculpt();s.ellipsoid(0x482d25,0,.65,-.12,.36,.4,.5);s.ellipsoid(0x543023,0,.92,.38,.36,.32,.29);
  for(const sign of [-1,1]){s.cone(0x994424,sign*.25,1.21,.27,.12,.25,0,0,-sign*.22);paw(s,0x483129,sign*.29,.34);paw(s,0x483129,sign*.29,-.42);s.rod(0xd25d1c,[sign*.2,.9,.56],[sign*.13,.65,.59],.023);}
  for(let i=0;i<14;i++){const a=i*2.4;s.ellipsoid(i%3?0x57352b:0x813b25,Math.sin(a)*.29,.46+(i%5)*.13,-.42+Math.cos(a)*.17,.13,.13,.12);s.rod(0xef6a17,[Math.sin(a)*.3,.48+(i%5)*.13,-.25+Math.cos(a)*.4],[Math.sin(a)*.34,.59+(i%5)*.13,-.18+Math.cos(a)*.41],.018);}
  eyes(s,.96,.64,.15,0xf09c20,.065);s.ellipsoid(0x29211f,0,.8,.7,.14,.09,.08);return s.finish();
}
function foambat(){
  const s=new Sculpt();s.ellipsoid(0x9ca98d,0,.8,.05,.25,.34,.22);
  for(const sign of [-1,1]){batWing(s,sign,0xaab99b,0xdbe1c9,.82,.93);s.cone(0xc3cdb3,sign*.15,1.13,.04,.07,.31,0,0,-sign*.2);
    for(let i=0;i<9;i++){const x=sign*(.24+(i%3)*.19),y=.73+Math.floor(i/3)*.17;s.ellipsoid(i%2?0xdce5cd:0x7d9178,x,y,.035,.035,.044,.024);}
    s.ellipsoid(0xd5dfc3,sign*.52,.52,.01,.045,.09,.04);
  }eyes(s,.82,.25,.1,0xc5bf46,.065);s.ellipsoid(0x72856e,0,.62,.21,.11,.08,.04);return s.finish();
}
function stallfox(){
  const s=new Sculpt(),fur=0xa56229;s.ellipsoid(fur,0,.73,0,.3,.43,.25);s.ellipsoid(0xcc8131,0,1.24,.05,.35,.31,.25);
  for(const sign of [-1,1]){s.cone(fur,sign*.25,1.6,0,.12,.42,0,0,-sign*.2);s.cone(0xe6c491,sign*.25,1.6,.07,.06,.27,0,0,-sign*.2);s.rod(fur,[sign*.22,.96,0],[sign*.34,.54,.08],.095);paw(s,fur,sign*.2,.05);s.rod(fur,[sign*.17,.51,0],[sign*.2,.16,.03],.12);}
  s.ellipsoid(0xd1b47a,0,1.13,.24,.24,.14,.1);eyes(s,1.32,.27,.14,0x6a5126,.06);s.ellipsoid(0x2b241a,0,1.19,.37,.065,.045,.035);
  s.panel(0x5e4c2f,[[-.27,1.01,.255],[.27,1.01,.255],[.23,.48,.255],[0,.4,.255],[-.23,.48,.255]]);s.box(0x9c8555,0,.68,.29,.3,.14,.04);
  s.rod(fur,[0,.6,-.16],[.47,.58,-.34],.14);s.cone(0xd88b35,.46,.8,-.33,.16,.51,0,0,-.5);coin(s,.11,1.02,.36,.075);return s.finish();
}
function kerbstomp(){
  const s=new Sculpt(),stone=0x858988;s.box(stone,0,1.15,0,1.12,.8,.78);s.box(0x9c9f9b,-.11,1.57,-.02,.87,.12,.73);
  for(const sign of [-1,1]){s.box(stone,sign*.39,.31,.03,.32,.59,.4);s.box(0x6d7370,sign*.4,.08,.16,.39,.18,.53);s.box(0x7b807c,sign*.7,.65,0,.25,.45,.33);s.box(0x424b48,sign*.69,.42,.1,.28,.18,.35);}
  s.box(0x454b47,0,.91,.4,.79,.14,.035);for(let i=0;i<6;i++)s.box(0x9ca09a,(i-2.5)*.135,.88,.43,.1,.17,.045);
  eyes(s,1.24,.41,.25,0xd8c746,.08);
  const cracks:P[][]=[[[-.48,1.51,.41],[-.21,1.38,.41],[.01,1.5,.41]],[[.4,1.49,.41],[.2,1.34,.41],[.31,1.07,.41]]];for(const c of cracks)for(let i=0;i<c.length-1;i++)s.rod(0x4d5551,c[i],c[i+1],.018);
  for(let i=0;i<4;i++)s.rod(0x58605a,[-.5,1.1+i*.12,-.405],[.5,1.15+i*.1,-.405],.013);return s.finish();
}
function binmaw(){
  const s=new Sculpt(),wood=0x69503b;s.ellipsoid(wood,0,.57,0,.49,.49,.4);s.ellipsoid(0x28221d,0,1.01,.31,.43,.43,.15);
  for(const y of [.28,.68,1.5])ring(s,0x887057,[0,y,.08],.46,.08,.035);
  s.ellipsoid(wood,0,1.49,.08,.51,.1,.43);s.ellipsoid(0x9a7d5c,0,1.55,.08,.48,.055,.4);
  for(let i=0;i<9;i++){const x=(i-4)*.092;s.cone(0xd8c28e,x,1.36,.38,.04,.23,Math.PI);s.cone(0xd8c28e,x,.78,.4,.035,.18);s.rod(0x403428,[x,.22,.36],[x,.6,.39],.013);}
  eyes(s,.99,.44,.18,0xdaba35,.075);
  for(const sign of [-1,1]){paw(s,wood,sign*.33,.07);s.ellipsoid(wood,sign*.51,.66,0,.13,.24,.18);for(let i=0;i<5;i++)s.cone(0x7c6145,sign*(.42+i*.035),.9+i*.065,.2,.045,.23,0,0,-sign*.8);}
  return s.finish();
}
function moosback(){
  const s=new Sculpt(),moss=0x52752a;s.ellipsoid(moss,0,.59,-.13,.53,.46,.57);s.ellipsoid(0x638b34,0,.43,.46,.33,.25,.29);
  for(const sign of [-1,1]){paw(s,0x53712a,sign*.39,.35);paw(s,0x53712a,sign*.39,-.46);s.ellipsoid(0x1e301c,sign*.14,.49,.69,.04,.045,.025);}
  for(let i=0;i<32;i++){const a=i*2.4,r=.15+(i%4)*.095;const x=Math.sin(a)*r,z=-.17+Math.cos(a)*r,y=.8+(.45-r)*.6;s.ellipsoid(i%3?0x6e9b30:0x96b941,x,y,z,.13,.18,.12);s.cone(0x477121,x,y+.16,z,.085,.25,0,0,Math.sin(a)*.4);}
  s.rod(0x4b7225,[.08,1.12,-.13],[.13,1.44,-.2],.035);for(const sign of [-1,1])s.ellipsoid(0x719b2b,.13+sign*.12,1.36,-.2,.14,.055,.07);return s.finish();
}
function cinderfang(){
  const s=new Sculpt(),fur=0x28262d;s.ellipsoid(fur,0,.73,-.1,.32,.39,.55);s.ellipsoid(fur,0,1.08,.45,.34,.34,.3);
  for(const sign of [-1,1]){s.cone(fur,sign*.24,1.43,.36,.11,.43,0,0,-sign*.15);s.rod(fur,[sign*.24,.72,.26],[sign*.27,.16,.4],.1);paw(s,fur,sign*.27,.43);paw(s,fur,sign*.26,-.47);
    s.rod(0xe85718,[sign*.12,.89,.7],[sign*.22,.91,.68],.027);s.ellipsoid(0xc4451c,sign*.14,1.13,.73,.055,.04,.025);s.cone(0xf1ae37,sign*.13,.83,.71,.035,.1,Math.PI);}
  for(let i=0;i<9;i++)s.cone(i%2?0x39333b:fur,(i%3-1)*.13,1.09+(i%3)*.065,-.43+(i/9)*.85,.1,.36,0,0,(i%3-1)*.3);
  s.rod(fur,[0,.77,-.59],[.39,1.02,-.87],.1);s.cone(0xe95b13,.4,1.24,-.86,.13,.49,0,0,-.22);s.cone(0xffbf33,.4,1.18,-.78,.065,.3);return s.finish();
}
function schlickhound(){
  const s=new Sculpt(),fur=0x686333;s.ellipsoid(fur,0,.74,-.14,.34,.45,.61);s.ellipsoid(0x777044,0,.87,.45,.33,.35,.3);
  for(const sign of [-1,1]){paw(s,fur,sign*.28,.37);paw(s,fur,sign*.28,-.5);s.rod(fur,[sign*.25,.72,.32],[sign*.28,.14,.38],.11);s.ellipsoid(0x534b2f,sign*.27,.85,.45,.1,.35,.1);}
  for(let i=0;i<22;i++){const a=i*2.4;s.rod(i%3?0x857e44:0x4f502e,[Math.sin(a)*.28,.9+(i%3)*.1,-.51+(i%6)*.17],[Math.sin(a)*.34,.37+(i%3)*.09,-.45+(i%6)*.17],.035);}
  eyes(s,1,.7,.13,0x997d37,.06);s.ellipsoid(0x302d1e,0,.83,.8,.11,.08,.06);
  for(const sign of [-1,1])s.rod(0xaaa36a,[sign*.07,.8,.78],[sign*.14,.5,.75],.037);s.ellipsoid(0x8a7840,0,.07,.06,.61,.04,.75);return s.finish();
}
function tapedog(){
  const s=new Sculpt(),tape=0xd6d1c1;s.ellipsoid(tape,0,.75,0,.3,.42,.24);s.ellipsoid(tape,0,1.25,.04,.34,.31,.25);
  for(const sign of [-1,1]){s.cone(tape,sign*.22,1.59,0,.1,.4,0,0,-sign*.16);s.ellipsoid(tape,sign*.42,.94,.3,.17,.21,.15);s.rod(tape,[sign*.2,.94,0],[sign*.42,.85,.22],.11);s.rod(tape,[sign*.17,.48,0],[sign*.22,.17,.03],.12);paw(s,tape,sign*.22,.08);
    for(let i=0;i<5;i++)s.rod(0x9f9d91,[sign*.28,.81+i*.06,.42],[sign*.56,.82+i*.055,.4],.012);}
  eyes(s,1.29,.28,.13,0x777971,.07);s.ellipsoid(0x494a42,0,1.11,.37,.08,.06,.04);
  for(let i=0;i<6;i++)s.rod(0xa6a497,[-.27,.5+i*.145,.2],[.27,.57+i*.145,.21],.014);s.rod(tape,[0,.58,-.16],[.33,.74,-.31],.085);return s.finish();
}
function racklurk(){
  const s=new Sculpt();s.box(0x383b43,0,.87,0,.74,.81,.62);s.box(0x747578,0,1.31,0,.81,.1,.68);s.box(0x1f232c,0,.91,.34,.62,.58,.06);
  for(const sign of [-1,1]){s.box(0xb4472d,sign*.2,1.04,.39,.12,.1,.035);for(let i=0;i<3;i++){const z=.36-i*.34;s.rod(0x5c5148,[sign*.36,.83,z],[sign*.61,.6,z],.045);s.rod(0x77706a,[sign*.61,.6,z],[sign*.72,.2,z+.1],.03);}
    s.rod(0xae7138,[sign*.17,1.35,-.07],[sign*.29,1.66,-.04],.025);}
  // Copper coils wrap outside the case in XZ, not hidden inside its front plane.
  for(let turn=0;turn<5;turn++)for(let i=0;i<12;i++){
    const a=-Math.PI*.55+i*Math.PI*1.6/12,b=-Math.PI*.55+(i+1)*Math.PI*1.6/12;
    s.rod(0xb47b40,[.24+Math.cos(a)*.28,.65+turn*.13+i*.002,Math.sin(a)*.43],[.24+Math.cos(b)*.28,.65+turn*.13+(i+1)*.002,Math.sin(b)*.43],.032);
  }
  for(let i=0;i<4;i++){s.box(0x7c75ac,(i-1.5)*.13,.75,.4,.06,.05,.045);s.cone(0xb2acd0,(i-1.5)*.12,.7,.41,.035,.13,Math.PI);}return s.finish();
}
function knuckbrute(){
  const s=new Sculpt(),fur=0x41313f;s.ellipsoid(fur,0,.8,0,.4,.52,.31);s.ellipsoid(0x59404f,0,1.4,.07,.37,.35,.27);
  for(const sign of [-1,1]){s.ellipsoid(fur,sign*.29,1.68,0,.14,.22,.09);s.ellipsoid(0xb36a78,sign*.29,1.7,.075,.08,.14,.03);s.rod(fur,[sign*.31,1.08,0],[sign*.59,1.13,.22],.16);s.ellipsoid(0xb4a89b,sign*.59,1.18,.29,.2,.22,.18);
    for(let i=0;i<5;i++)s.rod(0x776f68,[sign*.41,1.02+i*.066,.43],[sign*.78,1.04+i*.061,.42],.013);s.rod(fur,[sign*.24,.48,0],[sign*.32,.17,.06],.16);paw(s,0x6d4555,sign*.32,.14);}
  eyes(s,1.46,.32,.15,0xc64b38,.065);s.ellipsoid(0x8e5c62,0,1.28,.37,.2,.12,.1);fangs(s,0,1.21,.44,3,.24,.12);s.rod(0x966276,[0,.52,-.18],[.56,.42,-.46],.055);s.rod(0xb08087,[.56,.42,-.46],[.69,.7,-.33],.035);return s.finish();
}
function gratehound(){
  const s=new Sculpt(),fur=0x5c5037;s.ellipsoid(fur,0,.7,-.11,.35,.4,.58);s.ellipsoid(fur,0,.83,.49,.34,.29,.31);
  for(const sign of [-1,1]){s.ellipsoid(fur,sign*.28,.75,.45,.14,.31,.12);s.rod(fur,[sign*.25,.62,.3],[sign*.27,.15,.4],.1);paw(s,fur,sign*.27,.43);paw(s,fur,sign*.27,-.5);}
  s.box(0x626567,0,1.09,-.15,.86,.07,.95,0,.1,0);for(let i=0;i<5;i++){s.rod(0x292f30,[-.38+i*.19,1.14,-.6],[-.38+i*.19,1.14,.29],.018);s.rod(0x292f30,[-.4,1.14,-.56+i*.19],[.4,1.14,-.56+i*.19],.018);}
  eyes(s,.95,.76,.13,0xd1b747,.06);s.ellipsoid(0x241f19,0,.76,.87,.1,.07,.05);s.ellipsoid(0x32271c,0,.63,.77,.25,.1,.08);fangs(s,0,.67,.83,7,.44,.12);
  for(let i=0;i<15;i++)s.cone(i%2?0x7b6744:fur,Math.sin(i*2.4)*.33,.65+(i%3)*.1,-.46+(i%6)*.13,.06,.27,Math.PI);return s.finish();
}
function coinwraith(){
  const s=new Sculpt();s.ellipsoid(0x8b693c,0,.84,.03,.27,.42,.2);s.ellipsoid(0xb78b4b,0,1.2,.07,.26,.24,.19);
  for(const sign of [-1,1]){batWing(s,sign,0x776392,0xb78a5e,.77,.96);s.cone(0x875e33,sign*.16,1.47,.03,.07,.35,0,0,-sign*.2);}
  eyes(s,1.23,.25,.1,0xddd2a5,.055);for(let i=0;i<8;i++)coin(s,Math.sin(i*2.4)*.23,.5+(i%5)*.15,.18+Math.cos(i*2.4)*.04,.075);
  for(let i=0;i<5;i++)coin(s,Math.sin(i*1.4)*.72,.2+(i%3)*.52,.06,.07);s.ellipsoid(0x493744,0,.38,0,.14,.19,.1);return s.finish();
}
function slagjaw(){
  const s=new Sculpt();s.ellipsoid(0x49332e,0,.77,-.14,.49,.45,.54);s.ellipsoid(0x8d3d27,0,.87,.39,.48,.35,.34);
  for(const sign of [-1,1]){paw(s,0x594039,sign*.36,.39);paw(s,0x594039,sign*.35,-.47);s.cone(0x783522,sign*.32,1.22,.29,.13,.3,0,0,-sign*.3);}
  for(let i=0;i<17;i++){const a=i*2.4,x=Math.sin(a)*.4,z=-.15+Math.cos(a)*.42,y=.8+(i%3)*.12;s.ellipsoid(i%3?0x694335:0x3b3333,x,y,z,.18,.16,.16);s.rod(0xde671e,[x-.08,y-.1,z+.1],[x+.06,y+.13,z+.13],.021);}
  s.box(0xa74a29,0,.55,.58,.76,.22,.25);s.box(0x332622,0,.69,.69,.72,.08,.045);for(let i=0;i<5;i++)s.box(0xba6334,(i-2)*.14,.57,.73,.12,.18,.04);
  eyes(s,1.02,.66,.23,0xed9c2c,.065);s.rod(0xe26a20,[-.17,.86,.71],[-.08,.78,.73],.025);return s.finish();
}
export const SCULPTS_C: Readonly<Record<string, () => BufferGeometry>> = {
  mon_coinbat:coinbat, mon_dumpsterpup:dumpsterpup, mon_harzling:harzling, mon_wiremite:wiremite,
  mon_glutmoth:gluthmoth, mon_rohrling:rohrling, mon_fumemoth:fumemoth, mon_knuckrat:knuckrat,
  mon_shadefox:shadefox, mon_lacebat:lacebat, mon_slagpup:slagpup, mon_foambat:foambat,
  mon_stallfox:stallfox, mon_kerbstomp:kerbstomp, mon_binmaw:binmaw, mon_moosback:moosback,
  mon_cinderfang:cinderfang, mon_schlickhound:schlickhound, mon_tapedog:tapedog, mon_racklurk:racklurk,
  mon_knuckbrute:knuckbrute, mon_gratehound:gratehound, mon_coinwraith:coinwraith, mon_slagjaw:slagjaw,
};
