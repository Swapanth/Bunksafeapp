import { Config } from '../../config/AppConfig';
import { AppLogger } from '../../core/utils/Logger';
import { FirebasePhoneAuthService } from '../../data/services/FirebasePhoneAuthService';

export interface PhoneVerificationResult {
  success: boolean;
  verificationId?: string;
  error?: string;
  remainingAttempts?: number;
  canResendAt?: Date;
}

interface AttemptData {
  count: number;
  lastAttempt: Date;
  phoneNumber: string;
}

interface ResendData {
  lastSent: Date;
  phoneNumber: string;
}

export class PhoneVerificationUseCase {
  // Rate limiting storage - In production, consider using Redis or similar
  private static attemptStorage = new Map<string, AttemptData>();
  private static resendStorage = new Map<string, ResendData>();
  
  constructor(
    private phoneAuthService: FirebasePhoneAuthService = new FirebasePhoneAuthService()
  ) {}

  async sendOTP(phoneNumber: string): Promise<PhoneVerificationResult> {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      // Check resend rate limiting
      const resendCheck = this.checkResendRateLimit(formattedPhone);
      if (!resendCheck.allowed) {
        AppLogger.warn('OTP resend rate limit exceeded', { phoneNumber: this.maskPhoneNumber(formattedPhone) });
        return {
          success: false,
          error: `Please wait before requesting another OTP.`,
          canResendAt: resendCheck.canResendAt,
        };
      }

      AppLogger.info('Sending OTP', { phoneNumber: this.maskPhoneNumber(formattedPhone) });

      const result = await this.phoneAuthService.sendOTP(formattedPhone);
      
      if (result.success && result.verificationId) {
        // Update resend tracking
        PhoneVerificationUseCase.resendStorage.set(formattedPhone, {
          lastSent: new Date(),
          phoneNumber: formattedPhone,
        });

        // Clean up old data
        this.cleanupExpiredData();
        
        AppLogger.info('OTP sent successfully');
        return {
          success: true,
          verificationId: result.verificationId,
        };
      } else {
        AppLogger.error('Failed to send OTP', { error: result.error });
        return {
          success: false,
          error: result.error || 'Failed to send OTP. Please try again.',
        };
      }
    } catch (error: any) {
      AppLogger.error('Unexpected error during OTP send', error);
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      };
    }
  }

  async verifyOTP(
    verificationId: string,
    otp: string,
    phoneNumber: string
  ): Promise<PhoneVerificationResult> {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      // Check attempt rate limiting
      const attemptCheck = this.checkAttemptRateLimit(formattedPhone);
      if (!attemptCheck.allowed) {
        AppLogger.warn('OTP verification rate limit exceeded', { 
          phoneNumber: this.maskPhoneNumber(formattedPhone),
          attempts: attemptCheck.attempts 
        });
        return {
          success: false,
          error: 'Too many failed attempts. Please request a new OTP.',
          remainingAttempts: 0,
        };
      }

      AppLogger.info('Verifying OTP', { phoneNumber: this.maskPhoneNumber(formattedPhone) });
      
      const result = await this.phoneAuthService.verifyOTP(verificationId, otp);

      if (result.success) {
        // Clear attempt tracking on success
        PhoneVerificationUseCase.attemptStorage.delete(formattedPhone);
        PhoneVerificationUseCase.resendStorage.delete(formattedPhone);
        
        AppLogger.info('OTP verified successfully');
        return { success: true };
      } else {
        // Track failed attempt
        this.trackFailedAttempt(formattedPhone);
        const remainingAttempts = Config.otp.maxAttempts - attemptCheck.attempts - 1;
        
        AppLogger.warn('OTP verification failed', { 
          phoneNumber: this.maskPhoneNumber(formattedPhone),
          remainingAttempts 
        });
        
        return {
          success: false,
          error: result.error || 'Invalid OTP. Please try again.',
          remainingAttempts: Math.max(0, remainingAttempts),
        };
      }
    } catch (error: any) {
      AppLogger.error('Unexpected error during OTP verification', error);
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      };
    }
  }

  private checkResendRateLimit(phoneNumber: string): { allowed: boolean; canResendAt?: Date } {
    const resendData = PhoneVerificationUseCase.resendStorage.get(phoneNumber);
    
    if (!resendData) {
      return { allowed: true };
    }

    const timeSinceLastSend = Date.now() - resendData.lastSent.getTime();
    const cooldownMs = Config.otp.resendCooldownSeconds * 1000;
    
    if (timeSinceLastSend < cooldownMs) {
      const canResendAt = new Date(resendData.lastSent.getTime() + cooldownMs);
      return { allowed: false, canResendAt };
    }

    return { allowed: true };
  }

  private checkAttemptRateLimit(phoneNumber: string): { allowed: boolean; attempts: number } {
    const attemptData = PhoneVerificationUseCase.attemptStorage.get(phoneNumber);
    
    if (!attemptData) {
      return { allowed: true, attempts: 0 };
    }

    // Reset attempts if they're from more than 1 hour ago
    const hourAgo = Date.now() - (60 * 60 * 1000);
    if (attemptData.lastAttempt.getTime() < hourAgo) {
      PhoneVerificationUseCase.attemptStorage.delete(phoneNumber);
      return { allowed: true, attempts: 0 };
    }

    const allowed = attemptData.count < Config.otp.maxAttempts;
    return { allowed, attempts: attemptData.count };
  }

  private trackFailedAttempt(phoneNumber: string): void {
    const existing = PhoneVerificationUseCase.attemptStorage.get(phoneNumber);
    
    PhoneVerificationUseCase.attemptStorage.set(phoneNumber, {
      count: existing ? existing.count + 1 : 1,
      lastAttempt: new Date(),
      phoneNumber,
    });
  }

  private cleanupExpiredData(): void {
    const now = Date.now();
    const hourAgo = now - (60 * 60 * 1000);
    
    // Clean up old attempt data
    for (const [key, value] of PhoneVerificationUseCase.attemptStorage.entries()) {
      if (value.lastAttempt.getTime() < hourAgo) {
        PhoneVerificationUseCase.attemptStorage.delete(key);
      }
    }
    
    // Clean up old resend data
    const cooldownMs = Config.otp.resendCooldownSeconds * 1000;
    for (const [key, value] of PhoneVerificationUseCase.resendStorage.entries()) {
      if (now - value.lastSent.getTime() > cooldownMs * 2) { // Keep for 2x cooldown period
        PhoneVerificationUseCase.resendStorage.delete(key);
      }
    }
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, "");

    // Add country code if not present (assuming India +91)
    if (digits.length === 10) {
      return "+91" + digits;
    } else if (digits.length === 12 && digits.startsWith("91")) {
      return "+" + digits;
    } else if (digits.length === 13 && digits.startsWith("+91")) {
      return digits;
    }

    return phoneNumber; // Return as-is if format is unclear
  }

  private maskPhoneNumber(phoneNumber: string): string {
    if (phoneNumber.length <= 4) return phoneNumber;
    
    const last4 = phoneNumber.slice(-4);
    const masked = '*'.repeat(phoneNumber.length - 4);
    return `${masked}${last4}`;
  }

  // Utility method to get remaining cooldown time for UI
  getRemainingCooldownSeconds(phoneNumber: string): number {
    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    const resendData = PhoneVerificationUseCase.resendStorage.get(formattedPhone);
    
    if (!resendData) {
      return 0;
    }

    const timeSinceLastSend = Date.now() - resendData.lastSent.getTime();
    const cooldownMs = Config.otp.resendCooldownSeconds * 1000;
    const remainingMs = cooldownMs - timeSinceLastSend;
    
    return Math.max(0, Math.ceil(remainingMs / 1000));
  }
}
