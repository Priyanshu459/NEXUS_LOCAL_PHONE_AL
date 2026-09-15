import { NativeModules } from 'react-native';
import { AVAILABLE_MODELS } from '../constants/models';
export interface DeviceCapacity { totalMemory: number; availableMemory: number; freeStorage: number; is64Bit: boolean }
const GiB = 1024 ** 3;
export function compatibleModels(capacity:DeviceCapacity|null) {
  if(!capacity?.is64Bit || !Number.isFinite(capacity.totalMemory) || !Number.isFinite(capacity.availableMemory) || capacity.totalMemory<4*GiB)return [];
  return AVAILABLE_MODELS.filter(m=>(m.expectedSizeBytes||Infinity)<=1.3*GiB && capacity.availableMemory>=(m.expectedSizeBytes||Infinity)+1.5*GiB);
}
export function recommendModel(capacity: DeviceCapacity | null) {
  const models=compatibleModels(capacity);
  // Start small after the prior phone freeze; users can explicitly choose a larger eligible model.
  return {model:models[0]||AVAILABLE_MODELS[0], models, capacity,
    reason: !capacity ? 'Device capacity unavailable. Loading requires a successful memory check.'
      : models.length ? 'Showing LFM models that fit the current memory check. Memory is checked again before loading; performance varies by phone.' : 'No model fits the current memory reserve. Close other apps and check again, or connect a computer or cloud provider.'};
}
export async function getDeviceRecommendation() {
  try { return recommendModel(await NativeModules.DeviceControl.getDeviceCapacity()); }
  catch { return recommendModel(null); }
}
