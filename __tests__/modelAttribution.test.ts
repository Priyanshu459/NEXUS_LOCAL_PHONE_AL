import { MODEL_CATALOG, AVAILABLE_MODELS } from '../src/constants/models';

describe('Model Attribution and Licensing Verification', () => {
  it('contains all 10 known models in the full model catalog', () => {
    expect(MODEL_CATALOG.length).toBe(10);
    const expectedIds = [
      'moonlight-v7',
      'llama32-1b',
      'qwen25-15b',
      'llama32-3b',
      'deepseek-15b',
      'gemma2-2b',
      'phi3-mini',
      'lfm2-350m',
      'lfm2-700m',
      'lfm25-12b',
    ];
    for (const id of expectedIds) {
      expect(MODEL_CATALOG.some(m => m.id === id)).toBe(true);
    }
  });

  it('exposes only verified Liquid AI models in AVAILABLE_MODELS for initial phone download', () => {
    expect(AVAILABLE_MODELS.length).toBe(3);
    expect(AVAILABLE_MODELS.map(m => m.id)).toEqual([
      'lfm2-350m',
      'lfm2-700m',
      'lfm25-12b',
    ]);
  });

  it('ensures every catalog model has required attribution metadata and valid HTTPS license URLs', () => {
    for (const model of MODEL_CATALOG) {
      expect(model.id).toBeTruthy();
      expect(model.name).toBeTruthy();
      expect(model.originalPublisher).toBeTruthy();
      expect(model.quantizationPublisher).toBeTruthy();
      expect(model.licenseIdentifier).toBeTruthy();
      expect(model.originalModelUrl).toMatch(/^https:\/\//);
      expect(model.quantizedRepoUrl).toMatch(/^https:\/\//);
      expect(model.licenseUrl).toMatch(/^https:\/\//);
      expect(model.url).toMatch(/^https:\/\//);
      expect(typeof model.expectedSizeBytes).toBe('number');
      expect(model.expectedSizeBytes).toBeGreaterThan(0);
    }
  });

  it('verifies license identifiers match authoritative upstream licenses', () => {
    const licensesById = Object.fromEntries(
      MODEL_CATALOG.map(m => [m.id, m.licenseIdentifier]),
    );

    expect(licensesById['moonlight-v7']).toBe('Apache 2.0');
    expect(licensesById['llama32-1b']).toBe('Llama 3.2 Community License');
    expect(licensesById['llama32-3b']).toBe('Llama 3.2 Community License');
    expect(licensesById['qwen25-15b']).toBe('Apache 2.0');
    expect(licensesById['deepseek-15b']).toBe('MIT');
    expect(licensesById['gemma2-2b']).toBe('Gemma License');
    expect(licensesById['phi3-mini']).toBe('MIT');
    expect(licensesById['lfm2-350m']).toBe('LFM Open License 1.0');
    expect(licensesById['lfm2-700m']).toBe('LFM Open License 1.0');
    expect(licensesById['lfm25-12b']).toBe('LFM Open License 1.0');
  });
});
