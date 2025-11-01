import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { ProfileDataService, UserProfile } from './useProfileData';
import { SkeletonLoader } from '../../components/skeletons/SkeletonLoader';

interface EditProfileScreenProps {
  user: UserProfile;
  service?: ProfileDataService;
  onSave?: (updatedUser: UserProfile) => void;
  onCancel?: () => void;
}

const AVATAR_OPTIONS = ['👨‍🎓', '👩‍🎓', '🧑‍💻', '👨‍💼', '👩‍💼', '🧑‍🔬', '👨‍🏫', '👩‍🏫'];

export const EditProfileScreen: React.FC<EditProfileScreenProps> = ({
  user,
  service,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    avatar: user.avatar,
  });
  const [loading, setLoading] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    if (!formData.email.trim()) {
      Alert.alert('Error', 'Email is required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      if (service) {
        await service.updateUserProfile(formData);
      }
      
      const updatedUser = { ...user, ...formData };
      onSave?.(updatedUser);
      
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
      console.error('Profile update error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: '#fafafa' }}>
      {/* Header */}
      <View className="bg-white px-6 pt-16 pb-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={onCancel} className="p-2">
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">Edit Profile</Text>
          <TouchableOpacity 
            onPress={handleSave} 
            disabled={loading}
            className="p-2"
          >
            {loading ? (
              <SkeletonLoader width={40} height={16} borderRadius={8} />
            ) : (
              <Text className="text-blue-600 font-semibold">Save</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6">
          {/* Avatar Section */}
          <View className="bg-white rounded-3xl p-6 mb-6 border border-gray-100">
            <Text className="text-lg font-bold text-gray-800 mb-4">Profile Picture</Text>
            <View className="items-center">
              <TouchableOpacity 
                onPress={() => setShowAvatarPicker(!showAvatarPicker)}
                className="items-center"
              >
                <Text className="text-6xl mb-2">{formData.avatar}</Text>
                <Text className="text-blue-600 font-semibold">Change Avatar</Text>
              </TouchableOpacity>
              
              {showAvatarPicker && (
                <View className="mt-4 p-4 bg-gray-50 rounded-2xl">
                  <Text className="text-gray-600 text-center mb-3">Choose an avatar:</Text>
                  <View className="flex-row flex-wrap justify-center">
                    {AVATAR_OPTIONS.map((avatar, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => {
                          setFormData(prev => ({ ...prev, avatar }));
                          setShowAvatarPicker(false);
                        }}
                        className={`p-2 m-1 rounded-xl ${
                          formData.avatar === avatar ? 'bg-blue-100' : 'bg-white'
                        }`}
                      >
                        <Text className="text-3xl">{avatar}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Personal Information */}
          <View className="bg-white rounded-3xl p-6 mb-6 border border-gray-100">
            <Text className="text-lg font-bold text-gray-800 mb-4">Personal Information</Text>
            
            <View className="mb-4">
              <Text className="text-gray-600 font-semibold mb-2">Full Name</Text>
              <TextInput
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                className="bg-gray-50 rounded-xl p-4 text-gray-800"
                placeholder="Enter your full name"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-600 font-semibold mb-2">Email Address</Text>
              <TextInput
                value={formData.email}
                onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                className="bg-gray-50 rounded-xl p-4 text-gray-800"
                placeholder="Enter your email address"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Account Stats (Read-only) */}
          <View className="bg-white rounded-3xl p-6 mb-6 border border-gray-100">
            <Text className="text-lg font-bold text-gray-800 mb-4">Account Information</Text>
            
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-gray-600">Account Level</Text>
              <View className="bg-yellow-100 px-3 py-1 rounded-full">
                <Text className="text-yellow-700 font-semibold">{user.level}</Text>
              </View>
            </View>

            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-gray-600">Member Since</Text>
              <Text className="text-gray-800 font-semibold">{user.joinDate}</Text>
            </View>

            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600">Study Streak</Text>
              <Text className="text-orange-600 font-bold">🔥 {user.studyStreak} days</Text>
            </View>
          </View>

          {/* Save Button (Alternative) */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={loading}
            className="bg-blue-600 rounded-2xl p-4 active:bg-blue-700"
            activeOpacity={0.8}
          >
            <View className="flex-row items-center justify-center">
              {loading ? (
                <SkeletonLoader width={20} height={20} borderRadius={10} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={24} color="white" />
                  <Text className="text-white font-semibold ml-2 text-lg">
                    Save Changes
                  </Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};