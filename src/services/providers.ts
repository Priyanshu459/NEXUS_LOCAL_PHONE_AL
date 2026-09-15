import {NativeModules} from 'react-native';
import {storage, PersistedMessage} from './storage';
import {safeWebUrl, sourceEvidence, WebSource} from './webSearch';
import {normalizeStudioUrl} from './lmStudio';

export type ApiFormat = 'openai'|'anthropic'|'gemini';
export interface Provider {id:string; name:string; baseUrl:string; format:ApiFormat; models:string[]; verified?:boolean; webTools?:boolean; connectionType?:'lmstudio'; allowLocalHttp?:boolean}
export function hostedSearch(provider:Provider,model:string):'openai'|'anthropic'|null {
  if(provider.webTools===false)return null;
  let host='';try{host=new URL(provider.baseUrl).hostname;}catch{return null;}
  if(host==='api.openai.com'&&provider.format==='openai'&&/^(gpt-4\.1|gpt-5|o3|o4-mini)/.test(model))return 'openai';
  if(host==='api.anthropic.com'&&provider.format==='anthropic'&&/^claude-/.test(model))return 'anthropic';
  return null;
}
export const PROVIDER_PRESETS: Omit<Provider,'models'>[] = [
  {id:'openai',name:'OpenAI',baseUrl:'https://api.openai.com/v1',format:'openai'},
  {id:'gemini',name:'Google Gemini',baseUrl:'https://generativelanguage.googleapis.com/v1beta',format:'gemini'},
  {id:'anthropic',name:'Anthropic',baseUrl:'https://api.anthropic.com/v1',format:'anthropic'},
  {id:'alibaba',name:'Alibaba Cloud',baseUrl:'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',format:'openai'},
  {id:'nvidia',name:'NVIDIA',baseUrl:'https://integrate.api.nvidia.com/v1',format:'openai'},
];
export interface CloudSelection {providerId:string; model:string}
export function providerFormat(provider:Provider):ApiFormat {
  try {if(new URL(provider.baseUrl).hostname.toLowerCase()==='integrate.api.nvidia.com')return 'openai';}catch{}
  return provider.format;
}
export function listProviders():Provider[] {
  try {const value=JSON.parse(storage.getString('ai_providers')||'[]');return Array.isArray(value)?value.filter(p=>p && typeof p.id==='string' && typeof p.name==='string' && Array.isArray(p.models)):[];} catch{return [];}
}
function persist(provider:Provider) {storage.set('ai_providers',JSON.stringify([...listProviders().filter(p=>p.id!==provider.id),provider]));}
export function setProviderWebTools(id:string,enabled:boolean){const provider=listProviders().find(p=>p.id===id);if(provider)persist({...provider,webTools:enabled});}
export function getCloudSelection():CloudSelection|null {
  try {const value=JSON.parse(storage.getString('cloud_selection')||'null');return value && listProviders().some(p=>p.id===value.providerId) && typeof value.model==='string'?value:null;}catch{return null;}
}
export function selectCloud(value:CloudSelection|null) {if(value)storage.set('cloud_selection',JSON.stringify(value));else storage.remove('cloud_selection');}
export function validateProvider(provider:Provider, key:string) {
  if(provider.connectionType==='lmstudio'){
    normalizeStudioUrl(provider.baseUrl,provider.allowLocalHttp);
    if(provider.id!=='lmstudio'||provider.format!=='openai'||!provider.name.trim()||provider.name.length>50)throw new Error('Invalid LM Studio connection.');
    if(key.length>2048||/\s/.test(key))throw new Error('Use the LM Studio API token without spaces, or leave it empty if authentication is disabled.');
    return;
  }
  const endpoint=safeWebUrl(provider.baseUrl.trim());
  if(!endpoint || new URL(endpoint).search || new URL(endpoint).hash)throw new Error('Use a public HTTPS base URL without query parameters.');
  if(!provider.name.trim() || provider.name.length>50 || !/^[a-zA-Z0-9_-]{1,60}$/.test(provider.id))throw new Error('Enter a short connection name.');
  if(!['openai','anthropic','gemini'].includes(provider.format))throw new Error('Choose a supported API format.');
  if(key.trim().length<8 || key.trim().length>2048 || /\s/.test(key.trim()))throw new Error('Enter your provider API key.');
}
export async function saveProvider(provider:Provider,key:string,preserveExistingKey=false,requireToken=false) {
  validateProvider(provider,key);
  if(!NativeModules.DeviceControl?.saveProvider)throw new Error('Install the updated Android build to connect providers.');
  const normalized={...provider,format:providerFormat(provider),name:provider.name.trim(),baseUrl:provider.connectionType==='lmstudio'?normalizeStudioUrl(provider.baseUrl,provider.allowLocalHttp):provider.baseUrl.trim().replace(/\/+$/,''),verified:false};
  await NativeModules.DeviceControl.saveProvider(provider.id,JSON.stringify({baseUrl:normalized.baseUrl,format:normalized.format,apiKey:key.trim(),connectionType:normalized.connectionType,allowLocalHttp:normalized.allowLocalHttp===true,preserveExistingKey,requireToken}));
  persist(normalized);
}
export async function removeProvider(id:string) {
  await NativeModules.DeviceControl.removeProvider(id);
  if(getCloudSelection()?.providerId===id)selectCloud(null);
  storage.set('ai_providers',JSON.stringify(listProviders().filter(p=>p.id!==id)));
}
let requestSequence=0;
async function request(provider:Provider,operation:'models'|'chat'|'responses',model:string,body:unknown,signal?:AbortSignal) {
  if(!NativeModules.DeviceControl?.requestProvider)throw new Error('Cloud chat needs the updated Android build.');
  const id=`cloud-${++requestSequence}`;
  if(signal?.aborted)throw new Error('Request cancelled.');
  const cancel=()=>NativeModules.DeviceControl.cancelProvider(id);
  signal?.addEventListener('abort',cancel);
  const timeout=setTimeout(cancel,75000);
  try {
    const result=await NativeModules.DeviceControl.requestProvider(id,provider.id,operation,model,JSON.stringify(body));
    if(signal?.aborted)throw new Error('Request cancelled.');
    if(result.status===401 || result.status===403)throw new Error('The provider rejected access. Check your key, region and account permissions.');
    if(result.status===429)throw new Error('Provider limit reached. Check your API allowance or retry later.');
    if(result.status===404)throw new Error(`${provider.name}: HTTP 404. ${result.errorCategory==='deployment'?'NVIDIA reported a missing inference deployment.':result.errorCategory==='model'?'The provider reported an unavailable model.':'The server did not find the requested model or route.'} Refresh models in AI providers. Model: ${model||'model catalog'}.${result.route==='NVIDIA POST /v1/chat/completions'?' Route: NVIDIA POST /v1/chat/completions.':''}`);
    if(result.status===400 || result.status===422){
      const hints:Record<string,string>={roles:'This model rejected the conversation roles.',context:'The conversation exceeds this model’s context limit. Start a new chat.',model:'This model is unavailable or does not support chat. Refresh models and choose a chat model.',tokens:'This model rejected the response token limit. Lower it in Settings → Advanced.'};
      throw new Error(`${provider.name} (HTTP ${result.status}): ${hints[result.errorCategory]||'The provider rejected the request format or parameters. Check the selected model and API format.'}`);
    }
    if(result.status<200 || result.status>=300)throw new Error(`Provider request failed (HTTP ${result.status}). Try again later.`);
    if(typeof result.body!=='string' || result.body.length>1048576)throw new Error('Provider returned an invalid response.');
    try{return JSON.parse(result.body);}catch{throw new Error('The server returned a webpage or invalid JSON. Use the LM Studio API server address, not a browser login or LM Link invitation.');}
  }finally{clearTimeout(timeout);signal?.removeEventListener('abort',cancel);}
}
export async function refreshProviderModels(provider:Provider) {
  provider={...provider,format:providerFormat(provider)};
  const data=await request(provider,'models','',{});
  const items=provider.format==='gemini'?data.models:data.data;
  if(!Array.isArray(items))throw new Error('This endpoint does not list models. Enter a model ID manually.');
  const ids=items.filter((m:any)=>provider.format!=='gemini'||m.supportedGenerationMethods?.includes('generateContent')).map((m:any)=>provider.format==='gemini'?m.name?.replace(/^models\//,''):m.id).filter((id:unknown)=>typeof id==='string'&&id.length>0&&id.length<=200);
  const updated={...provider,models:[...new Set<string>(ids)].slice(0,200),verified:true};persist(updated);return updated;
}
export function buildCloudBody(provider:Provider,model:string,messages:PersistedMessage[],system:string,maxTokens:number,sources?:WebSource[]) {
  provider={...provider,format:providerFormat(provider)};
  const instruction=system+(sources?.length?sourceEvidence(sources):'');
  // Keep a complete user-first window, skip failed empty replies, merge consecutive roles.
  const turns:{role:'user'|'assistant';content:string}[]=[];
  for(const message of messages.slice(-20)){
    if(!message.content.trim()||(!turns.length&&message.role!=='user'))continue;
    const last=turns[turns.length-1];
    if(last?.role===message.role)last.content+='\n\n'+message.content;
    else turns.push({role:message.role,content:message.content});
  }
  const limit=Math.min(2048,Math.max(64,maxTokens));
  let body:unknown;
  const search=hostedSearch(provider,model);
  if(search==='openai')body={model,instructions:instruction,input:turns,max_output_tokens:limit,store:false,tools:[{type:'web_search'}]};
  else if(provider.format==='anthropic')body={model,system:instruction,messages:turns,max_tokens:limit,...(search?{tools:[{type:'web_search_20250305',name:'web_search',max_uses:3}]}:{})};
  else if(provider.format==='gemini')body={systemInstruction:{parts:[{text:instruction}]},contents:turns.map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:m.content}]})),generationConfig:{maxOutputTokens:limit}};
  else {
    // Gemma 1–3 / CodeGemma templates lack a system role. Gemma 4 supports it.
    const legacyGemma=/(?:^|\/)(?:codegemma(?:-|$)|gemma(?:-|$))/.test(model.toLowerCase())&&!/(?:^|\/)gemma-4(?:-|$)/.test(model.toLowerCase());
    const formatted=legacyGemma?turns.map((turn,index)=>index===0&&instruction?{...turn,content:instruction+'\n\n'+turn.content}:turn):[...(instruction?[{role:'system',content:instruction}]:[]),...turns];
    body={model,messages:formatted,stream:false,...(provider.id==='openai'?{max_completion_tokens:limit}:{max_tokens:limit})};
  }
  if(JSON.stringify(body).length>60000)throw new Error('This conversation is too large to send. Start a new chat or shorten your message.');
  return body;
}
export async function completeCloud(selection:CloudSelection,messages:PersistedMessage[],system:string,maxTokens:number,sources?:WebSource[],signal?:AbortSignal,onSources?:(sources:WebSource[])=>void) {
  const saved=listProviders().find(p=>p.id===selection.providerId);
  const provider=saved?{...saved,format:providerFormat(saved)}:undefined;
  if(!provider)throw new Error('Reconnect this provider in Settings.');
  const search=hostedSearch(provider,selection.model);
  const data=await request(provider,search==='openai'?'responses':'chat',selection.model,buildCloudBody(provider,selection.model,messages,system,maxTokens,sources),signal);
  const citations:WebSource[]=[];
  const add=(url:unknown,title:unknown)=>{const safe=safeWebUrl(url);if(safe&&!citations.some(c=>c.url===safe))citations.push({id:citations.length+1,url:safe,title:typeof title==='string'?title.slice(0,200):new URL(safe).hostname,snippet:''});};
  if(search==='openai')for(const item of data.output||[])for(const block of item.content||[])for(const a of block.annotations||[])if(a.type==='url_citation')add(a.url,a.title);
  if(search==='anthropic')for(const block of data.content||[])for(const c of block.citations||[])if(c.type==='web_search_result_location')add(c.url,c.title);
  onSources?.(citations);
  const citedText=(block:any)=>{
    let value=typeof block.text==='string'?block.text:'';
    const annotations=search==='openai'?block.annotations:block.citations;
    const links=(Array.isArray(annotations)?annotations:[]).map((a:any)=>({source:citations.find(c=>c.url===safeWebUrl(a.url)),end:Number.isInteger(a.end_index)?a.end_index:value.length})).filter((a:any)=>a.source).sort((a:any,b:any)=>b.end-a.end);
    for(const {source,end} of links){if(!source)continue;const at=Math.min(value.length,Math.max(0,end));const link=` [Source ${source.id}](${source.url.replace(/\(/g,'%28').replace(/\)/g,'%29')})`;value=value.slice(0,at)+link+value.slice(at);}
    return value;
  };
  const text=search==='openai'?data.output?.filter((o:any)=>o.type==='message').flatMap((o:any)=>o.content||[]).filter((c:any)=>c.type==='output_text').map(citedText).join('\n'):
    provider.format==='anthropic'?data.content?.filter((c:any)=>c.type==='text').map(citedText).join('\n'):
    provider.format==='gemini'?data.candidates?.[0]?.content?.parts?.filter((p:any)=>!p.thought).map((p:any)=>p.text||'').join('\n'):data.choices?.[0]?.message?.content;
  if(typeof text!=='string'||!text.trim())throw new Error('The provider returned no text. Try a different text model or increase the response limit.');
  return text.slice(0,64000);
}

