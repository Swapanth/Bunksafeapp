/**
 * Application Constants
 * Centralized location for all app-wide constants
 */

export const APP_CONFIG = {
  NAME: 'BunkSafe',
  VERSION: '1.0.0',
  DESCRIPTION: 'Smart attendance tracking for students',
} as const;

export const DEMO_CONFIG = {
  OTP_CODE: '9999',
  TEMP_PASSWORD_LENGTH: 12,
} as const;

export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 6,
  NICKNAME_MIN_LENGTH: 2,
  NICKNAME_MAX_LENGTH: 30,
  MOBILE_NUMBER_LENGTH: 10,
} as const;

export const UI_CONFIG = {
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 500,
  TOAST_DURATION: 3000,
} as const;

export const STORAGE_KEYS = {
  USER_TOKEN: '@bunksafe_user_token',
  USER_DATA: '@bunksafe_user_data',
  ONBOARDING_COMPLETED: '@bunksafe_onboarding_completed',
  THEME_PREFERENCE: '@bunksafe_theme',
} as const;