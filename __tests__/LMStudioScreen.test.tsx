import React from 'react';
import Renderer,{act} from 'react-test-renderer';
import {LMStudioScreen} from '../src/screens/LMStudioScreen';
import {storage} from '../src/services/storage';
import {listProviders,saveProvider,refreshProviderModels} from '../src/services/providers';
jest.mock('../src/services/providers',()=>({listProviders:jest.fn(),saveProvider:jest.fn(),refreshProviderModels:jest.fn(),selectCloud:jest.fn(),removeProvider:jest.fn()}));
jest.mock('react-native-safe-area-context',()=>({useSafeAreaInsets:()=>({top:24,bottom:24})}));
const saved={id:'lmstudio',name:'Computer',baseUrl:'https://computer.example.ts.net/v1',format:'openai',connectionType:'lmstudio',models:[],verified:false};
const button=(v:Renderer.ReactTestRenderer,label:string)=>v.root.findAll(n=>typeof n.props.onPress==='function'&&n.findAll(c=>String(c.type)==='Text'&&c.props.children===label).length>0).at(-1)!;
beforeEach(()=>{storage.clearAll();jest.clearAllMocks();(listProviders as jest.Mock).mockReturnValue([saved]);(saveProvider as jest.Mock).mockResolvedValue(true);});
test('editing a name keeps the encrypted token and displays discovered models',async()=>{
 (refreshProviderModels as jest.Mock).mockResolvedValue({...saved,models:['loaded-model'],verified:true});
 let view!:Renderer.ReactTestRenderer;await act(async()=>{view=Renderer.create(<LMStudioScreen navigation={{goBack:jest.fn(),navigate:jest.fn()}}/>);});
 await act(async()=>{view.root.findByProps({accessibilityLabel:'Computer name'}).props.onChangeText('My laptop');});
 await act(async()=>{await button(view,'Save & show models').props.onPress();});
 expect(saveProvider).toHaveBeenCalledWith(expect.objectContaining({name:'My laptop'}),'',true,false);
 expect(JSON.stringify(view.toJSON())).toContain('Connected · 1 models');
 expect(JSON.stringify(view.toJSON())).toContain('loaded-model');
 await act(async()=>view.unmount());
});
test('empty discovery gives a visible explanation and remote setup includes exact instructions',async()=>{
 (refreshProviderModels as jest.Mock).mockResolvedValue({...saved,models:[],verified:true});
 let view!:Renderer.ReactTestRenderer;await act(async()=>{view=Renderer.create(<LMStudioScreen navigation={{goBack:jest.fn()}}/>);});
 await act(async()=>{await button(view,'Show models').props.onPress();});
 expect(JSON.stringify(view.toJSON())).toContain('API returned no models');
 await act(async()=>button(view,'From anywhere').props.onPress());
 await act(async()=>button(view,'How to connect · step by step').props.onPress());
 expect(JSON.stringify(view.toJSON())).toContain('tailscale serve --bg http://127.0.0.1:1234');
 await act(async()=>view.unmount());
});
test('a changed server cannot silently receive the previous token or clear it',async()=>{
 let view!:Renderer.ReactTestRenderer;await act(async()=>{view=Renderer.create(<LMStudioScreen navigation={{goBack:jest.fn()}}/>);});
 await act(async()=>view.root.findByProps({accessibilityLabel:'Server address'}).props.onChangeText('https://other.example.com'));
 await act(async()=>{await button(view,'Save & show models').props.onPress();});
 expect(saveProvider).not.toHaveBeenCalled();expect(JSON.stringify(view.toJSON())).toContain('server address changed');
 await act(async()=>view.unmount());
});

