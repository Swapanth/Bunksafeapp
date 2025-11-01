import React, { useState } from 'react';
import { OTPVerificationScreen } from '../auth/OTPVerificationScreen';
import { SignupScreen } from '../auth/SignupScreen';
import { ClassroomSetupScreen } from '../classroom/ClassroomSetupScreen';
import { TimetableUploadScreen } from '../main/TimetableUploadScreen';
import { ProfileSetupScreen } from '../profile/ProfileSetupScreen';
import { UniversitySelectionScreen } from './UniversitySelectionScreen';
import { WelcomeScreen } from './WelcomeScreen';

type OnboardingStep = 
  | 'signup' 
  | 'otp' 
  | 'university' 
  | 'profile' 
  | 'classroom' 
  | 'timetable' 
  | 'welcome';

interface OnboardingData {
  // Step 1: Basic info
  nickname?: string;
  mobileNumber?: string;
  email?: string;
  password?: string;
  
  // Step 2: University details
  university?: string;
  department?: string;
  yearOfStudy?: string;
  attendanceTarget?: number;
  
  // Step 3: Profile setup
  avatar?: string;
  whatsappNotifications?: boolean;
  emailNotifications?: boolean;
  attendanceReminders?: boolean;
  profileVisibility?: 'public' | 'friends' | 'private';
  
  // Step 4: Classroom setup
  classroomAction?: 'join' | 'create' | 'skip';
  classroomCode?: string;
  classroomName?: string;
  classroomDescription?: string;
  
  // Step 5: Timetable
  timetableMethod?: 'file' | 'manual' | 'skip';
  classes?: any[];
  semesterStartDate?: string;
  semesterEndDate?: string;
}

interface OnboardingFlowProps {
  onComplete: (data: OnboardingData) => Promise<void>;
  onBack?: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, onBack }) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('signup');
  const [data, setData] = useState<OnboardingData>({});
  const [isCompleting, setIsCompleting] = useState(false);

  const updateData = (newData: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...newData }));
  };

  const goToNextStep = () => {
    switch (currentStep) {
      case 'signup':
        setCurrentStep('otp');
        break;
      case 'otp':
        setCurrentStep('university');
        break;
      case 'university':
        setCurrentStep('profile');
        break;
      case 'profile':
        setCurrentStep('classroom');
        break;
      case 'classroom':
        // Skip timetable setup if user joined an existing classroom
        if (data.classroomAction === 'join') {
          setCurrentStep('welcome');
        } else {
          setCurrentStep('timetable');
        }
        break;
      case 'timetable':
        setCurrentStep('welcome');
        break;
      case 'welcome':
        onComplete(data);
        break;
    }
  };

  const goToPreviousStep = () => {
    switch (currentStep) {
      case 'signup':
        if (onBack) {
          onBack();
        }
        break;
      case 'otp':
        setCurrentStep('signup');
        break;
      case 'university':
        setCurrentStep('otp');
        break;
      case 'profile':
        setCurrentStep('university');
        break;
      case 'classroom':
        setCurrentStep('profile');
        break;
      case 'timetable':
        setCurrentStep('classroom');
        break;
      case 'welcome':
        // If user joined a classroom, go back to classroom setup
        // Otherwise go back to timetable
        if (data.classroomAction === 'join') {
          setCurrentStep('classroom');
        } else {
          setCurrentStep('timetable');
        }
        break;
    }
  };

  const hasClassroom = data.classroomAction === 'join' || data.classroomAction === 'create';
  const shouldShowTimetableSetup = data.classroomAction === 'create' || data.classroomAction === 'skip';

  switch (currentStep) {
    case 'signup':
      return (
        <SignupScreen
          onNext={(signupData) => {
            updateData({
              nickname: signupData.nickname,
              mobileNumber: signupData.mobileNumber,
              email: signupData.email,
              password: signupData.password,
            });
            goToNextStep();
          }}
          onBack={currentStep === 'signup' ? onBack : goToPreviousStep}
        />
      );

    case 'otp':
      return (
        <OTPVerificationScreen
          mobileNumber={data.mobileNumber!}
          onVerified={goToNextStep}
          onBack={goToPreviousStep}
        />
      );

    case 'university':
      return (
        <UniversitySelectionScreen
          onNext={(universityData) => {
            updateData({
              university: universityData.university,
              department: universityData.department,
              yearOfStudy: universityData.yearOfStudy,
              attendanceTarget: universityData.attendanceTarget,
            });
            goToNextStep();
          }}
          onBack={goToPreviousStep}
        />
      );

    case 'profile':
      return (
        <ProfileSetupScreen
          onNext={(profileData) => {
            updateData({
              avatar: profileData.avatar,
              whatsappNotifications: profileData.whatsappNotifications,
              emailNotifications: profileData.emailNotifications,
              attendanceReminders: profileData.attendanceReminders,
              profileVisibility: profileData.profileVisibility,
            });
            goToNextStep();
          }}
          onBack={goToPreviousStep}
        />
      );

    case 'classroom':
      return (
        <ClassroomSetupScreen
          onNext={(classroomData) => {
            updateData({
              classroomAction: classroomData.type,
              classroomCode: classroomData.classroomCode,
              classroomName: classroomData.classroomName,
              classroomDescription: classroomData.classroomDescription,
            });
            goToNextStep();
          }}
          onBack={goToPreviousStep}
        />
      );

    case 'timetable':
      return (
        <TimetableUploadScreen
          showTimetable={shouldShowTimetableSetup}
          onNext={(timetableData) => {
            updateData({
              timetableMethod: timetableData.method,
              classes: timetableData.classes,
              semesterStartDate: timetableData.semesterStartDate,
              semesterEndDate: timetableData.semesterEndDate,
            });
            goToNextStep();
          }}
          onBack={goToPreviousStep}
        />
      );

    case 'welcome':
      return (
        <WelcomeScreen
          data={{
            nickname: data.nickname!,
            university: data.university!,
            department: data.department!,
            yearOfStudy: data.yearOfStudy!,
            classroomType: data.classroomAction,
            classroomName: data.classroomName,
            hasClassroom,
            attendanceTarget: data.attendanceTarget,
          }}
          onComplete={async () => {
            setIsCompleting(true);
            try {
              await onComplete(data);
            } finally {
              setIsCompleting(false);
            }
          }}
          loading={isCompleting}
        />
      );

    default:
      return null;
  }
};
