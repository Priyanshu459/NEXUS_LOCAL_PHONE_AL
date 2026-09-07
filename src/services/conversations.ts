import { storage, loadChatHistory, PersistedMessage } from './storage';
import {sanitizeSources} from './webSearch';

const KEY = 'conversations_v1';
export interface Conversation {
  id: string;
  title: string;
  updatedAt: number;
  messages: PersistedMessage[];
}

export function listConversations(): Conversation[] {
  const raw = storage.getString(KEY);
  if (!raw) {
    const legacy = loadChatHistory();
    const migrated = legacy.length
      ? [
          {
            id: 'imported',
            title: legacy[0].content.slice(0, 70),
            updatedAt: Date.now(),
            messages: legacy,
          },
        ]
      : [];
    storage.set(KEY, JSON.stringify(migrated));
    storage.remove('chat_history');
    return migrated;
  }
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data
      .filter(
        (c: Conversation) =>
          c &&
          typeof c.id === 'string' &&
          typeof c.title === 'string' &&
          Number.isFinite(c.updatedAt) &&
          Array.isArray(c.messages) &&
          c.messages.every(
            m =>
              m &&
              typeof m.id === 'string' &&
              typeof m.content === 'string' &&
              ['user', 'assistant'].includes(m.role),
          ),
      )
      .map((c: Conversation) => ({...c,messages:c.messages.map(m=>({...m,sources:sanitizeSources(m.sources)}))}))
      .sort((a: Conversation, b: Conversation) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export function saveConversation(id: string, messages: PersistedMessage[]) {
  const all = listConversations();
  const existing = all.find(c => c.id === id);
  const title =
    existing?.title ||
    messages
      .find(m => m.role === 'user')
      ?.content.replace(/\s+/g, ' ')
      .slice(0, 70) ||
    'New conversation';
  storage.set(
    KEY,
    JSON.stringify([
      { id, title, updatedAt: Date.now(), messages },
      ...all.filter(c => c.id !== id),
    ]),
  );
}

export function deleteConversation(id: string) {
  storage.set(
    KEY,
    JSON.stringify(listConversations().filter(c => c.id !== id)),
  );
}

export function clearConversations() {
  storage.set(KEY, '[]');
  storage.remove('chat_history');
}

export function renameConversation(id: string, title: string) {
  const trimmed = title.trim().slice(0, 100);
  if (!trimmed) return;
  storage.set(
    KEY,
    JSON.stringify(
      listConversations().map(c =>
        c.id === id ? { ...c, title: trimmed } : c,
      ),
    ),
  );
}
