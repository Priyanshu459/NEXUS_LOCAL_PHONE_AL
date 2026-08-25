import { storage } from './storage';

const MEMORY_KEY = 'memories';
export const memoryStorage = storage;

export type Fact = {
  id: string;
  content: string;
  timestamp: number;
};

const normalizeMemory = (content: string) => content.trim().replace(/\s+/g, ' ');

export const getMemories = (): Fact[] => {
  const data = memoryStorage.getString(MEMORY_KEY);
  if (!data) {
    return [];
  }

  try {
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is Fact =>
      item &&
      typeof item.id === 'string' &&
      typeof item.content === 'string' &&
      typeof item.timestamp === 'number',
    );
  } catch {
    return [];
  }
};

export const addMemory = (content: string) => {
  const normalized = normalizeMemory(content);
  if (!normalized) {
    return;
  }

  const memories = getMemories();
  if (!memories.find(m => normalizeMemory(m.content).toLowerCase() === normalized.toLowerCase())) {
    const timestamp = Date.now();
    memories.push({
      id: timestamp.toString(),
      content: normalized,
      timestamp,
    });
    memoryStorage.set(MEMORY_KEY, JSON.stringify(memories));
  }
};

export const deleteMemory = (id: string) => {
  const memories = getMemories().filter(m => m.id !== id);
  memoryStorage.set(MEMORY_KEY, JSON.stringify(memories));
};

export const getMemoryContextString = (): string => {
  const memories = getMemories();
  if (memories.length === 0) return '';
  return '\n\nFacts the user asked Moonlight to remember:\n' + memories.map(m => '- ' + m.content).join('\n');
};

export const parseMemoryActions = (text: string): string[] => {
  const regex = /<MEMORY>(.*?)<\/MEMORY>/gis;
  const memories: string[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    const normalized = normalizeMemory(match[1]);
    if (normalized && !memories.some(item => item.toLowerCase() === normalized.toLowerCase())) {
      memories.push(normalized);
    }
  }
  return memories;
};
