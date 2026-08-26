import RNFS from 'react-native-fs';

const FALLBACK_MODEL_FILENAME = 'model.gguf';

export const validateGgufDownloadUrl = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return 'Enter a direct model download URL.';
  if (!/^https:\/\//i.test(trimmed)) return 'The URL must use HTTPS.';
  if (!/^https:\/\/([^/]+\.)?huggingface\.co\//i.test(trimmed))
    return 'Use a huggingface.co download URL.';
  if (!trimmed.split('?')[0].toLowerCase().endsWith('.gguf'))
    return 'The URL must point directly to a .gguf file.';
  return null;
};

export const getModelFilenameFromUrl = (url: string): string => {
  const rawName =
    url.split('/').pop()?.split('?')[0] || FALLBACK_MODEL_FILENAME;
  const decodedName = decodeURIComponent(rawName);
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
  const safeFilename = getModelFilenameFromUrl(filename);
  const path = getModelPath(safeFilename);
  const tmpPath = `${path}.tmp`;

  if (await RNFS.exists(path)) {
    return path;
  }

  // Ensure any previous interrupted download is removed
  if (await RNFS.exists(tmpPath)) {
    await RNFS.unlink(tmpPath);
  }

  return new Promise((resolve, reject) => {
    const job = RNFS.downloadFile({
      fromUrl: url,
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
          // Move tmp file to final destination
          await RNFS.moveFile(tmpPath, path);
          onProgress(100);
          resolve(path);
        } else {
          if (await RNFS.exists(tmpPath)) {
            await RNFS.unlink(tmpPath);
          }
          reject(new Error(`Failed to download: ${res.statusCode}`));
        }
      })
      .catch(err => {
        currentJobId = null;
        reject(err);
      });
  });
};
