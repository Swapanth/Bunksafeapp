import React from 'react';
import {
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { CustomButton } from '../../components/CustomButton';

interface WelcomeData {
  nickname: string;
  university: string;
  department: string;
  yearOfStudy: string;
  classroomType?: 'join' | 'create' | 'skip';
  classroomName?: string;
  hasClassroom: boolean;
  attendanceTarget?: number;
}

interface WelcomeScreenProps {
  data: WelcomeData;
  onComplete: () => void;
  loading?: boolean;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  data,
  onComplete,
  loading = false,
}) => {
  const getClassroomMessage = () => {
    switch (data.classroomType) {
      case 'join':
        return '✅ Joined classroom successfully';
      case 'create':
        return `✅ Created classroom: ${data.classroomName}`;
      case 'skip':
      default:
        return '📚 You can join or create a classroom later';
    }
  };

  const getWelcomeMessage = () => {
    const timeOfDay = new Date().getHours();
    if (timeOfDay < 12) return 'Good morning';
    if (timeOfDay < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <View className="flex-1 bg-gradient-to-b from-green-50 to-white">
      <StatusBar barStyle="dark-content" backgroundColor="#F0FDF4" />
      
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="pt-20 pb-8 px-6">
          <Text className="text-5xl font-bold text-gray-800 text-center mb-2">
            Welcome to BunkSafe!
          </Text>
          <Text className="text-lg text-gray-600 text-center">
            {getWelcomeMessage()}, {data.nickname}!
          </Text>
        </View>

        {/* Success Animation/Illustration */}
        <View className="items-center mb-8">
          <View className="w-32 h-32 bg-green-100 rounded-full items-center justify-center mb-6">
            <Text className="text-6xl">✨</Text>
          </View>
          <Text className="text-2xl font-bold text-green-600 mb-2">
            Setup Complete!
          </Text>
          <Text className="text-gray-600 text-center px-6">
            Your BunkSafe account is ready to use
          </Text>
        </View>

        {/* Summary Card */}
        <View className="mx-6 mb-8">
          <View className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <Text className="text-xl font-semibold text-gray-800 mb-4 text-center">
              Your Profile Summary
            </Text>
            
            <View className="space-y-3">
              <View className="flex-row items-center">
                <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center mr-3">
                  <Text className="text-blue-600">👤</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm text-gray-500">Name</Text>
                  <Text className="text-base font-medium text-gray-800">{data.nickname}</Text>
                </View>
              </View>

              <View className="flex-row items-center">
                <View className="w-8 h-8 bg-purple-100 rounded-full items-center justify-center mr-3">
                  <Text className="text-purple-600">🏛️</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm text-gray-500">University</Text>
                  <Text className="text-base font-medium text-gray-800">{data.university}</Text>
                </View>
              </View>

              <View className="flex-row items-center">
                <View className="w-8 h-8 bg-orange-100 rounded-full items-center justify-center mr-3">
                  <Text className="text-orange-600">📚</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm text-gray-500">Course</Text>
                  <Text className="text-base font-medium text-gray-800">
                    {data.department} • {data.yearOfStudy}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center">
                <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center mr-3">
                  <Text className="text-blue-600">🎯</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm text-gray-500">Attendance Target</Text>
                  <Text className="text-base font-medium text-gray-800">
                    {data.attendanceTarget}% goal
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center">
                <View className="w-8 h-8 bg-green-100 rounded-full items-center justify-center mr-3">
                  <Text className="text-green-600">🏫</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm text-gray-500">Classroom</Text>
                  <Text className="text-base font-medium text-gray-800">
                    {getClassroomMessage()}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Features Preview */}
        <View className="mx-6 mb-8">
          <Text className="text-xl font-semibold text-gray-800 mb-4 text-center">
            What&apos;s Next?
          </Text>

          <View className="space-y-3">
            <View className="bg-white rounded-xl p-4 border border-gray-100 flex-row items-center m-1">
              <Text className="text-2xl mr-3">📊</Text>
              <View className="flex-1">
                <Text className="font-medium text-gray-800">Track Attendance</Text>
                <Text className="text-sm text-gray-600">Monitor your class attendance automatically</Text>
              </View>
            </View>

            <View className="bg-white rounded-xl p-4 border border-gray-100 flex-row items-center m-1">
              <Text className="text-2xl mr-3">👥</Text>
              <View className="flex-1">
                <Text className="font-medium text-gray-800">Connect with Classmates</Text>
                <Text className="text-sm text-gray-600">Share attendance and study together</Text>
              </View>
            </View>

            <View className="bg-white rounded-xl p-4 border border-gray-100 flex-row items-center m-1">
              <Text className="text-2xl mr-3">🔔</Text>
              <View className="flex-1">
                <Text className="font-medium text-gray-800">Smart Reminders</Text>
                <Text className="text-sm text-gray-600">Get notified before classes and deadlines</Text>
              </View>
            </View>

            {!data.hasClassroom && (
              <View className="bg-yellow-50 rounded-xl p-4 border border-yellow-200 flex-row items-center m-1">
                <Text className="text-2xl mr-3">💡</Text>
                <View className="flex-1">
                  <Text className="font-medium text-yellow-800">Pro Tip</Text>
                  <Text className="text-sm text-yellow-700">
                    Join or create a classroom to unlock all features
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Motivational Quote */}
        <View className="mx-6 mb-8">
          <View className="bg-gradient-to-r from-green-500 to-green-500 rounded-2xl p-6">
            <Text className="text-white text-center text-lg font-medium mb-2">
              &quot;Success is the sum of small efforts repeated day in and day out.&quot;
            </Text>
            <Text className="text-green-100 text-center text-sm">
              - Robert Collier
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View className="p-6 bg-white border-t border-gray-100">
        <CustomButton
          title={loading ? "Setting up your account..." : "Start Using BunkSafe"}
          onPress={onComplete}
          loading={loading}
          disabled={loading}
         />
        
        <Text className="text-center text-sm text-gray-500 mt-4">
          Ready to take control of your attendance! 🚀
        </Text>
      </View>
    </View>
  );
};
