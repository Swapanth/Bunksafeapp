import React, { useState } from 'react';
import {
    Modal,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { CustomButton } from '../../components/CustomButton';
import { CustomInput } from '../../components/CustomInput';

interface SignupDetailsData {
  email: string;
  collegeName: string;
}

interface SignupDetailsScreenProps {
  onComplete: (data: SignupDetailsData) => void;
  onBack: () => void;
}

const COLLEGES = [
  'Indian Institute of Technology (IIT) Delhi',
  'Indian Institute of Technology (IIT) Bombay',
  'Indian Institute of Technology (IIT) Kanpur',
  'Indian Institute of Science (IISc) Bangalore',
  'Jadavpur University',
  'Delhi University',
  'Jawaharlal Nehru University (JNU)',
  'Banaras Hindu University (BHU)',
  'Aligarh Muslim University (AMU)',
  'University of Hyderabad',
  'Pune University',
  'Anna University',
  'Jamia Millia Islamia',
  'Manipal Institute of Technology',
  'VIT University',
  'SRM Institute of Science and Technology',
  'Amity University',
  'Lovely Professional University',
  'Other',
];

export const SignupDetailsScreen: React.FC<SignupDetailsScreenProps> = ({
  onComplete,
  onBack,
}) => {
  const [email, setEmail] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [showCollegeModal, setShowCollegeModal] = useState(false);
  const [errors, setErrors] = useState<{email?: string; collegeName?: string}>({});

  const validateForm = (): boolean => {
    const newErrors: {email?: string; collegeName?: string} = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!collegeName.trim()) {
      newErrors.collegeName = 'College selection is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleComplete = () => {
    if (validateForm()) {
      onComplete({
        email: email.trim(),
        collegeName: collegeName.trim(),
      });
    }
  };

  const selectCollege = (college: string) => {
    setCollegeName(college);
    setShowCollegeModal(false);
    setErrors(prev => ({ ...prev, collegeName: undefined }));
  };

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="pt-16 pb-8 px-6">
          <TouchableOpacity onPress={onBack} className="mb-6">
            <View className="w-10 h-10 rounded-full bg-white items-center justify-center">
              <Text className="text-lg">←</Text>
            </View>
          </TouchableOpacity>
          
          <Text className="text-3xl font-bold text-gray-800 mb-2">
            Almost Done!
          </Text>
          <Text className="text-lg text-gray-600">
            Just a few more details to complete your profile
          </Text>
        </View>

        {/* Progress Indicator */}
        <View className="px-6 mb-8">
          <View className="flex-row items-center">
            <View className="flex-1 h-2 bg-green-500 rounded-full" />
            <View className="flex-1 h-2 bg-green-500 rounded-full ml-2" />
            <View className="flex-1 h-2 bg-green-500 rounded-full ml-2" />
          </View>
          <Text className="text-sm text-gray-500 mt-2 text-center">Step 3 of 3</Text>
        </View>

        {/* Form */}
        <View className="px-6">
          {/* Welcome Card */}
          <View className="bg-white rounded-2xl p-6 mb-6 border border-gray-100">
            <Text className="text-center text-6xl mb-4">🎓</Text>
            <Text className="text-xl font-semibold text-center text-gray-800 mb-2">
              Academic Details
            </Text>
            <Text className="text-gray-600 text-center leading-6">
              Help us personalize your experience with your academic information.
            </Text>
          </View>

          {/* Form Fields */}
          <View className="bg-white rounded-2xl p-6 border border-gray-100">
            <CustomInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email address"
              keyboardType="email-address"
              error={errors.email}
              leftIcon="mail-outline"
            />

            {/* College Selector */}
            <View className="mb-4">
              <Text className="text-gray-700 font-semibold mb-3 ml-1 text-base">
                College/University
              </Text>
              <TouchableOpacity
                onPress={() => setShowCollegeModal(true)}
                className={`flex-row items-center border-2 rounded-xl px-4 py-4 ${
                  errors.collegeName
                    ? 'border-red-400 bg-red-50'
                    : collegeName
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <View className="pl-0 mr-3">
                  <Text className="text-xl">🏫</Text>
                </View>
                <Text className={`flex-1 text-base ${
                  collegeName ? 'text-gray-800' : 'text-gray-400'
                }`}>
                  {collegeName || 'Select your college/university'}
                </Text>
                <Text className="text-gray-400 text-lg">▼</Text>
              </TouchableOpacity>
              {errors.collegeName && (
                <Text className="text-red-500 text-sm mt-2 ml-1 font-medium">
                  {errors.collegeName}
                </Text>
              )}
            </View>

            <View className="bg-green-50 p-4 rounded-xl mt-4">
              <Text className="text-green-800 text-sm font-medium">
                🔒 Your information is secure and will only be used to enhance your app experience
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View className="p-6 bg-white border-t border-gray-100">
        <CustomButton
          title="Complete Registration"
          onPress={handleComplete}
          disabled={!email.trim() || !collegeName.trim()}
        />
      </View>

      {/* College Selection Modal */}
      <Modal
        visible={showCollegeModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View className="flex-1 bg-white">
          <View className="pt-16 pb-4 px-6 border-b border-gray-200">
            <View className="flex-row items-center justify-between">
              <Text className="text-2xl font-bold text-gray-800">
                Select College
              </Text>
              <TouchableOpacity onPress={() => setShowCollegeModal(false)}>
                <Text className="text-lg text-gray-600">✕</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <ScrollView className="flex-1">
            {COLLEGES.map((college, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => selectCollege(college)}
                className="px-6 py-4 border-b border-gray-100 active:bg-gray-50"
              >
                <View className="flex-row items-center">
                  <Text className="text-lg mr-3">🏫</Text>
                  <Text className="flex-1 text-gray-800 text-base">
                    {college}
                  </Text>
                  {collegeName === college && (
                    <Text className="text-green-500 text-lg">✓</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};
