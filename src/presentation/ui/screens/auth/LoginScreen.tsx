import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { LoginCredentials } from '../../../../domain/model/User';
import { CustomButton } from '../../components/CustomButton';
import { CustomInput } from '../../components/CustomInput';

interface LoginScreenProps {
  onLoginSuccess: () => void;
  onLogin: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  onSignupPress?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onLogin, onSignupPress }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await onLogin({ email: email.trim(), password });
      
      if (result.success) {
        onLoginSuccess();
      } else {
        const errorMessage = result.error || 'Invalid credentials';
        
        // Check if it's a "no account found" error
        if (errorMessage.includes('No account found') || errorMessage.includes('create an account')) {
          Alert.alert(
            'Account Not Found', 
            errorMessage,
            [
              { text: 'Try Again', style: 'cancel' },
              { 
                text: 'Create Account', 
                style: 'default',
                onPress: () => onSignupPress?.()
              }
            ]
          );
        } else {
          Alert.alert('Login Failed', errorMessage);
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ backgroundColor: '#ffffff' }}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-6 py-12">
          {/* Header */}
          <View className="items-center mb-12">
            <View 
              className="bg-white p-6 rounded-3xl mb-6 border border-gray-100"
            >
              <Text className="text-5xl font-bold text-primary-500 text-center">BS</Text>
            </View>
            <Text className="text-4xl font-bold text-gray-800 mb-2">Welcome Back</Text>
            <Text className="text-gray-600 text-center leading-relaxed">
              Sign in to access your BUNK SAFE account{'\n'}and stay protected
            </Text>
            {onSignupPress && (
              <TouchableOpacity onPress={onSignupPress}>
                <Text className="text-blue-600 text-sm mt-2 text-center">
                  First time here? You&apos;ll need to create an account first
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Login Form */}
          <View 
            className="bg-white rounded-3xl p-8 border border-gray-100"
          >
            <Text className="text-2xl font-bold text-gray-800 mb-8 text-center">
              Sign In
            </Text>

            <CustomInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              error={errors.email}
              leftIcon="mail-outline"
            />

            <CustomInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              error={errors.password}
              leftIcon="lock-closed-outline"
            />

            <CustomButton
              title={loading ? 'Signing In...' : 'Sign In'}
              onPress={handleLogin}
              loading={loading}
              className="mt-6"
              size="large"
            />
            
            <CustomButton
              title="Forgot Password?"
              onPress={() => {}}
              variant="ghost"
              className="mt-4"
              size="small"
            />
          </View>

                   {/* Footer */}
          <View className="mt-5 items-center">
            <View className="flex-row items-center">
              <View className="w-8 h-0.5 bg-primary-300"></View>
              <Text className="text-primary-600 text-sm font-medium mx-4">
                Secure • Trusted • Reliable
              </Text>
              <View className="w-8 h-0.5 bg-primary-300"></View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
