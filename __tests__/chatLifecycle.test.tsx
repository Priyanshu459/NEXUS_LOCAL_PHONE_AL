import React from 'react';
import Renderer, {act} from 'react-test-renderer';
import {Alert,NativeModules, TextInput,TouchableOpacity} from 'react-native';
import {selectCloud} from '../src/services/providers';
import {initLlama} from 'llama.rn';
import {ChatScreen} from '../src/screens/ChatScreen';
import {getSettings, saveSettings, storage} from '../src/services/storage';
import {listConversations} from '../src/services/conversations';
import {saveSearchConnection} from '../src/services/webSearch';

let mockFocused = true;
jest.mock('@react-navigation/native', () => ({useIsFocused: () => mockFocused}));
jest.mock('react-native-safe-area-context', () => ({useSafeAreaInsets: () => ({top:0,bottom:0})}));
jest.mock('../src/services/modelManager', () => ({
  checkModelExists: jest.fn(async()=>true), getModelFilenameFromUrl: (url:string)=>url,
  getModelPath:(path:string)=>path,
}));
jest.mock('../src/services/modelLoadGuard', () => ({
  checkLoadCapacity: jest.fn(async()=>{}), serializeModelLoad: (work:any)=>work(),
}));
jest.mock('../src/services/deviceRecommendation', () => ({getDeviceRecommendation: async()=>({reason:'Test',model:{id:'test'},models:[]})}));
jest.mock('../src/services/contextWindow', () => ({fitContext: async()=>({prompt:'Test',nPredict:32,additionalStops:[],removedMessages:0})}));

test('cloud chat asks before transmitting, then responds without loading a local model',async()=>{
  jest.useRealTimers();storage.clearAll();jest.clearAllMocks();
  storage.set('ai_providers',JSON.stringify([{id:'test',name:'Test Provider',format:'openai',baseUrl:'https://example.com/v1',models:['model']} ]));
  selectCloud({providerId:'test',model:'model'});
  NativeModules.DeviceControl.requestProvider=jest.fn(async()=>({status:200,body:JSON.stringify({choices:[{message:{content:'Cloud answer'}}]})}));
  const alert=jest.spyOn(Alert,'alert');
  const navigation:any={addListener:()=>()=>{},setParams:jest.fn()};let view!:Renderer.ReactTestRenderer;
  await act(async()=>{view=Renderer.create(<ChatScreen navigation={navigation} route={{params:{}} as any}/>);});
  await act(async()=>view.root.findByProps({accessibilityLabel:'Message'}).props.onChangeText('Hello cloud'));
  await act(async()=>view.root.findAllByType(TouchableOpacity).find(b=>b.props.accessibilityLabel==='Send message')!.props.onPress());
  expect(NativeModules.DeviceControl.requestProvider).not.toHaveBeenCalled();
  const buttons=alert.mock.calls.find(call=>call[0]==='Send to Test Provider?')![2]!;
  await act(async()=>{buttons.find(b=>b.text==='Send')!.onPress!();});
  expect(NativeModules.DeviceControl.requestProvider).toHaveBeenCalledTimes(1);
  expect(initLlama).not.toHaveBeenCalled();
  expect(listConversations()[0].messages.some(m=>m.content==='Cloud answer')).toBe(true);
  await act(async()=>view.unmount());alert.mockRestore();
});

test('navigation retains the model, voice sends, and changing models releases the old context', async()=>{
  jest.useFakeTimers(); storage.clearAll(); jest.clearAllMocks();
  const listeners:Record<string,()=>void>={};
  const navigation:any={addListener:(event:string,fn:()=>void)=>{listeners[event]=fn;return ()=>{};},setParams:jest.fn()};
  const route:any={params:{}};
  let view!:Renderer.ReactTestRenderer;
  await act(async()=>{view=Renderer.create(<ChatScreen navigation={navigation} route={route}/>);});
  await act(async()=>{jest.advanceTimersByTime(700);});
  const context=await (initLlama as jest.Mock).mock.results[0].value;
  expect(initLlama).toHaveBeenCalledTimes(1);
  mockFocused=false;
  await act(async()=>{view.update(<ChatScreen navigation={navigation} route={route}/>);});
  mockFocused=true;
  await act(async()=>{listeners.focus();view.update(<ChatScreen navigation={navigation} route={route}/>);});
  await act(async()=>{jest.advanceTimersByTime(700);});
  expect(context.release).not.toHaveBeenCalled();
  expect(initLlama).toHaveBeenCalledTimes(1);
  NativeModules.DeviceControl.startSpeechRecognition=jest.fn(async()=> 'Hello Moonlight');
  NativeModules.DeviceControl.requestWebSearch=jest.fn(async()=>({status:200,body:JSON.stringify({sources:[{title:'Example',url:'https://example.com/',snippet:'A source.'}]})}));
  await act(async()=>{await view.root.findAllByType(TouchableOpacity).find(b=>b.props.accessibilityLabel==='Speak and send message')!.props.onPress();});
  expect(context.completion).toHaveBeenCalledTimes(1);
  expect(NativeModules.DeviceControl.requestWebSearch).not.toHaveBeenCalled();
  expect(listConversations()[0].messages.some(m=>m.content==='Hello Moonlight')).toBe(true);
  await act(async()=>{saveSettings({...getSettings(),modelUrl:'https://huggingface.co/new.gguf'});listeners.focus();});
  await act(async()=>{jest.advanceTimersByTime(700);});
  expect(context.release).toHaveBeenCalledTimes(1);
  expect(initLlama).toHaveBeenCalledTimes(2);
  await act(async()=>view.unmount()); jest.useRealTimers();
});

