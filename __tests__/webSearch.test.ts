import {NativeModules} from 'react-native';
import {storage} from '../src/services/storage';
import {DEFAULT_SEARCH_ENDPOINT,disconnectSearch,getSearchConnection,restoreSearchConnection,saveSearchConnection,searchWeb,sanitizeSources,safeWebUrl} from '../src/services/webSearch';
const code='a'.repeat(43);
afterEach(()=>{delete NativeModules.DeviceControl.readSearchCredentials;delete NativeModules.DeviceControl.saveSearchCredentials;delete NativeModules.DeviceControl.clearSearchCredentials;});
beforeEach(()=>{storage.clearAll();disconnectSearch();NativeModules.DeviceControl.requestWebSearch=jest.fn();NativeModules.DeviceControl.cancelWebSearch=jest.fn();});
test('configuration requires HTTPS and keeps the access code out of persisted settings',()=>{
  expect(()=>saveSearchConnection('http://example.com/search',code)).toThrow();
  saveSearchConnection('https://example.com/search',code);
  expect(getSearchConnection().connected).toBe(true);
  expect(storage.getString('search_endpoint')).toBe('https://example.com/search');
  expect(storage.getString('app_settings')).toBeUndefined();
  disconnectSearch();expect(getSearchConnection().connected).toBe(false);
});

test('restores endpoint and key from encrypted native storage before sending',async()=>{
  NativeModules.DeviceControl.readSearchCredentials=jest.fn(async()=>JSON.stringify({endpoint:DEFAULT_SEARCH_ENDPOINT,code}));
  NativeModules.DeviceControl.requestWebSearch.mockResolvedValue({status:200,body:JSON.stringify({sources:[{title:'Page',url:'https://example.org/a',snippet:'Evidence'}]})});
  await searchWeb('restored query');
  expect(NativeModules.DeviceControl.requestWebSearch).toHaveBeenCalledWith(expect.any(String),DEFAULT_SEARCH_ENDPOINT,code,'restored query');
});

test('failed secure saving cannot claim a new connection',async()=>{
  NativeModules.DeviceControl.saveSearchCredentials=jest.fn(async()=>{throw new Error('storage unavailable');});
  await expect(saveSearchConnection(DEFAULT_SEARCH_ENDPOINT,code)).rejects.toThrow('storage unavailable');
  expect(getSearchConnection().connected).toBe(false);
});

test('disconnect cannot be undone by a pending restore',async()=>{
  let finish!:(value:string)=>void;
  NativeModules.DeviceControl.readSearchCredentials=jest.fn(()=>new Promise(resolve=>{finish=resolve;}));
  const restoring=restoreSearchConnection();
  disconnectSearch();
  finish(JSON.stringify({endpoint:DEFAULT_SEARCH_ENDPOINT,code}));
  await restoring;
  expect(getSearchConnection().connected).toBe(false);
});
test('unconfigured search sends nothing',async()=>{
  expect(getSearchConnection()).toEqual({endpoint:DEFAULT_SEARCH_ENDPOINT,connected:false});
  await expect(searchWeb('q')).rejects.toThrow('not activated');
  expect(NativeModules.DeviceControl.requestWebSearch).not.toHaveBeenCalled();
});
test('rejected credentials are discarded and cannot be retried automatically',async()=>{
  saveSearchConnection(DEFAULT_SEARCH_ENDPOINT,code);
  NativeModules.DeviceControl.requestWebSearch.mockResolvedValue({status:401,body:''});
  await expect(searchWeb('q')).rejects.toThrow('expired');
  expect(getSearchConnection().connected).toBe(false);
  await expect(searchWeb('q')).rejects.toThrow('not activated');
  expect(NativeModules.DeviceControl.requestWebSearch).toHaveBeenCalledTimes(1);
});
test('sends only the approved query and sanitizes results',async()=>{
  saveSearchConnection('https://example.com/search',code);
  NativeModules.DeviceControl.requestWebSearch.mockResolvedValue({status:200,body:JSON.stringify({sources:[{title:'Page',url:'https://example.org/a',snippet:'Evidence'}]})});
  expect((await searchWeb('query')).length).toBe(1);
  expect(NativeModules.DeviceControl.requestWebSearch).toHaveBeenCalledWith(expect.any(String),'https://example.com/search',code,'query');
});
test('cancelled search cannot return results',async()=>{
  saveSearchConnection('https://example.com/search',code);
  const controller=new AbortController();controller.abort();
  await expect(searchWeb('q',controller.signal)).rejects.toThrow('cancelled');
  expect(NativeModules.DeviceControl.requestWebSearch).not.toHaveBeenCalled();
});
test('rejects unsafe citations and normalizes IDs',()=>{
  expect(safeWebUrl('javascript:alert(1)')).toBeNull();
  expect(safeWebUrl('https://127.0.0.1/')).toBeNull();
  const sources=sanitizeSources([{id:99,title:'<b>Page</b>',url:'https://example.com',snippet:'text'},{title:'x',url:'file:///etc/passwd',snippet:'x'}]);
  expect(sources).toHaveLength(1);expect(sources[0].id).toBe(1);expect(sources[0].title).toBe('Page');
});
test('empty and failed searches do not claim success',async()=>{
  saveSearchConnection('https://example.com/search',code);
  NativeModules.DeviceControl.requestWebSearch.mockResolvedValueOnce({status:429,body:''}).mockResolvedValueOnce({status:200,body:'{"sources":[]}'});
  await expect(searchWeb('q')).rejects.toThrow('daily allowance');
  await expect(searchWeb('q')).rejects.toThrow('No usable sources');
});
