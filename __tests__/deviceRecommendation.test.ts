import {recommendModel, DeviceCapacity} from '../src/services/deviceRecommendation';
const GiB=1024**3;
const capable:DeviceCapacity={totalMemory:12*GiB,availableMemory:8*GiB,freeStorage:20*GiB,is64Bit:true};
test('large Moonlight model remains unavailable even on a high-memory device',()=>{
  expect(recommendModel(capable).model.id).toBe('qwen25-15b');
});
test.each([
  {...capable,availableMemory:2*GiB}, {...capable,freeStorage:4*GiB},
  {...capable,is64Bit:false}, {...capable,totalMemory:4*GiB},
])('does not recommend the large model when a capacity requirement fails',capacity=>{
  expect(recommendModel(capacity).model.id).not.toBe('moonlight-v7');
});
test('unknown device information falls back to a compact option',()=>{
  expect(recommendModel(null).model.id).toBe('llama32-1b');
});
