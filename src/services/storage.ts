import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV({
  id: 'moon-studio-storage',
});

export const SETTINGS_KEY = 'app_settings';
export const CHAT_HISTORY_KEY = 'chat_history';

export interface AppSettings {
  responseStyle?: 'concise' | 'balanced' | 'detailed';
  systemPrompt: string;
  temperature: number;
  top_p: number;
  top_k: number;
  maxTokens: number;
  modelUrl: string;
  memoryEnabled: boolean;
}

export const defaultSettings: AppSettings = {
  responseStyle: 'balanced',
  systemPrompt: 'You are a helpful, respectful, and honest local AI assistant. Always answer as helpfully as possible, while being safe.',
  temperature: 0.7,
  top_p: 0.9,
  top_k: 40,
  maxTokens: 512,
  modelUrl: 'https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf',
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

  const clamp = (val: unknown, min: number, max: number, fallback: number) => {
    if (typeof val !== 'number' || isNaN(val)) return fallback;
    return Math.max(min, Math.min(max, val));
  };

  return {
    responseStyle: value.responseStyle === 'concise' || value.responseStyle === 'detailed' ? value.responseStyle : 'balanced',
    systemPrompt: typeof value.systemPrompt === 'string' && value.systemPrompt.trim()
      ? value.systemPrompt
      : defaultSettings.systemPrompt,
    temperature: clamp(value.temperature, 0, 2, defaultSettings.temperature),
    top_p: clamp(value.top_p, 0, 1, defaultSettings.top_p),
    top_k: clamp(value.top_k, 1, 100, defaultSettings.top_k),
    maxTokens: clamp(value.maxTokens, 64, 8192, defaultSettings.maxTokens),
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

export interface PersistedMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: import('./webSearch').WebSource[];
}

export const loadChatHistory = (): PersistedMessage[] => {
  const raw = storage.getString(CHAT_HISTORY_KEY);
  if (!raw) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    storage.remove(CHAT_HISTORY_KEY);
    return [];
  }

  if (!Array.isArray(parsed)) {
    storage.remove(CHAT_HISTORY_KEY);
    return [];
  }

  const validMessages: PersistedMessage[] = [];
  let neededMigration = false;

  for (const item of parsed) {
    if (isRecord(item)) {
      if (item.role === 'system') {
        neededMigration = true;
        continue;
      }
      if (
        typeof item.id === 'string' &&
        (item.role === 'user' || item.role === 'assistant') &&
        typeof item.content === 'string'
      ) {
        validMessages.push({
          id: item.id,
          role: item.role,
          content: item.content,
        });
      } else {
        neededMigration = true;
      }
    } else {
      neededMigration = true;
    }
  }

  if (neededMigration) {
    storage.set(CHAT_HISTORY_KEY, JSON.stringify(validMessages));
  }

  return validMessages;
};

export const saveChatHistory = (messages: PersistedMessage[]) => {
  storage.set(CHAT_HISTORY_KEY, JSON.stringify(messages));
};

export const clearChatHistory = () => {
  storage.remove(CHAT_HISTORY_KEY);
};
