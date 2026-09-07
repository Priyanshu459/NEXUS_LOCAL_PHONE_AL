import RNFS from 'react-native-fs';
import {
  downloadModel,
  getModelFilenameFromUrl,
  validateGgufDownloadUrl,
} from '../src/services/modelManager';

describe('hostile model inputs', () => {
  beforeEach(() => jest.clearAllMocks());

  it.each(['%', '%FF', '%E0%A4%A'])('rejects malformed encoding %s without crashing Settings', encoding => {
    const url = `https://huggingface.co/org/repo/resolve/main/${encoding}.gguf`;
    expect(() => validateGgufDownloadUrl(url)).not.toThrow();
    expect(validateGgufDownloadUrl(url)).not.toBeNull();
    expect(() => getModelFilenameFromUrl(`${encoding}.gguf`)).not.toThrow();
  });

  it.each(['https://example.com/model.gguf', 'http://127.0.0.1/model.gguf', 'file:///private/model.gguf'])(
    'rejects untrusted download input at the service boundary: %s', async url => {
      await expect(downloadModel(url, 'model.gguf', jest.fn())).rejects.toThrow();
      expect(RNFS.downloadFile).not.toHaveBeenCalled();
    },
  );
});
