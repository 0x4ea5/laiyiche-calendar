import 'javascript-lp-solver/src/Tableau/index.js';
import Model from 'javascript-lp-solver/src/Model.js';
export function recommend(players,dateKeys,size){
 if(!Number.isInteger(size)||size<1)return {groups:[],assigned:[],score:0,targetCars:0};
 const people=[...players].sort((a,b)=>a.name.localeCompare(b.name)||a.id.localeCompare(b.id));
 const targetCars=Math.floor(people.length/size);
 const candidates=[...new Set(dateKeys)].sort().filter(date=>people.filter(p=>p.slots.includes(date)).length>=size);
 if(!targetCars||!candidates.length)return {groups:[],assigned:[],score:0,targetCars};
 const model={optimize:'score',opType:'max',constraints:{totalCars:{max:targetCars}},variables:{},ints:{}};
 people.forEach((p,i)=>model.constraints['person_'+i]={max:1});
 candidates.forEach((date,j)=>{
  const balance='date_'+j,limit='opened_'+j,y='car_'+j;
  model.constraints[balance]={equal:0};model.constraints[limit]={max:1};
  model.variables[y]={score:people.length+1+(candidates.length-j)/(candidates.length*4*(targetCars+1)),totalCars:1,[balance]:-size,[limit]:1};model.ints[y]=1;
  people.forEach((p,i)=>{if(p.slots.includes(date)){const x='player_'+i+'_'+j;model.variables[x]={score:p.preferredDates.includes(date)?1:0,['person_'+i]:1,[balance]:1}}});
 });
 const solution=new Model(1e-8).loadJson(model).solve();
 const result={feasible:solution.feasible,...solution.generateSolutionSet()};
 if(!result.feasible)throw Error('暂时无法生成分组，请重试');
 const groups=candidates.flatMap((date,j)=>result['car_'+j]>.5?[{date,players:people.filter((p,i)=>result['player_'+i+'_'+j]>.5)}]:[]);
 const assigned=groups.flatMap(g=>g.players.map(p=>p.id));
 if(groups.some(g=>g.players.length!==size)||new Set(assigned).size!==assigned.length)throw Error('分组结果不完整，请重试');
 return {groups,assigned,score:groups.reduce((n,g)=>n+g.players.filter(p=>p.preferredDates.includes(g.date)).length,0),targetCars};
}
