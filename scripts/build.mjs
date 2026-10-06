import {build} from 'esbuild';
import {mkdir,copyFile} from 'node:fs/promises';
const client=await build({entryPoints:['worker/recommend.js'],bundle:true,format:'esm',platform:'browser',write:false,minify:true,target:'es2022'});
const source=client.outputFiles[0].text;
await mkdir('dist/server',{recursive:true});await mkdir('dist/.openai',{recursive:true});
await build({entryPoints:['worker/index.js'],bundle:true,format:'esm',platform:'browser',outfile:'dist/server/index.js',target:'es2022',plugins:[{name:'client-algorithm',setup(builder){builder.onResolve({filter:/^virtual:recommend-client$/},()=>({path:'recommend-client',namespace:'virtual'}));builder.onLoad({filter:/.*/,namespace:'virtual'},()=>({contents:'export default '+JSON.stringify(source)+';',loader:'js'}))}}]});
await copyFile('.openai/hosting.json','dist/.openai/hosting.json');console.log('Built monthly calendar and dynamic recommendation module');
