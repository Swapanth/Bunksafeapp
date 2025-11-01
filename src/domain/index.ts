/**
 * Domain Layer Exports
 * Centralized exports for business logic, models, and use cases
 */

// Models
export type { ClassSchedule, Classroom, ClassroomMember, Schedule } from './model/Classroom';
export type { CreateTaskData, Task, UpdateTaskData } from './model/Task';
export type { AuthResult, LoginCredentials, SignupData, User } from './model/User';

// Repository Interfaces
export type { AuthRepository } from './repository/AuthRepository';

// Use Cases
export { ClassroomUseCase } from './usecase/ClassroomUseCase';
export { CompleteOnboardingUseCase } from './usecase/CompleteOnboardingUseCase';
export { GetCurrentUserUseCase } from './usecase/GetCurrentUserUseCase';
export { LoginUseCase } from './usecase/LoginUseCase';
export { PhoneVerificationUseCase } from './usecase/PhoneVerificationUseCase';
export { SignupUseCase } from './usecase/SignupUseCase';
export { TaskUseCase } from './usecase/TaskUseCase';

