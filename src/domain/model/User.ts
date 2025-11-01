export interface User {
  id: string;
  email: string;
  name?: string;
  nickname?: string;
  mobileNumber?: string;
  collegeName?: string;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  nickname: string;
  mobileNumber: string;
  email: string;
  collegeName: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}
