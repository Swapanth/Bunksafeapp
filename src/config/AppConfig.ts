import Constants from 'expo-constants';

export interface AppConfig {
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  app: {
    environment: 'development' | 'production';
    enableDebugLogs: boolean;
  };
  otp: {
    expiryMinutes: number;
    maxAttempts: number;
    resendCooldownSeconds: number;
  };
}

class ConfigManager {
  private config: AppConfig;

  constructor() {
    const env = Constants.expoConfig?.extra?.env || process.env;
    
    // Use web API key for REST API calls, fallback to regular API key
    const webApiKey = env.EXPO_PUBLIC_FIREBASE_WEB_API_KEY || env.EXPO_PUBLIC_FIREBASE_API_KEY;
    
    this.config = {
      firebase: {
        apiKey: webApiKey,
        authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: env.EXPO_PUBLIC_FIREBASE_APP_ID,
      },
      app: {
        environment: 'production',
        enableDebugLogs: false
      },
      otp: {
        expiryMinutes: parseInt(env.EXPO_PUBLIC_OTP_EXPIRY_MINUTES || '10'),
        maxAttempts: parseInt(env.EXPO_PUBLIC_MAX_OTP_ATTEMPTS || '3'),
        resendCooldownSeconds: parseInt(env.EXPO_PUBLIC_OTP_RESEND_COOLDOWN || '60'),
      },
    };

    this.validateConfig();
  }

  private validateConfig(): void {
    const { firebase } = this.config;
    
    if (!firebase.apiKey || !firebase.projectId) {
      console.warn(
        'Missing Firebase configuration. Using default development config. ' +
        'Please check your environment variables for production use.'
      );
      
      // Only throw error in production
      if (this.isProduction()) {
        throw new Error(
          'Missing required Firebase configuration. Please check your environment variables.'
        );
      }
    }
  }

  get firebase(): AppConfig['firebase'] {
    return this.config.firebase;
  }

  get app(): AppConfig['app'] {
    return this.config.app;
  }

  get otp(): AppConfig['otp'] {
    return this.config.otp;
  }

  isProduction(): boolean {
    return this.config.app.environment === 'production';
  }

  isDevelopment(): boolean {
    return this.config.app.environment === 'development';
  }

  shouldLogDebug(): boolean {
    return this.config.app.enableDebugLogs;
  }
}

export const Config = new ConfigManager();
