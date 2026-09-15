import {NativeModules} from 'react-native';
import {storage} from '../src/services/storage';
import {Provider,saveProvider,listProviders,refreshProviderModels,buildCloudBody,completeCloud,selectCloud,getCloudSelection,removeProvider} from '../src/services/providers';
const provider:Provider={id:'custom-test',name:'Test',baseUrl:'https://example.com/v1',format:'openai',models:['test-model']};
beforeEach(()=>{storage.clearAll();NativeModules.DeviceControl.saveProvider=jest.fn(async()=>true);NativeModules.DeviceControl.removeProvider=jest.fn(async()=>true);NativeModules.DeviceControl.cancelProvider=jest.fn();NativeModules.DeviceControl.requestProvider=jest.fn();});
test('saves secrets only natively and rejects unsafe endpoints',async()=>{
  await expect(saveProvider({...provider,baseUrl:'http://example.com'},'private-key')).rejects.toThrow('HTTPS');
  await saveProvider(provider,'private-key');expect(storage.getString('ai_providers')).not.toContain('private-key');expect(listProviders()[0].verified).toBe(false);
});
test('save failure cannot claim configuration',async()=>{
  NativeModules.DeviceControl.saveProvider.mockRejectedValue(new Error('locked'));await expect(saveProvider(provider,'private-key')).rejects.toThrow('locked');expect(listProviders()).toEqual([]);
});
test('fetches models and removes a selected provider',async()=>{
  await saveProvider(provider,'private-key');NativeModules.DeviceControl.requestProvider.mockResolvedValue({status:200,body:JSON.stringify({data:[{id:'actual-model'}]})});
  expect((await refreshProviderModels(provider)).models).toEqual(['actual-model']);selectCloud({providerId:provider.id,model:'actual-model'});await removeProvider(provider.id);expect(getCloudSelection()).toBeNull();
});
test.each(['openai','anthropic','gemini'] as const)('formats %s messages',format=>{
  const body:any=buildCloudBody({...provider,format},'test',[{id:'a',role:'user',content:'Hello'}],'Be helpful',128);
  expect(JSON.stringify(body)).toContain('Hello');expect(JSON.stringify(body)).toContain('Be helpful');
  if(format==='gemini')expect(body.contents[0].parts).toEqual([{text:'Hello'}]);if(format==='anthropic')expect(body.system).toBe('Be helpful');
});
test('bounds outbound size',()=>{expect(()=>buildCloudBody(provider,'test',[{id:'x',role:'user',content:'x'.repeat(61000)}],'',128)).toThrow('too large');});
test('extracts replies and hides provider error bodies',async()=>{
  await saveProvider(provider,'private-key');NativeModules.DeviceControl.requestProvider.mockResolvedValueOnce({status:200,body:JSON.stringify({choices:[{message:{content:'Hello'}}]})}).mockResolvedValueOnce({status:401,body:'secret'});
  const selection={providerId:provider.id,model:'test'};expect(await completeCloud(selection,[],'',128)).toBe('Hello');await expect(completeCloud(selection,[],'',128)).rejects.toThrow('rejected access');
});
test('aborted requests never start networking',async()=>{
  await saveProvider(provider,'private-key');const controller=new AbortController();controller.abort();await expect(completeCloud({providerId:provider.id,model:'test'},[],'',128,undefined,controller.signal)).rejects.toThrow('cancelled');expect(NativeModules.DeviceControl.requestProvider).not.toHaveBeenCalled();
});

test('NVIDIA CodeGemma folds instructions into user turn and normalizes failed turns',()=>{
  const body:any=buildCloudBody({...provider,id:'nvidia'},'google/codegemma-1.1-7b',[
    {id:'0',role:'assistant',content:'Old answer'},
    {id:'1',role:'user',content:'Hello'},
    {id:'2',role:'assistant',content:''},
    {id:'3',role:'user',content:'Try again'},
  ],'Be helpful',128);
  expect(body.messages).toEqual([{role:'user',content:'Be helpful\n\nHello\n\nTry again'}]);
  expect(body.max_tokens).toBe(128);
});
test('Gemma 4 and other chat models retain system instructions',()=>{
  for(const model of ['google/gemma-4-31b-it','meta/llama-3.1-8b-instruct']){
    const body:any=buildCloudBody(provider,model,[{id:'1',role:'user',content:'Hello'}],'Be helpful',128);
    expect(body.messages[0]).toEqual({role:'system',content:'Be helpful'});
  }
});
test('provider validation errors are distinguished without leaking raw responses',async()=>{
  await saveProvider(provider,'private-key');
  NativeModules.DeviceControl.requestProvider.mockResolvedValue({status:422,errorCategory:'roles',body:'private-key'});
  await expect(completeCloud({providerId:provider.id,model:'test'},[],'',128)).rejects.toThrow('HTTP 422');
  NativeModules.DeviceControl.requestProvider.mockResolvedValue({status:404,body:'private-key'});
  await expect(completeCloud({providerId:provider.id,model:'test'},[],'',128)).rejects.toThrow('Refresh models');
});

test('NVIDIA repairs saved Gemini format for request body, model discovery and reply parsing',async()=>{
  const old:Provider={...provider,id:'nvidia',name:'NVIDIA',baseUrl:'https://integrate.api.nvidia.com/v1',format:'gemini'};
  storage.set('ai_providers',JSON.stringify([old]));
  NativeModules.DeviceControl.requestProvider.mockResolvedValueOnce({status:200,body:JSON.stringify({choices:[{message:{content:'NVIDIA answer'}}]})});
  expect(await completeCloud({providerId:'nvidia',model:'deepseek-ai/test'},[{id:'1',role:'user',content:'Hello'}],'Help',128)).toBe('NVIDIA answer');
  const body=JSON.parse(NativeModules.DeviceControl.requestProvider.mock.calls[0][4]);
  expect(body.messages[1].content).toBe('Hello');expect(body.contents).toBeUndefined();
  NativeModules.DeviceControl.requestProvider.mockResolvedValueOnce({status:200,body:JSON.stringify({data:[{id:'nvidia/test'}]})});
  expect((await refreshProviderModels(old)).models).toEqual(['nvidia/test']);
  await saveProvider(old,'private-key');
  expect(JSON.parse(NativeModules.DeviceControl.saveProvider.mock.calls[0][1]).format).toBe('openai');
});

test('OpenAI searches through Responses and preserves clickable citations',async()=>{
 const p:Provider={...provider,id:'openai',baseUrl:'https://api.openai.com/v1'};
 await saveProvider(p,'private-key');
 NativeModules.DeviceControl.requestProvider.mockResolvedValue({status:200,body:JSON.stringify({output:[{type:'web_search_call'},{type:'message',content:[{type:'output_text',text:'Verified fact.',annotations:[{type:'url_citation',url:'https://example.com/article',title:'Article',end_index:14}]}]}]})});
 const sources=jest.fn();const answer=await completeCloud({providerId:p.id,model:'gpt-4.1'},[{id:'1',role:'user',content:'Latest news'}],'Help',128,undefined,undefined,sources);
 expect(NativeModules.DeviceControl.requestProvider.mock.calls[0][2]).toBe('responses');
 const body=JSON.parse(NativeModules.DeviceControl.requestProvider.mock.calls[0][4]);
 expect(body.tools).toEqual([{type:'web_search'}]);expect(body.store).toBe(false);
 expect(answer).toContain('[Source 1](https://example.com/article)');expect(sources.mock.calls[0][0]).toHaveLength(1);
});
test('Anthropic search has bounded uses and NVIDIA never receives unsupported hosted tools',()=>{
 const message:any=[{id:'1',role:'user',content:'News'}];
 const anthropic:any=buildCloudBody({...provider,format:'anthropic',baseUrl:'https://api.anthropic.com/v1'},'claude-sonnet-4-5',message,'Help',256);
 expect(anthropic.tools[0].max_uses).toBe(3);
 const nvidia:any=buildCloudBody({...provider,baseUrl:'https://integrate.api.nvidia.com/v1'},'nvidia/nemotron',message,'Help',256);
 expect(nvidia.tools).toBeUndefined();
 const disabled:any=buildCloudBody({...provider,baseUrl:'https://api.openai.com/v1',webTools:false},'gpt-4.1',message,'Help',256);
 expect(disabled.tools).toBeUndefined();expect(disabled.messages).toBeDefined();
});
