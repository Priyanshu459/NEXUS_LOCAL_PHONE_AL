import {fitContext} from '../src/services/contextWindow';
import {saveConversation,listConversations} from '../src/services/conversations';
import {storage} from '../src/services/storage';
const sources=[1,2,3].map(id=>({id,title:'Source',url:`https://example.com/${id}`,snippet:'x'.repeat(240)}));
test('reduces web evidence to fit and returns exactly the included sources',async()=>{
  const llama={getFormattedChat:jest.fn(async(messages:any[])=>({prompt:messages.map(m=>m.content).join('\n')})),tokenize:jest.fn(async(prompt:string)=>({tokens:Array.from({length:Math.ceil(prompt.length/2)})}))};
  const result=await fitContext(llama as any,{messages:[{id:'1',role:'user',content:'Question'}],systemPrompt:'Answer carefully',memoryContextString:'',modelUrl:'custom',webSources:sources},450,128);
  expect(result.webSources!.length).toBeLessThan(3);
  expect(result.webSources!.length).toBeGreaterThan(0);
  expect(result.webSources![0].snippet.length).toBe(90);
  expect((await llama.tokenize(result.prompt)).tokens.length+128+64).toBeLessThanOrEqual(450);
});
test('saved history keeps source links and drops unsafe URLs',()=>{
  storage.clearAll();
  saveConversation('chat',[{id:'1',role:'assistant',content:'Answer [1]',sources:[...sources,{id:4,title:'bad',url:'javascript:alert(1)',snippet:'bad'}]}]);
  const restored=listConversations()[0].messages[0];
  expect(restored.sources).toEqual(sources);
});
