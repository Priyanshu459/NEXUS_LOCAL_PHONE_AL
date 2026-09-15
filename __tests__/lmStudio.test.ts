import {NativeModules} from 'react-native';
import {normalizeStudioUrl,isPrivateAddress} from '../src/services/lmStudio';
import {saveProvider,listProviders,refreshProviderModels,completeCloud,Provider} from '../src/services/providers';
import {storage} from '../src/services/storage';

const studio:Provider={id:'lmstudio',name:'My computer',connectionType:'lmstudio',allowLocalHttp:true,baseUrl:'http://192.168.1.12:1234',format:'openai',models:[]};
beforeEach(()=>{storage.clearAll();jest.clearAllMocks();NativeModules.DeviceControl.saveProvider=jest.fn(async()=>true);NativeModules.DeviceControl.cancelProvider=jest.fn();});
test.each(['10.0.0.2','172.16.0.2','172.31.255.1','192.168.1.1','100.64.0.1','100.127.255.254'])('accepts private address %s only after opt-in',host=>{
 expect(isPrivateAddress(host)).toBe(true);
 expect(()=>normalizeStudioUrl(`http://${host}:1234`)).toThrow();
 expect(normalizeStudioUrl(`http://${host}:1234`,true)).toBe(`http://${host}:1234/v1`);
});
test.each(['8.8.8.8','127.0.0.1','169.254.169.254','computer.local','172.32.0.1','10.999.1.1'])('rejects untrusted cleartext destination %s',host=>{
 expect(()=>normalizeStudioUrl(`http://${host}:1234`,true)).toThrow();
});
test.each(['https://user:secret@example.com','https://example.com/v1?key=test','https://example.com/v1#test','https://example.com/v1/chat/completions'])('rejects embedded credentials and wrong paths %s',url=>{
 expect(()=>normalizeStudioUrl(url)).toThrow();
});
test('normalizes an HTTPS base without adding v1 twice',()=>{
 expect(normalizeStudioUrl('https://studio.example.com/v1/')).toBe('https://studio.example.com/v1');
});

test.each(['https://localhost','https://127.0.0.1','https://lmstudio.ai/link','https://link.lmstudio.ai'])('rejects phone loopback and invitation addresses %s',url=>{
 expect(()=>normalizeStudioUrl(url)).toThrow();
});

test('token preservation is requested only through native storage',async()=>{
 await saveProvider(studio,'',true,true);
 expect(JSON.parse((NativeModules.DeviceControl.saveProvider as jest.Mock).mock.calls[0][1])).toMatchObject({preserveExistingKey:true,requireToken:true});
 expect(storage.getString('ai_providers')).not.toContain('preserveExistingKey');
});
test('saves token only in native vault, discovers server models and completes chat through the saved connection',async()=>{
 await saveProvider(studio,'test-computer-token');
 const saved=listProviders()[0];
 expect(saved.baseUrl).toBe('http://192.168.1.12:1234/v1');
 expect(storage.getString('ai_providers')).not.toContain('test-computer-token');
 expect(JSON.parse((NativeModules.DeviceControl.saveProvider as jest.Mock).mock.calls[0][1])).toMatchObject({connectionType:'lmstudio',allowLocalHttp:true,apiKey:'test-computer-token'});
 NativeModules.DeviceControl.requestProvider=jest.fn(async(_request,_id,operation)=>({status:200,body:JSON.stringify(operation==='models'?{data:[{id:'lfm2-350m'}]}:{choices:[{message:{content:'Hello from the computer'}}]})}));
 const checked=await refreshProviderModels(saved);
 expect(checked.models).toEqual(['lfm2-350m']);
 const answer=await completeCloud({providerId:'lmstudio',model:'lfm2-350m'},[{id:'1',role:'user',content:'Hello'}],'Be helpful',128);
 expect(answer).toContain('Hello from the computer');
 expect((NativeModules.DeviceControl.requestProvider as jest.Mock).mock.calls[1].slice(1,4)).toEqual(['lmstudio','chat','lfm2-350m']);
});
test('local HTTP opt-in cannot relax cloud-provider HTTPS validation',async()=>{
 await expect(saveProvider({...studio,id:'custom',connectionType:undefined},'test-api-key')).rejects.toThrow('HTTPS');
 expect(NativeModules.DeviceControl.saveProvider).not.toHaveBeenCalled();
});
