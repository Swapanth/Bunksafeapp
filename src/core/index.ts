/**
 * Core Module Exports
 * Centralized exports for core functionality
 */

// Dependency Injection
export { DIContainer } from './di/DIContainer';

// Constants
export { APP_CONFIG, DEMO_CONFIG, STORAGE_KEYS, UI_CONFIG, VALIDATION_RULES } from './constants/AppConstants';

// Types
export type { AppScreen, AuthScreen, MainTabScreen, NavigationProps, OnboardingScreen } from './types/Navigation';

// Errors
export {
    AppError,
    AuthenticationError, ErrorHandler, FirebaseError, NetworkError, OnboardingError, ValidationError
} from './errors/AppError';

// Utils
export { StringUtils } from './utils/StringUtils';
export { ValidationUtils } from './utils/ValidationUtils';
