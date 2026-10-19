import type * as THREE from 'three';
import { Sculpt } from './model-sculpt';

type P = [number, number, number];

/** #91: a used metal ashtray, violet inner enamel and tired eyes on its front rim. */
function ashpan() {
  const s = new Sculpt(), tilt = .29, c = Math.cos(tilt), n = Math.sin(tilt);
  const pan = (x: number, y: number, z: number): P => [x,.49+y*c-z*n,y*n+z*c];
  // Both surfaces are part of the same closed bowl: the opening has real depth.
  s.lathe('#777582',[[0,-.145],[.36,-.145],[.48,-.104],[.536,-.027],[.555,.14],[.549,.208],[.522,.229],[.488,.215],[.477,.15],[.456,.014],[.393,-.057],[0,-.071]],0,.49,0,tilt);
  s.lathe('#61566c',[[0,-.066],[.38,-.066],[.446,-.006],[.474,.135],[.48,.188],[.493,.207],[.505,.19],[.494,.125],[.468,-.015],[.395,-.075],[0,-.078]],0,.49,0,tilt);
  // The original's violet interior remains visible above the shallow ash bed.
  s.lathe('#9a6f9c',[[.448,-.003],[.464,.055],[.477,.145],[.482,.192],[.493,.208],[.505,.203],[.489,.139],[.477,.048],[.459,-.014],[.448,-.003]],0,.49,0,tilt);
  s.lathe('#d0c9d6',[[.488,.207],[.505,.225],[.529,.229],[.548,.215],[.554,.195],[.543,.186],[.529,.209],[.509,.21],[.488,.207]],0,.49,0,tilt);
  s.lathe('#aaa7b3',[[.519,-.039],[.539,-.022],[.546,-.002],[.54,.008],[.53,-.007],[.519,-.039]],0,.49,0,tilt);
  s.lathe('#9a96a3',[[.438,-.119],[.475,-.104],[.5,-.076],[.494,-.069],[.466,-.091],[.438,-.119]],0,.49,0,tilt);
  // Small rim rests and metal seams break the otherwise turned silhouette.
  for (const a of [.48,2.7,4.62]) {
    const p = pan(Math.cos(a)*.521,.212,Math.sin(a)*.521);
    s.ellipsoid('#bdb9c8',...p,.044,.025,.044);
    const q = pan(Math.cos(a)*.52,.229,Math.sin(a)*.52);
    s.ellipsoid('#6d6778',...q,.025,.011,.027);
  }
  for (let i = 0; i < 14; i++) {
    const a = i*Math.PI*2/14, r = .542;
    s.rod(i%3 ? '#8c8796' : '#c1bac8',pan(Math.cos(a)*r,.027,Math.sin(a)*r),pan(Math.cos(a)*r,.151,Math.sin(a)*r),.005);
  }
  s.lathe('#60584c',[[0,-.05],[.285,-.05],[.39,-.031],[.422,-.004],[.404,.021],[.326,.034],[0,.025]],0,.49,0,tilt);
  // Low irregular ash granules sit inside the bowl, never on top of its lip.
  const ashColors = ['#8f897b','#a29c8c','#69645c','#4d4841'];
  for (let i = 0; i < 29; i++) {
    const a = i*2.39996, r = .065+Math.sqrt(i/29)*.328;
    const p = pan(Math.cos(a)*r,.026+(i%3)*.008,Math.sin(a)*r);
    s.ellipsoid(ashColors[i%4],...p,.021+(i%4)*.005,.012+(i%3)*.004,.024+(i%5)*.003);
  }
  // Five individual stubs: rolled tobacco, a paper collar and black ash ends.
  const stubs: [P,P][] = [
    [[-.21,.055,.174],[-.32,.286,-.086]],
    [[-.075,.052,.047],[-.158,.398,-.249]],
    [[.096,.07,-.037],[.254,.433,-.244]],
    [[.118,.048,.23],[.346,.14,.079]],
    [[-.33,.044,.073],[-.382,.204,-.097]],
  ];
  for (let i = 0; i < stubs.length; i++) {
    const [from,to] = stubs[i];
    const at = (t: number): P => pan(from[0]+(to[0]-from[0])*t,from[1]+(to[1]-from[1])*t,from[2]+(to[2]-from[2])*t);
    s.rod('#322d26',at(0),at(.17),.052);
    s.rod('#756a51',at(.12),at(.29),.052);
    s.rod('#d4c3a3',at(.27),at(.47),.049);
    s.rod('#ac793e',at(.47),at(1),.05);
    s.rod('#c39a58',at(.54),at(.61),.051);
    s.rod('#d4ae69',at(.86),at(.91),.051);
    s.ellipsoid('#42392b',...at(0),.048,.042,.049);
    s.ellipsoid('#91816a',...at(.02),.019,.014,.021);
    // Short tobacco specks have deliberate volume, without a pixel texture.
    for (let j = 0; j < 3; j++) {
      const p = at(.57+j*.14);
      s.ellipsoid(j%2 ? '#79532c' : '#d0a35c',p[0]-.023,p[1]+.015,p[2]+.04,.008,.008,.006);
    }
  }
  // Sleepy blue eyes sit on the outside/front, below the unbroken bowl opening.
  for (const side of [-1,1]) {
    const x = side*.237, y = .42, z = .51;
    s.ellipsoid('#45424f',x,y,z,.116,.08,.039);
    s.ellipsoid('#c1b9c6',x,y-.006,z+.027,.096,.062,.021);
    s.ellipsoid('#202a38',x,y-.006,z+.044,.079,.051,.015);
    s.ellipsoid('#7492a8',x,y-.014,z+.055,.052,.033,.009);
    s.ellipsoid('#1c2432',x,y-.01,z+.062,.029,.031,.005);
    s.ellipsoid('#d5e0e7',x-.015,y+.001,z+.068,.012,.009,.004);
    s.tube('#aaa4b1',[[x-.106,y+.023,z+.032],[x-.057,y+.071,z+.018],[x+.035,y+.077,z+.011],[x+.109,y+.035,z+.026]],.022,16);
    s.ellipsoid('#797482',x,y+.042,z+.046,.092,.028,.024);
    // Two broad metal feet emerge from beneath the original tray.
    s.box('#777480',side*.36,.235,.08,.19,.18,.23,0,0,side*.28);
    s.ellipsoid('#97929f',side*.394,.127,.143,.112,.055,.135);
    s.box('#a8a4af',side*.392,.17,.184,.12,.055,.089,0,0,side*.22);
  }
  return s.finish();
}

/** #92: a heavy Y pipe, open branch sockets, bolted collars and a pedestal flange. */
function ypipe() {
  const s = new Sculpt(), steel = '#94999d', dark = '#555c64';
  s.lathe('#7a8089',[[0,.055],[.218,.055],[.243,.079],[.244,.137],[.224,.159],[.168,.16],[.155,.227],[.151,.659],[.173,.733],[0,.747]],0,0,0);
  s.lathe('#b4b7ba',[[.22,.063],[.244,.079],[.246,.111],[.238,.12],[.231,.091],[.22,.063]],0,0,0);
  s.lathe('#a6aaad',[[0,.187],[.176,.187],[.214,.21],[.216,.336],[.198,.363],[.16,.369],[0,.369]],0,0,0);
  s.lathe('#696e77',[[.156,.353],[.19,.353],[.202,.368],[.199,.39],[.17,.402],[.155,.394],[.156,.353]],0,0,0);
  s.lathe('#b5b8bb',[[.156,.397],[.18,.399],[.184,.416],[.171,.428],[.155,.426],[.156,.397]],0,0,0);
  s.lathe(steel,[[0,.417],[.154,.417],[.164,.456],[.168,.666],[.191,.724],[0,.738]],0,0,0);
  // The original branch ends face a little forward, exposing the recessed bore.
  const rx = .65, cr = Math.cos(rx), sr = Math.sin(rx);
  for (const side of [-1,1]) {
    const rz = -side*.73, cz = Math.cos(rz), sz = Math.sin(rz);
    const branch = (x: number,y: number,z: number): P => {
      const a = x*cz-y*sz, b = x*sz+y*cz;
      return [a,.706+b*cr-z*sr,b*sr+z*cr];
    };
    s.lathe(steel,[[0,0],[.143,0],[.162,.077],[.16,.509],[.18,.551],[.183,.626],[.174,.654],[.129,.655],[.116,.627],[.116,.427],[0,.424]],0,.706,0,rx,0,rz);
    s.lathe('#343941',[[0,.427],[.113,.427],[.119,.447],[.119,.628],[.128,.649],[.136,.643],[.127,.619],[.127,.443],[.115,.417],[0,.417]],0,.706,0,rx,0,rz);
    s.lathe('#c5c8ca',[[.13,.651],[.147,.664],[.173,.66],[.185,.643],[.185,.624],[.177,.62],[.172,.64],[.145,.649],[.13,.651]],0,.706,0,rx,0,rz);
    // Two substantial sleeve joints and the sockets' fixed fastening bolts.
    for (const y of [.209,.523]) {
      s.lathe(dark,[[.153,y-.025],[.179,y-.025],[.188,y-.011],[.187,y+.037],[.172,y+.05],[.153,y+.05],[.153,y-.025]],0,.706,0,rx,0,rz);
      s.lathe('#a9aeb3',[[.175,y-.021],[.188,y-.009],[.188,y+.024],[.18,y+.03],[.18,y-.003],[.175,y-.021]],0,.706,0,rx,0,rz);
      for (const angle of [.45,2.05,3.65,5.25]) {
        const p = branch(Math.cos(angle)*.18,y+.007,Math.sin(angle)*.18);
        s.ellipsoid('#c0c4c7',...p,.023,.023,.023);
        if (p[2] > .03) s.ellipsoid('#606873',p[0],p[1],p[2]+.018,.009,.011,.006);
      }
    }
    s.rod('#c0c4c7',branch(-.059,.27,.146),branch(-.059,.475,.146),.01);
    // A small water droplet hangs from each outer lower socket edge.
    const drip = branch(side*.143,.535,.076);
    s.ellipsoid('#9da4bc',drip[0]+side*.028,drip[1]-.09,drip[2],.014,.023,.014);
    s.ellipsoid('#d4d4df',drip[0]+side*.025,drip[1]-.083,drip[2]+.008,.006,.01,.005);
  }
  s.ellipsoid('#989da2',0,.765,.015,.214,.19,.171);
  // A dark continuous collar joins the two branches, with round mechanical eyes.
  s.lathe('#444a54',[[0,.615],[.166,.615],[.198,.655],[.207,.767],[.183,.81],[0,.812]],0,0,.013);
  s.box('#424852',0,.74,.177,.253,.114,.05);
  for (const side of [-1,1]) {
    const x = side*.1;
    s.ellipsoid('#333942',x,.743,.205,.072,.072,.027);
    s.lathe('#a7aeb7',[[.041,-.014],[.057,-.014],[.067,0],[.058,.017],[.042,.017],[.034,.006],[.041,-.014]],x,.743,.215,Math.PI/2);
    s.ellipsoid('#4c5664',x,.743,.231,.036,.039,.013);
    s.ellipsoid('#c6cdd1',x-.009,.756,.243,.013,.015,.006);
    s.rod('#6c737d',[side*.1,.47,.131],[side*.1,.589,.131],.006);
  }
  for (let i = 0; i < 8; i++) {
    const a = i*Math.PI/4;
    s.ellipsoid('#c0c2c6',Math.cos(a)*.207,.275,Math.sin(a)*.207,.027,.027,.027);
    if (Math.sin(a) > .2) s.ellipsoid('#5a616b',Math.cos(a)*.211,.275,Math.sin(a)*.211+.021,.012,.013,.006);
    s.ellipsoid('#c1c3c6',Math.cos(a)*.235,.103,Math.sin(a)*.235,.017,.018,.017);
  }
  return s.finish();
}

/** #93: two separate yellow work gloves; five fingers and one cuff eye apiece. */
function glovepair() {
  const s = new Sculpt(), yellow = '#e5bb22', lit = '#f4cf34', shade = '#bb8e14';
  for (const side of [-1,1]) {
    const center = side*.385, mirror = -side;
    const hand = (x: number,y: number,z: number): P => [center+mirror*x,y,z];
    // Palms and wrists are rounded continuous volumes; the two gloves never join.
    s.ellipsoid(yellow,...hand(0,.858,.008),.178,.231,.093);
    s.ellipsoid(lit,...hand(-.014,.871,.044),.151,.191,.065);
    s.ellipsoid(yellow,...hand(.002,.679,.006),.115,.117,.082);
    // Four long fingers taper towards the fingertips, with room between them.
    const fingers: [number,number,number,number][] = [
      [-.139,1.001,-.191,1.183],[-.058,1.034,-.08,1.332],
      [.035,1.047,.057,1.372],[.119,1.009,.148,1.246],
    ];
    for (let i = 0; i < fingers.length; i++) {
      const [x,y,tipX,tipY] = fingers[i], r = i === 0 ? .035 : .038;
      s.tube(i%2 ? lit : yellow,[hand(x,y,.008),hand((x+tipX)*.5,(y+tipY)*.5,.015),hand(tipX,tipY,.007)],r,14);
      s.ellipsoid('#f9d84d',...hand(tipX-.006,tipY-.008,.026),r*.62,r*.82,r*.5);
      const creaseY = y+(tipY-y)*.38, creaseX = x+(tipX-x)*.38;
      s.rod('#c99f19',hand(creaseX-.019,creaseY,.048),hand(creaseX+.016,creaseY+.004,.048),.0035);
    }
    // The fifth digit curls inward from the palm, rather than being another spike.
    s.tube(yellow,[hand(.114,.808,.025),hand(.199,.879,.036),hand(.235,.988,.034),hand(.239,1.058,.013)],.045,18);
    s.ellipsoid('#f8d340',...hand(.235,1.039,.041),.029,.04,.027);
    s.tube('#d2a31c',[hand(.082,.79,.089),hand(.119,.826,.096),hand(.134,.88,.089)],.005,10);
    s.tube('#edc82f',[hand(-.083,.744,.073),hand(-.01,.723,.079),hand(.067,.75,.073)],.006,10);
    // Square reinforced cuffs have rounded corners, a golden welt and tiny rivets.
    s.box(yellow,...hand(0,.563,.014),.289,.176,.201);
    s.box(lit,...hand(0,.573,.123),.274,.138,.014);
    for (const x of [-.135,.135]) {
      for (const y of [.49,.634]) s.ellipsoid(yellow,...hand(x,y,.016),.027,.027,.102);
      s.rod('#edc32a',hand(x,.493,.118),hand(x,.635,.118),.012);
    }
    s.rod(shade,hand(-.133,.486,.121),hand(.133,.486,.121),.008);
    s.rod('#ffdc4f',hand(-.135,.643,.118),hand(.135,.643,.118),.009);
    for (const x of [-.112,.111]) {
      s.ellipsoid('#936e1e',...hand(x,.518,.136),.012,.016,.006);
      s.ellipsoid('#f4d459',...hand(x-.003,.523,.14),.004,.005,.003);
    }
    const eye = hand(-.053,.574,.143);
    s.ellipsoid('#a57d22',...eye,.054,.066,.014);
    s.ellipsoid('#2c2345',eye[0],eye[1],eye[2]+.012,.043,.051,.012);
    s.ellipsoid('#f8f2e9',eye[0]-.011,eye[1]+.018,eye[2]+.024,.017,.019,.005);
    s.ellipsoid('#8d879b',eye[0]+.013,eye[1]-.021,eye[2]+.025,.009,.009,.004);
    // A short dark ankle and two small splayed boots support each separate glove.
    s.ellipsoid('#33264b',...hand(0,.417,0),.103,.079,.074);
    for (const foot of [-1,1]) {
      s.rod('#302445',hand(foot*.043,.418,.011),hand(foot*.067,.333,.023),.04);
      s.ellipsoid('#29203f',...hand(foot*.08,.298,.07),.077,.05,.104);
      s.ellipsoid('#46325e',...hand(foot*.087,.317,.087),.064,.04,.082);
      s.rod('#584071',hand(foot*.078-.021,.34,.074),hand(foot*.078+.017,.34,.074),.006);
    }
  }
  return s.finish();
}

export const SCULPTS_K_PROPS: Record<string, () => THREE.BufferGeometry> = {
  mon_ashpan: ashpan,
  mon_ypipe: ypipe,
  mon_glovepair: glovepair,
};
