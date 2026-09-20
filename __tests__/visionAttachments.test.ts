import {buildCloudBody,Provider} from '../src/services/providers';
import {visionParts,VisionAttachment} from '../src/services/visionAttachments';
const image:VisionAttachment={kind:'image',frames:[{dataUrl:'data:image/jpeg;base64,/9j/AA=='}]};
const prompt=[{id:'1',role:'user' as const,content:'Describe this image'}];
const provider:Provider={id:'lmstudio',name:'Computer',baseUrl:'https://example.com/v1',format:'openai',models:[],connectionType:'lmstudio'};
test.each(['lmstudio','nvidia','alibaba','custom'])('%s receives real image content instead of a file placeholder',id=>{
 const body=buildCloudBody({...provider,id},'vision-model',prompt,'Instructions',512,undefined,image) as any;
 expect(body.messages.at(-1).content).toEqual([{type:'text',text:'Describe this image'},{type:'image_url',image_url:{url:image.frames[0].dataUrl}}]);
 expect(prompt[0].content).toBe('Describe this image');
});
test('OpenAI hosted search receives Responses image blocks',()=>{
 const body=buildCloudBody({...provider,id:'openai',baseUrl:'https://api.openai.com/v1'},'gpt-4.1',prompt,'Instructions',512,undefined,image) as any;
 expect(body.input.at(-1).content[1]).toEqual({type:'input_image',image_url:image.frames[0].dataUrl});
 expect(body.tools[0].type).toBe('web_search');
});
test('Anthropic receives base64 source blocks',()=>{
 const body=buildCloudBody({...provider,format:'anthropic'},'claude',prompt,'Instructions',512,undefined,image) as any;
 expect(body.messages.at(-1).content[1]).toEqual({type:'image',source:{type:'base64',media_type:'image/jpeg',data:'/9j/AA=='}});
});
test('Gemini receives inlineData',()=>{
 const body=buildCloudBody({...provider,format:'gemini'},'gemini',prompt,'Instructions',512,undefined,image) as any;
 expect(body.contents.at(-1).parts[1]).toEqual({inlineData:{mimeType:'image/jpeg',data:'/9j/AA=='}});
});
test('video frames include timestamps and explicit limits on what is visible',()=>{
 const media:VisionAttachment={kind:'video',durationSeconds:30,frames:[0,10,20,29].map(seconds=>({...image.frames[0],seconds}))};
 const parts=visionParts(media);
 expect(parts.filter(p=>p.type==='image_url')).toHaveLength(4);
 expect(JSON.stringify(parts)).toContain('Audio and unsampled moments are unavailable');
 expect(JSON.stringify(parts)).toContain('20.00 seconds');
});
test('rejects oversized media, external URLs, invalid timestamps and malformed frame counts',()=>{
 expect(()=>visionParts({...image,frames:[{dataUrl:'https://example.com/private.jpg'}]})).toThrow();
 expect(()=>visionParts({...image,frames:[{dataUrl:'data:image/jpeg;base64,'+'A'.repeat(350001)}]})).toThrow();
 expect(()=>visionParts({...image,frames:[]})).toThrow();
 expect(()=>visionParts({kind:'video',durationSeconds:90,frames:Array(4).fill(image.frames[0])})).toThrow();
 expect(()=>visionParts({kind:'video',durationSeconds:30,frames:Array(4).fill({...image.frames[0],seconds:NaN})})).toThrow();
});
