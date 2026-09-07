import http from 'node:http';
import {createHash} from 'node:crypto';
import {readFileSync, writeFileSync, renameSync, existsSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

export const hashToken = token => createHash('sha256').update(token).digest('hex');
const clean = (v,n) => typeof v === 'string' ? v.replace(/<[^>]*>/g,' ').replace(/&(?:amp|lt|gt|quot|#39);/g,' ').replace(/[\x00-\x1f\x7f]/g,' ').replace(/\s+/g,' ').trim().slice(0,n) : '';
export function normalizeResults(items) {
  if (!Array.isArray(items)) return [];
  const result=[], seen=new Set();
  for(const item of items.slice(0,30)) {
    try {
      const url=new URL(item.url);
      if(url.protocol!=='https:' || url.username || url.password || !url.hostname.includes('.') ||
         /^[\d.]+$/.test(url.hostname) || url.hostname.includes(':') || /\.(local|localhost)$/.test(url.hostname) || url.href.length>2048) continue;
      url.hash='';
      const title=clean(item.title,100),snippet=clean(item.content,240);
      if(!title || !snippet || seen.has(url.href))continue;
      seen.add(url.href);result.push({id:result.length+1,title,url:url.href,snippet});
      if(result.length===3)break;
    } catch {}
  }
  return result;
}
async function readBounded(stream, max, signal) {
  let size=0;const chunks=[];
  for await (const chunk of stream) {
    if(signal?.aborted) throw new Error('cancelled');
    size+=chunk.length;if(size>max)throw new Error('too_large');chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8');
}

export function createGateway({searxUrl, tokens, quotaPath, fetchImpl=fetch, dailyLimit=20, concurrency=3, timeoutMs=10000}) {
  const upstream=new URL('/search',searxUrl);
  if(!['http:','https:'].includes(upstream.protocol) || upstream.username || upstream.password)throw new Error('Invalid SearXNG URL');
  if(!Array.isArray(tokens) || !tokens.length || tokens.some(t=>!/^\w{64}$/.test(t)))throw new Error('Configure tester token hashes');
  const allowed=new Set(tokens), active=new Set();let total=0;
  let quota={day:new Date().toISOString().slice(0,10),counts:{}};
  if(quotaPath && existsSync(quotaPath)) {quota=JSON.parse(readFileSync(quotaPath,'utf8'));if(!quota.counts || typeof quota.day!=='string')throw new Error('Invalid quota file');}
  const reply=(res,status,data)=>{if(!res.destroyed){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...(status===429?{'Retry-After':'30'}:{})});res.end(JSON.stringify(data));}};
  const server=http.createServer(async(req,res)=>{
    if(req.url==='/health' && req.method==='GET'){reply(res,200,{status:'ok'});return;}
    if(req.url!=='/search' || req.method!=='POST'){reply(res,404,{error:'not_found'});return;}
    const auth=req.headers.authorization || '';
    const token=auth.startsWith('Bearer ')?auth.slice(7):'';
    const id=hashToken(token);
    if(!/^[A-Za-z0-9_-]{32,128}$/.test(token) || !allowed.has(id)){reply(res,401,{error:'unauthorized'});return;}
    if(total>=concurrency || active.has(id)){reply(res,429,{error:'busy'});return;}
    if(!String(req.headers['content-type']).startsWith('application/json')){reply(res,415,{error:'json_required'});return;}
    if(Number(req.headers['content-length'])>2048){reply(res,413,{error:'too_large'});return;}
    active.add(id);total++;
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),timeoutMs);
    const onClose=()=>{if(!res.writableEnded)controller.abort();};res.on('close',onClose);
    try {
      const payload=JSON.parse(await readBounded(req,2048,controller.signal));
      if(typeof payload.query!=='string' || !payload.query.trim() || payload.query.length>400 || Object.keys(payload).some(k=>k!=='query')){reply(res,400,{error:'invalid_query'});return;}
      const day=new Date().toISOString().slice(0,10);if(quota.day!==day)quota={day,counts:{}};
      if((quota.counts[id]||0)>=dailyLimit){reply(res,429,{error:'daily_limit'});return;}
      quota.counts[id]=(quota.counts[id]||0)+1;
      // Count attempts (including upstream failures) to bound abuse. Store no queries or results.
      if(quotaPath){writeFileSync(quotaPath+'.tmp',JSON.stringify(quota),{mode:0o600});renameSync(quotaPath+'.tmp',quotaPath);}
      const response=await fetchImpl(upstream, {method:'POST',redirect:'error',signal:controller.signal,
        headers:{'Content-Type':'application/x-www-form-urlencoded','Accept':'application/json'},
        body:new URLSearchParams({q:payload.query.trim(),format:'json',categories:'general',safesearch:'1',pageno:'1'}).toString()});
      if(!response.ok)throw new Error('upstream_failed');
      const body=JSON.parse(await readBounded(response.body,512*1024,controller.signal));
      if(!Array.isArray(body.results))throw new Error('invalid_upstream');
      reply(res,200,{sources:normalizeResults(body.results)});
    }catch(error){reply(res,controller.signal.aborted?504:error.message==='too_large'?413:error instanceof SyntaxError?502:502,{error:controller.signal.aborted?'timeout':'search_failed'});}
    finally{clearTimeout(timer);res.off('close',onClose);active.delete(id);total--;}
  });
  server.requestTimeout=12000;server.headersTimeout=10000;server.timeout=15000;
  return server;
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
  const tokens=JSON.parse(readFileSync(process.env.TOKEN_HASH_FILE || '/data/token-hashes.json','utf8'));
  createGateway({searxUrl:process.env.SEARXNG_URL || 'http://127.0.0.1:8080',tokens,quotaPath:process.env.QUOTA_FILE || '/data/quotas.json'})
    .listen(Number(process.env.PORT || 8787),process.env.BIND_ADDRESS || '127.0.0.1',()=>console.log('Moonlight search gateway ready'));
}
