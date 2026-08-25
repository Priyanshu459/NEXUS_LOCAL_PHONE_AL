import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV({
  id: 'moon-studio-storage',
});

export const SETTINGS_KEY = 'app_settings';
export const CHAT_HISTORY_KEY = 'chat_history';

export interface AppSettings {
  systemPrompt: string;
  temperature: number;
  top_p: number;
  top_k: number;
  modelUrl: string;
  memoryEnabled: boolean;
}

export const defaultSettings: AppSettings = {
  systemPrompt: 'You are a helpful, respectful, and honest local AI assistant. Always answer as helpfully as possible, while being safe.',
  temperature: 0.7,
  top_p: 0.9,
  top_k: 40,
  modelUrl: 'https://huggingface.co/Qwen/Qwen1.5-1.8B-Chat-GGUF/resolve/main/qwen1_5-1_8b-chat-q4_k_m.gguf?download=true',
  memoryEnabled: true,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const parseJsonOrDefault = <T>(raw: string | undefined, fallback: T): T => {
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const sanitizeSettings = (value: unknown): AppSettings => {
  if (!isRecord(value)) {
    return defaultSettings;
  }

  return {
    systemPrompt: typeof value.systemPrompt === 'string' && value.systemPrompt.trim()
      ? value.systemPrompt
      : defaultSettings.systemPrompt,
    temperature: typeof value.temperature === 'number' ? value.temperature : defaultSettings.temperature,
    top_p: typeof value.top_p === 'number' ? value.top_p : defaultSettings.top_p,
    top_k: typeof value.top_k === 'number' ? value.top_k : defaultSettings.top_k,
    modelUrl: typeof value.modelUrl === 'string' && value.modelUrl.trim()
      ? value.modelUrl
      : defaultSettings.modelUrl,
    memoryEnabled: typeof value.memoryEnabled === 'boolean'
      ? value.memoryEnabled
      : defaultSettings.memoryEnabled,
  };
};

export const getSettings = (): AppSettings => {
  return sanitizeSettings(parseJsonOrDefault(storage.getString(SETTINGS_KEY), defaultSettings));
};

export const saveSettings = (settings: AppSettings) => {
  storage.set(SETTINGS_KEY, JSON.stringify(sanitizeSettings(settings)));
};
