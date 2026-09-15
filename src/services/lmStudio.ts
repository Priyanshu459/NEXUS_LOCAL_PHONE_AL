/** HTTP is opt-in and restricted to literal private IPv4 addresses. No DNS ambiguity. */
export function isPrivateAddress(host:string) {
  if(!/^\d{1,3}(\.\d{1,3}){3}$/.test(host))return false;
  const p=host.split('.').map(Number);
  if(p.some(n=>n>255))return false;
  return p[0]===10 || (p[0]===192&&p[1]===168) || (p[0]===172&&p[1]>=16&&p[1]<=31) || (p[0]===100&&p[1]>=64&&p[1]<=127);
}
export function normalizeStudioUrl(raw:string,allowLocalHttp=false) {
  let url:URL;try{url=new URL(raw.trim());}catch{throw new Error('Enter the server address shown in LM Studio.');}
  if(['localhost','127.0.0.1','0.0.0.0','[::1]'].includes(url.hostname))throw new Error('That address points to this phone. Use your computer’s network IP or private HTTPS address.');
  if(url.hostname==='lmstudio.ai'||url.hostname.endsWith('.lmstudio.ai'))throw new Error('An LM Link invitation is not an API server address. Follow the connection guide below.');
  if(url.username||url.password||url.search||url.hash)throw new Error('Use a server address without a password, query or fragment.');
  if(url.protocol!=='https:' && !(url.protocol==='http:'&&allowLocalHttp&&isPrivateAddress(url.hostname)))throw new Error('Use HTTPS, or allow HTTP for a private IPv4 address on your trusted network.');
  if(!['','/','/v1','/v1/'].includes(url.pathname))throw new Error('Use the server address or its /v1 base, not a chat or model endpoint.');
  return `${url.origin}/v1`;
}
