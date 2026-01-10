/**
 * Video compression using FFmpeg WASM
 */

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export interface VideoCompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  duration?: number;
}

export interface VideoCompressionProgress {
  stage: 'loading' | 'compressing' | 'done';
  progress: number;
  message: string;
}

let ffmpegInstance: FFmpeg | null = null;
let isLoading = false;

/**
 * Check if file is a compressible video
 */
export const isCompressibleVideo = (file: File): boolean => {
  return ['video/mp4', 'video/webm', 'video/quicktime'].includes(file.type);
};

/**
 * Get or create FFmpeg instance
 */
const getFFmpeg = async (
  onProgress?: (progress: VideoCompressionProgress) => void
): Promise<FFmpeg> => {
  if (ffmpegInstance) {
    return ffmpegInstance;
  }

  if (isLoading) {
    // Wait for existing load to complete
    while (isLoading) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (ffmpegInstance) return ffmpegInstance;
  }

  isLoading = true;
  onProgress?.({
    stage: 'loading',
    progress: 0,
    message: 'Loading video processor...',
  });

  try {
    const ffmpeg = new FFmpeg();

    ffmpeg.on('log', ({ message }) => {
      console.log('[FFmpeg]', message);
    });

    ffmpeg.on('progress', ({ progress }) => {
      onProgress?.({
        stage: 'compressing',
        progress: Math.round(progress * 100),
        message: `Compressing video... ${Math.round(progress * 100)}%`,
      });
    });

    // Load FFmpeg core from CDN
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    ffmpegInstance = ffmpeg;
    onProgress?.({
      stage: 'loading',
      progress: 100,
      message: 'Video processor ready',
    });

    return ffmpeg;
  } finally {
    isLoading = false;
  }
};

/**
 * Compress a video file
 */
export const compressVideo = async (
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    videoBitrate?: string;
    audioBitrate?: string;
    onProgress?: (progress: VideoCompressionProgress) => void;
  } = {}
): Promise<VideoCompressionResult> => {
  const {
    maxWidth = 1280,
    maxHeight = 720,
    videoBitrate = '1500k',
    audioBitrate = '128k',
    onProgress,
  } = options;

  const originalSize = file.size;

  console.log(`[videoCompression] Starting compression for ${file.name} (${(originalSize / (1024 * 1024)).toFixed(1)} MB)`);

  const ffmpeg = await getFFmpeg(onProgress);

  const inputName = 'input' + getExtension(file.name);
  const outputName = 'output.mp4';

  onProgress?.({
    stage: 'compressing',
    progress: 0,
    message: 'Preparing video...',
  });

  // Write input file
  await ffmpeg.writeFile(inputName, await fetchFile(file));

  onProgress?.({
    stage: 'compressing',
    progress: 5,
    message: 'Compressing video...',
  });

  // Run compression
  // Scale to fit within maxWidth x maxHeight while maintaining aspect ratio
  // -crf 28 is a good balance between quality and file size
  await ffmpeg.exec([
    '-i', inputName,
    '-vf', `scale='min(${maxWidth},iw)':'min(${maxHeight},ih)':force_original_aspect_ratio=decrease`,
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '28',
    '-b:v', videoBitrate,
    '-maxrate', videoBitrate,
    '-bufsize', `${parseInt(videoBitrate) * 2}k`,
    '-c:a', 'aac',
    '-b:a', audioBitrate,
    '-movflags', '+faststart',
    '-y',
    outputName,
  ]);

  onProgress?.({
    stage: 'compressing',
    progress: 95,
    message: 'Finalizing...',
  });

  // Read output file
  const data = await ffmpeg.readFile(outputName);
  // Handle the FileData type from FFmpeg - it could be Uint8Array or string
  let blob: Blob;
  if (typeof data === 'string') {
    // If it's a string (unlikely for video), encode it
    blob = new Blob([new TextEncoder().encode(data)], { type: 'video/mp4' });
  } else {
    // It's a Uint8Array - copy to a new ArrayBuffer to avoid SharedArrayBuffer issues
    const buffer = new ArrayBuffer(data.length);
    new Uint8Array(buffer).set(data);
    blob = new Blob([buffer], { type: 'video/mp4' });
  }
  
  // Clean up
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);

  // Create new file
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const compressedFile = new File([blob], `${baseName}_compressed.mp4`, {
    type: 'video/mp4',
  });

  const compressedSize = compressedFile.size;

  console.log(
    `[videoCompression] ${file.name}: ${(originalSize / (1024 * 1024)).toFixed(1)}MB → ${(compressedSize / (1024 * 1024)).toFixed(1)}MB (${Math.round((1 - compressedSize / originalSize) * 100)}% reduction)`
  );

  onProgress?.({
    stage: 'done',
    progress: 100,
    message: 'Compression complete',
  });

  return {
    file: compressedFile,
    originalSize,
    compressedSize,
    compressionRatio: compressedSize / originalSize,
  };
};

/**
 * Optimize video if beneficial
 */
export const optimizeVideo = async (
  file: File,
  options?: Parameters<typeof compressVideo>[1]
): Promise<VideoCompressionResult> => {
  // Skip if not a compressible video
  if (!isCompressibleVideo(file)) {
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 1,
    };
  }

  // Skip small videos (< 5MB) - not worth the processing time
  if (file.size < 5 * 1024 * 1024) {
    console.log(`[videoCompression] Skipping small file: ${file.name}`);
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 1,
    };
  }

  try {
    const result = await compressVideo(file, options);

    // Only use compressed version if it's actually smaller by at least 10%
    if (result.compressedSize < result.originalSize * 0.9) {
      return result;
    }

    console.log(`[videoCompression] Compression not beneficial for ${file.name}, using original`);
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 1,
    };
  } catch (error) {
    console.error(`[videoCompression] Failed to compress ${file.name}:`, error);
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 1,
    };
  }
};

/**
 * Get file extension
 */
function getExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'mp4':
      return '.mp4';
    case 'webm':
      return '.webm';
    case 'mov':
    case 'quicktime':
      return '.mov';
    default:
      return '.mp4';
  }
}
