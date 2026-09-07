import { NativeModules } from 'react-native';
import { AVAILABLE_MODELS } from '../constants/models';
export interface DeviceCapacity { totalMemory: number; availableMemory: number; freeStorage: number; is64Bit: boolean }
const GiB = 1024 ** 3;
export function recommendModel(capacity: DeviceCapacity | null) {
  // Recommendations are estimates; the loader separately checks live memory.
  const id = !capacity || capacity.availableMemory < 3 * GiB ? 'llama32-1b' : 'qwen25-15b';
  return {model: AVAILABLE_MODELS.find(m => m.id === id)!,
    reason: !capacity ? 'Device capacity unavailable. Loading requires a successful memory check.'
      : 'A compact model is suggested. Large models are unavailable in this test release; available memory is checked again before loading.'};
}
export async function getDeviceRecommendation() {
  try { return recommendModel(await NativeModules.DeviceControl.getDeviceCapacity()); }
  catch { return recommendModel(null); }
}
