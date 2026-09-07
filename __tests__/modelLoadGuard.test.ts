import {serializeModelLoad, validateLoadCapacity} from '../src/services/modelLoadGuard';
const GiB = 1024 ** 3;
const capacity = {is64Bit:true,totalMemory:8*GiB,availableMemory:4*GiB};
test.each([0, NaN, 4.28e9])('rejects invalid or large files before native loading: %s', size => {
  expect(()=>validateLoadCapacity(size,capacity)).toThrow();
});
test('requires live memory information and a reserve',()=>{
  expect(()=>validateLoadCapacity(GiB,null)).toThrow();
  expect(()=>validateLoadCapacity(GiB,{...capacity,availableMemory:2*GiB})).toThrow();
  expect(()=>validateLoadCapacity(GiB,capacity)).not.toThrow();
});
test('serializes initialization and recovers after a rejected load',async()=>{
  const order:string[]=[];
  let finish!:()=>void;
  const first=serializeModelLoad(async()=>{order.push('first');await new Promise<void>(r=>{finish=r;});throw new Error('load failed');});
  const failure=expect(first).rejects.toThrow('load failed');
  const second=serializeModelLoad(async()=>{order.push('second');});
  await Promise.resolve();
  expect(order).toEqual(['first']);
  finish();await failure;await second;
  expect(order).toEqual(['first','second']);
});
