import {NativeModules, Platform} from 'react-native';

export type AvailableUpdate = {versionCode: number};
const interval = 60 * 60 * 1000;
let checkedAt = -Infinity;
let cached: AvailableUpdate | null = null;
let pending: Promise<AvailableUpdate | null> | undefined;

/** One check per hour, shared across screens and foreground events. */
export function checkAppUpdate(): Promise<AvailableUpdate | null> {
  if (Platform.OS !== 'android' || !NativeModules.AppUpdates?.check) return Promise.resolve(null);
  if (pending) return pending;
  if (Date.now() - checkedAt < interval) return Promise.resolve(cached);
  pending = Promise.resolve().then(() => NativeModules.AppUpdates.check()).then(result => {
    cached = Number.isInteger(result?.versionCode) && result.versionCode > 0 ? result : null;
    return cached;
  }).catch(() => { cached = null; return null; }).finally(() => {
    checkedAt = Date.now();
    pending = undefined;
  });
  return pending;
}

export async function openUpdateStore(): Promise<void> {
  if (!NativeModules.AppUpdates?.openStore) throw new Error('Google Play is unavailable.');
  await NativeModules.AppUpdates.openStore();
}
