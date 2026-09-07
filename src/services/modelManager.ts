import RNFS from 'react-native-fs';
import { AVAILABLE_MODELS } from '../constants/models';

const FALLBACK_MODEL_FILENAME = 'model.gguf';

// ── Hugging Face URL Parser ────────────────────────────────────────────────
//
// Accepts all common Hugging Face URL forms and normalises them to a direct
// /resolve/ download URL when a GGUF file path is embedded in the URL.
//
// Supported inputs:
//   https://huggingface.co/{owner}/{repo}
//   https://huggingface.co/{owner}/{repo}/
//   https://huggingface.co/{owner}/{repo}/tree/{revision}
//   https://huggingface.co/{owner}/{repo}/blob/{revision}/{file-path}
//   https://huggingface.co/{owner}/{repo}/resolve/{revision}/{file-path}
//   (Any trailing query string is stripped from path detection but preserved for resolve URLs)
//
// Returns null if the URL is not a recognised Hugging Face URL or cannot be
// resolved to a direct download path.
// Returns a ParsedHfUrl object otherwise.
//
export interface ParsedHfUrl {
  /** The normalised direct download URL (always a /resolve/ URL for file paths). */
  resolveUrl: string;
  /** The file extension of the target file (lowercased), or null for repo-level URLs. */
  fileExtension: string | null;
  /** The decoded filename, or null for repo-level URLs. */
  filename: string | null;
  /** Whether this resolved to a direct file URL (true) or a repo-level URL (false). */
  isDirectFile: boolean;
  owner: string;
  repo: string;
  revision: string;
}

export function parseHuggingFaceUrl(raw: string): ParsedHfUrl | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  // Only accept HTTPS Hugging Face URLs
  if (parsed.protocol !== 'https:') return null;
  if (
    parsed.hostname !== 'huggingface.co' &&
    !parsed.hostname.endsWith('.huggingface.co')
  ) {
    return null;
  }

  // Strip leading slash, split pathname into segments
  const segments = parsed.pathname.replace(/^\//, '').split('/').filter(Boolean);

  // Must have at least owner + repo
  if (segments.length < 2) return null;

  const [encodedOwner, encodedRepo, mode, encodedRevision, ...rest] = segments;

  if (!encodedOwner || !encodedRepo) return null;

  let owner: string;
  let repo: string;
  let revision: string;
  try {
    owner = decodeURIComponent(encodedOwner);
    repo = decodeURIComponent(encodedRepo);
    revision = encodedRevision ? decodeURIComponent(encodedRevision) : 'main';
  } catch {
    return null;
  }

  const base = `https://huggingface.co/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;

  // Repository-level URL: no mode or unrecognised mode
  if (!mode || (mode !== 'blob' && mode !== 'resolve' && mode !== 'tree')) {
    return {
      resolveUrl: base,
      fileExtension: null,
      filename: null,
      isDirectFile: false,
      owner,
      repo,
      revision,
    };
  }

  // /tree/{revision} — repository browser at a specific revision, no file
  if (mode === 'tree') {
    return {
      resolveUrl: `${base}/tree/${encodeURIComponent(revision)}`,
      fileExtension: null,
      filename: null,
      isDirectFile: false,
      owner,
      repo,
      revision,
    };
  }

  // /blob/{revision}/{...filePath} or /resolve/{revision}/{...filePath}
  if ((mode === 'blob' || mode === 'resolve') && encodedRevision && rest.length > 0) {
    // Rebuild the file path from remaining segments, preserving slashes
    const rawFilePath = rest.join('/');
    // Decode the path for display / extension detection
    let decodedFilePath: string;
    try {
      decodedFilePath = decodeURIComponent(rawFilePath);
    } catch {
      return null;
    }
    const fileExtension = decodedFilePath.split('.').pop()?.toLowerCase() ?? null;
    const filename = decodedFilePath.split('/').pop() ?? null;

    // Always convert blob/ → resolve/ so we get the raw file, not the HTML viewer
    const resolveUrl = `${base}/resolve/${encodeURIComponent(revision)}/${rawFilePath}`;

    return {
      resolveUrl,
      fileExtension: fileExtension ?? null,
      filename,
      isDirectFile: true,
      owner,
      repo,
      revision,
    };
  }

  // /blob/{revision} with no file path — just a mode+revision, no file
  if ((mode === 'blob' || mode === 'resolve') && encodedRevision && rest.length === 0) {
    return {
      resolveUrl: `${base}/${mode}/${encodeURIComponent(revision)}`,
      fileExtension: null,
      filename: null,
      isDirectFile: false,
      owner,
      repo,
      revision,
    };
  }

  return null;
}

// ── URL validation ─────────────────────────────────────────────────────────
//
// Accepts:
//   • A direct /resolve/ GGUF URL
//   • A /blob/ GGUF URL (converted internally to /resolve/)
//
// Repository-level URLs are resolved to a compatible GGUF before download.
//
export const validateGgufDownloadUrl = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return 'Enter a Hugging Face model URL.';

  // Protocol gate
  if (!/^https:\/\//i.test(trimmed))
    return 'The URL must use HTTPS.';

  const parsed = parseHuggingFaceUrl(trimmed);

  if (!parsed) {
    // Not a HF URL at all — check if it's even a HF domain
    if (!/huggingface\.co/i.test(trimmed))
      return 'Use a huggingface.co model URL.';
    return 'Invalid Hugging Face model link.';
  }

  if (parsed.isDirectFile && parsed.fileExtension !== 'gguf') {
    return `Unsupported file type (.${parsed.fileExtension ?? 'unknown'}). Only .gguf model files can be used.`;
  }

  return null;
};

export interface ResolvedModelDownload {
  url: string;
  filename: string;
}

type HuggingFaceSibling = { rfilename?: unknown };
type HuggingFaceModelInfo = { siblings?: HuggingFaceSibling[] };

const isSplitModelFile = (filename: string) =>
  /-\d{5}-of-\d{5}\.gguf$/i.test(filename);

const ggufPreference = (filename: string) => {
  const lower = filename.toLowerCase();
  const priorities = ['q4_k_m', 'q4_k_s', 'q4_0', 'q5_k_m', 'q5_k_s'];
  const match = priorities.findIndex(quant => lower.includes(quant));
  return match === -1 ? priorities.length : match;
};

const selectCompatibleGguf = (filenames: string[]): string | null => {
  const compatible = filenames
    .filter(name => name.toLowerCase().endsWith('.gguf'))
    .filter(name => !isSplitModelFile(name))
    .sort((left, right) => {
      const preference = ggufPreference(left) - ggufPreference(right);
      return preference || left.localeCompare(right);
    });
  return compatible[0] ?? null;
};

export const resolveHuggingFaceModelUrl = async (
  rawUrl: string,
): Promise<ResolvedModelDownload> => {
  const parsed = parseHuggingFaceUrl(rawUrl);
  if (!parsed) {
    throw new Error('Use a valid HTTPS huggingface.co model URL.');
  }

  if (parsed.isDirectFile && parsed.filename) {
    if (parsed.fileExtension !== 'gguf') {
      throw new Error('Only GGUF model files are supported.');
    }
    return {
      url: parsed.resolveUrl,
      filename: getModelFilenameFromUrl(parsed.filename),
    };
  }

  const modelId = `${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}`;
  const revisionPath =
    parsed.revision === 'main'
      ? ''
      : `/revision/${encodeURIComponent(parsed.revision)}`;
  const metadataUrl = `https://huggingface.co/api/models/${modelId}${revisionPath}`;
  const response = await fetch(metadataUrl);

  if (response.status === 401 || response.status === 403) {
    throw new Error('This model requires Hugging Face access.');
  }
  if (response.status === 404) {
    throw new Error('The requested Hugging Face model does not exist.');
  }
  if (!response.ok) {
    throw new Error(`Hugging Face could not resolve this model (HTTP ${response.status}).`);
  }

  const metadata = (await response.json()) as HuggingFaceModelInfo;
  const filenames = (metadata.siblings ?? [])
    .map(item => item.rfilename)
    .filter((name): name is string => typeof name === 'string');
  const filename = selectCompatibleGguf(filenames);

  if (!filename) {
    const hasSplitGguf = filenames.some(
      name => name.toLowerCase().endsWith('.gguf') && isSplitModelFile(name),
    );
    throw new Error(
      hasSplitGguf
        ? 'This repository only contains split GGUF files, which are not supported.'
        : 'No supported GGUF model files were found in this repository.',
    );
  }

  const encodedPath = filename
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/');
  const base = `https://huggingface.co/${modelId}`;
  return {
    url: `${base}/resolve/${encodeURIComponent(parsed.revision)}/${encodedPath}`,
    filename: getModelFilenameFromUrl(filename),
  };
};

// ── Normalise a URL for downloading ───────────────────────────────────────
//
// Converts a /blob/ URL to its /resolve/ equivalent so the download goes to
// the raw file rather than the HTML viewer page.  Pass-through for other URLs.
//
export const normaliseHfDownloadUrl = (url: string): string => {
  const parsed = parseHuggingFaceUrl(url.trim());
  if (parsed?.isDirectFile) return parsed.resolveUrl;
  return url;
};

export const getModelFilenameFromUrl = (url: string): string => {
  // Try to get a nice name from a parsed HF URL first
  const parsed = parseHuggingFaceUrl(url.trim());
  if (parsed?.filename) {
    const safeName = parsed.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    if (safeName.toLowerCase().endsWith('.gguf')) return safeName;
  }
  if (parsed && !parsed.isDirectFile) {
    const repoFilename = `${parsed.owner}_${parsed.repo}.gguf`.replace(
      /[^a-zA-Z0-9._-]/g,
      '_',
    );
    return repoFilename;
  }

  const rawName =
    url.split('/').pop()?.split('?')[0] || FALLBACK_MODEL_FILENAME;
  let decodedName: string;
  try {
    decodedName = decodeURIComponent(rawName);
  } catch {
    return FALLBACK_MODEL_FILENAME;
  }
  const safeName = decodedName.replace(/[^a-zA-Z0-9._-]/g, '_');

  if (!safeName.toLowerCase().endsWith('.gguf')) {
    return FALLBACK_MODEL_FILENAME;
  }

  return safeName || FALLBACK_MODEL_FILENAME;
};

export const getModelPath = (filename: string) => {
  return `${RNFS.DocumentDirectoryPath}/${getModelFilenameFromUrl(filename)}`;
};

export const checkModelExists = async (filename: string) => {
  const path = getModelPath(filename);
  return await RNFS.exists(path);
};

export const deleteModel = async (filename: string) => {
  const path = getModelPath(filename);
  if (await RNFS.exists(path)) {
    await RNFS.unlink(path);
  }
};


const safeCleanup = async (path: string) => {
  try {
    if (await RNFS.exists(path)) {
      await RNFS.unlink(path);
    }
  } catch (cleanupErr) {
    console.warn('Failed to cleanup temp file:', cleanupErr);
  }
};

let currentJobId: number | null = null;

export const cancelDownload = () => {
  if (currentJobId !== null) {
    RNFS.stopDownload(currentJobId);
    currentJobId = null;
  }
};

export const downloadModel = async (
  url: string,
  filename: string,
  onProgress: (progress: number) => void,
): Promise<string> => {
  const catalogModel = AVAILABLE_MODELS.find(m => m.url === url);
  const expectedSizeBytes = catalogModel?.expectedSizeBytes;
  const expectedSha256 = catalogModel?.sha256;

  if (expectedSizeBytes) {
    const fsInfo = await RNFS.getFSInfo();
    const requiredSpace = expectedSizeBytes + 100 * 1024 * 1024; // 100MB safety margin
    if (fsInfo.freeSpace < requiredSpace) {
      throw new Error(`Insufficient storage. This model requires at least ${(requiredSpace / 1024 / 1024 / 1024).toFixed(2)} GB of free space.`);
    }
  }

  const resolvedDownload = await resolveHuggingFaceModelUrl(url);
  const effectiveUrl = resolvedDownload.url;

  const safeFilename = getModelFilenameFromUrl(
    filename || resolvedDownload.filename,
  );
  const path = getModelPath(safeFilename);
  const tmpPath = `${path}.tmp`;

  if (await RNFS.exists(path)) {
    return path;
  }

  // Ensure any previous interrupted download is removed
  await safeCleanup(tmpPath);

  return new Promise((resolve, reject) => {
    const job = RNFS.downloadFile({
      fromUrl: effectiveUrl,
      toFile: tmpPath,
      progress: res => {
        if (res.contentLength > 0) {
          const percentage = Math.min(
            100,
            Math.max(0, (res.bytesWritten / res.contentLength) * 100),
          );
          onProgress(percentage);
        }
      },
      progressDivider: 1,
    });

    currentJobId = job.jobId;

    job.promise
      .then(async res => {
        currentJobId = null;
        if (res.statusCode === 200) {
          if (expectedSizeBytes) {
            const stat = await RNFS.stat(tmpPath);
            if (stat.size !== expectedSizeBytes) {
              await safeCleanup(tmpPath);
              throw new Error(`Model integrity check failed: Expected ${expectedSizeBytes} bytes, but downloaded ${stat.size} bytes.`);
            }
          }

          if (expectedSha256) {
            const actualSha256 = await RNFS.hash(tmpPath, 'sha256');
            if (actualSha256.toLowerCase() !== expectedSha256.toLowerCase()) {
              await safeCleanup(tmpPath);
              throw new Error('Model integrity check failed: SHA256 checksum mismatch.');
            }
          }

          // Move tmp file to final destination atomically
          await RNFS.moveFile(tmpPath, path);
          onProgress(100);
          resolve(path);
        } else if (res.statusCode === 401 || res.statusCode === 403) {
          await safeCleanup(tmpPath);
          reject(
            new Error(
              `This model requires Hugging Face access. ` +
                `The repository may be gated or private. (HTTP ${res.statusCode})`,
            ),
          );
        } else if (res.statusCode === 404) {
          await safeCleanup(tmpPath);
          reject(
            new Error(
              `The requested model file does not exist. ` +
                `Check the URL and try again. (HTTP 404)`,
            ),
          );
        } else {
          await safeCleanup(tmpPath);
          reject(new Error(`Download interrupted. Try again. (HTTP ${res.statusCode})`));
        }
      })
      .catch(async err => {
        currentJobId = null;
        await safeCleanup(tmpPath);
        reject(err);
      });
  });
};
