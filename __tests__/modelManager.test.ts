import RNFS from 'react-native-fs';
import {
  downloadModel,
  getModelFilenameFromUrl,
  getModelPath,
  validateGgufDownloadUrl,
  parseHuggingFaceUrl,
  normaliseHfDownloadUrl,
  resolveHuggingFaceModelUrl,
} from '../src/services/modelManager';

// ── parseHuggingFaceUrl ───────────────────────────────────────────────────

describe('parseHuggingFaceUrl', () => {
  it('parses a repository URL', () => {
    const result = parseHuggingFaceUrl(
      'https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF',
    );
    expect(result).not.toBeNull();
    expect(result!.isDirectFile).toBe(false);
    expect(result!.fileExtension).toBeNull();
  });

  it('parses a repository URL with trailing slash', () => {
    const result = parseHuggingFaceUrl(
      'https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/',
    );
    expect(result).not.toBeNull();
    expect(result!.isDirectFile).toBe(false);
  });

  it('parses a /tree/{revision} URL', () => {
    const result = parseHuggingFaceUrl(
      'https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/tree/main',
    );
    expect(result).not.toBeNull();
    expect(result!.isDirectFile).toBe(false);
    expect(result!.fileExtension).toBeNull();
  });

  it('parses a /blob/{revision}/{file-path} URL', () => {
    const result = parseHuggingFaceUrl(
      'https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/blob/main/Llama-3.2-1B-Instruct-Q4_K_M.gguf',
    );
    expect(result).not.toBeNull();
    expect(result!.isDirectFile).toBe(true);
    expect(result!.fileExtension).toBe('gguf');
    expect(result!.filename).toBe('Llama-3.2-1B-Instruct-Q4_K_M.gguf');
    // blob must be converted to resolve
    expect(result!.resolveUrl).toContain('/resolve/');
    expect(result!.resolveUrl).not.toContain('/blob/');
  });

  it('parses a /blob/ URL with nested file path', () => {
    const result = parseHuggingFaceUrl(
      'https://huggingface.co/org/repo/blob/main/subfolder/model-q4.gguf',
    );
    expect(result).not.toBeNull();
    expect(result!.isDirectFile).toBe(true);
    expect(result!.filename).toBe('model-q4.gguf');
    expect(result!.resolveUrl).toContain('/resolve/main/subfolder/model-q4.gguf');
  });

  it('parses a /resolve/{revision}/{file-path} URL', () => {
    const result = parseHuggingFaceUrl(
      'https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_K_M.gguf',
    );
    expect(result).not.toBeNull();
    expect(result!.isDirectFile).toBe(true);
    expect(result!.fileExtension).toBe('gguf');
    expect(result!.resolveUrl).toContain('/resolve/');
  });

  it('parses a URL with query parameters', () => {
    const result = parseHuggingFaceUrl(
      'https://huggingface.co/org/repo/resolve/main/model.gguf?download=true',
    );
    expect(result).not.toBeNull();
    expect(result!.isDirectFile).toBe(true);
    expect(result!.filename).toBe('model.gguf');
  });

  it('parses a URL-encoded filename', () => {
    const result = parseHuggingFaceUrl(
      'https://huggingface.co/org/repo/resolve/main/My%20Model%20Q4.gguf',
    );
    expect(result).not.toBeNull();
    expect(result!.isDirectFile).toBe(true);
    expect(result!.filename).toBe('My Model Q4.gguf');
    expect(result!.fileExtension).toBe('gguf');
  });

  it('returns null for a non-Hugging Face domain', () => {
    expect(
      parseHuggingFaceUrl('https://example.com/model.gguf'),
    ).toBeNull();
  });

  it('returns null for an unsupported protocol (http)', () => {
    expect(
      parseHuggingFaceUrl('http://huggingface.co/org/repo/resolve/main/model.gguf'),
    ).toBeNull();
  });

  it('returns null for missing owner', () => {
    expect(parseHuggingFaceUrl('https://huggingface.co/')).toBeNull();
  });

  it('returns null for missing repo', () => {
    expect(parseHuggingFaceUrl('https://huggingface.co/owner')).toBeNull();
  });

  it('returns null for empty input', () => {
    expect(parseHuggingFaceUrl('')).toBeNull();
  });

  it('correctly identifies an unsupported file extension', () => {
    const result = parseHuggingFaceUrl(
      'https://huggingface.co/org/repo/blob/main/model.safetensors',
    );
    expect(result).not.toBeNull();
    expect(result!.isDirectFile).toBe(true);
    expect(result!.fileExtension).toBe('safetensors');
  });

  it('preserves repository names with hyphens, underscores and periods', () => {
    const result = parseHuggingFaceUrl(
      'https://huggingface.co/some-org/My_Repo.v2/resolve/main/model.gguf',
    );
    expect(result).not.toBeNull();
    expect(result!.isDirectFile).toBe(true);
  });
});

// ── normaliseHfDownloadUrl ────────────────────────────────────────────────

describe('normaliseHfDownloadUrl', () => {
  it('converts /blob/ to /resolve/', () => {
    const normalised = normaliseHfDownloadUrl(
      'https://huggingface.co/org/repo/blob/main/model.gguf',
    );
    expect(normalised).toContain('/resolve/');
    expect(normalised).not.toContain('/blob/');
  });

  it('leaves /resolve/ URLs unchanged', () => {
    const url =
      'https://huggingface.co/org/repo/resolve/main/model.gguf';
    expect(normaliseHfDownloadUrl(url)).toBe(url);
  });

  it('returns the original string for non-HF URLs', () => {
    const url = 'https://example.com/model.gguf';
    expect(normaliseHfDownloadUrl(url)).toBe(url);
  });
});

// ── validateGgufDownloadUrl ────────────────────────────────────────────────

describe('validateGgufDownloadUrl', () => {
  it('accepts a direct /resolve/ GGUF URL', () => {
    expect(
      validateGgufDownloadUrl(
        'https://huggingface.co/org/repo/resolve/main/model.gguf',
      ),
    ).toBeNull();
  });

  it('accepts a /blob/ GGUF URL (converts internally)', () => {
    expect(
      validateGgufDownloadUrl(
        'https://huggingface.co/org/repo/blob/main/model.gguf',
      ),
    ).toBeNull();
  });

  it('accepts a /resolve/ URL with query parameters', () => {
    expect(
      validateGgufDownloadUrl(
        'https://huggingface.co/org/repo/resolve/main/model.gguf?download=true',
      ),
    ).toBeNull();
  });

  it('rejects http:// URLs', () => {
    expect(
      validateGgufDownloadUrl(
        'http://huggingface.co/org/repo/resolve/main/model.gguf',
      ),
    ).toMatch(/HTTPS/);
  });

  it('rejects non-Hugging Face domains', () => {
    expect(
      validateGgufDownloadUrl('https://example.com/model.gguf'),
    ).toMatch(/huggingface/i);
  });

  it('accepts repository-level URLs for metadata resolution', () => {
    expect(
      validateGgufDownloadUrl('https://huggingface.co/org/repo'),
    ).toBeNull();
  });

  it('accepts /tree/ URLs for metadata resolution', () => {
    expect(
      validateGgufDownloadUrl(
        'https://huggingface.co/org/repo/tree/main',
      ),
    ).toBeNull();
  });

  it('rejects non-GGUF file extensions', () => {
    expect(
      validateGgufDownloadUrl(
        'https://huggingface.co/org/repo/resolve/main/model.safetensors',
      ),
    ).toMatch(/\.gguf|gguf/i);
  });

  it('returns an error for empty input', () => {
    expect(validateGgufDownloadUrl('')).not.toBeNull();
  });

  it('returns an error for missing owner/repo', () => {
    expect(
      validateGgufDownloadUrl('https://huggingface.co/'),
    ).not.toBeNull();
  });
});

// ── getModelFilenameFromUrl ────────────────────────────────────────────────

describe('getModelFilenameFromUrl', () => {
  it('sanitizes model filenames from URLs', () => {
    expect(
      getModelFilenameFromUrl(
        'https://example.com/models/My Model%201.gguf?download=true',
      ),
    ).toBe('My_Model_1.gguf');
    expect(getModelFilenameFromUrl('../secret.txt')).toBe('model.gguf');
    expect(getModelPath('../secret.gguf')).toBe('/tmp/secret.gguf');
  });

  it('extracts filename from a /blob/ URL', () => {
    expect(
      getModelFilenameFromUrl(
        'https://huggingface.co/org/repo/blob/main/Llama-3.2-1B-Q4.gguf',
      ),
    ).toBe('Llama-3.2-1B-Q4.gguf');
  });

  it('extracts filename from a /resolve/ URL', () => {
    expect(
      getModelFilenameFromUrl(
        'https://huggingface.co/org/repo/resolve/main/Llama-3.2-1B-Q4.gguf',
      ),
    ).toBe('Llama-3.2-1B-Q4.gguf');
  });

  it('decodes URL-encoded filenames', () => {
    expect(
      getModelFilenameFromUrl(
        'https://huggingface.co/org/repo/resolve/main/My%20Model%20Q4.gguf',
      ),
    ).toBe('My_Model_Q4.gguf');
  });

  it('falls back to model.gguf for non-GGUF paths', () => {
    expect(getModelFilenameFromUrl('https://example.com/readme.md')).toBe(
      'model.gguf',
    );
  });
});

// ── validateGgufDownloadUrl (legacy compatibility) ─────────────────────────
// Keep the original test cases passing.

describe('validateGgufDownloadUrl (original test cases)', () => {
  it('accepts only direct HTTPS Hugging Face GGUF URLs', () => {
    expect(
      validateGgufDownloadUrl(
        'https://huggingface.co/org/repo/resolve/main/model.gguf?download=true',
      ),
    ).toBeNull();
    expect(
      validateGgufDownloadUrl('http://huggingface.co/org/model.gguf'),
    ).toMatch(/HTTPS/);
    expect(validateGgufDownloadUrl('https://example.com/model.gguf')).toMatch(
      /huggingface/i,
    );
    expect(
      validateGgufDownloadUrl('https://huggingface.co/org/repo'),
    ).toBeNull();
  });
});

describe('resolveHuggingFaceModelUrl', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('resolves a repository URL to a preferred non-split GGUF file', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        siblings: [
          { rfilename: 'README.md' },
          { rfilename: 'model-Q8_0.gguf' },
          { rfilename: 'quant/model-Q4_K_M.gguf' },
        ],
      }),
    }) as jest.Mock;

    await expect(
      resolveHuggingFaceModelUrl('https://huggingface.co/org/repo'),
    ).resolves.toEqual({
      url: 'https://huggingface.co/org/repo/resolve/main/quant/model-Q4_K_M.gguf',
      filename: 'model-Q4_K_M.gguf',
    });
  });

  it('keeps a direct blob link and converts it to a resolve link', async () => {
    await expect(
      resolveHuggingFaceModelUrl(
        'https://huggingface.co/org/repo/blob/main/model.gguf',
      ),
    ).resolves.toEqual({
      url: 'https://huggingface.co/org/repo/resolve/main/model.gguf',
      filename: 'model.gguf',
    });
  });

  it('reports repositories without a compatible GGUF file', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ siblings: [{ rfilename: 'model.safetensors' }] }),
    }) as jest.Mock;

    await expect(
      resolveHuggingFaceModelUrl('https://huggingface.co/org/repo'),
    ).rejects.toThrow(/no supported gguf/i);
  });

  it('reports gated repositories', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
    }) as jest.Mock;

    await expect(
      resolveHuggingFaceModelUrl('https://huggingface.co/org/private-repo'),
    ).rejects.toThrow(/requires hugging face access/i);
  });
});

// ── downloadModel ──────────────────────────────────────────────────────────

describe('downloadModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('moves a successful download into place and reports completion', async () => {
    const progress = jest.fn();
    (RNFS.exists as jest.Mock).mockResolvedValue(false);
    (RNFS.downloadFile as jest.Mock).mockImplementation(
      ({ progress: onProgress }) => {
        onProgress({ bytesWritten: 50, contentLength: 100 });
        return {
          jobId: 9,
          promise: Promise.resolve({ statusCode: 200 }),
        };
      },
    );

    await expect(
      downloadModel('https://huggingface.co/org/repo/resolve/main/model.gguf', 'model.gguf', progress),
    ).resolves.toBe('/tmp/model.gguf');

    expect(RNFS.moveFile).toHaveBeenCalledWith(
      '/tmp/model.gguf.tmp',
      '/tmp/model.gguf',
    );
    expect(progress).toHaveBeenLastCalledWith(100);
  });

  it('converts a /blob/ URL to /resolve/ before downloading', async () => {
    (RNFS.exists as jest.Mock).mockResolvedValue(false);
    (RNFS.downloadFile as jest.Mock).mockReturnValue({
      jobId: 1,
      promise: Promise.resolve({ statusCode: 200 }),
    });

    await downloadModel(
      'https://huggingface.co/org/repo/blob/main/model.gguf',
      'model.gguf',
      jest.fn(),
    );

    const callArgs = (RNFS.downloadFile as jest.Mock).mock.calls[0][0];
    expect(callArgs.fromUrl).toContain('/resolve/');
    expect(callArgs.fromUrl).not.toContain('/blob/');
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

    await expect(
      downloadModel('https://huggingface.co/org/repo/resolve/main/bad.gguf', 'bad.gguf', jest.fn()),
    ).rejects.toThrow('Download interrupted');

    expect(RNFS.unlink).toHaveBeenCalledWith('/tmp/bad.gguf.tmp');
  });

  it('rejects with an auth error on 401', async () => {
    (RNFS.exists as jest.Mock).mockResolvedValue(false);
    (RNFS.downloadFile as jest.Mock).mockReturnValue({
      jobId: 2,
      promise: Promise.resolve({ statusCode: 401 }),
    });

    await expect(
      downloadModel('https://huggingface.co/org/repo/resolve/main/model.gguf', 'model.gguf', jest.fn()),
    ).rejects.toThrow(/gated or private/i);
  });

  it('rejects with a not-found error on 404', async () => {
    (RNFS.exists as jest.Mock).mockResolvedValue(false);
    (RNFS.downloadFile as jest.Mock).mockReturnValue({
      jobId: 3,
      promise: Promise.resolve({ statusCode: 404 }),
    });

    await expect(
      downloadModel('https://huggingface.co/org/repo/resolve/main/model.gguf', 'model.gguf', jest.fn()),
    ).rejects.toThrow(/does not exist/i);
  });

  it('rejects with a 403 auth error', async () => {
    (RNFS.exists as jest.Mock).mockResolvedValue(false);
    (RNFS.downloadFile as jest.Mock).mockReturnValue({
      jobId: 4,
      promise: Promise.resolve({ statusCode: 403 }),
    });

    await expect(
      downloadModel('https://huggingface.co/org/repo/resolve/main/model.gguf', 'model.gguf', jest.fn()),
    ).rejects.toThrow(/gated or private/i);
  });

  it('does not re-download a file that already exists', async () => {
    (RNFS.exists as jest.Mock).mockResolvedValue(true); // file exists
    const result = await downloadModel(
      'https://huggingface.co/org/repo/resolve/main/model.gguf',
      'model.gguf',
      jest.fn(),
    );
    expect(result).toBe('/tmp/model.gguf');
    expect(RNFS.downloadFile).not.toHaveBeenCalled();
  });

  it('removes a partial .tmp file from a previous run before starting', async () => {
    (RNFS.exists as jest.Mock)
      .mockResolvedValueOnce(false) // final file does not exist
      .mockResolvedValueOnce(true);  // tmp file does exist
    (RNFS.downloadFile as jest.Mock).mockReturnValue({
      jobId: 5,
      promise: Promise.resolve({ statusCode: 200 }),
    });

    await downloadModel('https://huggingface.co/org/repo/resolve/main/model.gguf', 'model.gguf', jest.fn());

    expect(RNFS.unlink).toHaveBeenCalledWith('/tmp/model.gguf.tmp');
  });

  it('propagates a cancelled download error', async () => {
    (RNFS.exists as jest.Mock).mockResolvedValue(false);
    (RNFS.downloadFile as jest.Mock).mockReturnValue({
      jobId: 6,
      promise: Promise.reject(new Error('canceled')),
    });

    await expect(
      downloadModel('https://huggingface.co/org/repo/resolve/main/model.gguf', 'model.gguf', jest.fn()),
    ).rejects.toThrow('canceled');
  });
});
