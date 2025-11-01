import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { UserProfile } from '../screens/profile/useProfileData';
import { SkeletonLoader } from './skeletons/SkeletonLoader';

interface EditProfileModalProps {
  visible: boolean;
  user: UserProfile;
  onClose: () => void;
  onSave: (updates: Partial<UserProfile>) => Promise<void>;
}

const AVATAR_OPTIONS = ['👨‍🎓', '👩‍🎓', '🧑‍💻', '👨‍💼', '👩‍💼', '🧑‍🔬', '👨‍🏫', '👩‍🏫'];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  user,
  onClose,
  onSave,
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

    try {
      setLoading(true);
      await onSave(formData);
      onClose();
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original values
    setFormData({
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    });
    setShowAvatarPicker(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <View className="flex-1 bg-gray-50">
        {/* Header */}
        

        <ScrollView className="flex-1 px-6 py-6">
          {/* Avatar Section */}
          <View className="bg-white rounded-2xl p-6 mb-6 border border-gray-100">
            <Text className="text-lg font-bold text-gray-800 mb-4">Profile Picture</Text>
            <View className="items-center">
              <TouchableOpacity
                onPress={() => setShowAvatarPicker(!showAvatarPicker)}
                className="items-center"
              >
                <Text className="text-6xl mb-2">{formData.avatar}</Text>
                <Text className="text-blue-600 font-medium">Change Avatar</Text>
              </TouchableOpacity>

              {showAvatarPicker && (
                <View className="mt-4 p-4 bg-gray-50 rounded-xl">
                  <Text className="text-center text-gray-600 mb-3">Choose an avatar:</Text>
                  <View className="flex-row flex-wrap justify-center">
                    {AVATAR_OPTIONS.map((avatar, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => {
                          setFormData({ ...formData, avatar });
                          setShowAvatarPicker(false);
                        }}
                        className={`p-2 m-1 rounded-lg ${
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

          {/* Name Field */}
          <View className="bg-white rounded-2xl p-6 mb-4 border border-gray-100">
            <Text className="text-lg font-bold text-gray-800 mb-4">Personal Information</Text>
            
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Full Name</Text>
              <TextInput
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Enter your full name"
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
                style={{ fontSize: 16 }}
              />
            </View>

            <View>
              <Text className="text-gray-700 font-medium mb-2">Email Address</Text>
              <TextInput
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="Enter your email address"
                keyboardType="email-address"
                autoCapitalize="none"
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
                style={{ fontSize: 16 }}
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View className="space-y-3">
            <TouchableOpacity
              onPress={handleSave}
              disabled={loading}
              className="bg-blue-600 rounded-2xl p-4 active:bg-blue-700 mb-2"
              activeOpacity={0.8}
            >
              <View className="flex-row items-center justify-center">
                {loading ? (
                  <SkeletonLoader width={20} height={20} borderRadius={10} />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color="white" />
                    <Text className="text-white font-bold text-lg ml-2 ">Save Changes</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCancel}
              className="bg-gray-200 rounded-2xl p-4 active:bg-gray-300 m-2 mb-7"
              activeOpacity={0.8}
            >
              <View className="flex-row items-center justify-center">
                <Ionicons name="close" size={20} color="#6b7280" />
                <Text className="text-gray-700 font-bold text-lg ml-2">Cancel</Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};