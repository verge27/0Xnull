/**
 * Video thumbnail generation utility
 * Extracts the first frame from a video as a thumbnail image
 */

export interface ThumbnailResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Extract a thumbnail from a video file at a specific time
 */
export const extractVideoThumbnail = async (
  file: File,
  options: {
    time?: number; // Time in seconds to capture (default: 0.5)
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  } = {}
): Promise<ThumbnailResult> => {
  const { time = 0.5, maxWidth = 640, maxHeight = 360, quality = 0.85 } = options;

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    // Create object URL for the video
    const videoUrl = URL.createObjectURL(file);

    const cleanup = () => {
      URL.revokeObjectURL(videoUrl);
      video.remove();
    };

    video.onloadedmetadata = () => {
      // Set the time to capture
      video.currentTime = Math.min(time, video.duration);
    };

    video.onseeked = () => {
      try {
        // Calculate dimensions maintaining aspect ratio
        let width = video.videoWidth;
        let height = video.videoHeight;

        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;
          if (width / maxWidth > height / maxHeight) {
            width = maxWidth;
            height = Math.round(width / aspectRatio);
          } else {
            height = maxHeight;
            width = Math.round(height * aspectRatio);
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw the video frame to canvas
        ctx.drawImage(video, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            cleanup();
            if (blob) {
              const dataUrl = canvas.toDataURL('image/jpeg', quality);
              resolve({
                blob,
                dataUrl,
                width,
                height,
              });
            } else {
              reject(new Error('Failed to create thumbnail blob'));
            }
          },
          'image/jpeg',
          quality
        );
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    video.onerror = () => {
      cleanup();
      reject(new Error('Failed to load video'));
    };

    // Set video properties
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.src = videoUrl;
  });
};

/**
 * Extract multiple thumbnails from a video at different times
 */
export const extractVideoThumbnails = async (
  file: File,
  count: number = 4,
  options?: Omit<Parameters<typeof extractVideoThumbnail>[1], 'time'>
): Promise<ThumbnailResult[]> => {
  // First, get video duration
  const duration = await getVideoDuration(file);
  
  // Calculate time points (avoid the very start and end)
  const startOffset = Math.min(0.5, duration * 0.05);
  const endOffset = Math.min(0.5, duration * 0.05);
  const usableDuration = duration - startOffset - endOffset;
  const interval = usableDuration / (count - 1);

  const thumbnails: ThumbnailResult[] = [];

  for (let i = 0; i < count; i++) {
    const time = startOffset + interval * i;
    try {
      const thumbnail = await extractVideoThumbnail(file, { ...options, time });
      thumbnails.push(thumbnail);
    } catch (err) {
      console.warn(`[videoThumbnail] Failed to extract frame at ${time}s:`, err);
    }
  }

  return thumbnails;
};

/**
 * Get video duration
 */
export const getVideoDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const videoUrl = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(videoUrl);
      resolve(video.duration);
    };

    video.onerror = () => {
      URL.revokeObjectURL(videoUrl);
      reject(new Error('Failed to load video'));
    };

    video.preload = 'metadata';
    video.src = videoUrl;
  });
};

/**
 * Create a thumbnail file from a video
 */
export const createThumbnailFile = async (
  videoFile: File,
  options?: Parameters<typeof extractVideoThumbnail>[1]
): Promise<File> => {
  const result = await extractVideoThumbnail(videoFile, options);
  const baseName = videoFile.name.replace(/\.[^/.]+$/, '');
  return new File([result.blob], `${baseName}_thumb.jpg`, { type: 'image/jpeg' });
};
