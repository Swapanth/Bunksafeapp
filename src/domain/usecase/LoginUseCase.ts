import { AuthResult, LoginCredentials } from '../model/User';
import { AuthRepository } from '../repository/AuthRepository';

export class LoginUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(credentials: LoginCredentials): Promise<AuthResult> {
    console.log('🔐 LoginUseCase: Validating credentials for:', credentials.email);
    
    if (!credentials.email || !credentials.password) {
      return {
        success: false,
        error: 'Email and password are required'
      };
    }

    if (!this.isValidEmail(credentials.email)) {
      return {
        success: false,
        error: 'Please enter a valid email address'
      };
    }

    if (credentials.password.length < 6) {
      return {
        success: false,
        error: 'Password must be at least 6 characters long'
      };
    }

    console.log('✅ LoginUseCase: Credentials validated, proceeding with login');
    return await this.authRepository.login(credentials);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
