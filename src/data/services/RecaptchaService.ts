import { AppLogger } from '../../core/utils/Logger';

/**
 * Service to manage reCAPTCHA verification requests
 * Implements a singleton pattern to ensure consistent state across the app
 */
export class RecaptchaService {
  private static instance: RecaptchaService;
  private pendingResolve: ((token: string) => void) | null = null;
  private pendingReject: ((error: Error) => void) | null = null;
  private isPending: boolean = false;

  private constructor() {
    AppLogger.info('RecaptchaService: Initialized');
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): RecaptchaService {
    if (!RecaptchaService.instance) {
      RecaptchaService.instance = new RecaptchaService();
    }
    return RecaptchaService.instance;
  }

  /**
   * Request a reCAPTCHA token
   * This will trigger the UI to show the reCAPTCHA modal
   */
  public async requestToken(): Promise<string> {
    AppLogger.info('RecaptchaService: Token requested');
    
    if (this.isPending) {
      AppLogger.warn('RecaptchaService: Token request already pending');
      throw new Error('A reCAPTCHA verification is already in progress');
    }

    this.isPending = true;

    return new Promise<string>((resolve, reject) => {
      this.pendingResolve = resolve;
      this.pendingReject = reject;

      AppLogger.info('RecaptchaService: Promise created, waiting for resolution');

      // Set a timeout to automatically reject after 5 minutes
      setTimeout(() => {
        if (this.isPending) {
          AppLogger.warn('RecaptchaService: Token request timed out');
          this.resolveWithError('Security verification timed out');
        }
      }, 5 * 60 * 1000);
    });
  }

  /**
   * Resolve the pending request with a token
   */
  public resolveWithToken(token: string): void {
    AppLogger.info('RecaptchaService: Resolving with token');
    
    if (this.pendingResolve) {
      this.pendingResolve(token);
      this.cleanup();
    } else {
      AppLogger.warn('RecaptchaService: No pending resolve function');
    }
  }

  /**
   * Resolve the pending request with an error
   */
  public resolveWithError(errorMessage: string): void {
    AppLogger.info('RecaptchaService: Resolving with error', errorMessage);
    
    if (this.pendingReject) {
      this.pendingReject(new Error(errorMessage));
      this.cleanup();
    } else {
      AppLogger.warn('RecaptchaService: No pending reject function');
    }
  }

  /**
   * Check if there's a pending reCAPTCHA request
   */
  public hasPendingRequest(): boolean {
    return this.isPending;
  }

  /**
   * Clean up the pending request state
   */
  private cleanup(): void {
    AppLogger.info('RecaptchaService: Cleaning up pending request');
    this.pendingResolve = null;
    this.pendingReject = null;
    this.isPending = false;
  }

  /**
   * Reset the service state (useful for testing or error recovery)
   */
  public reset(): void {
    AppLogger.info('RecaptchaService: Resetting service');
    if (this.pendingReject) {
      this.pendingReject(new Error('Security verification was reset'));
    }
    this.cleanup();
  }
}
