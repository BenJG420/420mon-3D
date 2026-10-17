import assert from 'node:assert/strict';
import {test,after} from 'node:test';
import {createServer} from 'vite';
const server=await createServer({root:new URL('..',import.meta.url).pathname,server:{middlewareMode:true},appType:'custom',logLevel:'silent'});
after(()=>server.close());
globalThis.localStorage={getItem:()=>null,setItem:()=>{}};globalThis.window=new EventTarget();
const rules=await server.ssrLoadModule('/src/game/slot-rules.ts');
const slots=await server.ssrLoadModule('/src/game/slot-state.ts');
const save=await server.ssrLoadModule('/src/game/save.ts');
const {MAPS}=await server.ssrLoadModule('/src/game/data/maps.ts');
const fresh=structuredClone(save.getSave());
const state=extra=>({...structuredClone(fresh),gold:2000,inventory:{},stats:{},outfit:'wear_trashbag',...extra});
const grid=(machine,symbol)=>Array.from({length:machine.reels},()=>Array(machine.rows).fill(symbol));
function stops(machine,indices,extra=.99){let i=0;return()=>i<indices.length?(indices[i++]+.01)/machine.strip.length:extra;}
const buds=rules.machineById('buds'),fruit=rules.machineById('fruit'),free=rules.machineById('free');

test('all three original cabinets and games retain source reels, strips, 20/5/9 lines and exact stake ladder',()=>{
 assert.deepEqual(['studio','kino','kai'].map(id=>MAPS[id].objs.filter(obj=>obj.id.startsWith('slot_')).map(obj=>obj.id)),[['slot_keller'],['slot_kino'],['slot_kai']]);
 assert.deepEqual(rules.MACHINES.map(m=>[m.id,m.reels,m.rows,m.lines.length,m.strip.length]),[['buds',5,3,20,60],['fruit',3,3,5,36],['free',5,3,9,61]]);
 assert.deepEqual(rules.LINES[0],[1,1,1,1,1]);
 assert.equal(rules.stakeTotal(20,1000000),20000000);
 assert.equal(rules.stepBet(500000,1),1000000);assert.equal(rules.stepBet(1000,-1),500);
});
test('authentic left-to-right line, wild, scatter, fruit nudge and five-420 jackpot payouts',()=>{
 assert.equal(rules.evalGrid(buds,grid(buds,'four'),1,2).total,5000);
 assert.equal(rules.evalGrid(buds,grid(buds,'four'),20,2).total,100000);
 const wild=grid(buds,'joint');wild[0][1]='wild';wild[1][1]='wild';
 assert.equal(rules.evalGrid(buds,wild,1,3).total,180);
 assert.equal(rules.evalGrid(fruit,grid(fruit,'star'),5,2).total,1000);
 const scattered=grid(free,'joint');for(let i=0;i<3;i++)scattered[i][0]='scatter';
 const r=rules.evalGrid(free,scattered,1,2);assert.equal(r.scatterPay,6);assert.equal(r.freeAward,6);
 const nudge=rules.playSpin(fruit,1,1,stops(fruit,[0,1,6],0));assert.ok(nudge.total>=8);
});
test('invalid, fractional or unaffordable bets cannot debit or call persistence/RNG',()=>{
 for(const [machine,lines,bet] of [['bad',1,1],['buds',0,1],['buds',21,1],['fruit',6,1],['buds',1,0],['buds',1,1.5],['buds',NaN,1],['buds',1,Infinity],['buds',1,1000001],['buds',1.5,1]]){
  const s=state(),before=structuredClone(s);
  assert.equal(slots.settleSlotSpin(s,machine,lines,bet,()=>assert.fail('persist'),()=>assert.fail('rng')).ok,false);assert.deepEqual(s,before);
 }
 const s=state({gold:0});assert.equal(slots.settleSlotSpin(s,'buds',1,1,()=>assert.fail(),()=>assert.fail()).ok,false);assert.equal(s.gold,0);
});
test('one booking pays exact gross Softcash and counters without clothing/fish bonuses; no HP/XP or team reference change',()=>{
 const s=state({team:[{uid:'ko',id:'mon_puffpuff',name:'Puffpuff',hp:0,hpMax:50,level:5,xp:17}],outfit:'nude',flagLowtown:true,highGold:3,highUntil:Date.now()/1000+1000});
 const team=s.team,box=s.box,pots=s.pots,partners=structuredClone(s.team);let writes=0;
 const r=slots.settleSlotSpin(s,'buds',1,2,()=>{writes++;return true},stops(buds,[0,0,0,0,0]));
 assert.equal(r.ok,true);assert.equal(r.receipt.payout,160);assert.equal(r.receipt.stake,2);assert.equal(s.gold,2158);assert.equal(s.stats.goldEarned,160);assert.equal(writes,1);
 assert.equal(s.team,team);assert.equal(s.box,box);assert.equal(s.pots,pots);assert.deepEqual(s.team,partners);
 const reload=state(JSON.parse(JSON.stringify(s))),before=structuredClone(reload);
 assert.equal(slots.readSlotState(reload).last.payout,160);assert.deepEqual(reload,before,'reading/reopening never pays again');
});
test('five 420 pays jackpot rewards once per spin without inventing a unique Kiez find',()=>{
 const s=state();const start=buds.strip.indexOf('four')-1;
 const r=slots.settleSlotSpin(s,'buds',1,1,()=>true,stops(buds,[start,start,start,start,start]));
 assert.equal(r.ok,true);assert.equal(r.receipt.result.jackpot,true);assert.equal(s.gold,4499);
 assert.equal(s.inventory.seed_eddi,10);assert.equal(s.inventory.chip_crown,10);assert.deepEqual(s.foundLoot,[],'the original unique-find list excludes crown chips and Zero-Day seeds');
 const before=structuredClone(s);slots.readSlotState(s);slots.readSlotState(s);assert.deepEqual(s,before);
});
test('free awards retain locked source stake over reload/other games and consume zero Softcash with double payout',()=>{
 const s=state();const scatter=free.strip.indexOf('scatter');
 const award=slots.settleSlotSpin(s,'free',1,2,()=>true,stops(free,[scatter,scatter,scatter,0,0]));
 assert.equal(award.ok,true);assert.equal(award.receipt.result.freeAward,6);
 const bank=slots.readSlotState(s);assert.equal(bank.freeLeft,6);assert.equal(bank.freeBet,2);
 const reload=state(JSON.parse(JSON.stringify(s)));const before=structuredClone(reload);
 assert.equal(slots.settleSlotSpin(reload,'free',1,100,()=>assert.fail()).ok,false);assert.deepEqual(reload,before);
 slots.settleSlotSpin(reload,'fruit',1,1,()=>true,stops(fruit,[0,0,0]));assert.equal(slots.readSlotState(reload).freeLeft,6);
 const balance=reload.gold;const r=slots.settleSlotSpin(reload,'free',1,2,()=>true,stops(free,[0,0,0,0,0]));
 assert.equal(r.ok,true);assert.equal(r.receipt.free,true);assert.equal(r.receipt.stake,0);assert.equal(r.receipt.payout,320);assert.equal(reload.gold,balance+320);assert.equal(slots.readSlotState(reload).freeLeft,5);
});
test('failed or throwing save restores all fields and references, including derived quests/achievements and jackpot inventory',()=>{
 for(const throwing of [false,true]){
  const s=state(),before=structuredClone(s),team=s.team,inventory=s.inventory;const index=buds.strip.indexOf('four')-1;
  const r=slots.settleSlotSpin(s,'buds',1,1,()=>{s.ach={gold_1000:'done'};s.quests={transient:'done'};s.gold+=17;s.unrelatedTemporary=true;if(throwing)throw Error('disk full');return false},stops(buds,[index,index,index,index,index]));
  assert.equal(r.ok,false);assert.deepEqual(s,before);assert.equal(s.team,team);assert.equal(s.inventory,inventory);
 }
});
test('receipt normalization never trusts stored payouts or replays a spin; legacy and malformed banks remain safe',()=>{
 const s=state();assert.equal(slots.readSlotState(s).freeLeft,0);assert.equal('slotState' in s,false);
 s.slotState={version:1,freeLeft:Infinity,freeBet:100000000,freeLines:9,last:{machine:'buds',lines:1,bet:1,free:false,payout:1e99,result:{grid:grid(buds,'joint'),total:1e99},balanceBefore:50}};
 assert.equal(slots.readSlotState(s).freeLeft,0);assert.equal(slots.readSlotState(s).last.payout,60);assert.equal(s.gold,2000);
 s.slotState.last.result.grid=[['<script>']];assert.equal(slots.readSlotState(s).last,null);
});
