import { CHAT_HISTORY_KEY, defaultSettings, getSettings, parseJsonOrDefault, saveSettings, storage } from '../src/services/storage';

describe('storage service', () => {
  beforeEach(() => {
    storage.clearAll();
  });

  it('returns defaults when settings JSON is malformed', () => {
    storage.set('app_settings', '{bad json');

    expect(getSettings()).toEqual(defaultSettings);
  });

  it('migrates missing settings fields to defaults', () => {
    storage.set('app_settings', JSON.stringify({ temperature: 1.2 }));

    expect(getSettings()).toEqual({
      ...defaultSettings,
      temperature: 1.2,
    });
  });

  it('saves sanitized settings', () => {
    saveSettings({ ...defaultSettings, memoryEnabled: false, modelUrl: 'https://example.com/model.gguf' });

    expect(getSettings().memoryEnabled).toBe(false);
    expect(getSettings().modelUrl).toBe('https://example.com/model.gguf');
  });

  it('parses fallback JSON without throwing', () => {
    storage.set(CHAT_HISTORY_KEY, '{nope');

    expect(parseJsonOrDefault(storage.getString(CHAT_HISTORY_KEY), [])).toEqual([]);
  });
});
