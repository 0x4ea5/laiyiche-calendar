import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../worker/index.js',import.meta.url),'utf8');
const html=JSON.parse(source.slice('const page='.length,source.indexOf(';\nimport ')));
const script=html.split('<script type="module">')[1].split('</script>')[0].replace('import {recommend} from "/recommend.js";','');
class Element {
 constructor(tag='div'){this.tag=tag;this.children=[];this.textContent='';this.value='';this.className='';this.attributes={};this.classList={add:name=>{this.className+=' '+name}}}
 append(...items){this.children.push(...items)} replaceChildren(...items){this.children=items}
 setAttribute(key,value){this.attributes[key]=String(value)}
}
class FixedDate extends Date {constructor(...args){super(...(args.length?args:[2026,9,30,12]))}}
async function page(initialPlayers=[],self=null,recommendation=null){
 const elements=new Map(),requests=[],state={players:initialPlayers};
 const get=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id)};
 const context=vm.createContext({document:{getElementById:get,createElement:tag=>new Element(tag)},location:{href:'https://example.com/?car='+'a'.repeat(32)},URL,Date:FixedDate,crypto,localStorage:{getItem:()=>self?JSON.stringify({...self,token:'my-token'}):null},fetch:async(url,options={})=>{requests.push({url,method:options.method||'GET'});const data=url.startsWith('/api/me')?self:url.startsWith('/api/settings')?{groupSize:6}:state.players;return {ok:true,json:async()=>JSON.parse(JSON.stringify(data))}},recommend:()=>recommendation||({groups:[],assigned:[],score:0,targetCars:0}),setInterval(){}});
 vm.runInContext(script,context);await new Promise(resolve=>setImmediate(resolve));
 const button=date=>get('calendar').children.find(e=>e.tag==='button'&&e.attributes['aria-label']?.startsWith(date));
 return {get,button,state,requests,refresh:()=>vm.runInContext('refresh()',context)};
}
const player=(id,slots,preferredDates=[])=>({id,name:id,slots,preferredDates});
test('opens at earliest saved month across years; an empty car opens at current month',async()=>{
 const ui=await page([player('other',['2027-02-10','2025-12-03'])]);assert.equal(ui.get('range').textContent,'2025 年 12 月');assert.ok(ui.button('2025-12-03').className.includes('others-selected'));
 const empty=await page([]);assert.equal(empty.get('range').textContent,'2026 年 10 月');
 const noDates=await page([player('other',[])]);assert.equal(noDates.get('range').textContent,'2026 年 10 月');
});
test('marks only dates selected by others and keeps own preference color when shared',async()=>{
 const self=player('self',['2026-11-01','2026-11-03'],['2026-11-03']);
 const ui=await page([self,player('other',['2026-11-02','2026-11-03'])],self);
 assert.ok(!ui.button('2026-11-01').className.includes('others-selected'));
 assert.ok(ui.button('2026-11-02').className.includes('others-selected'));
 assert.ok(ui.button('2026-11-03').className.includes('others-selected'));
 assert.ok(ui.button('2026-11-03').className.includes('preferred'));
 assert.match(ui.button('2026-11-03').attributes['aria-label'],/其他 1 位玩家已选/);
 assert.ok(!ui.button('2026-11-04').className.includes('others-selected'));
});
test('refresh updates dotted dates without jumping back after month navigation or writing records',async()=>{
 const ui=await page([player('other',['2026-11-02'])]);ui.get('next').onclick();assert.equal(ui.get('range').textContent,'2026 年 12 月');
 ui.state.players=[player('other',['2026-09-01','2026-12-04'])];await ui.refresh();
 assert.equal(ui.get('range').textContent,'2026 年 12 月');assert.ok(ui.button('2026-12-04').className.includes('others-selected'));
 ui.state.players=[];await ui.refresh();assert.equal(ui.get('range').textContent,'2026 年 12 月');assert.ok(!ui.button('2026-12-04').className.includes('others-selected'));
 assert.ok(ui.requests.every(r=>r.method==='GET'));
});

test('shows saved player totals including self and updates counts after others change selections',async()=>{
 const date='2026-11-03',self=player('self',[date],[date]);
 const ui=await page([self,player('other',[date]),player('third',[date])],self);
 const count=()=>ui.button(date).children.find(e=>e.className==='selection-count')?.textContent;
 assert.equal(count(),'3人');assert.match(ui.button(date).attributes['aria-label'],/共 3 人已选/);
 assert.ok(ui.button(date).className.includes('preferred'));assert.ok(ui.button(date).className.includes('others-selected'));
 ui.state.players=[self];await ui.refresh();assert.equal(count(),'1人');assert.ok(!ui.button(date).className.includes('others-selected'));
 ui.state.players=[];await ui.refresh();assert.equal(count(),undefined);
 assert.match(html,/border:3px dashed #c23883/);assert.match(html,/\.selection-count/);
});

test('pending dates sort by preference before availability count, and preferred players appear first',async()=>{
 const a='2026-11-01',b='2026-11-02',all=[player('ordinary',[a,b]),player('extra',[a]),player('extra-two',[a]),player('priority',[b],[b])];
 const ui=await page(all);const boxes=ui.get('matches').children.filter(e=>e.className==='recommend');
 assert.match(boxes[0].children[0].textContent,/2026-11-02.*1 人优先/);assert.equal(boxes[0].children[1].textContent,'priority（优先）、ordinary');
 assert.match(boxes[1].children[0].textContent,/2026-11-01.*0 人优先/);
});
test('full-car display prioritizes preferred dates and players without changing assignments',async()=>{
 const a='2026-11-01',b='2026-11-02',one=[player('plain-a',[a]),player('preferred-a',[a],[a])],two=[player('plain-b',[b]),player('preferred-b',[b],[b]),player('preferred-c',[b],[b])];
 const plan={groups:[{date:a,players:one},{date:b,players:two}],assigned:[...one,...two].map(p=>p.id),score:3,targetCars:2};
 const before=JSON.stringify(plan),ui=await page([...one,...two],null,plan),boxes=ui.get('matches').children.filter(e=>e.className==='recommend');
 assert.match(boxes[0].children[0].textContent,/2026-11-02.*2 人优先/);assert.equal(boxes[0].children[1].textContent,'preferred-b（优先）、preferred-c（优先）、plain-b');
 assert.match(boxes[1].children[0].textContent,/2026-11-01.*1 人优先/);assert.equal(JSON.stringify(plan),before);
});
