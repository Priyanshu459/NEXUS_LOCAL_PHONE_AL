import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createGateway,hashToken,normalizeResults} from './server.mjs';
const code='a'.repeat(43);
async function start(options={}) {
  const server=createGateway({searxUrl:'http://localhost:8080',tokens:[hashToken(code)],...options});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  return {url:`http://127.0.0.1:${server.address().port}/search`,stop:()=>new Promise(r=>{server.close(r);server.closeAllConnections();})};
}
const post=(url,body={query:'weather'},token=code)=>fetch(url,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(body)});
test('authentication and schema rejection do not contact SearXNG',async()=>{
  let requests=0;const app=await start({fetchImpl:async()=>{requests++;throw Error();}});
  try{assert.equal((await post(app.url,{},'bad')).status,401);assert.equal((await post(app.url,{query:'q',history:'private'})).status,400);assert.equal(requests,0);}finally{await app.stop();}
});
test('forwards only reviewed query and returns bounded safe sources',async()=>{
  const app=await start({fetchImpl:async(url,options)=>{
    assert.equal(url.href,'http://localhost:8080/search');assert.equal(new URLSearchParams(options.body).get('q'),'moonlight');assert.equal(options.redirect,'error');
    return new Response(JSON.stringify({results:[{title:'<b>Example</b>',url:'https://example.com/page',content:'x'.repeat(1000)},{title:'bad',url:'javascript:alert(1)',content:'bad'}]}));
  }});
  try{const res=await post(app.url,{query:'moonlight'});assert.equal(res.status,200);const {sources}=await res.json();assert.equal(sources.length,1);assert.equal(sources[0].snippet.length,240);assert.equal(sources[0].title,'Example');}finally{await app.stop();}
});
test('daily quota survives process restart and is per tester',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'moonlight-search-'));const options={quotaPath:join(dir,'quota.json'),dailyLimit:1,fetchImpl:async()=>new Response('{"results":[]}')};
  let app=await start(options);
  try{assert.equal((await post(app.url)).status,200);await app.stop();app=await start(options);assert.equal((await post(app.url)).status,429);}finally{await app.stop();rmSync(dir,{recursive:true,force:true});}
});
test('one active request per tester; timeout releases its slot',async()=>{
  const app=await start({timeoutMs:100,fetchImpl:async(_,o)=>new Promise((_,reject)=>o.signal.addEventListener('abort',()=>reject(Error('timeout'))))});
  try{const first=post(app.url);await new Promise(r=>setTimeout(r,25));assert.equal((await post(app.url)).status,429);assert.equal((await first).status,504);assert.equal((await post(app.url)).status,504);}finally{await app.stop();}
});
test('filters private URLs and duplicate sources',()=>{
  const item={title:'Title',content:'Excerpt'};
  assert.deepEqual(normalizeResults([{...item,url:'https://127.0.0.1/'},{...item,url:'https://a.local/'},{...item,url:'https://user:secret@example.com/'}]),[]);
  assert.equal(normalizeResults([{...item,url:'https://example.com/'},{...item,url:'https://example.com/'}]).length,1);
});
