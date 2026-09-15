const mockCheck = jest.fn();
const mockOpen = jest.fn();
jest.mock('react-native', () => ({Platform:{OS:'android'},NativeModules:{AppUpdates:{check:mockCheck,openStore:mockOpen}}}));

beforeEach(() => { jest.resetModules(); mockCheck.mockReset(); mockOpen.mockReset(); });

test('coalesces concurrent checks and caches for an hour, then discovers a newer release', async () => {
  const time = jest.spyOn(Date, 'now').mockReturnValue(1000);
  const {checkAppUpdate} = require('../src/services/appUpdates');
  mockCheck.mockResolvedValue({versionCode:16});
  expect(await Promise.all([checkAppUpdate(),checkAppUpdate()])).toEqual([{versionCode:16},{versionCode:16}]);
  await checkAppUpdate();
  expect(mockCheck).toHaveBeenCalledTimes(1);
  time.mockReturnValue(3601001);
  mockCheck.mockResolvedValue({versionCode:17});
  expect(await checkAppUpdate()).toEqual({versionCode:17});
  expect(mockCheck).toHaveBeenCalledTimes(2);
  time.mockRestore();
});

test.each([null, {versionCode:0}, {versionCode:'16'}, {versionCode:1.5}])('hides absent or invalid availability %p',async value => {
  mockCheck.mockResolvedValue(value);
  expect(await require('../src/services/appUpdates').checkAppUpdate()).toBeNull();
});

test('a native failure leaves chat usable',async () => {
  mockCheck.mockRejectedValue(new Error('offline'));
  expect(await require('../src/services/appUpdates').checkAppUpdate()).toBeNull();
});

test('opens the native store route and propagates launch failures for retry UI',async () => {
  const {openUpdateStore} = require('../src/services/appUpdates');
  await openUpdateStore();
  expect(mockOpen).toHaveBeenCalledTimes(1);
  mockOpen.mockRejectedValue(new Error('No store'));
  await expect(openUpdateStore()).rejects.toThrow('No store');
});
