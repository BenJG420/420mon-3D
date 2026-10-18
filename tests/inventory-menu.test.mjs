import assert from 'node:assert/strict';import {test,after} from 'node:test';import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true},appType:'custom',logLevel:'silent'});after(()=>server.close());
globalThis.localStorage={getItem:()=>null,setItem:()=>{}};globalThis.window=new EventTarget();
const {groupedInv,CAT_ORDER,ITEMS,itemUseLabel}=await server.ssrLoadModule('/src/game/data/items.ts');
const {healInventoryItem,PAUSE_ENTRIES}=await server.ssrLoadModule('/src/game/inventory-actions.ts');
test('2D inventory category order, German item sorting and total quantities retain unknown legacy items',()=>{
 const inv={joint_gold:3,potion_patch:2,bud_kush:7,joint_fat:1,old_custom_item:5,seed_kush:4,chip_junk:0};const before=structuredClone(inv);const groups=groupedInv(inv);
 assert.deepEqual(groups.map(g=>g.cat),CAT_ORDER.filter(c=>['heal','smoke','seed','bud','misc'].includes(c)));assert.deepEqual(groups.find(g=>g.cat==='smoke').rows.map(r=>r.id),['joint_fat','joint_gold']);assert.equal(groups.flatMap(g=>g.rows).reduce((n,r)=>n+r.n,0),22);assert.equal(groups.at(-1).rows[0].def.name,'old_custom_item');assert.deepEqual(inv,before);
 assert.equal(itemUseLabel(ITEMS.joint_gold),'Rauchen');assert.equal(itemUseLabel(ITEMS.potion_patch),'Heilen');assert.equal(itemUseLabel(ITEMS.wear_trashbag,'wear_trashbag'),'Ausziehen');
});
test('explicit healing partner selection preserves KO, other partners, references and item on invalid target',()=>{
 const ko={uid:'ko',name:'KO',level:5,hp:0,hpMax:50,xp:17},a={uid:'a',name:'A',level:5,hp:2,hpMax:50},b={uid:'b',name:'B',level:5,hp:3,hpMax:50};const s={team:[ko,a,b],inventory:{potion_patch:2}},team=s.team;
 for(const uid of ['ko','missing']){assert.equal(healInventoryItem(s,'potion_patch',uid).ok,false);assert.equal(s.inventory.potion_patch,2);}
 assert.equal(healInventoryItem(s,'potion_patch','b').ok,true);assert.equal(a.hp,2);assert.ok(b.hp>3);assert.equal(ko.hp,0);assert.equal(ko.xp,17);assert.equal(s.team,team);assert.equal(s.inventory.potion_patch,1);
 assert.equal(healInventoryItem(s,'seed_kush','b').ok,false);
});
test('Pause keeps the authentic original destination order, with no freely accessible shop',()=>{
 assert.deepEqual(PAUSE_ENTRIES.map(r=>r[0]),['help','net','post','log','bag','dex','quest','ach','team','world','home','feedback']);
 assert.equal(PAUSE_ENTRIES.some(r=>r[0]==='shop'),false);
});
