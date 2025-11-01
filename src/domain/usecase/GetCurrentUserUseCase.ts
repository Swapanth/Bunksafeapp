import { User } from '../model/User';
import { AuthRepository } from '../repository/AuthRepository';

export class GetCurrentUserUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(): Promise<User | null> {
    return await this.authRepository.getCurrentUser();
  }
}
