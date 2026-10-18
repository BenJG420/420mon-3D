import assert from 'node:assert/strict';
import {test,after} from 'node:test';
import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true},appType:'custom',logLevel:'silent'});after(()=>server.close());
globalThis.localStorage={getItem:()=>null,setItem:()=>{}};globalThis.window=new EventTarget();
const {consumeSmoke,consumeFish,fishEffectMultiplier,activeFishEffects}=await server.ssrLoadModule('/src/game/fish-consumption.ts');
const {ITEMS}=await server.ssrLoadModule('/src/game/data/items.ts');
const {battleCatchBoost,battleXpBoost,battleGoldReward}=await server.ssrLoadModule('/src/game/battle-rewards.ts');
const {getSave}=await server.ssrLoadModule('/src/game/save.ts');
const fresh=structuredClone(getSave());
function state(inv){return {...structuredClone(fresh),inventory:inv,playtime:100,outfit:'wear_trashbag',map:'alley',team:[{hp:0,xp:17}]};}
test('every authentic joint/bud consumable spends exactly one and leaves team, inventory reference and HP0 untouched',()=>{
 for(const item of Object.values(ITEMS).filter(i=>i.use==='smoke'&&['smoke','bud'].includes(i.cat))){
  const s=state({[item.id]:2}),team=s.team,inventory=s.inventory;let commits=0;
  assert.equal(consumeSmoke(s,item.id,()=>{commits++;return true},()=>0).ok,true,item.id);
  assert.equal(s.inventory[item.id],1);assert.equal(commits,1);assert.equal(s.team,team);assert.equal(s.inventory,inventory);assert.deepEqual(s.team,[{hp:0,xp:17}]);assert.ok(activeFishEffects(s).length,item.id);
 }
});
test('joint catch stacks strongest value and duration up to 600 seconds; independent speed and expiry do not revive buffs',()=>{
 const s=state({joint_gold:1,joint_street:30,bud_haze:1});
 consumeSmoke(s,'joint_gold');assert.equal(battleCatchBoost(s),1.8);assert.equal(s.highCatchUntil,200);
 consumeSmoke(s,'joint_street');assert.equal(s.highCatch,1.8);assert.equal(s.highCatchUntil,242);
 for(let i=0;i<29;i++)consumeSmoke(s,'joint_street');assert.equal(s.highCatchUntil,700);
 const speed=Object.values(ITEMS).find(i=>i.cat==='bud'&&i.strain!=='hybrid'&&i.speedMul>1);s.inventory[speed.id]=1;consumeSmoke(s,speed.id);assert.equal(fishEffectMultiplier(s,'speed'),speed.speedMul);assert.equal(s.highCatchUntil,700);
 s.playtime=701;assert.equal(battleCatchBoost(s),1);assert.equal(fishEffectMultiplier(s,'speed'),1);
});
test('hybrid buds roll one/two different effects; Zero-Day grants exactly catch, speed, gold without RNG',()=>{
 for(const rolls of [1,2,3]){
  const item=Object.values(ITEMS).find(i=>i.cat==='bud'&&i.strain==='hybrid'&&(i.hybridRolls??1)===rolls);assert.ok(item);
  const s=state({[item.id]:1});let calls=0;consumeSmoke(s,item.id,()=>true,()=>{calls++;return .1});
  const effects=activeFishEffects(s);assert.equal(effects.length,rolls);assert.equal(new Set(effects.map(e=>e.id)).size,rolls);assert.equal(calls,rolls===3?0:3);
  if(rolls===3){assert.deepEqual(effects.map(e=>e.id),['catch','speed','gold']);assert.equal(battleGoldReward(s,100),Math.round(100*item.goldHigh));}
 }
});
test('XP consumables feed battle XP, fish coexists, legacy clocks persist and storage failures restore consumption',()=>{
 const xp=Object.values(ITEMS).find(i=>i.cat==='smoke'&&i.xpMul>1);const s=state({[xp.id]:1,joint_street:1,fish_neonbrasse:1});
 s.highSpeed=1.5;s.highUntil=150;delete s.highSpeedUntil;consumeSmoke(s,xp.id);assert.equal(battleXpBoost(s),xp.xpMul);assert.equal(s.highSpeedUntil,150);
 consumeFish(s,'fish_neonbrasse');assert.equal(battleXpBoost(s),xp.xpMul);
 const before=structuredClone(s);assert.equal(consumeSmoke(s,'joint_street',()=>false).ok,false);assert.deepEqual(s,before);
 assert.equal(consumeSmoke(s,'joint_street',()=>{throw Error('storage')}).ok,false);assert.deepEqual(s,before);
 for(const id of ['missing','seed_kush','fish_neonbrasse'])assert.equal(consumeSmoke(s,id).ok,false);
 assert.equal(consumeSmoke(s,xp.id).ok,false);
});
