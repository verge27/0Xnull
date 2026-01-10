/**
 * Image compression utility for reducing file size before upload
 */

const MAX_DIMENSION = 1920; // Max width/height
const JPEG_QUALITY = 0.85;
const WEBP_QUALITY = 0.85;

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

/**
 * Check if file is an image that can be compressed
 */
export const isCompressibleImage = (file: File): boolean => {
  return ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
};

/**
 * Load an image file into an HTMLImageElement
 */
const loadImage = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Calculate new dimensions maintaining aspect ratio
 */
const calculateDimensions = (
  width: number,
  height: number,
  maxDimension: number
): { width: number; height: number } => {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }

  if (width > height) {
    return {
      width: maxDimension,
      height: Math.round((height * maxDimension) / width),
    };
  }

  return {
    width: Math.round((width * maxDimension) / height),
    height: maxDimension,
  };
};

/**
 * Compress an image file
 */
export const compressImage = async (
  file: File,
  options: {
    maxDimension?: number;
    quality?: number;
    outputFormat?: 'image/jpeg' | 'image/webp';
  } = {}
): Promise<CompressionResult> => {
  const {
    maxDimension = MAX_DIMENSION,
    quality = JPEG_QUALITY,
    outputFormat = 'image/jpeg',
  } = options;

  const originalSize = file.size;

  // Load the image
  const img = await loadImage(file);
  const { width: originalWidth, height: originalHeight } = img;

  // Calculate target dimensions
  const { width, height } = calculateDimensions(
    originalWidth,
    originalHeight,
    maxDimension
  );

  // Create canvas and draw resized image
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Use high-quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  // Convert to blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Failed to compress image'));
      },
      outputFormat,
      quality
    );
  });

  // Determine output filename
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const extension = outputFormat === 'image/webp' ? 'webp' : 'jpg';
  const newFileName = `${baseName}.${extension}`;

  const compressedFile = new File([blob], newFileName, { type: outputFormat });
  const compressedSize = compressedFile.size;

  console.log(
    `[imageCompression] ${file.name}: ${(originalSize / 1024).toFixed(0)}KB → ${(compressedSize / 1024).toFixed(0)}KB (${Math.round((1 - compressedSize / originalSize) * 100)}% reduction)`
  );

  return {
    file: compressedFile,
    originalSize,
    compressedSize,
    compressionRatio: compressedSize / originalSize,
  };
};

/**
 * Compress image if beneficial, otherwise return original
 */
export const optimizeImage = async (
  file: File,
  options?: Parameters<typeof compressImage>[1]
): Promise<CompressionResult> => {
  // Skip if not a compressible image
  if (!isCompressibleImage(file)) {
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 1,
    };
  }

  // Skip tiny images (< 100KB) - not worth compressing
  if (file.size < 100 * 1024) {
    console.log(`[imageCompression] Skipping small file: ${file.name}`);
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 1,
    };
  }

  try {
    const result = await compressImage(file, options);

    // Only use compressed version if it's actually smaller
    if (result.compressedSize < result.originalSize) {
      return result;
    }

    console.log(`[imageCompression] Compression not beneficial for ${file.name}, using original`);
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 1,
    };
  } catch (error) {
    console.warn(`[imageCompression] Failed to compress ${file.name}:`, error);
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 1,
    };
  }
};
