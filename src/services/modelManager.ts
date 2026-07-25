import RNFS from 'react-native-fs';

export const getModelPath = (filename: string) => {
  return `${RNFS.DocumentDirectoryPath}/${filename}`;
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
  onProgress: (progress: number) => void
): Promise<string> => {
  const path = getModelPath(filename);
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
      progress: (res) => {
        const percentage = (res.bytesWritten / res.contentLength) * 100;
        onProgress(percentage);
      },
      progressDivider: 1,
    });
    
    currentJobId = job.jobId;
    
    job.promise.then(async (res) => {
      currentJobId = null;
      if (res.statusCode === 200) {
        // Move tmp file to final destination
        await RNFS.moveFile(tmpPath, path);
        resolve(path);
      } else {
        reject(new Error(`Failed to download: ${res.statusCode}`));
      }
    }).catch((err) => {
      currentJobId = null;
      reject(err);
    });
  });
};
