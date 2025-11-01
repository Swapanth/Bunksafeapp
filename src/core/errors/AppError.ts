/**
 * Application Error Classes
 * Centralized error handling with specific error types
 */

export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;

  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class AuthenticationError extends AppError {
  readonly code = 'AUTH_ERROR';
  readonly statusCode = 401;

  constructor(message: string = 'Authentication failed', cause?: Error) {
    super(message, cause);
  }
}

export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;

  constructor(message: string = 'Validation failed', cause?: Error) {
    super(message, cause);
  }
}

export class NetworkError extends AppError {
  readonly code = 'NETWORK_ERROR';
  readonly statusCode = 500;

  constructor(message: string = 'Network request failed', cause?: Error) {
    super(message, cause);
  }
}

export class FirebaseError extends AppError {
  readonly code = 'FIREBASE_ERROR';
  readonly statusCode = 500;

  constructor(message: string = 'Firebase operation failed', cause?: Error) {
    super(message, cause);
  }
}

export class OnboardingError extends AppError {
  readonly code = 'ONBOARDING_ERROR';
  readonly statusCode = 400;

  constructor(message: string = 'Onboarding process failed', cause?: Error) {
    super(message, cause);
  }
}

/**
 * Error Handler Utility
 */
export class ErrorHandler {
  static handle(error: unknown): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof Error) {
      // Map common Firebase errors
      if (error.message.includes('auth/')) {
        return new AuthenticationError(error.message, error);
      }
      
      if (error.message.includes('network')) {
        return new NetworkError(error.message, error);
      }

      return new AppError(error.message, error) as any;
    }

    return new AppError('An unknown error occurred') as any;
  }

  static getDisplayMessage(error: AppError): string {
    switch (error.code) {
      case 'AUTH_ERROR':
        return 'Please check your credentials and try again.';
      case 'VALIDATION_ERROR':
        return 'Please check your input and try again.';
      case 'NETWORK_ERROR':
        return 'Please check your internet connection and try again.';
      case 'FIREBASE_ERROR':
        return 'Service temporarily unavailable. Please try again later.';
      case 'ONBOARDING_ERROR':
        return 'Unable to complete setup. Please try again.';
      default:
        return 'Something went wrong. Please try again.';
    }
  }
}