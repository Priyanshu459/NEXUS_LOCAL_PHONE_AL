import { addMemory, getMemories, parseMemoryActions } from '../src/services/MemoryManager';
import { storage } from '../src/services/storage';

describe('MemoryManager', () => {
  beforeEach(() => {
    storage.clearAll();
  });

  it('returns an empty list for malformed storage JSON', () => {
    storage.set('memories', '{bad');

    expect(getMemories()).toEqual([]);
  });

  it('dedupes memory content case-insensitively after whitespace normalization', () => {
    addMemory(' Priya likes quiet UI ');
    addMemory('priya   likes quiet ui');

    expect(getMemories()).toHaveLength(1);
    expect(getMemories()[0].content).toBe('Priya likes quiet UI');
  });

  it('parses multiline memory tags and removes duplicates', () => {
    expect(parseMemoryActions('<MEMORY>Likes React Native\nand local models</MEMORY><MEMORY>likes react native and local models</MEMORY>')).toEqual([
      'Likes React Native and local models',
    ]);
  });
});
