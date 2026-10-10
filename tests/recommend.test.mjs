import assert from 'node:assert/strict';
import {recommend} from '../worker/recommend.js';
const dates=['2026-10-10','2026-11-14','2026-12-19'];
for (const size of [5,6,7,8]) {const p=Array.from({length:size*3},(_,i)=>({id:String(i),name:String(i),slots:dates,preferredDates:[dates[Math.floor(i/size)]]}));const r=recommend(p,dates,size);assert.equal(r.groups.length,3);assert.equal(r.score,p.length);assert.equal(new Set(r.assigned).size,p.length);}
