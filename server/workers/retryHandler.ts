/**
 * Retry Handler
 * Implements exponential backoff retry logic for failed tasks
 */

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
};

export class RetryHandler {
  private config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config };
  }

  /**
   * Calculate delay for retry attempt
   */
  calculateDelay(attempt: number): number {
    const delay = this.config.initialDelay * Math.pow(this.config.backoffMultiplier, attempt);
    return Math.min(delay, this.config.maxDelay);
  }

  /**
   * Execute function with retry logic
   */
  async execute<T>(
    fn: () => Promise<T>,
    onRetry?: (attempt: number, error: Error, nextDelay: number) => void
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < this.config.maxRetries) {
          const delay = this.calculateDelay(attempt);
          if (onRetry) {
            onRetry(attempt + 1, lastError, delay);
          }
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error("Max retries exceeded");
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Check if error is retryable
   */
  isRetryable(error: Error): boolean {
    // Network errors are retryable
    if (error.message.includes("ECONNREFUSED") ||
        error.message.includes("ENOTFOUND") ||
        error.message.includes("ETIMEDOUT") ||
        error.message.includes("timeout")) {
      return true;
    }

    // Browser errors are retryable
    if (error.message.includes("browser") ||
        error.message.includes("playwright") ||
        error.message.includes("Executable doesn't exist")) {
      return true;
    }

    return false;
  }
}

export default RetryHandler;
