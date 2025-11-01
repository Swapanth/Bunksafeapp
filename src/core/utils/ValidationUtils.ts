import { VALIDATION_RULES } from '../constants/AppConstants';

/**
 * Validation Utilities
 * Centralized validation logic for forms and user input
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export class ValidationUtils {
  /**
   * Validate email address
   */
  static validateEmail(email: string): ValidationResult {
    if (!email.trim()) {
      return { isValid: false, error: 'Email is required' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }

    return { isValid: true };
  }

  /**
   * Validate password
   */
  static validatePassword(password: string): ValidationResult {
    if (!password.trim()) {
      return { isValid: false, error: 'Password is required' };
    }

    if (password.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
      return { 
        isValid: false, 
        error: `Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters` 
      };
    }

    return { isValid: true };
  }

  /**
   * Validate nickname
   */
  static validateNickname(nickname: string): ValidationResult {
    if (!nickname.trim()) {
      return { isValid: false, error: 'Nickname is required' };
    }

    if (nickname.length < VALIDATION_RULES.NICKNAME_MIN_LENGTH) {
      return { 
        isValid: false, 
        error: `Nickname must be at least ${VALIDATION_RULES.NICKNAME_MIN_LENGTH} characters` 
      };
    }

    if (nickname.length > VALIDATION_RULES.NICKNAME_MAX_LENGTH) {
      return { 
        isValid: false, 
        error: `Nickname must be less than ${VALIDATION_RULES.NICKNAME_MAX_LENGTH} characters` 
      };
    }

    return { isValid: true };
  }

  /**
   * Validate mobile number
   */
  static validateMobileNumber(mobileNumber: string): ValidationResult {
    if (!mobileNumber.trim()) {
      return { isValid: false, error: 'Mobile number is required' };
    }

    // Remove any non-digit characters for validation
    const digitsOnly = mobileNumber.replace(/\D/g, '');
    
    if (digitsOnly.length !== VALIDATION_RULES.MOBILE_NUMBER_LENGTH) {
      return { 
        isValid: false, 
        error: `Mobile number must be ${VALIDATION_RULES.MOBILE_NUMBER_LENGTH} digits` 
      };
    }

    return { isValid: true };
  }

  /**
   * Validate OTP code
   */
  static validateOTP(otp: string): ValidationResult {
    if (!otp.trim()) {
      return { isValid: false, error: 'OTP is required' };
    }

    if (otp.length !== 4) {
      return { isValid: false, error: 'OTP must be 4 digits' };
    }

    if (!/^\d{4}$/.test(otp)) {
      return { isValid: false, error: 'OTP must contain only numbers' };
    }

    return { isValid: true };
  }

  /**
   * Validate required field
   */
  static validateRequired(value: string, fieldName: string): ValidationResult {
    if (!value.trim()) {
      return { isValid: false, error: `${fieldName} is required` };
    }

    return { isValid: true };
  }

  /**
   * Validate multiple fields at once
   */
  static validateFields(validations: Array<() => ValidationResult>): ValidationResult {
    for (const validation of validations) {
      const result = validation();
      if (!result.isValid) {
        return result;
      }
    }

    return { isValid: true };
  }
}