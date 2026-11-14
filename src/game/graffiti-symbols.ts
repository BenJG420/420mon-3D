/** Original vector illustrations; deliberately distinct silhouettes, not a font icon set. */
export const GRAFFITI_SUBJECTS = [
  "sneaker", "pigeon", "boombox", "leaf", "watering-can", "sunflower",
  "circuit-eye", "cassette", "plug", "pear", "coffee", "scales",
  "projector", "film-reel", "popcorn", "lighthouse", "anchor", "wave",
  "rat", "fishbone", "manhole", "phoenix", "match", "chimney",
  "octopus", "pipe", "umbrella", "flask", "molecule", "gas-mask",
  "boxing-glove", "trophy", "bell", "maze", "key", "moth",
  "heart", "rose", "moon", "robot", "gear", "magnet",
] as const;

type P = readonly [number, number];

/** Draw within a 156×156 square centred at the origin; caller owns layout/scale. */
export function drawGraffitiSymbol(ctx: CanvasRenderingContext2D, subject: string, ink: string, accent: string) {
  ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round";
  const path = (draw: () => void, fill: string | null = accent, width = 4) => {
    ctx.beginPath(); draw();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    ctx.strokeStyle = ink; ctx.lineWidth = width; ctx.stroke();
  };
  const line = (points: readonly P[], width = 4, color = ink) => {
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath();
    points.forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.stroke();
  };
  const poly = (points: readonly P[], fill: string | null = accent, width = 4) => path(() => {
    points.forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.closePath();
  }, fill, width);
  const oval = (x: number, y: number, rx: number, ry = rx, fill: string | null = accent, angle = 0, width = 4) =>
    path(() => ctx.ellipse(x,y,rx,ry,angle,0,Math.PI*2),fill,width);
  const rect = (x: number,y: number,w: number,h: number,fill: string | null = accent) =>
    poly([[x,y],[x+w,y],[x+w,y+h],[x,y+h]],fill);
  const dot = (x: number,y: number,r=3,color=ink) => {ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();};
  switch (subject) {
    case "sneaker":
      poly([[-66,20],[-58,-34],[-31,-30],[-15,-5],[20,14],[62,24],[68,45],[38,53],[-60,48]]);
      line([[-63,34],[-29,38],[10,38],[63,36]],5); line([[-60,47],[42,52],[68,45]],6);
      poly([[-52,-26],[-35,-22],[-27,6],[-53,9]],ink,2);
      for(let i=0;i<4;i++)line([[-25+i*11,-10+i*7],[-13+i*11,-17+i*7]],3);
      line([[-20,15],[0,29],[29,24]],5); for(let i=0;i<7;i++)line([[-43+i*13,43],[-39+i*13,48]],2);
      break;
    case "pigeon":
      path(()=>{ctx.moveTo(-48,40);ctx.bezierCurveTo(-64,12,-42,-15,-13,-10);ctx.bezierCurveTo(2,-6,5,-27,7,-45);ctx.bezierCurveTo(8,-65,39,-68,48,-46);ctx.bezierCurveTo(55,-22,30,-12,29,9);ctx.bezierCurveTo(38,42,4,59,-29,52);ctx.closePath();});
      poly([[45,-43],[66,-36],[47,-31]],ink,2); dot(34,-45,4);
      path(()=>{ctx.moveTo(-39,5);ctx.bezierCurveTo(-5,-11,16,5,15,23);ctx.bezierCurveTo(-2,42,-29,39,-43,24);},null,3);
      line([[-38,22],[-15,29],[5,17]],3); line([[-26,50],[-28,64],[-38,68]],3);line([[0,52],[4,65],[17,67]],3);
      break;
    case "boombox":
      rect(-67,-29,134,79);line([[-32,-30],[-32,-53],[32,-53],[32,-30]],6);
      oval(-40,13,20);oval(-40,13,10,10,ink);oval(40,13,20);oval(40,13,10,10,ink);
      rect(-15,-11,30,23,ink);line([[-10,-5],[10,-5]],2,accent);line([[-9,3],[7,3]],2,accent);
      for(let i=0;i<6;i++)line([[-11+i*5,27],[-11+i*5,38]],2);
      line([[-57,-21],[-38,-21]],3);dot(48,-20,4);dot(58,-20,3);line([[49,-31],[63,-69]],3);
      break;
    case "leaf":
      poly([[0,64],[-9,31],[-40,44],[-28,16],[-66,6],[-33,-7],[-54,-40],[-17,-24],[0,-72],[17,-24],[54,-40],[33,-7],[66,6],[28,16],[40,44],[9,31]]);
      line([[0,66],[0,-49]],4);for(const side of [-1,1]){line([[0,11],[side*39,-28]],3);line([[0,18],[side*46,4]],3);line([[0,27],[side*27,32]],3);}
      break;
    case "watering-can":
      oval(-39,0,24,35,null);rect(-39,-25,76,67);oval(-1,-26,38,10);
      poly([[35,-4],[65,-43],[72,-32],[42,30]]);oval(66,-39,10,15,accent,.58);
      for(let i=0;i<4;i++)dot(64+(i%2)*5,-46+Math.floor(i/2)*9,1.7);
      line([[-14,-35],[-10,-49],[15,-49],[20,-35]],5);line([[-25,-10],[-25,28]],3);line([[-38,40],[34,40]],3);
      break;
    case "sunflower":
      line([[1,17],[-3,72]],6);poly([[-2,51],[-35,35],[-34,54],[-5,61]]);poly([[-2,42],[26,26],[31,45],[0,53]]);
      for(let i=0;i<12;i++){const a=i*Math.PI/6;oval(Math.cos(a)*38,-19+Math.sin(a)*38,13,23,accent,a+Math.PI/2,3);}
      oval(0,-19,24,24,ink);for(let i=0;i<12;i++){const a=i*2.4,r=7+(i%3)*5;dot(Math.cos(a)*r,-19+Math.sin(a)*r,2,accent);}
      break;
    case "circuit-eye":
      path(()=>{ctx.moveTo(-62,0);ctx.quadraticCurveTo(0,-56,62,0);ctx.quadraticCurveTo(0,56,-62,0);ctx.closePath();});
      oval(0,0,22,22,ink);oval(0,0,10,10,accent,0,2);dot(-4,-5,3,ink);
      for(const side of [-1,1]) {line([[side*26,-27],[side*40,-46],[side*64,-46]],3);dot(side*67,-46,4);line([[side*25,28],[side*43,46],[side*59,46],[side*59,61]],3);dot(side*59,65,4);}
      line([[0,-32],[0,-65]],3);dot(0,-69,4);line([[0,33],[0,67]],3);dot(0,69,3);
      break;
    case "cassette":
      poly([[-67,-46],[67,-46],[67,42],[52,52],[-52,52],[-67,42]]);
      rect(-54,-33,108,48,ink);oval(-28,-9,16,16,accent);oval(28,-9,16,16,accent);line([[-10,-14],[10,-14],[10,-4],[-10,-4],[-10,-14]],2,accent);
      for(const x of [-28,28])for(let i=0;i<6;i++){const a=i*Math.PI/3;line([[x+Math.cos(a)*7,-9+Math.sin(a)*7],[x+Math.cos(a)*13,-9+Math.sin(a)*13]],2);}
      poly([[-37,27],[37,27],[46,47],[-46,47]],null,3);for(const x of [-58,58]){dot(x,-38,2);dot(x,35,2);}
      break;
    case "plug":
      path(()=>{ctx.moveTo(0,24);ctx.lineTo(0,45);ctx.bezierCurveTo(0,72,-56,72,-56,42);ctx.bezierCurveTo(-56,18,-34,27,-35,10);},null,7);
      rect(-29,-34,58,59);rect(-21,-62,11,28,ink);rect(10,-62,11,28,ink);
      line([[-29,-6],[29,-6]],3);line([[-16,7],[16,7]],3);poly([[-2,-28],[-14,-10],[-3,-10],[-11,2],[12,-17],[2,-17],[10,-28]],ink,2);
      break;
    case "pear":
      path(()=>{ctx.moveTo(-4,-49);ctx.bezierCurveTo(-27,-47,-20,-16,-37,3);ctx.bezierCurveTo(-74,53,-18,69,9,62);ctx.bezierCurveTo(61,66,67,25,40,4);ctx.bezierCurveTo(21,-15,22,-45,7,-49);ctx.closePath();});
      line([[1,-47],[6,-69]],6);path(()=>{ctx.moveTo(7,-59);ctx.quadraticCurveTo(28,-76,48,-59);ctx.quadraticCurveTo(29,-44,7,-59);});
      line([[-27,14],[-35,30],[-31,42]],4);for(const [x,y] of [[12,27],[22,43],[4,49],[32,23]])dot(x,y,2);
      break;
    case "coffee":
      oval(43,1,23,25,null);path(()=>{ctx.moveTo(-46,-27);ctx.lineTo(37,-27);ctx.lineTo(32,37);ctx.quadraticCurveTo(-3,55,-37,37);ctx.closePath();});
      oval(-5,-26,41,9);oval(-4,-25,30,4,ink,0,2);oval(-4,51,58,8,null);
      for(const x of [-23,0,23])path(()=>{ctx.moveTo(x,-40);ctx.bezierCurveTo(x+18,-52,x-13,-59,x+1,-73);},null,3);
      poly([[-8,-4],[-21,13],[-7,32],[7,15]],ink,2);line([[-6,2],[-13,13],[-6,24]],2,accent);
      break;
    case "scales":
      line([[0,-55],[0,54]],7);poly([[-32,62],[32,62],[21,48],[-21,48]]);oval(0,-54,8);
      line([[-61,-31],[61,-43]],6);
      for(const side of [-1,1]){const y=side<0?-31:-43;line([[side*47,y],[side*67,y+46]],3);line([[side*47,y],[side*27,y+46]],3);path(()=>{ctx.moveTo(side*67,y+46);ctx.quadraticCurveTo(side*47,y+68,side*27,y+46);ctx.closePath();});}
      break;
    case "projector":
      oval(-28,-43,23);oval(23,-45,27);for(const [x,y] of [[-28,-43],[23,-45]])for(let i=0;i<3;i++){const a=i*Math.PI*2/3;dot(x+Math.cos(a)*12,y+Math.sin(a)*12,5);}
      rect(-52,-18,95,59);poly([[43,-4],[66,-13],[66,31],[43,23]]);
      line([[-34,43],[-47,64]],6);line([[24,43],[38,64]],6);rect(-40,-5,30,24,ink);
      for(let i=0;i<3;i++)line([[3+i*9,-3],[3+i*9,23]],3);dot(-24,31,3);
      break;
    case "film-reel":
      oval(-7,-7,54);oval(-7,-7,12,12,ink);for(let i=0;i<5;i++){const a=i*Math.PI*2/5;oval(-7+Math.cos(a)*32,-7+Math.sin(a)*32,12,12,ink,0,2);}
      path(()=>{ctx.moveTo(35,27);ctx.bezierCurveTo(65,27,58,54,31,53);ctx.bezierCurveTo(12,52,20,69,61,67);},null,13);
      line([[32,51],[38,51]],2,accent);line([[49,64],[54,65]],2,accent);line([[47,35],[50,40]],2,accent);
      break;
    case "popcorn":
      poly([[-48,-18],[48,-18],[34,66],[-34,66]]);
      for(const x of [-24,0,24])poly([[x-7,-15],[x+7,-15],[x+5,62],[x-5,62]],ink,2);
      for(const [x,y,r] of [[-38,-27,16],[-20,-44,18],[3,-51,20],[29,-42,18],[43,-21,16],[10,-24,20],[-12,-22,16]]){
        oval(x,y,r,r,accent,0,3);line([[x-5,y-3],[x,y+3],[x+6,y-4]],2);
      }
      break;
    case "lighthouse":
      poly([[-25,58],[25,58],[17,-38],[-17,-38]]);rect(-23,-51,46,17);poly([[-30,-52],[0,-72],[30,-52]]);
      poly([[-18,-20],[19,-27],[20,-8],[-20,-1]],ink,2);poly([[-22,21],[22,13],[24,32],[-24,40]],ink,2);
      rect(-8,39,16,19,ink);line([[-44,64],[-22,60],[0,65],[24,61],[47,65]],4);
      poly([[-28,-47],[-70,-63],[-70,-26]],null,2);poly([[28,-47],[70,-63],[70,-26]],null,2);
      break;
    case "anchor":
      oval(0,-49,17,17,null);line([[0,-31],[0,53]],9);line([[-32,-15],[32,-15]],7);
      path(()=>{ctx.moveTo(-59,8);ctx.bezierCurveTo(-60,55,-21,60,0,69);ctx.bezierCurveTo(21,60,60,55,59,8);},null,8);
      poly([[-69,25],[-59,3],[-43,25]],ink,2);poly([[69,25],[59,3],[43,25]],ink,2);
      break;
    case "wave":
      path(()=>{ctx.moveTo(-69,45);ctx.bezierCurveTo(-17,48,-36,-30,22,-49);ctx.bezierCurveTo(59,-64,80,-17,53,2);ctx.bezierCurveTo(42,11,26,3,28,-10);ctx.bezierCurveTo(3,9,28,37,67,42);ctx.lineTo(67,61);ctx.lineTo(-69,61);ctx.closePath();});
      path(()=>{ctx.moveTo(-51,39);ctx.bezierCurveTo(-16,20,-22,-11,11,-26);ctx.bezierCurveTo(35,-37,49,-27,48,-15);},null,5);
      for(const [x,y] of [[-24,-21],[-10,-46],[12,-60],[40,-51],[62,-33]])oval(x,y,5,8,accent,-.5,2);
      line([[-49,53],[-15,50],[16,55],[48,51]],3);
      break;
    case "rat":
      path(()=>{ctx.moveTo(-39,35);ctx.bezierCurveTo(-71,51,-74,-13,-51,-26);ctx.bezierCurveTo(-42,-33,-44,-49,-62,-52);},null,6);
      oval(-5,16,42,31);poly([[18,-4],[42,-24],[68,-2],[42,19],[25,27]]);oval(31,-25,14,17);oval(32,-25,6,8,ink,0,2);
      dot(48,-5,4);dot(67,-2,5);line([[61,5],[73,10]],2);line([[60,-2],[73,-9]],2);
      line([[-23,42],[-28,56],[-14,56]],5);line([[19,42],[28,55],[39,55]],5);line([[-22,2],[-8,-1],[5,4]],3);
      break;
    case "fishbone":
      poly([[29,-13],[50,-34],[72,-5],[54,21],[29,15]]);dot(56,-6,5);
      line([[-46,0],[31,0]],7);poly([[-46,0],[-70,-26],[-66,24]],accent,4);
      for(let i=0;i<5;i++){const x=-28+i*12,h=18+Math.sin(i/4*Math.PI)*13;line([[x-8,-h],[x,0],[x-8,h]],4);}
      break;
    case "manhole":
      oval(0,4,69,49);oval(0,4,57,39,ink,0,3);oval(0,4,47,30,accent,0,3);
      for(const y of [-12,4,20])line([[-40,y],[40,y]],4);for(const x of [-28,-10,10,28])line([[x,-20],[x,28]],4);
      for(let i=0;i<8;i++){const a=i*Math.PI/4;dot(Math.cos(a)*61,4+Math.sin(a)*42,3);}
      line([[-51,-53],[-44,-63]],3);line([[0,-54],[2,-70]],3);line([[49,-52],[58,-63]],3);
      break;
    case "phoenix":
      poly([[0,-56],[-14,-35],[-22,-7],[-58,-48],[-48,-12],[-72,-24],[-58,13],[-31,30],[-47,56],[-17,43],[0,72],[17,43],[47,56],[31,30],[58,13],[72,-24],[48,-12],[58,-48],[22,-7],[14,-35]]);
      poly([[-6,-47],[12,-45],[3,-36]],ink,2);line([[0,-25],[0,30]],4);
      for(const side of [-1,1]){line([[side*14,11],[side*50,-12]],3);line([[side*18,25],[side*45,12]],3);line([[side*9,37],[side*22,52]],3);}
      break;
    case "match":
      poly([[-12,68],[3,72],[31,-9],[15,-16]]);oval(24,-18,16,19,ink,-.35);
      path(()=>{ctx.moveTo(9,-18);ctx.bezierCurveTo(-18,-42,20,-45,16,-73);ctx.bezierCurveTo(38,-59,31,-39,47,-42);ctx.bezierCurveTo(55,-19,35,-8,9,-18);ctx.closePath();});
      path(()=>{ctx.moveTo(21,-23);ctx.quadraticCurveTo(12,-36,29,-50);ctx.quadraticCurveTo(27,-35,36,-32);ctx.quadraticCurveTo(36,-21,21,-23);},ink,2);
      line([[-30,-30],[-42,-37]],3);line([[58,-52],[67,-61]],3);line([[-15,-60],[-21,-69]],3);
      break;
    case "chimney":
      rect(-29,-5,58,69);rect(-36,-18,72,16);line([[-29,17],[29,17]],3);line([[-29,41],[29,41]],3);
      line([[0,-3],[0,16]],3);line([[-13,18],[-13,40]],3);line([[13,42],[13,62]],3);
      path(()=>{ctx.moveTo(-14,-20);ctx.bezierCurveTo(-43,-31,-20,-49,-7,-41);ctx.bezierCurveTo(-27,-64,12,-79,25,-58);ctx.bezierCurveTo(51,-65,64,-38,40,-25);},null,6);
      line([[-39,65],[42,65]],5);
      break;
    case "octopus":
      oval(0,-20,35,43);oval(-12,-19,8,11,ink);oval(12,-19,8,11,ink);dot(-14,-22,2,accent);dot(10,-22,2,accent);
      for(let i=0;i<8;i++) {const x=(i-3.5)*8,end=(i-3.5)*18;
        path(()=>{ctx.moveTo(x,12);ctx.bezierCurveTo(x*1.8,44,end,66,end,36);},null,8);
        dot(end*.76,44,2,accent);
      }line([[-7,2],[0,8],[7,2]],3);
      break;
    case "pipe":
      path(()=>{ctx.moveTo(-64,-26);ctx.lineTo(-9,-26);ctx.quadraticCurveTo(33,-26,33,16);ctx.lineTo(33,59);ctx.lineTo(4,59);ctx.lineTo(4,14);ctx.quadraticCurveTo(4,3,-9,3);ctx.lineTo(-64,3);ctx.closePath();});
      rect(-65,-34,16,46);rect(-3,53,44,15);line([[-45,-18],[-13,-18]],3);line([[25,20],[25,45]],3);
      oval(18,-47,20,20,null);line([[18,-27],[18,-9]],5);line([[0,-47],[36,-47]],3);line([[18,-66],[18,-29]],3);
      break;
    case "umbrella":
      path(()=>{ctx.moveTo(-68,-1);ctx.quadraticCurveTo(-50,-59,0,-62);ctx.quadraticCurveTo(50,-59,68,-1);ctx.quadraticCurveTo(48,-16,34,0);ctx.quadraticCurveTo(15,-15,0,0);ctx.quadraticCurveTo(-15,-15,-34,0);ctx.quadraticCurveTo(-48,-16,-68,-1);ctx.closePath();});
      path(()=>{ctx.moveTo(0,-61);ctx.quadraticCurveTo(-26,-36,-34,0);ctx.moveTo(0,-61);ctx.quadraticCurveTo(26,-36,34,0);},null,3);
      path(()=>{ctx.moveTo(0,-64);ctx.lineTo(0,49);ctx.bezierCurveTo(0,72,-29,72,-29,51);},null,6);
      line([[-54,24],[-59,35]],3);line([[43,19],[37,31]],3);line([[63,43],[57,54]],3);
      break;
    case "flask":
      path(()=>{ctx.moveTo(-14,-62);ctx.lineTo(14,-62);ctx.lineTo(14,-17);ctx.lineTo(55,51);ctx.quadraticCurveTo(61,63,43,65);ctx.lineTo(-43,65);ctx.quadraticCurveTo(-61,63,-55,51);ctx.lineTo(-14,-17);ctx.closePath();});
      line([[-20,-62],[20,-62]],7);poly([[-30,15],[31,15],[48,51],[40,55],[-42,55],[-48,49]],ink,2);
      oval(-10,36,7,7,accent,0,2);oval(17,45,5,5,accent,0,2);oval(8,3,6);oval(-4,-20,4);
      line([[25,1],[33,1]],3);line([[33,17],[40,17]],3);line([[42,33],[49,33]],3);
      break;
    case "molecule":
      line([[-47,-31],[0,0],[43,-40]],7);line([[0,0],[15,56]],7);line([[-47,-31],[-51,35]],5);line([[15,56],[-51,35]],5);
      oval(-47,-31,19);oval(43,-40,22);oval(0,0,21,21,ink);oval(15,56,16);oval(-51,35,15);
      dot(-53,-38,5,ink);dot(36,-47,6,ink);dot(10,51,4,ink);dot(-57,30,4,ink);oval(64,17,8,8,null,0,3);
      break;
    case "gas-mask":
      path(()=>{ctx.moveTo(-42,-47);ctx.quadraticCurveTo(0,-70,42,-47);ctx.lineTo(49,5);ctx.quadraticCurveTo(35,46,0,62);ctx.quadraticCurveTo(-35,46,-49,5);ctx.closePath();});
      oval(-23,-15,21,25,ink,.15);oval(23,-15,21,25,ink,-.15);line([[-32,-26],[-18,-33]],4,accent);line([[14,-28],[27,-34]],4,accent);
      oval(0,29,23);for(const x of [-12,-4,4,12])line([[x,17],[x,40]],3);oval(-52,18,13,24);oval(52,18,13,24);
      break;
    case "boxing-glove":
      path(()=>{ctx.moveTo(-31,39);ctx.bezierCurveTo(-60,21,-65,-13,-39,-22);ctx.bezierCurveTo(-50,-66,21,-77,43,-48);ctx.bezierCurveTo(60,-25,58,13,35,36);ctx.lineTo(28,59);ctx.lineTo(-29,59);ctx.closePath();});
      rect(-31,37,64,29);line([[-24,48],[25,48]],3);path(()=>{ctx.moveTo(-37,-21);ctx.quadraticCurveTo(-12,-19,-18,15);},null,4);
      line([[-24,-48],[9,-57],[34,-40]],3);for(let i=0;i<4;i++)line([[-17+i*11,41],[-12+i*11,57]],2);
      break;
    case "trophy":
      oval(-44,-20,25,28,null);oval(44,-20,25,28,null);
      path(()=>{ctx.moveTo(-39,-54);ctx.lineTo(39,-54);ctx.lineTo(33,2);ctx.quadraticCurveTo(0,37,-33,2);ctx.closePath();});
      line([[0,23],[0,49]],9);poly([[-29,51],[29,51],[36,66],[-36,66]]);
      poly([[0,-42],[7,-25],[25,-23],[11,-10],[15,7],[0,-2],[-15,7],[-11,-10],[-25,-23],[-7,-25]],ink,2);
      break;
    case "bell":
      oval(0,-56,10,10,null);path(()=>{ctx.moveTo(-49,34);ctx.quadraticCurveTo(-32,18,-31,-14);ctx.bezierCurveTo(-31,-58,31,-58,31,-14);ctx.quadraticCurveTo(32,18,49,34);ctx.closePath();});
      oval(0,38,51,10);oval(0,53,12,14,ink);line([[-20,-14],[-18,15]],4);
      for(const side of [-1,1]){line([[side*49,-31],[side*64,-42]],4);line([[side*56,-9],[side*72,-10]],4);}
      break;
    case "maze":
      rect(-66,-66,132,132,null);line([[-49,-65],[-49,16],[-17,16],[-17,49],[16,49],[16,66]],6);
      line([[-49,-33],[16,-33],[16,0],[49,0],[49,49]],6);line([[-17,-33],[-17,-1],[-1,-1]],6);
      line([[16,-65],[16,-49],[49,-49],[49,-16],[66,-16]],6);line([[-65,49],[-33,49]],6);line([[16,16],[16,31],[34,31]],6);dot(-34,-49,5);dot(49,16,5);
      break;
    case "key":
      oval(-31,-28,31);oval(-31,-28,13,13,ink);poly([[-12,-7],[59,49],[50,61],[36,50],[27,61],[15,50],[23,39],[-26,5]]);
      line([[-17,-6],[44,43]],3);line([[57,-41],[67,-49]],3);line([[43,-53],[45,-68]],3);line([[65,-22],[74,-22]],3);
      break;
    case "moth":
      for(const side of [-1,1]){path(()=>{ctx.moveTo(side*7,-13);ctx.bezierCurveTo(side*34,-70,side*73,-64,side*67,-20);ctx.bezierCurveTo(side*69,7,side*44,18,side*15,16);ctx.bezierCurveTo(side*61,27,side*58,58,side*34,62);ctx.quadraticCurveTo(side*10,59,side*6,29);ctx.closePath();});
        oval(side*43,-20,14,18,ink);oval(side*43,-20,6,8,accent,0,2);line([[side*15,11],[side*39,47]],3);
      }
      oval(0,6,8,39,ink);line([[-4,-31],[-16,-54]],3);line([[4,-31],[16,-54]],3);dot(-16,-55,3);dot(16,-55,3);
      break;
    case "heart":
      path(()=>{ctx.moveTo(0,65);ctx.bezierCurveTo(-16,49,-70,12,-66,-21);ctx.bezierCurveTo(-62,-64,-15,-69,0,-35);ctx.bezierCurveTo(15,-69,62,-64,66,-21);ctx.bezierCurveTo(70,12,16,49,0,65);ctx.closePath();});
      poly([[-66,14],[-51,-10],[65,-10],[51,14]],ink,2);line([[-40,1],[39,1]],3,accent);
      path(()=>{ctx.moveTo(-47,-29);ctx.quadraticCurveTo(-38,-48,-22,-38);},null,4);line([[-2,25],[9,33],[2,42]],3);
      break;
    case "rose":
      line([[1,13],[-7,72]],6);poly([[-5,49],[-34,30],[-35,51],[-7,60]]);poly([[-2,35],[28,20],[28,39],[-3,48]]);
      path(()=>{ctx.moveTo(-39,-45);ctx.quadraticCurveTo(-8,-71,25,-57);ctx.quadraticCurveTo(59,-40,43,-8);ctx.quadraticCurveTo(28,23,-9,19);ctx.quadraticCurveTo(-49,16,-48,-17);ctx.closePath();});
      path(()=>{ctx.moveTo(-32,-39);ctx.quadraticCurveTo(8,-56,24,-28);ctx.quadraticCurveTo(28,-8,-1,-6);ctx.quadraticCurveTo(-22,-7,-17,-25);ctx.quadraticCurveTo(-10,-37,6,-24);},null,4);
      line([[-41,-9],[-13,7],[18,8],[39,-16]],3);line([[27,-53],[30,-27],[12,-8]],3);
      break;
    case "moon":
      path(()=>{ctx.moveTo(22,-65);ctx.bezierCurveTo(-59,-70,-75,21,-21,58);ctx.bezierCurveTo(2,74,40,66,56,45);ctx.bezierCurveTo(-4,53,-37,-30,22,-65);ctx.closePath();});
      for(const [x,y,r] of [[42,-35,9],[65,2,6],[10,31,5]])poly([[x,y-r],[x+3,y-3],[x+r,y],[x+3,y+3],[x,y+r],[x-3,y+3],[x-r,y],[x-3,y-3]],ink,2);
      oval(-36,2,7,7,null,0,2);oval(-28,31,5,5,null,0,2);
      break;
    case "robot":
      line([[0,-49],[0,-66]],5);dot(0,-69,5);rect(-46,-45,92,74);rect(-30,30,60,36);
      oval(-20,-16,12,12,ink);oval(20,-16,12,12,ink);dot(-23,-19,3,accent);dot(17,-19,3,accent);
      rect(-25,6,50,12,ink);for(let i=0;i<4;i++)line([[-17+i*11,8],[-17+i*11,16]],2,accent);
      rect(-61,-23,15,34);rect(46,-23,15,34);line([[-16,42],[16,42]],4);dot(0,55,4);
      break;
    case "gear": {
      const points:P[]=[];for(let i=0;i<48;i++){const a=i*Math.PI/24,r=i%4===0||i%4===3?61:72;points.push([Math.cos(a)*r,Math.sin(a)*r]);}poly(points);
      oval(0,0,42,42,ink);oval(0,0,19,19,accent);for(let i=0;i<6;i++){const a=i*Math.PI/3;dot(Math.cos(a)*52,Math.sin(a)*52,3);}
      break;
    }
    case "magnet":
      path(()=>{ctx.moveTo(-55,-56);ctx.lineTo(-22,-56);ctx.lineTo(-22,13);ctx.bezierCurveTo(-22,43,22,43,22,13);ctx.lineTo(22,-56);ctx.lineTo(55,-56);ctx.lineTo(55,15);ctx.bezierCurveTo(55,83,-55,83,-55,15);ctx.closePath();});
      rect(-55,-56,33,27,ink);rect(22,-56,33,27,ink);line([[-45,-43],[-31,-43]],3,accent);line([[31,-43],[45,-43]],3,accent);line([[38,-50],[38,-36]],3,accent);
      for(const side of [-1,1]){line([[side*15,-26],[side*3,-37],[side*14,-49]],3);line([[side*67,-34],[side*72,-22]],3);}
      break;
  }
  ctx.restore();
}
