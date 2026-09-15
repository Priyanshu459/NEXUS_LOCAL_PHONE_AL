import React from 'react';
import Renderer, {act} from 'react-test-renderer';
import {AppState, Text} from 'react-native';
import {AppUpdateNotice} from '../src/components/AppUpdateNotice';
import {checkAppUpdate, openUpdateStore} from '../src/services/appUpdates';
jest.mock('../src/services/appUpdates', () => ({checkAppUpdate:jest.fn(),openUpdateStore:jest.fn()}));
jest.mock('react-native-safe-area-context', () => ({useSafeAreaInsets:()=>({top:24,bottom:24,left:0,right:0})}));
const check = checkAppUpdate as jest.Mock;
const open = openUpdateStore as jest.Mock;
const button = (view:Renderer.ReactTestRenderer,label:string)=>view.root.findAll(b=>b.props.accessibilityLabel===(label==='Update'?'Update Moonlight on Google Play':label)&&typeof b.props.onPress==='function')[0];
beforeEach(()=>{jest.clearAllMocks();check.mockResolvedValue(null);open.mockResolvedValue(undefined);jest.spyOn(AppState,'addEventListener').mockReturnValue({remove:jest.fn()});});
afterEach(()=>{jest.restoreAllMocks();});

test('no banner when no eligible update exists',async()=>{
  let view!:Renderer.ReactTestRenderer;
  await act(async()=>{view=Renderer.create(<AppUpdateNotice/>);});
  expect(view.toJSON()).toBeNull();
  await act(async()=>{view.unmount();});
});

test('update opens the store, dismissal survives foreground until a different release',async()=>{
  let listener!: (state:any)=>void;
  const remove = jest.fn();
  const subscription = jest.spyOn(AppState,'addEventListener').mockImplementation((_,handler)=>{listener=handler;return {remove};});
  check.mockResolvedValue({versionCode:16});
  let view!:Renderer.ReactTestRenderer;
  await act(async()=>{view=Renderer.create(<AppUpdateNotice/>);});
  await act(async()=>{await button(view,'Update').props.onPress();});
  expect(open).toHaveBeenCalledTimes(1);
  await act(async()=>{button(view,'Not now').props.onPress();listener('active');});
  expect(view.toJSON()).toBeNull();
  check.mockResolvedValue({versionCode:17});
  await act(async()=>{listener('active');});
  expect(button(view,'Update')).toBeDefined();
  await act(async()=>{view.unmount();});
  expect(remove).toHaveBeenCalled();
  subscription.mockRestore();
});

test('store failure offers a retry without dismissing the notice',async()=>{
  check.mockResolvedValue({versionCode:16});open.mockRejectedValue(new Error('unavailable'));
  let view!:Renderer.ReactTestRenderer;
  await act(async()=>{view=Renderer.create(<AppUpdateNotice/>);});
  await act(async()=>{await button(view,'Update').props.onPress();});
  expect(view.root.findAllByType(Text).some(t=>t.props.accessibilityRole==='alert')).toBe(true);
  expect(button(view,'Update').props.disabled).toBe(false);
  await act(async()=>{view.unmount();});
});
