import { OnboardingError } from '../../core/errors/AppError';
import { StringUtils } from '../../core/utils/StringUtils';
import { FirebaseUserService } from '../../data/services/UserService';
import { ClassSchedule } from '../model/Classroom';
import { AuthResult } from '../model/User';
import { AuthRepository } from '../repository/AuthRepository';
import { ClassroomUseCase } from './ClassroomUseCase';

export interface OnboardingData {
  // Step 1: Basic Registration
  nickname: string;
  mobileNumber: string;
  email?: string;
  password?: string;
  
  // Step 2: OTP Verification (handled separately)
  
  // Step 3: University Selection
  university: string;
  department: string;
  yearOfStudy: string;
  
  // Step 4: Profile Setup
  avatar?: string;
  whatsappNotifications: boolean;
  emailNotifications: boolean;
  attendanceReminders: boolean;
  profileVisibility: 'public' | 'friends' | 'private';
  
  // Step 5: Classroom Setup
  classroomAction?: 'join' | 'create' | 'skip';
  classroomCode?: string;
  classroomName?: string;
  classroomDescription?: string;
  attendanceTarget?: number;
  
  // Step 6: Timetable
  timetableMethod?: 'file' | 'manual' | 'skip';
  classes?: ClassSchedule[];
  semesterStartDate?: string;
  semesterEndDate?: string;
  
}

export class CompleteOnboardingUseCase {
  constructor(
    private authRepository: AuthRepository,
    private userService: FirebaseUserService = new FirebaseUserService(),
    private classroomUseCase: ClassroomUseCase = new ClassroomUseCase()
  ) {}

  async execute(onboardingData: OnboardingData): Promise<AuthResult> {
    try {
      console.log('CompleteOnboardingUseCase: Starting with data:', onboardingData);
      
      // Use provided email or generate one as fallback
      const email = onboardingData.email || this.generateEmail(onboardingData.nickname, onboardingData.university);
      console.log('Using email:', email);
      
      // Create the signup data
      const signupData = {
        nickname: onboardingData.nickname,
        mobileNumber: onboardingData.mobileNumber,
        email: email,
        collegeName: onboardingData.university,
        password: onboardingData.password || this.generateTempPassword(),
      };
      
      console.log('Signup data:', signupData);

      // Create the user account
      const authResult = await this.authRepository.signup(signupData);
      
      if (authResult.success && authResult.user) {
        const userId = authResult.user.id;
        let classroomId: string | undefined;

        // Handle classroom creation or joining
        if (onboardingData.classroomAction === 'create' && onboardingData.classroomName && onboardingData.classroomDescription) {
          console.log('Creating classroom during onboarding...');
          const classroomResult = await this.classroomUseCase.createClassroom(userId, {
            name: onboardingData.classroomName,
            description: onboardingData.classroomDescription,
            university: onboardingData.university,
            department: onboardingData.department,
            attendanceTarget: onboardingData.attendanceTarget || 75,
          });

          if (classroomResult.success && classroomResult.classroom) {
            classroomId = classroomResult.classroom.id;
            console.log('✅ Classroom created successfully:', classroomResult.classroom.code);

            // Create schedule if timetable data is provided
            if (onboardingData.timetableMethod === 'manual' && onboardingData.classes && onboardingData.classes.length > 0) {
              console.log('Creating schedule for new classroom...');
              const scheduleResult = await this.classroomUseCase.createSchedule(
                userId,
                classroomId,
                onboardingData.classes,
                onboardingData.semesterStartDate,
                onboardingData.semesterEndDate
              );

              if (scheduleResult.success) {
                console.log('✅ Schedule created successfully');
              } else {
                console.warn('⚠️ Failed to create schedule:', scheduleResult.error);
              }
            }
          } else {
            console.warn('⚠️ Failed to create classroom:', classroomResult.error);
          }
        } else if (onboardingData.classroomAction === 'join' && onboardingData.classroomCode) {
          console.log('Joining classroom during onboarding...');
          const joinResult = await this.classroomUseCase.joinClassroom(userId, {
            classroomCode: onboardingData.classroomCode,
          });

          if (joinResult.success && joinResult.classroom) {
            classroomId = joinResult.classroom.id;
            console.log('✅ Joined classroom successfully:', joinResult.classroom.name);
          } else {
            console.warn('⚠️ Failed to join classroom:', joinResult.error);
          }
        }

        // Complete the onboarding with additional data
        await this.userService.completeOnboarding(userId, {
          ...onboardingData,
          email: email,
          classroomId: classroomId,
        });

        return authResult;
      }

      return authResult;
    } catch (error) {
      console.error('Complete onboarding error:', error);
      throw new OnboardingError('Failed to complete onboarding. Please try again.', error as Error);
    }
  }

  private generateEmail(nickname: string, university: string): string {
    return StringUtils.generateEmail(nickname, university);
  }

  private generateTempPassword(): string {
    // Generate a temporary password as fallback (should not be used in normal flow)
    return Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
  }
}