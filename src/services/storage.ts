import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV({ id: 'app-storage' });

export const SETTINGS_KEY = 'app_settings';
export const CHAT_HISTORY_KEY = 'chat_history';

export interface AppSettings {
  systemPrompt: string;
  temperature: number;
  top_p: number;
  top_k: number;
  modelUrl: string;
}

export const defaultSettings: AppSettings = {
  systemPrompt: "You are a helpful, respectful, and honest local AI assistant. Always answer as helpfully as possible, while being safe.",
  temperature: 0.7,
  top_p: 0.9,
  top_k: 40,
  modelUrl: "https://huggingface.co/Qwen/Qwen1.5-1.8B-Chat-GGUF/resolve/main/qwen1_5-1_8b-chat-q4_k_m.gguf?download=true", // Example small model
};

export const getSettings = (): AppSettings => {
  const data = storage.getString(SETTINGS_KEY);
  return data ? JSON.parse(data) : defaultSettings;
};

export const saveSettings = (settings: AppSettings) => {
  storage.set(SETTINGS_KEY, JSON.stringify(settings));
};
