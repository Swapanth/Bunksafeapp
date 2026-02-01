import { ConfirmationResult } from 'firebase/auth';
import { AppLogger } from '../../core/utils/Logger';

export interface PhoneAuthResult {
  success: boolean;
  verificationId?: string;
  error?: string;
  confirmationResult?: ConfirmationResult;
}

// Mock OTP storage for development (In production, use real Firebase Phone Auth with proper backend)
const mockOTPStorage = new Map<string, { otp: string; expiresAt: number }>();

/**
 * Service to handle Firebase Phone Authentication
 * Note: This is a simplified version for development. In production, implement proper Firebase Phone Auth
 */
export class FirebasePhoneAuthService {
  private confirmationResult: ConfirmationResult | null = null;
  private verificationId: string | null = null;

  /**
   * Send OTP to the provided phone number
   * For development: generates a mock 6-digit OTP
   */
  async sendOTP(phoneNumber: string): Promise<PhoneAuthResult> {
    try {
      AppLogger.info('FirebasePhoneAuthService: Initiating OTP send', {
        phone: this.maskPhoneNumber(phoneNumber),
      });

      // Generate a random 6-digit OTP for development
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const verificationId = `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store OTP with 10 minute expiry
      mockOTPStorage.set(phoneNumber, {
        otp,
        expiresAt: Date.now() + 10 * 60 * 1000,
      });

      this.verificationId = verificationId;

      // Log OTP for development (REMOVE IN PRODUCTION)
      console.log('🔐 Development OTP for', this.maskPhoneNumber(phoneNumber), ':', otp);
      AppLogger.info('FirebasePhoneAuthService: OTP generated for development', {
        verificationId,
      });

      return {
        success: true,
        verificationId,
      };
    } catch (error: any) {
      AppLogger.error('FirebasePhoneAuthService: Unexpected error during OTP send', error);
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      };
    }
  }

  /**
   * Verify OTP code
   * For development: checks against mock OTP storage
   */
  async verifyOTP(verificationId: string, otpCode: string): Promise<PhoneAuthResult> {
    try {
      AppLogger.info('FirebasePhoneAuthService: Verifying OTP');

      // Find the phone number associated with this verification
      let phoneNumber: string | null = null;
      for (const [phone, data] of mockOTPStorage.entries()) {
        if (Date.now() < data.expiresAt) {
          phoneNumber = phone;
          break;
        }
      }

      if (!phoneNumber) {
        AppLogger.error('FirebasePhoneAuthService: No active verification session');
        return {
          success: false,
          error: 'Verification session expired. Please request a new code.',
        };
      }

      const storedData = mockOTPStorage.get(phoneNumber);
      
      if (!storedData) {
        return {
          success: false,
          error: 'Verification session expired. Please request a new code.',
        };
      }

      // Check if OTP is expired
      if (Date.now() > storedData.expiresAt) {
        mockOTPStorage.delete(phoneNumber);
        return {
          success: false,
          error: 'Verification code has expired. Please request a new one.',
        };
      }

      // Verify OTP
      if (storedData.otp === otpCode) {
        AppLogger.info('FirebasePhoneAuthService: OTP verified successfully');
        mockOTPStorage.delete(phoneNumber);
        
        return {
          success: true,
        };
      } else {
        AppLogger.warn('FirebasePhoneAuthService: Invalid OTP provided');
        return {
          success: false,
          error: 'Invalid verification code. Please try again.',
        };
      }
    } catch (error: any) {
      AppLogger.error('FirebasePhoneAuthService: Unexpected error during OTP verification', error);
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      };
    }
  }

  /**
   * Resend OTP (same as sendOTP but logs it as a resend)
   */
  async resendOTP(phoneNumber: string): Promise<PhoneAuthResult> {
    AppLogger.info('FirebasePhoneAuthService: Resending OTP');
    return this.sendOTP(phoneNumber);
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    AppLogger.info('FirebasePhoneAuthService: Cleaning up');
    this.confirmationResult = null;
    this.verificationId = null;
  }

  /**
   * Mask phone number for logging (security)
   */
  private maskPhoneNumber(phoneNumber: string): string {
    if (phoneNumber.length <= 4) {
      return '****';
    }
    return phoneNumber.slice(0, 3) + '****' + phoneNumber.slice(-2);
  }
}
