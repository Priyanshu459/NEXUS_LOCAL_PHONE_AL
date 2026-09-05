/* eslint-env jest */

const { NativeModules } = require('react-native');

const mockMmkvStore = new Map();

jest.mock('react-native-mmkv', () => ({
  createMMKV: () => ({
    getString: key => mockMmkvStore.get(key),
    set: (key, value) => mockMmkvStore.set(key, value),
    delete: key => mockMmkvStore.delete(key),
    remove: key => mockMmkvStore.delete(key),
    clearAll: () => mockMmkvStore.clear(),
  }),
}));

jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/tmp',
  exists: jest.fn(() => Promise.resolve(false)),
  unlink: jest.fn(() => Promise.resolve()),
  moveFile: jest.fn(() => Promise.resolve()),
  stopDownload: jest.fn(),
  downloadFile: jest.fn(() => ({
    jobId: 1,
    promise: Promise.resolve({ statusCode: 200 }),
  })),
}));

jest.mock('llama.rn', () => ({
  initLlama: jest.fn(() => Promise.resolve({
    completion: jest.fn(() => Promise.resolve()),
    stopCompletion: jest.fn(),
    release: jest.fn(() => Promise.resolve()),
  })),
}));

NativeModules.DeviceControl = {
  startSpeechRecognition: jest.fn(() => Promise.resolve('')),
  pickFile: jest.fn(() => Promise.resolve(null)),
  copyToClipboard: jest.fn(() => Promise.resolve(true)),
};
