/**
 * Upload retry logic with exponential backoff
 */

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  onRetry?: (attempt: number, error: Error, delayMs: number) => void;
}

export interface UploadProgress {
  status: 'idle' | 'uploading' | 'retrying' | 'success' | 'failed';
  progress: number;
  attempt: number;
  maxAttempts: number;
  error?: string;
  retryingIn?: number;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry'>> = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
};

/**
 * Check if an error is retryable (network/timeout errors)
 */
export const isRetryableError = (error: unknown): boolean => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('failed to fetch') ||
      message.includes('connection') ||
      message.includes('abort') ||
      message.includes('504') ||
      message.includes('502') ||
      message.includes('503')
    );
  }
  return false;
};

/**
 * Calculate delay with exponential backoff and jitter
 */
const calculateDelay = (
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number
): number => {
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt - 1);
  const jitter = Math.random() * 0.3 * exponentialDelay;
  return Math.min(exponentialDelay + jitter, maxDelayMs);
};

/**
 * Sleep for a duration
 */
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Execute an async operation with retry logic
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries, baseDelayMs, maxDelayMs } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry if it's not a retryable error or we've exhausted retries
      if (!isRetryableError(error) || attempt > maxRetries) {
        throw lastError;
      }

      const delayMs = calculateDelay(attempt, baseDelayMs, maxDelayMs);
      console.log(
        `[uploadRetry] Attempt ${attempt} failed, retrying in ${delayMs}ms:`,
        lastError.message
      );

      options.onRetry?.(attempt, lastError, delayMs);
      await sleep(delayMs);
    }
  }

  throw lastError || new Error('Upload failed after retries');
}

/**
 * Create a progress tracker for upload with retries
 */
export const createProgressTracker = (
  onProgress: (progress: UploadProgress) => void,
  maxAttempts: number
) => {
  let currentAttempt = 1;

  return {
    setAttempt: (attempt: number) => {
      currentAttempt = attempt;
    },
    
    uploading: (progress: number) => {
      onProgress({
        status: 'uploading',
        progress,
        attempt: currentAttempt,
        maxAttempts,
      });
    },

    retrying: (attempt: number, error: Error, delayMs: number) => {
      currentAttempt = attempt + 1;
      onProgress({
        status: 'retrying',
        progress: 0,
        attempt: currentAttempt,
        maxAttempts,
        error: error.message,
        retryingIn: delayMs,
      });
    },

    success: () => {
      onProgress({
        status: 'success',
        progress: 100,
        attempt: currentAttempt,
        maxAttempts,
      });
    },

    failed: (error: string) => {
      onProgress({
        status: 'failed',
        progress: 0,
        attempt: currentAttempt,
        maxAttempts,
        error,
      });
    },

    reset: () => {
      currentAttempt = 1;
      onProgress({
        status: 'idle',
        progress: 0,
        attempt: 1,
        maxAttempts,
      });
    },
  };
};
