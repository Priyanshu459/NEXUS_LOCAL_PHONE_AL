import { storage } from '../src/services/storage';
import {
  listConversations,
  saveConversation,
  deleteConversation,
  renameConversation,
} from '../src/services/conversations';
import { fitContext } from '../src/services/contextWindow';
jest.mock('../src/services/chatFormatting', () => ({
  formatMessagesForModel: jest.fn(async (_llama, options) => ({
    prompt: JSON.stringify(options.messages),
    additionalStops: [],
  })),
}));
beforeEach(() => storage.clearAll());
const user = { id: 'u', role: 'user' as const, content: 'My first idea' };
test('migrates existing history exactly once and never resurrects deleted chats', () => {
  storage.set('chat_history', JSON.stringify([user]));
  expect(listConversations()[0].messages).toEqual([user]);
  deleteConversation('imported');
  expect(listConversations()).toEqual([]);
});
test('keeps conversations isolated and preserves custom titles after another reply', () => {
  saveConversation('one', [user]);
  saveConversation('two', [{ ...user, content: 'Other' }]);
  renameConversation('one', 'Project');
  saveConversation('one', [
    user,
    { id: 'a', role: 'assistant', content: 'Hello' },
  ]);
  expect(listConversations().find(c => c.id === 'one')?.title).toBe('Project');
  expect(
    listConversations().find(c => c.id === 'two')?.messages[0].content,
  ).toBe('Other');
});
test('drops whole oldest turns to fit inference without mutating saved messages', async () => {
  const messages = [
    user,
    { id: 'a', role: 'assistant' as const, content: 'Answer' },
    { ...user, id: 'u2' },
  ];
  const llama = {
    tokenize: jest.fn(async (prompt: string) => ({
      tokens: new Array(JSON.parse(prompt).length * 100),
    })),
  };
  const result = await fitContext(
    llama as any,
    { messages, systemPrompt: '', memoryContextString: '', modelUrl: '' },
    300,
    100,
  );
  expect(result.removedMessages).toBe(2);
  expect(messages).toHaveLength(3);
});
test('rejects an oversized final message instead of silently truncating it', async () => {
  const llama = {
    tokenize: jest.fn(async () => ({ tokens: new Array(1000) })),
  };
  await expect(
    fitContext(
      llama as any,
      {
        messages: [user],
        systemPrompt: '',
        memoryContextString: '',
        modelUrl: '',
      },
      300,
      100,
    ),
  ).rejects.toThrow('too large');
});
