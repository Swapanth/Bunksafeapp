import { AuthResult, LoginCredentials, SignupData, User } from '../model/User';

export interface AuthRepository {
  login(credentials: LoginCredentials): Promise<AuthResult>;
  signup(signupData: SignupData): Promise<AuthResult>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  isAuthenticated(): Promise<boolean>;
}
