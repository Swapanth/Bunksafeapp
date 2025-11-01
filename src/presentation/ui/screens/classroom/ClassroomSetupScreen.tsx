import React, { useState } from 'react';
import {
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CustomButton } from '../../components/CustomButton';
import { CustomInput } from '../../components/CustomInput';


interface ClassroomData {
  type: 'join' | 'create' | 'skip';
  classroomCode?: string;
  classroomName?: string;
  classroomDescription?: string;
}

interface ClassroomSetupScreenProps {
  onNext: (data: ClassroomData) => void;
  onBack: () => void;
}

export const ClassroomSetupScreen: React.FC<ClassroomSetupScreenProps> = ({
  onNext,
  onBack,
}) => {
  const [selectedOption, setSelectedOption] = useState<'join' | 'create' | 'skip' | null>(null);
  const [classroomCode, setClassroomCode] = useState('');
  const [classroomName, setClassroomName] = useState('');
  const [classroomDescription, setClassroomDescription] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (selectedOption === 'join') {
      if (!classroomCode.trim()) {
        newErrors.classroomCode = 'Classroom code is required';
      } else if (!/^\d{6}$/.test(classroomCode.trim())) {
        newErrors.classroomCode = 'Please enter a valid 6-digit code';
      }
    } else if (selectedOption === 'create') {
      if (!classroomName.trim()) {
        newErrors.classroomName = 'Classroom name is required';
      }
      if (!classroomDescription.trim()) {
        newErrors.classroomDescription = 'Classroom description is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (selectedOption === 'skip') {
      onNext({ type: 'skip' });
      return;
    }

    if (!validateForm()) {
      return;
    }

    if (selectedOption === 'join') {
      await handleJoinClassroom();
    } else if (selectedOption === 'create') {
      const data: ClassroomData = {
        type: 'create',
        classroomName: classroomName.trim(),
        classroomDescription: classroomDescription.trim(),
      };
      onNext(data);
    }
  };

  const handleJoinClassroom = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      // Just validate that the classroom exists without joining
      const result = await validateClassroomExists(classroomCode.trim());

      if (result.success) {
        // Classroom exists and is valid, proceed to next step
        const data: ClassroomData = {
          type: 'join',
          classroomCode: classroomCode.trim(),
        };
        onNext(data);
      } else {
        // Show error message
        setErrors({
          classroomCode: result.error || 'Classroom not found',
        });
      }
    } catch (error) {
      console.error('Error validating classroom:', error);
      setErrors({
        classroomCode: 'Unable to validate classroom code. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateClassroomExists = async (code: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { FirebaseClassroomService } = await import('../../../../data/services/ClassroomService');
      const service = new FirebaseClassroomService();

      const result = await service.checkClassroomExists(code);
      return result;
    } catch (error: any) {
      console.error('Error validating classroom:', error);

      // Handle specific Firebase permission errors
      if (error?.code === 'permission-denied' || error?.message?.includes('permissions')) {
        return {
          success: false,
          error: 'Unable to verify classroom code. Please check your internet connection and try again.'
        };
      }

      return {
        success: false,
        error: 'Unable to validate classroom code. Please try again.'
      };
    }
  };

  const formatClassroomCode = (text: string) => {
    const digits = text.replace(/\D/g, '');
    if (digits.length <= 6) {
      setClassroomCode(digits);
      // Clear errors when user starts typing
      if (errors.classroomCode) {
        setErrors(prev => ({ ...prev, classroomCode: '' }));
      }
    }
  };

  const OptionCard: React.FC<{
    title: string;
    description: string;
    icon: string;
    value: 'join' | 'create' | 'skip';
    selected: boolean;
    onSelect: () => void;
  }> = ({ title, description, icon, value, selected, onSelect }) => (
    <TouchableOpacity
      onPress={onSelect}
      className={`p-6 rounded-2xl border-2 mb-4 ${selected
        ? 'border-green-500 bg-green-50'
        : 'border-gray-200 bg-white'
        }`}
    >
      <View className="flex-row items-center">
        <Text className="text-4xl mr-4">{icon}</Text>
        <View className="flex-1">
          <Text className={`text-lg font-semibold ${selected ? 'text-green-700' : 'text-gray-800'
            }`}>
            {title}
          </Text>
          <Text className={`text-sm ${selected ? 'text-green-600' : 'text-gray-600'
            }`}>
            {description}
          </Text>
        </View>
        <View className={`w-6 h-6 rounded-full border-2 ${selected
          ? 'border-green-500 bg-green-500'
          : 'border-gray-300'
          }`}>
          {selected && (
            <View className="flex-1 items-center justify-center">
              <Text className="text-white text-xs">✓</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="pt-16 pb-8 px-6">
          <View className="flex-row items-center mb-6">
            <TouchableOpacity onPress={onBack} className="mr-4">
              <View className="w-10 h-10 rounded-full bg-white items-center justify-center">
                <Text className="text-lg">←</Text>
              </View>
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-3xl font-bold text-gray-800">
                Classroom Setup
              </Text>
              <Text className="text-lg text-gray-600 mt-2">
                Connect to or create a classroom
              </Text>
            </View>
          </View>
        </View>

        {/* Progress Indicator */}
        <View className="px-6 mb-8">
          <View className="flex-row items-center">
            <View className="flex-1 h-2 bg-green-500 rounded-full" />
            <View className="flex-1 h-2 bg-green-500 rounded-full ml-2" />
            <View className="flex-1 h-2 bg-green-500 rounded-full ml-2" />
            <View className="flex-1 h-2 bg-green-500 rounded-full ml-2" />
            <View className="flex-1 h-2 bg-green-500 rounded-full ml-2" />
            <View className="flex-1 h-2 bg-gray-200 rounded-full ml-2" />
          </View>
          <Text className="text-sm text-gray-500 mt-2 text-center">Step 5 of 6</Text>
        </View>

        {/* Content */}
        <View className="px-6">
          {/* Info Card */}
          <View className="bg-white rounded-2xl p-6 mb-6 border border-gray-100">
            <Text className="text-center text-6xl mb-4">🏫</Text>
            <Text className="text-xl font-semibold text-center text-gray-800 mb-2">
              Join Your Classroom
            </Text>
            <Text className="text-gray-600 text-center leading-6">
              Connect with your classmates and start tracking attendance together.
            </Text>
          </View>

          {/* Options */}
          <OptionCard
            title="Join Classroom"
            description="Enter a 6-digit code to join an existing classroom"
            icon="🔗"
            value="join"
            selected={selectedOption === 'join'}
            onSelect={() => setSelectedOption('join')}
          />

          {/* Join Classroom Form - Directly below the Join option */}
          {selectedOption === 'join' && (
            <View className="bg-white rounded-2xl p-6 mb-4 border-2 border-green-200 shadow-sm">

              <CustomInput
                label="Classroom Code"
                value={classroomCode}
                onChangeText={formatClassroomCode}
                placeholder="Enter 6-digit code"
                keyboardType="numeric"
                error={errors.classroomCode}
                leftIcon="key-outline"
              />

              {/* Show error message if classroom validation fails */}
              {errors.classroomCode && (
                <View className="bg-red-50 p-4 rounded-xl mt-3 border border-red-200">
                  <Text className="text-red-800 text-sm font-medium">
                    ❌ {errors.classroomCode}
                  </Text>
                </View>
              )}
              <View className="bg-blue-50 p-4 rounded-xl mt-4">
                <Text className="text-blue-800 text-sm font-medium">
                  💡 Ask your teacher or classmate for the classroom code
                </Text>
              </View>
              <View className="bg-green-50 p-4 rounded-xl mt-3 border border-green-200">
                <Text className="text-green-800 text-sm font-medium">
                  ✨ Joining an existing classroom? Great! The timetable is already set up for you.
                </Text>
              </View>
            </View>
          )}

          <OptionCard
            title="Create Classroom"
            description="Set up a new classroom and invite others"
            icon="➕"
            value="create"
            selected={selectedOption === 'create'}
            onSelect={() => setSelectedOption('create')}
          />

          {/* Create Classroom Form - Directly below the Create option */}
          {selectedOption === 'create' && (
            <View className="bg-white rounded-2xl p-6 mb-4 border-2 border-green-200 shadow-sm">


              <CustomInput
                label="Classroom Name"
                value={classroomName}
                onChangeText={setClassroomName}
                placeholder="e.g., CS101 - Computer Science"
                error={errors.classroomName}
                leftIcon="school-outline"
              />

              <CustomInput
                label="Description"
                value={classroomDescription}
                onChangeText={setClassroomDescription}
                placeholder="Brief description of the class"
                error={errors.classroomDescription}
                leftIcon="document-text-outline"
              />

              <View className="bg-green-50 p-4 rounded-xl">
                <Text className="text-green-800 text-sm font-medium">
                  🎯 You can share the classroom code with others after creation
                </Text>
              </View>
            </View>
          )}

          
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View className="p-6 bg-white border-t border-gray-100">
        <CustomButton
          title={
            isLoading
              ? 'Validating...'
              : selectedOption === 'skip'
                ? 'Complete Setup'
                : selectedOption === 'join'
                  ? 'Verify & Continue'
                  : 'Continue'
          }
          onPress={handleNext}
          disabled={!selectedOption || isLoading}
          loading={isLoading}
        />
      </View>
    </View>
  );
};
