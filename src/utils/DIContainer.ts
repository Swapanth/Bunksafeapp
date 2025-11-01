import { AuthRepositoryImpl } from "../data/repository/AuthRepositoryImpl";
import { CompleteOnboardingUseCase } from "../domain/usecase/CompleteOnboardingUseCase";
import { GetCurrentUserUseCase } from "../domain/usecase/GetCurrentUserUseCase";
import { LoginUseCase } from "../domain/usecase/LoginUseCase";
import { PhoneVerificationUseCase } from "../domain/usecase/PhoneVerificationUseCase";
import { SignupUseCase } from "../domain/usecase/SignupUseCase";

// Dependency injection container
export class DIContainer {
  private static _authRepository: AuthRepositoryImpl;
  private static _loginUseCase: LoginUseCase;
  private static _signupUseCase: SignupUseCase;
  private static _getCurrentUserUseCase: GetCurrentUserUseCase;
  private static _completeOnboardingUseCase: CompleteOnboardingUseCase;
  private static _phoneVerificationUseCase: PhoneVerificationUseCase;

  static get authRepository(): AuthRepositoryImpl {
    if (!this._authRepository) {
      this._authRepository = new AuthRepositoryImpl();
    }
    return this._authRepository;
  }

  static get loginUseCase(): LoginUseCase {
    if (!this._loginUseCase) {
      this._loginUseCase = new LoginUseCase(this.authRepository);
    }
    return this._loginUseCase;
  }

  static get signupUseCase(): SignupUseCase {
    if (!this._signupUseCase) {
      this._signupUseCase = new SignupUseCase(this.authRepository);
    }
    return this._signupUseCase;
  }

  static get getCurrentUserUseCase(): GetCurrentUserUseCase {
    if (!this._getCurrentUserUseCase) {
      this._getCurrentUserUseCase = new GetCurrentUserUseCase(
        this.authRepository
      );
    }
    return this._getCurrentUserUseCase;
  }

  static get completeOnboardingUseCase(): CompleteOnboardingUseCase {
    if (!this._completeOnboardingUseCase) {
      this._completeOnboardingUseCase = new CompleteOnboardingUseCase(
        this.authRepository
      );
    }
    return this._completeOnboardingUseCase;
  }

  static get phoneVerificationUseCase(): PhoneVerificationUseCase {
    if (!this._phoneVerificationUseCase) {
      this._phoneVerificationUseCase = new PhoneVerificationUseCase();
    }
    return this._phoneVerificationUseCase;
  }
}
