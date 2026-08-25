import RNFS from 'react-native-fs';
import { downloadModel, getModelFilenameFromUrl, getModelPath } from '../src/services/modelManager';

describe('modelManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sanitizes model filenames from URLs', () => {
    expect(getModelFilenameFromUrl('https://example.com/models/My Model%201.gguf?download=true')).toBe('My_Model_1.gguf');
    expect(getModelFilenameFromUrl('../secret.txt')).toBe('model.gguf');
    expect(getModelPath('../secret.gguf')).toBe('/tmp/secret.gguf');
  });

  it('moves a successful download into place and reports completion', async () => {
    const progress = jest.fn();
    (RNFS.exists as jest.Mock).mockResolvedValue(false);
    (RNFS.downloadFile as jest.Mock).mockImplementation(({ progress: onProgress }) => {
      onProgress({ bytesWritten: 50, contentLength: 100 });
      return {
        jobId: 9,
        promise: Promise.resolve({ statusCode: 200 }),
      };
    });

    await expect(downloadModel('https://example.com/model.gguf', 'model.gguf', progress)).resolves.toBe('/tmp/model.gguf');

    expect(RNFS.moveFile).toHaveBeenCalledWith('/tmp/model.gguf.tmp', '/tmp/model.gguf');
    expect(progress).toHaveBeenLastCalledWith(100);
  });

  it('cleans up a failed temporary download', async () => {
    (RNFS.exists as jest.Mock)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    (RNFS.downloadFile as jest.Mock).mockReturnValue({
      jobId: 10,
      promise: Promise.resolve({ statusCode: 500 }),
    });

    await expect(downloadModel('https://example.com/bad.gguf', 'bad.gguf', jest.fn())).rejects.toThrow('500');

    expect(RNFS.unlink).toHaveBeenCalledWith('/tmp/bad.gguf.tmp');
  });
});
