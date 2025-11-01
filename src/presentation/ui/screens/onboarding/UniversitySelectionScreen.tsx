import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CustomButton } from '../../components/CustomButton';
import { CustomInput } from '../../components/CustomInput';

interface UniversityData {
  university: string;
  department: string;
  yearOfStudy: string;
  attendanceTarget: number;
}

interface UniversitySelectionScreenProps {
  onNext: (data: UniversityData) => void;
  onBack: () => void;
}

const POPULAR_UNIVERSITIES = [
  'Delhi University',
  'Jawaharlal Nehru University',
  'University of Mumbai',
  'Anna University',
  'Bangalore University',
  'Pune University',
  'Jamia Millia Islamia',
  'Aligarh Muslim University',
  'Banaras Hindu University',
  'Calcutta University',
  'Other'
];

const POPULAR_DEPARTMENTS = [
  'Computer Science & Engineering',
  'Information Technology',
  'Electronics & Communication',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'Commerce',
  'Business Administration',
  'Arts',
  'Science',
  'Medicine',
  'Law',
  'Other'
];

const YEARS_OF_STUDY = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

const ATTENDANCE_TARGETS = [60, 65, 70, 75, 80, 85, 90, 95];

export const UniversitySelectionScreen: React.FC<UniversitySelectionScreenProps> = ({
  onNext,
  onBack,
}) => {
  const [university, setUniversity] = useState('');
  const [department, setDepartment] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [attendanceTarget, setAttendanceTarget] = useState('75');
  const [customUniversity, setCustomUniversity] = useState('');
  const [customDepartment, setCustomDepartment] = useState('');
  const [showUniversityModal, setShowUniversityModal] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [showYearModal, setShowYearModal] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [errors, setErrors] = useState<{university?: string; department?: string; yearOfStudy?: string}>({});

  const validateForm = (): boolean => {
    const newErrors: {university?: string; department?: string; yearOfStudy?: string} = {};

    const finalUniversity = university === 'Other' ? customUniversity : university;
    const finalDepartment = department === 'Other' ? customDepartment : department;

    if (!finalUniversity.trim()) {
      newErrors.university = 'University is required';
    }

    if (!finalDepartment.trim()) {
      newErrors.department = 'Department is required';
    }

    if (!yearOfStudy.trim()) {
      newErrors.yearOfStudy = 'Year of study is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      const finalUniversity = university === 'Other' ? customUniversity : university;
      const finalDepartment = department === 'Other' ? customDepartment : department;
      
      onNext({
        university: finalUniversity.trim(),
        department: finalDepartment.trim(),
        yearOfStudy: yearOfStudy,
        attendanceTarget: parseInt(attendanceTarget),
      });
    }
  };

  const SelectionModal: React.FC<{
    visible: boolean;
    title: string;
    data: string[];
    onSelect: (item: string) => void;
    onClose: () => void;
  }> = ({ visible, title, data, onSelect, onClose }) => (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl max-h-96">
          <View className="p-4 border-b border-gray-200">
            <View className="flex-row justify-between items-center">
              <Text className="text-lg font-semibold text-gray-800">{title}</Text>
              <TouchableOpacity onPress={onClose}>
                <Text className="text-2xl text-gray-500">×</Text>
              </TouchableOpacity>
            </View>
          </View>
          <FlatList
            data={data}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
                className="p-4 border-b border-gray-100"
              >
                <Text className="text-gray-800 text-base">{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
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
                Educational Info
              </Text>
              <Text className="text-lg text-gray-600 mt-2">
                Tell us about your university and course
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
            <View className="flex-1 h-2 bg-gray-200 rounded-full ml-2" />
            <View className="flex-1 h-2 bg-gray-200 rounded-full ml-2" />
            <View className="flex-1 h-2 bg-gray-200 rounded-full ml-2" />
          </View>
          <Text className="text-sm text-gray-500 mt-2 text-center">Step 3 of 6</Text>
        </View>

        {/* Form */}
        <View className="px-6">
          
          {/* Form Fields */}
          <View className="bg-white rounded-2xl p-6 border border-gray-100">
            {/* University Selection */}
            <View className="mb-6">
              <Text className="text-base font-medium text-gray-700 mb-2">University *</Text>
              <TouchableOpacity
                onPress={() => setShowUniversityModal(true)}
                className={`p-4 rounded-xl border ${
                  errors.university ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                }`}
              >
                <Text className={`text-base ${university ? 'text-gray-800' : 'text-gray-500'}`}>
                  {university || 'Select your university'}
                </Text>
              </TouchableOpacity>
              {errors.university && (
                <Text className="text-red-500 text-sm mt-1">{errors.university}</Text>
              )}
            </View>

            {/* Custom University Input */}
            {university === 'Other' && (
              <CustomInput
                label="University Name"
                value={customUniversity}
                onChangeText={setCustomUniversity}
                placeholder="Enter your university name"
                leftIcon="school-outline"
              />
            )}

            {/* Department Selection */}
            <View className="mb-6">
              <Text className="text-base font-medium text-gray-700 mb-2">Department/Course *</Text>
              <TouchableOpacity
                onPress={() => setShowDepartmentModal(true)}
                className={`p-4 rounded-xl border ${
                  errors.department ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                }`}
              >
                <Text className={`text-base ${department ? 'text-gray-800' : 'text-gray-500'}`}>
                  {department || 'Select your department'}
                </Text>
              </TouchableOpacity>
              {errors.department && (
                <Text className="text-red-500 text-sm mt-1">{errors.department}</Text>
              )}
            </View>

            {/* Custom Department Input */}
            {department === 'Other' && (
              <CustomInput
                label="Department/Course Name"
                value={customDepartment}
                onChangeText={setCustomDepartment}
                placeholder="Enter your department/course"
                leftIcon="library-outline"
              />
            )}

            {/* Year of Study Selection */}
            <View className="mb-6">
              <Text className="text-base font-medium text-gray-700 mb-2">Year of Study *</Text>
              <TouchableOpacity
                onPress={() => setShowYearModal(true)}
                className={`p-4 rounded-xl border ${
                  errors.yearOfStudy ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                }`}
              >
                <Text className={`text-base ${yearOfStudy ? 'text-gray-800' : 'text-gray-500'}`}>
                  {yearOfStudy || 'Select your year'}
                </Text>
              </TouchableOpacity>
              {errors.yearOfStudy && (
                <Text className="text-red-500 text-sm mt-1">{errors.yearOfStudy}</Text>
              )}
            </View>

            {/* Attendance Target Selection */}
            <View className="mb-6">
              <Text className="text-base font-medium text-gray-700 mb-2">Attendance Target</Text>
              <TouchableOpacity
                onPress={() => setShowTargetModal(true)}
                className="p-4 rounded-xl border border-gray-300 bg-gray-50"
              >
                <Text className="text-base text-gray-800">
                  {attendanceTarget}% attendance target
                </Text>
              </TouchableOpacity>
              <Text className="text-xs text-gray-500 mt-1">
                Set your personal attendance goal
              </Text>
            </View>

            <View className="bg-blue-50 p-4 rounded-xl">
              <Text className="text-blue-800 text-sm font-medium">
                🔒 Your educational information will be kept private and secure
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View className="p-6 bg-white border-t border-gray-100">
        <CustomButton
          title="Continue"
          onPress={handleNext}
          disabled={!university || !department || !yearOfStudy}
        />
      </View>

      {/* Modals */}
      <SelectionModal
        visible={showUniversityModal}
        title="Select University"
        data={POPULAR_UNIVERSITIES}
        onSelect={setUniversity}
        onClose={() => setShowUniversityModal(false)}
      />

      <SelectionModal
        visible={showDepartmentModal}
        title="Select Department"
        data={POPULAR_DEPARTMENTS}
        onSelect={setDepartment}
        onClose={() => setShowDepartmentModal(false)}
      />

      <SelectionModal
        visible={showYearModal}
        title="Select Year"
        data={YEARS_OF_STUDY}
        onSelect={setYearOfStudy}
        onClose={() => setShowYearModal(false)}
      />

      <SelectionModal
        visible={showTargetModal}
        title="Select Attendance Target"
        data={ATTENDANCE_TARGETS.map(target => `${target}%`)}
        onSelect={(target) => setAttendanceTarget(target.replace('%', ''))}
        onClose={() => setShowTargetModal(false)}
      />
    </View>
  );
};
