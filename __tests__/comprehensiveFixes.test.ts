import { formatMessagesForModel } from '../src/services/chatFormatting';
import { loadChatHistory, storage, getSettings, saveSettings } from '../src/services/storage';
import { downloadModel } from '../src/services/modelManager';
import { AVAILABLE_MODELS, MODEL_CATALOG } from '../src/constants/models';
import RNFS from 'react-native-fs';
jest.mock('react-native-fs', () => ({
  getFSInfo: jest.fn(),
  exists: jest.fn(),
  unlink: jest.fn(),
  downloadFile: jest.fn(),
  moveFile: jest.fn(),
}));

describe('Validation Tests', () => {

  // Catalog tests
  describe('Catalog & Attribution', () => {
    it('should have unique catalog IDs and URLs', () => {
      const ids = new Set();
      const urls = new Set();
      AVAILABLE_MODELS.forEach(m => {
        expect(ids.has(m.id)).toBe(false);
        expect(urls.has(m.url)).toBe(false);
        ids.add(m.id);
        urls.add(m.url);
      });
    });

    it('should have attribution completeness', () => {
      AVAILABLE_MODELS.forEach(m => {
        expect(m.originalPublisher).toBeDefined();
        expect(m.quantizationPublisher).toBeDefined();
        expect(m.originalModelUrl).toBeDefined();
        expect(m.quantizedRepoUrl).toBeDefined();
        expect(m.licenseIdentifier).toBeDefined();
        expect(m.licenseUrl).toBeDefined();
        expect(typeof m.isLicenseVerified).toBe('boolean');
      });
    });

    it('should have a default model in the catalog', () => {
      const defaultUrl = getSettings().modelUrl;
      const defaultModel = AVAILABLE_MODELS.find(m => m.url === defaultUrl);
      expect(defaultModel).toBeDefined();
    });
  });

  // Storage tests
  describe('Storage Validation & Migration', () => {
    beforeEach(() => {
      storage.clearAll();
    });

    it('should clamp maxTokens and other generation settings', () => {
      saveSettings({ maxTokens: 999999, temperature: 5, top_p: -1, top_k: 0 } as any);
      const s = getSettings();
      expect(s.maxTokens).toBe(8192); // clamped to 8192
      expect(s.temperature).toBe(2);
      expect(s.top_p).toBe(0);
      expect(s.top_k).toBe(1);
    });

    it('should validate and migrate history', () => {
      storage.set('chat_history', JSON.stringify([
        { role: 'system', content: 'legacy' }, // should drop
        { id: '1', role: 'user', content: 'hello' }, // keep
        { id: 2, role: 'assistant', content: 'hi' }, // drop (malformed ID)
      ]));

      const h = loadChatHistory();
      expect(h.length).toBe(1);
      expect(h[0].content).toBe('hello');

      // Check idempotent migration (the saved string should be updated)
      const afterMigrate = JSON.parse(storage.getString('chat_history') || '[]');
      expect(afterMigrate.length).toBe(1);
      expect(afterMigrate[0].id).toBe('1');
    });
  });

  // Chat Formatting
  describe('Chat Formatting', () => {
    it('should format messages correctly', async () => {
      const llamaMock = {
        getFormattedChat: jest.fn().mockResolvedValue({
          prompt: 'MockPrompt',
          additional_stops: ['mock_stop']
        })
      };

      const res = await formatMessagesForModel(llamaMock as any, {
        messages: [{ id: '1', role: 'user', content: 'hello' }],
        systemPrompt: 'system',
        memoryContextString: '',
        modelUrl: AVAILABLE_MODELS[0].url
      });

      expect(res.prompt).toBe('MockPrompt');
      expect(res.additionalStops).toContain('mock_stop');
    });

    it('should throw on unsupported custom templates', async () => {
      const llamaMock = {
        getFormattedChat: jest.fn().mockRejectedValue(new Error('Format error'))
      };
      
      await expect(formatMessagesForModel(llamaMock as any, {
        messages: [],
        systemPrompt: '',
        memoryContextString: '',
        modelUrl: 'custom_url'
      })).rejects.toThrow(/Model template error/);
    });

    it('should append assistant prefix for DeepSeek models', async () => {
      const llamaMock = {
        getFormattedChat: jest.fn().mockResolvedValue({
          prompt: 'DeepSeekPrompt'
        })
      };

      const dsModel = MODEL_CATALOG.find(m => m.id.includes('deepseek'));
      const res = await formatMessagesForModel(llamaMock as any, {
        messages: [],
        systemPrompt: '',
        memoryContextString: '',
        modelUrl: dsModel!.url
      });

      expect(res.prompt).toContain('<|im_start|>assistant');
    });

    it('should prepend attachment ephemerally', async () => {
      const llamaMock = {
        getFormattedChat: jest.fn().mockResolvedValue({ prompt: 'test' })
      };

      await formatMessagesForModel(llamaMock as any, {
        messages: [{ id: '1', role: 'user', content: 'hello' }],
        systemPrompt: '',
        memoryContextString: '',
        currentAttachmentText: 'document_content',
        modelUrl: AVAILABLE_MODELS[0].url
      });

      const callArgs = llamaMock.getFormattedChat.mock.calls[0][0];
      const userMsg = callArgs.find((m: any) => m.role === 'user');
      expect(userMsg.content).toContain('document_content');
      expect(userMsg.content).toContain('hello');
    });
  });

  // Model Manager
  describe('Model Integrity & Cleanup', () => {
    it('should reject if free space is insufficient', async () => {
      (RNFS.getFSInfo as jest.Mock).mockResolvedValue({ freeSpace: 100 });
      await expect(downloadModel(AVAILABLE_MODELS[0].url, 'test.gguf', () => {})).rejects.toThrow(/Insufficient storage/);
    });
    
    // More download tests can be added...
  });

});
