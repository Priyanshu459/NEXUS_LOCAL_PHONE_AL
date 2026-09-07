import {NativeModules} from 'react-native';
import RNFS from 'react-native-fs';

const GiB = 1024 ** 3;
let pending: Promise<unknown> = Promise.resolve();
/** A context finishing after navigation must release before another begins. */
export function serializeModelLoad<T>(work: () => Promise<T>): Promise<T> {
  const result = pending.then(work, work);
  pending = result.catch(() => undefined);
  return result;
}

export function validateLoadCapacity(size: number, capacity: {is64Bit: boolean; totalMemory: number; availableMemory: number} | null) {
  if (!Number.isFinite(size) || size <= 0 || size > 1.3 * GiB) {
    throw new Error('This test build only loads compact models up to 1.3 GB. The large Moonlight model is unavailable while we investigate the phone freeze.');
  }
  if (!capacity || !capacity.is64Bit || !Number.isFinite(capacity.totalMemory) || !Number.isFinite(capacity.availableMemory)) {
    throw new Error('Unable to verify available device memory. Model loading has been stopped.');
  }
  if (capacity.totalMemory < 4 * GiB || capacity.availableMemory < size + 1.5 * GiB) {
    throw new Error('There is not enough available memory to load this model with the required reserve. Close other apps or choose a smaller model.');
  }
}

export async function checkLoadCapacity(path: string) {
  const file = await RNFS.stat(path);
  let capacity = null;
  try { capacity = await NativeModules.DeviceControl.getDeviceCapacity(); } catch {}
  validateLoadCapacity(Number(file.size), capacity);
}
