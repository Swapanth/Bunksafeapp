/**
 * String Utilities
 * Common string manipulation and formatting functions
 */

export class StringUtils {
  /**
   * Generate email from nickname and university
   */
  static generateEmail(nickname: string, university: string): string {
    const cleanNickname = nickname.toLowerCase().replace(/\s+/g, '');
    const cleanUniversity = university.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
    return `${cleanNickname}@${cleanUniversity}.edu`;
  }

  /**
   * Generate random password
   */
  static generateRandomPassword(length: number = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    return password;
  }

  /**
   * Capitalize first letter of each word
   */
  static toTitleCase(str: string): string {
    return str.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }

  /**
   * Format mobile number for display
   */
  static formatMobileNumber(mobileNumber: string): string {
    const cleaned = mobileNumber.replace(/\D/g, '');
    
    if (cleaned.length === 10) {
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    
    return mobileNumber;
  }

  /**
   * Truncate string with ellipsis
   */
  static truncate(str: string, maxLength: number): string {
    if (str.length <= maxLength) {
      return str;
    }
    
    return str.slice(0, maxLength - 3) + '...';
  }

  /**
   * Remove special characters and spaces
   */
  static sanitize(str: string): string {
    return str.replace(/[^a-zA-Z0-9]/g, '');
  }

  /**
   * Check if string is empty or whitespace
   */
  static isEmpty(str: string | null | undefined): boolean {
    return !str || str.trim().length === 0;
  }

  /**
   * Generate unique ID
   */
  static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}