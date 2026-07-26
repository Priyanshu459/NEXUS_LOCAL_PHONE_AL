import { storage } from './storage';

export const memoryStorage = storage;

export type Fact = {
  id: string;
  content: string;
  timestamp: number;
};

export const getMemories = (): Fact[] => {
  const data = memoryStorage.getString('memories');
  return data ? JSON.parse(data) : [];
};

export const addMemory = (content: string) => {
  const memories = getMemories();
  if (!memories.find(m => m.content.toLowerCase() === content.toLowerCase())) {
    memories.push({
      id: Date.now().toString(),
      content,
      timestamp: Date.now()
    });
    memoryStorage.set('memories', JSON.stringify(memories));
  }
};

export const deleteMemory = (id: string) => {
  const memories = getMemories().filter(m => m.id !== id);
  memoryStorage.set('memories', JSON.stringify(memories));
};

export const getMemoryContextString = (): string => {
  const memories = getMemories();
  if (memories.length === 0) return "";
  return "\n\nCRITICAL FACTS ABOUT THE USER:\n" + memories.map(m => "- " + m.content).join('\n');
};

export const parseMemoryActions = (text: string): string[] => {
  const regex = /<MEMORY>(.*?)<\/MEMORY>/g;
  const memories: string[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    memories.push(match[1]);
  }
  return memories;
};
