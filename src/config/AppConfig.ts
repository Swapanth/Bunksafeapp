/**
 * Application configuration
 * Centralizes all app configuration values from environment variables
 */

export const Config = {
  // OTP Configuration
  otp: {
    expiryMinutes: parseInt(process.env.EXPO_PUBLIC_OTP_EXPIRY_MINUTES || '10', 10),
    maxAttempts: parseInt(process.env.EXPO_PUBLIC_MAX_OTP_ATTEMPTS || '3', 10),
    resendCooldownSeconds: parseInt(process.env.EXPO_PUBLIC_OTP_RESEND_COOLDOWN || '60', 10),
  },

  // App Environment
  app: {
    environment: process.env.EXPO_PUBLIC_APP_ENV || 'development',
    enableDebugLogs: process.env.EXPO_PUBLIC_ENABLE_DEBUG_LOGS === 'true',
  },

  // Firebase Configuration
  firebase: {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
    webApiKey: process.env.EXPO_PUBLIC_FIREBASE_WEB_API_KEY || '',
  },

  // Helper functions
  isProduction: (): boolean => {
    return (process.env.EXPO_PUBLIC_APP_ENV || 'development') === 'production';
  },

  isDevelopment: (): boolean => {
    return (process.env.EXPO_PUBLIC_APP_ENV || 'development') === 'development';
  },

  shouldLogDebug: (): boolean => {
    return process.env.EXPO_PUBLIC_ENABLE_DEBUG_LOGS === 'true';
  },
} as const;

// Type exports for better IDE support
export type AppConfig = typeof Config;
