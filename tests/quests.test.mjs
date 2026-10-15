import assert from "node:assert/strict";
import { test, after } from "node:test";
import { createServer } from "vite";
const server = await createServer({root:new URL("..",import.meta.url).pathname,server:{middlewareMode:true},appType:"custom",logLevel:"silent"});
after(()=>server.close());
const quest = await server.ssrLoadModule("/src/game/quests.ts");
const loot = await server.ssrLoadModule("/src/game/loot.ts");
const npc = await server.ssrLoadModule("/src/game/npc-actions.ts");
const merchant = await server.ssrLoadModule("/src/game/merchant-state.ts");
const { restTeam } = await server.ssrLoadModule("/src/game/rest.ts");
const { QUEST_DEFS } = await server.ssrLoadModule("/src/game/data/quests.ts");
globalThis.localStorage={getItem:()=>null,setItem:()=>{}};
globalThis.window=new EventTarget();
const save = await server.ssrLoadModule("/src/game/save.ts");
const fresh=structuredClone(save.getSave());
const state=extra=>({...structuredClone(fresh),gold:0,inventory:{},...extra});
const bin=id=>({id,kind:"bin",label:"Tonne",x:0,y:0,w:18,h:18,sprite:"dumpster"});

test("24 original quests preserve completed legacy states and settle board rewards only once",()=>{
  const s=state({quest:{q1_bolt:true},quests:{custom:"done"},collection:["mon_puffpuff"],customFlag:"keep"});
  quest.syncQuests(s);
  assert.equal(QUEST_DEFS.length,24);assert.equal(s.quests.q1_bolt,"done");assert.equal(s.quests.custom,"done");
  assert.equal(s.quests.q_k_alley,"done");assert.equal(s.gold,16);
  quest.syncQuests(s);quest.setQuestState(s,"q1_bolt","active");
  assert.equal(s.gold,16);assert.equal(s.quests.q1_bolt,"done");assert.equal(s.customFlag,"keep");
});

test("original visit rewards and species home districts work independently of recommended level",()=>{
  const s=state({collection:["mon_budling"],team:[],trainerLv:1});
  quest.recordVisit(s,"market");
  assert.equal(s.quests.q_v_market,"done");assert.equal(s.quests.q_k_yard,"done");assert.equal(s.gold,37);
  quest.recordVisit(s,"market");assert.equal(s.gold,37);
  const progress=quest.questProgress(s,QUEST_DEFS.find(q=>q.id==="q_k_yard"));
  assert.equal(progress.done,true);assert.equal(progress.eligible,false);
});

test("three distinct containers count at playtime zero and cooldown prevents duplicated loot",()=>{
  const s=state({playtime:0});
  for(const id of ["one","two","three"]) assert.equal(loot.searchContainer(s,bin(id),"alley",()=>.9).searched,true);
  assert.equal(s.quests.q3_trash,"done");assert.equal(s.stats.binsSearched,3);
  const snapshot=structuredClone(s);
  assert.equal(loot.searchContainer(s,bin("one"),"alley",()=>.9).searched,false);
  assert.deepEqual(s,snapshot);
  s.playtime=76;assert.equal(loot.searchContainer(s,bin("one"),"alley",()=>.9).searched,true);
  assert.equal(Object.keys(s.searchedBins).length,3);
});

test("the warm data stick reaches Static and his source reward cannot repeat",()=>{
  const s=state({playtime:1});
  loot.searchContainer(s,bin("data"),"alley",()=>0);
  assert.equal(s.inventory.key_stick,1);assert.equal(s.stickFound,true);
  npc.talkStatic(s);assert.equal(s.inventory.key_stick,0);assert.equal(s.inventory.chip_neon,1);assert.equal(s.quests.q9_static,"done");
  const gold=s.gold;npc.talkStatic(s);assert.equal(s.gold,gold);assert.equal(s.inventory.chip_neon,1);
});

test("Silk calibration consumes the correct stick once, while Bolt preserves the original two-talk route",()=>{
  const s=state({outfit:"wear_trashbag",inventory:{key_silkstick:2,chip_junk:2}});
  npc.talkBolt(s);assert.equal(s.inventory.chip_junk,2);npc.talkBolt(s);assert.equal(s.inventory.chip_junk,1);assert.equal(s.quests.q1_bolt,"done");
  npc.giveSilkStick(s);assert.equal(s.catchPerm,1.08);assert.equal(s.inventory.key_silkstick,1);assert.equal(s.gold,28);
  npc.giveSilkStick(s);assert.equal(s.gold,28);assert.equal(s.inventory.key_silkstick,1);
});

test("mattress story rewards respect cooldown without blocking defeated partner revival",()=>{
  const s=state({playtime:0,team:[{id:"mon_budling",name:"Budling",level:5,xp:9,hp:0,hpMax:50,status:"poison"}]});
  const mat={...bin("mat"),kind:"mattress"};
  npc.mattressQuest(s,mat,"alley",()=>.9);assert.equal(s.quests.q8_mattress,"done");assert.equal(s.stats.sexEvents,1);
  const earned=s.gold;npc.mattressQuest(s,mat,"alley",()=>.9);assert.equal(s.gold,earned);assert.equal(s.stats.sexEvents,1);
  restTeam(s.team);assert.equal(s.team[0].hp,50);assert.equal(s.team[0].status,"");assert.equal(s.team[0].xp,9);
});

test("physical merchant sales fulfill the original Silk route atomically and Ben acknowledgement requires trainer level ten",()=>{
  const s=state({inventory:{bud_kush:1},trainerLv:9});
  const price=merchant.sellMerchantItem(s,"bud_kush");assert.ok(price>0);assert.equal(s.inventory.bud_kush,0);assert.equal(s.quests.q5_silk,"done");
  assert.equal(merchant.sellMerchantItem(s,"bud_kush"),0);assert.equal(s.gold,price);
  assert.equal(npc.acknowledgeBen(s),false);s.trainerLv=10;assert.equal(npc.acknowledgeBen(s),true);assert.equal(s.quests.q_ben,"done");
});

test("Lowtown finishes from its nine original threads without downgrading imported progress",()=>{
  const s=state();for(const id of ["q1_bolt","q2_harvest","q3_trash","q4_fight","q5_silk","q6_nude","q7_grow","q8_mattress","q9_static"])quest.setQuestState(s,id,"done");
  assert.equal(s.quests.q10_lowtown,"done");assert.equal(s.flagLowtown,true);assert.equal(s.ach.lowtown_all,"done");
  quest.syncQuests(s);assert.equal(s.quests.q10_lowtown,"done");
});
