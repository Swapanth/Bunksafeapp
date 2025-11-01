import { AuthResult, SignupData } from '../model/User';
import { AuthRepository } from '../repository/AuthRepository';

export class SignupUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(signupData: SignupData): Promise<AuthResult> {
    // Add any business logic validation here if needed
    if (!signupData.email || !signupData.nickname || !signupData.mobileNumber || !signupData.collegeName) {
      return {
        success: false,
        error: 'All fields are required',
      };
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupData.email)) {
      return {
        success: false,
        error: 'Invalid email format',
      };
    }

    // Mobile number validation (10 digits)
    const mobileRegex = /^\d{10}$/;
    if (!mobileRegex.test(signupData.mobileNumber)) {
      return {
        success: false,
        error: 'Invalid mobile number format',
      };
    }

    return await this.authRepository.signup(signupData);
  }
}
