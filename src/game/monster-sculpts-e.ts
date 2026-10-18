import type * as THREE from "three";
import { Sculpt } from "./model-sculpt";
type P=[number,number,number];
const ball=(s:Sculpt,c:string,p:P,r:P)=>s.ellipsoid(c,...p,...r);
const line=(s:Sculpt,c:string,a:P,b:P,r=.025)=>s.rod(c,a,b,r);
function eye(s:Sculpt,x:number,y:number,z:number,c:string,r=.045){
 ball(s,'#161923',[x,y,z],[r*1.3,r,.026]);ball(s,c,[x,y,z+.023],[r*.75,r*.7,.017]);
 ball(s,'#101017',[x,y,z+.038],[r*.19,r*.55,.009]);ball(s,'#fff5cf',[x-r*.2,y+r*.25,z+.047],[.009,.011,.006]);
}
/** #55: howling cable wolf; the mouth is an actual gap between lifted jaws. */
function portwolf(){
 const s=new Sculpt(),fur='#454b63',edge='#666b83',dark='#252a3d',cable='#703d78';
 ball(s,fur,[0,.58,-.12],[.25,.3,.48]);ball(s,dark,[0,.78,.18],[.27,.36,.26]);
 for(const a of [-1,1])for(const z of [-.43,.25]){
  ball(s,fur,[a*.19,.39,z],[.1,.22,.13]);line(s,dark,[a*.2,.33,z],[a*.22,.1,z+.07],.055);
  ball(s,edge,[a*.22,.065,z+.13],[.095,.065,.13]);
  for(let i=0;i<3;i++)line(s,'#b6b7bd',[a*.22+(i-1)*.045,.055,z+.23],[a*.22+(i-1)*.045,.035,z+.265],.012);
  for(let i=0;i<2;i++)s.box(edge,a*.22,.16+i*.08,z+.065,.12,.024,.115);
 }
 // Layered pointed mane follows the neck and flanks rather than a generic smooth ball.
 for(const a of [-1,1])for(let row=0;row<4;row++)for(let i=0;i<3;i++){
  const x=a*(.16+i*.045),y=1.08-row*.135,z=.12-i*.07;
  s.panel(i%2?edge:fur,[[x-a*.06,y,z],[x+a*.075,y-.07,z+.02],[x+a*.09,y-.25,z+.015],[x-a*.035,y-.17,z]],.035);
 }
 for(let i=0;i<5;i++){
  const z=-.48+i*.16;line(s,cable,[-.13,.68,z],[-.28,.83,z-.05],.018);line(s,dark,[-.28,.83,z-.05],[-.34,.69,z+.05],.018);
 }
 line(s,fur,[0,.61,-.5],[-.21,.55,-.76],.09);line(s,edge,[-.21,.55,-.76],[-.39,.5,-.91],.06);
 for(let i=0;i<4;i++)s.cone(fur,-.27-i*.035,.52-i*.04,-.77-i*.055,.045,.2,0,0,.7);
 ball(s,fur,[0,1.1,.31],[.2,.25,.19]);
 for(const a of [-1,1]){
  s.panel(dark,[[a*.1,1.24,.2],[a*.18,1.52,.1],[a*.24,1.19,.23]],.055);
  s.panel(edge,[[a*.135,1.27,.245],[a*.175,1.42,.17],[a*.195,1.26,.245]],.012);
  eye(s,a*.14,1.24,.43,'#b75593',.042);
 }
 ball(s,'#121019',[0,1.25,.53],[.095,.19,.11]);ball(s,'#632b3a',[0,1.2,.61],[.06,.13,.025]);
 line(s,fur,[-.09,1.18,.34],[-.085,1.12,.62],.045);line(s,fur,[.09,1.18,.34],[.085,1.12,.62],.045);
 ball(s,edge,[0,1.105,.63],[.105,.045,.07]);
 ball(s,fur,[0,1.43,.51],[.12,.075,.18]);ball(s,'#171d2b',[0,1.46,.66],[.075,.045,.04]);
 for(const a of [-1,1])for(let i=0;i<4;i++){
  s.cone('#d1c9bf',a*.075,1.38,.43+i*.055,.014,i===3?.09:.055,Math.PI);
  s.cone('#d1c9bf',a*.065,1.14,.48+i*.045,.012,.04);
 }
 return s.finish();
}
/** #56: dense suspended mist canopy, yellow eyes and dangling wisps, no limbs. */
function fogbank(){
 const s=new Sculpt(),fog='#b9c79d',pale='#e0e4bd',shade='#81977a';
 ball(s,shade,[0,.8,0],[.32,.38,.22]);
 for(let row=0;row<4;row++)for(let col=-2;col<=2;col++){
  const width=[.19,.24,.26,.21][row],x=col*width*.85+(row%2?.025:-.025),y=1.5-row*.19+Math.sin(row*7+col*3)*.025,z=.02+(col%2)*.06;
  const r=.15+(2-Math.abs(col))*.025;
  ball(s,(row+col)%2?pale:fog,[x,y,z],[r,r*.9,r*.8]);
 }
 // The face is recessed below the crown; eyes remain readable through the mist.
 ball(s,shade,[0,.75,.18],[.21,.19,.09]);
 for(const a of [-1,1]){
  ball(s,'#394b39',[a*.105,.78,.259],[.06,.075,.025]);ball(s,'#e5d953',[a*.105,.78,.279],[.037,.052,.015]);
  ball(s,'#fff3a2',[a*.105,.8,.292],[.018,.025,.009]);
 }
 for(let i=-3;i<=3;i++){
  const x=i*.105,y=.58-Math.abs(i)*.015;
  ball(s,fog,[x,y,0],[.075,.15+(i%2)*.025,.08]);line(s,fog,[x,y-.1,0],[x+.02,y-.24,.01],.023);
  ball(s,pale,[x+.02,y-.3-(i%2)*.05,.01],[.022,.04,.022]);
 }
 for(const [x,y]of [[-.39,.8],[.39,.93],[-.31,1.4],[.27,1.55]])ball(s,pale,[x,y,-.04],[.08,.09,.07]);
 return s.finish();
}
/** #57: industrial cargo crab, recessed red lights and two closed curved pincers. */
function dockclaw(){
 const s=new Sculpt(),metal='#555657',rim='#7a7770',dark='#282d33',red='#b84641';
 s.box(dark,0,.42,0,.65,.32,.62);s.box(metal,0,.58,-.02,.67,.25,.65);
 for(let i=0;i<3;i++)s.box(rim,0,.72,-.25+i*.21,.57,.04,.17);
 for(const a of [-1,1]){
  line(s,rim,[a*.34,.5,-.31],[a*.34,.69,-.27],.022);
  line(s,rim,[a*.34,.69,-.27],[a*.34,.69,.26],.022);
  for(const z of [-.25,0,.24])ball(s,dark,[a*.27,.747,z],[.018,.009,.018]);
  for(let i=0;i<3;i++){
   const z=-.25+i*.22;line(s,dark,[a*.3,.4,z],[a*.51,.27,z-.12],.055);line(s,metal,[a*.51,.27,z-.12],[a*.57,.07,z+.02],.045);
   ball(s,rim,[a*.51,.27,z-.12],[.065,.065,.065]);
  }
  line(s,dark,[a*.3,.45,.17],[a*.53,.43,.43],.085);line(s,metal,[a*.53,.43,.43],[a*.62,.3,.66],.1);
  line(s,red,[a*.575,.37,.53],[a*.605,.335,.59],.108);
  ball(s,dark,[a*.62,.29,.7],[.14,.11,.13]);
  // Opposing prongs curve around an empty, real opening.
  for(const side of [-1,1]){
   line(s,metal,[a*.62+side*.09,.28,.72],[a*.62+side*.14,.19,.85],.055);
   line(s,rim,[a*.62+side*.14,.19,.85],[a*.62+side*.08,.14,.98],.035);
   line(s,metal,[a*.62+side*.08,.14,.98],[a*.62+side*.025,.15,1.03],.02);
  }
 }
 s.box(dark,0,.45,.337,.55,.23,.035);
 for(const a of [-1,1]){
  s.box(rim,a*.17,.48,.365,.12,.12,.025);s.box('#d54142',a*.17,.48,.384,.066,.066,.012);
  ball(s,'#ff8c77',[a*.18,.5,.395],[.018,.018,.009]);
 }
 for(let i=-1;i<=1;i++)s.box('#1b2329',i*.13,.365,.365,.08,.04,.015);
 for(let i=-1;i<=1;i++)s.box(red,i*.16,.65,.319,.07,.027,.016);return s.finish();
}
/** #58: a lime segmented caterpillar with a bubble helmet/brim and drips. */
function flaskwyrm(){
 const s=new Sculpt(),lime='#9acb2c',yellow='#cbdc39',shade='#638e26',spot='#3e6b26';
 const segments:[P,P][]=[[[0,.57,.36],[.24,.27,.24]],[[0,.39,-.02],[.24,.24,.27]],[[0,.37,-.43],[.22,.23,.25]],[[0,.42,-.77],[.17,.2,.2]]];
 for(const [i,[p,r]]of segments.entries()){
  ball(s,i%2?lime:yellow,p,r);
  for(const a of [-1,1]){
   ball(s,spot,[a*(r[0]-.025),p[1]+.015,p[2]+.035],[.032,.04,.048]);
   if(i>0){line(s,lime,[a*.14,.27,p[2]],[a*.17,.1,p[2]+.03],.026);ball(s,yellow,[a*.17,.07,p[2]+.08],[.045,.025,.06]);}
  }
 }
 s.cone(yellow,0,.54,-.94,.085,.35,-.6);
 ball(s,shade,[0,.85,.4],[.23,.23,.2]);
 for(const a of [-1,1])eye(s,a*.09,.89,.592,'#e7e7bd',.045);
 line(s,'#3d6126',[-.07,.77,.593],[.07,.77,.593],.011);
 // Closed broad brim and domed cap are separate geometry, not a flask proxy.
 ball(s,yellow,[0,1.065,.4],[.33,.055,.29]);ball(s,lime,[0,1.17,.4],[.25,.19,.23]);
 for(let i=0;i<9;i++){
  const a=i*Math.PI*2/9,x=Math.cos(a)*.285,z=.4+Math.sin(a)*.25;
  ball(s,spot,[x,1.075,z],[.027,.02,.027]);
  line(s,yellow,[x,1.04,z],[x,1.04-(i%3+1)*.05,z],.012);
  ball(s,yellow,[x,1.04-(i%3+1)*.05,z],[.017,.023,.017]);
 }
 for(const a of [-1,1])line(s,lime,[a*.16,.5,.42],[a*.25,.35,.5],.025);
 return s.finish();
}
/** #59: seated purple fox, dark hood/face, curled tail, gold rings and forehead crest. */
function velourfox(){
 const s=new Sculpt(),purple='#9959ad',light='#c783ca',dark='#402b55',gold='#cea448';
 ball(s,purple,[0,.44,-.04],[.27,.34,.24]);
 for(const a of [-1,1]){
  ball(s,purple,[a*.2,.22,.07],[.16,.19,.17]);ball(s,light,[a*.13,.08,.26],[.09,.055,.1]);
  line(s,purple,[a*.2,.68,.08],[a*.17,.29,.28],.075);ball(s,light,[a*.17,.23,.29],[.08,.07,.08]);
  for(const y of [.38,.62])ball(s,gold,[a*.185,y,.23],[.082,.025,.076]);
 }
 // The tail wraps across the lap, tapering upward at both sides.
 line(s,dark,[-.24,.3,-.05],[-.4,.23,.14],.13);line(s,purple,[-.4,.23,.14],[-.29,.18,.39],.13);
 line(s,light,[-.29,.18,.39],[.11,.18,.44],.125);line(s,purple,[.11,.18,.44],[.38,.29,.2],.11);
 s.cone(dark,.41,.43,.14,.1,.32,0,0,-.3);
 for(const x of [-.23,.12])ball(s,gold,[x,.19,.44],[.035,.13,.125]);
 ball(s,purple,[0,.95,.02],[.3,.27,.23]);ball(s,dark,[0,1.03,.155],[.28,.2,.095]);
 for(const a of [-1,1]){
  s.panel(dark,[[a*.13,1.13,-.01],[a*.33,1.46,-.05],[a*.34,1.04,.04]],.07);
  s.panel(light,[[a*.2,1.16,.06],[a*.3,1.34,.015],[a*.29,1.12,.08]],.015);
  ball(s,light,[a*.14,.91,.224],[.145,.115,.055]);
  // Narrow half-closed eyes echo the original expression.
  line(s,'#241f32',[a*.055,.985,.257],[a*.2,1.02,.235],.017);
  ball(s,'#c8aace',[a*.125,.98,.265],[.05,.012,.012]);
  for(let i=0;i<3;i++)s.cone(purple,a*.28,.94-i*.06,.08,.055,.17,0,0,a*1.2);
 }
 ball(s,'#32253d',[0,.9,.294],[.035,.024,.02]);line(s,'#63365d',[-.04,.86,.275],[.04,.86,.275],.008);
 for(const a of [-1,1])line(s,gold,[0,1.06,.267],[a*.085,1.18,.24],.015);
 s.panel(gold,[[0,1.13,.26],[.035,1.19,.25],[0,1.26,.22],[-.035,1.19,.25]],.013);
 for(let i=0;i<14;i++){const a=i*Math.PI*2/14;ball(s,gold,[Math.cos(a)*.21,.74,Math.sin(a)*.18],[.03,.02,.025]);}
 return s.finish();
}
/** #60: rusted, riveted quadruped, real open jaw, piston legs and round mechanical eyes. */
function rustmaw(){
 const s=new Sculpt(),rust='#9e5428',plate='#bf6b31',edge='#633c28',iron='#82715d';
 ball(s,edge,[0,.57,-.18],[.38,.34,.53]);
 for(let row=0;row<5;row++){
  const z=-.61+row*.21;ball(s,plate,[0,.69,z],[.36,.24,.14]);
  line(s,edge,[-.32,.78,z],[.32,.78,z],.012);
  for(const a of [-1,1]){s.box(rust,a*.29,.65,z,.11,.21,.17,0,0,a*.35);ball(s,iron,[a*.35,.68,z],[.022,.022,.022]);}
 }
 for(const a of [-1,1])for(const z of [-.47,.24]){
  ball(s,rust,[a*.3,.35,z],[.16,.2,.16]);line(s,iron,[a*.32,.28,z],[a*.35,.13,z+.07],.06);
  ball(s,edge,[a*.35,.09,z+.13],[.14,.08,.16]);
  for(let i=0;i<3;i++)ball(s,iron,[a*.35+(i-1)*.075,.07,z+.26],[.032,.045,.07]);
  s.box(plate,a*.3,.38,z+.12,.18,.07,.05);
 }
 ball(s,rust,[0,.61,.44],[.3,.23,.3]);
 // Mouth cavity between broad upper snout and independently supported lower jaw.
 s.box('#2a211b',0,.37,.53,.38,.26,.08);
 s.box(plate,0,.58,.75,.46,.14,.38);s.box(rust,0,.2,.71,.45,.1,.4);
 for(const a of [-1,1]){
  line(s,edge,[a*.23,.34,.42],[a*.23,.22,.7],.055);
  ball(s,edge,[a*.26,.64,.53],[.08,.09,.04]);ball(s,iron,[a*.28,.64,.56],[.052,.06,.025]);ball(s,'#d17a3b',[a*.29,.64,.58],[.026,.031,.012]);
  for(let i=0;i<5;i++){s.cone('#b9a885',a*.18,.46,.57+i*.07,.022,.09,Math.PI);s.cone('#a99575',a*.16,.29,.58+i*.07,.021,.08);}
  for(let i=0;i<3;i++)s.box(edge,a*.13,.66,.61+i*.1,.014,.02,.06);
 }
 s.box(edge,0,.66,.72,.018,.02,.38);
 for(const a of [-1,1])for(const z of [.6,.83])ball(s,iron,[a*.19,.66,z],[.018,.012,.018]);
 line(s,rust,[0,.55,-.62],[.12,.63,-.85],.08);s.cone(plate,.15,.73,-.91,.055,.18,-.6);
 return s.finish();
}
export const SCULPTS_E:Record<string,()=>THREE.BufferGeometry>={mon_portwolf:portwolf,mon_fogbank:fogbank,mon_dockclaw:dockclaw,mon_flaskwyrm:flaskwyrm,mon_velourfox:velourfox,mon_rustmaw:rustmaw};
