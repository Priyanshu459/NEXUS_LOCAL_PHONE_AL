module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['./jest.setup.js'],
  modulePathIgnorePatterns: ['<rootDir>/.local-release/'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-safe-area-context|react-native-screens|react-native-mmkv|react-native-fs|llama.rn)/)',
  ],
};
