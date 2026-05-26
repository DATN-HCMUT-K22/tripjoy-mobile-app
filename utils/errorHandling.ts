import NetInfo from '@react-native-community/netinfo';

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public isRetryable: boolean = false
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Check if error is due to network connectivity
 */
export async function isNetworkError(error: any): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      return true;
    }

    // Check for common network error patterns
    const message = error?.message?.toLowerCase() || '';
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('connection') ||
      message.includes('fetch failed') ||
      error?.code === 'ECONNABORTED' ||
      error?.code === 'ETIMEDOUT'
    );
  } catch {
    return false;
  }
}

/**
 * Handle error with retry support
 */
export async function handleError(
  error: any,
  options?: {
    onRetry?: () => void;
    retryable?: boolean;
  }
): Promise<{
  message: string;
  isRetryable: boolean;
  shouldShowRetry: boolean;
}> {
  const isNetwork = await isNetworkError(error);

  let message = 'Đã xảy ra lỗi';
  let isRetryable = options?.retryable ?? isNetwork;

  if (isNetwork) {
    message = 'Không có kết nối mạng';
    isRetryable = true;
  } else if (error?.message) {
    // Parse error message from API
    try {
      const parsed = JSON.parse(error.message);
      message = parsed.message || message;
    } catch {
      message = error.message;
    }
  }

  return {
    message,
    isRetryable,
    shouldShowRetry: isRetryable && !!options?.onRetry,
  };
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
  }
): Promise<T> {
  const maxRetries = options?.maxRetries ?? 3;
  const initialDelay = options?.initialDelay ?? 1000;
  const maxDelay = options?.maxDelay ?? 10000;
  const backoffFactor = options?.backoffFactor ?? 2;

  let lastError: any;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      const isNetwork = await isNetworkError(error);
      if (!isNetwork && attempt > 0) {
        // Don't retry non-network errors after first attempt
        throw error;
      }

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * backoffFactor, maxDelay);
      }
    }
  }

  throw lastError;
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: any): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.message) {
    try {
      const parsed = JSON.parse(error.message);
      return parsed.message || error.message;
    } catch {
      return error.message;
    }
  }

  return 'Đã xảy ra lỗi. Vui lòng thử lại.';
}
