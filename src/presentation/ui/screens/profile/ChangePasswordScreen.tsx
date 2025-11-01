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

interface ChangePasswordScreenProps {
  onSave?: (passwords: { currentPassword: string; newPassword: string }) => Promise<void>;
  onCancel?: () => void;
}

export const ChangePasswordScreen: React.FC<ChangePasswordScreenProps> = ({
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const validatePasswords = () => {
    if (!formData.currentPassword.trim()) {
      Alert.alert('Error', 'Current password is required');
      return false;
    }

    if (!formData.newPassword.trim()) {
      Alert.alert('Error', 'New password is required');
      return false;
    }

    if (formData.newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters long');
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return false;
    }

    if (formData.currentPassword === formData.newPassword) {
      Alert.alert('Error', 'New password must be different from current password');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validatePasswords()) return;

    setLoading(true);
    try {
      await onSave?.({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      
      Alert.alert('Success', 'Password changed successfully!', [
        { text: 'OK', onPress: onCancel }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to change password. Please try again.');
      console.error('Password change error:', error);
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
          <Text className="text-xl font-bold text-gray-800">Change Password</Text>
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
          {/* Security Notice */}
          <View className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
            <View className="flex-row items-center mb-2">
              <Ionicons name="shield-checkmark" size={24} color="#3b82f6" />
              <Text className="text-blue-800 font-semibold ml-2">Security Notice</Text>
            </View>
            <Text className="text-blue-700 text-sm">
              Choose a strong password with at least 6 characters. 
              We recommend using a mix of letters, numbers, and symbols.
            </Text>
          </View>

          {/* Password Form */}
          <View className="bg-white rounded-3xl p-6 mb-6 border border-gray-100">
            <Text className="text-lg font-bold text-gray-800 mb-4">Password Information</Text>
            
            {/* Current Password */}
            <View className="mb-4">
              <Text className="text-gray-600 font-semibold mb-2">Current Password</Text>
              <View className="relative">
                <TextInput
                  value={formData.currentPassword}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, currentPassword: text }))}
                  className="bg-gray-50 rounded-xl p-4 pr-12 text-gray-800"
                  placeholder="Enter your current password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showPasswords.current}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                  className="absolute right-4 top-4"
                >
                  <Ionicons 
                    name={showPasswords.current ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color="#6b7280" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* New Password */}
            <View className="mb-4">
              <Text className="text-gray-600 font-semibold mb-2">New Password</Text>
              <View className="relative">
                <TextInput
                  value={formData.newPassword}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, newPassword: text }))}
                  className="bg-gray-50 rounded-xl p-4 pr-12 text-gray-800"
                  placeholder="Enter your new password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showPasswords.new}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                  className="absolute right-4 top-4"
                >
                  <Ionicons 
                    name={showPasswords.new ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color="#6b7280" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm New Password */}
            <View className="mb-4">
              <Text className="text-gray-600 font-semibold mb-2">Confirm New Password</Text>
              <View className="relative">
                <TextInput
                  value={formData.confirmPassword}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, confirmPassword: text }))}
                  className="bg-gray-50 rounded-xl p-4 pr-12 text-gray-800"
                  placeholder="Confirm your new password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showPasswords.confirm}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                  className="absolute right-4 top-4"
                >
                  <Ionicons 
                    name={showPasswords.confirm ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color="#6b7280" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Password Strength Indicator */}
            {formData.newPassword.length > 0 && (
              <View className="mt-2">
                <Text className="text-gray-600 text-sm mb-1">Password Strength:</Text>
                <View className="flex-row items-center">
                  <View className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                    <View 
                      className={`h-2 rounded-full ${
                        formData.newPassword.length < 6 ? 'bg-red-500' :
                        formData.newPassword.length < 8 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ 
                        width: `${Math.min((formData.newPassword.length / 8) * 100, 100)}%` 
                      }}
                    />
                  </View>
                  <Text className={`text-xs font-semibold ${
                    formData.newPassword.length < 6 ? 'text-red-600' :
                    formData.newPassword.length < 8 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {formData.newPassword.length < 6 ? 'Weak' :
                     formData.newPassword.length < 8 ? 'Good' : 'Strong'}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={loading}
            className="bg-blue-600 rounded-2xl p-4 mb-6 active:bg-blue-700"
            activeOpacity={0.8}
          >
            <View className="flex-row items-center justify-center">
              {loading ? (
                <SkeletonLoader width={20} height={20} borderRadius={10} />
              ) : (
                <>
                  <Ionicons name="lock-closed-outline" size={24} color="white" />
                  <Text className="text-white font-semibold ml-2 text-lg">
                    Change Password
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