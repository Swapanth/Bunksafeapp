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

interface SignupData {
  nickname: string;
  mobileNumber: string;
  email: string;
  password: string;
}

interface SignupScreenProps {
  onNext: (data: SignupData) => void;
  onBack?: () => void;
}

export const SignupScreen: React.FC<SignupScreenProps> = ({ onNext, onBack }) => {
  const [nickname, setNickname] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ nickname?: string; mobileNumber?: string; email?: string; password?: string; confirmPassword?: string }>({});
  const [isValidating, setIsValidating] = useState<{ email?: boolean; mobile?: boolean }>({});
  const [validationStatus, setValidationStatus] = useState<{ email?: 'valid' | 'invalid'; mobile?: 'valid' | 'invalid' }>({});

  const validateForm = (): boolean => {
    const newErrors: { nickname?: string; mobileNumber?: string; email?: string; password?: string; confirmPassword?: string } = {};

    if (!nickname.trim()) {
      newErrors.nickname = 'Nickname is required';
    } else if (nickname.trim().length < 2) {
      newErrors.nickname = 'Nickname must be at least 2 characters';
    }

    if (!mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(mobileNumber.replace(/\s/g, ''))) {
      newErrors.mobileNumber = 'Please enter a valid 10-digit mobile number';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateForm()) {
      return;
    }

    // Final validation before proceeding
    setIsValidating({ email: true, mobile: true });

    try {
      const [emailResult, mobileResult] = await Promise.all([
        validateEmailExists(email.trim()),
        validateMobileExists(mobileNumber.replace(/\s/g, ''))
      ]);

      if (emailResult.exists || mobileResult.exists) {
        const newErrors: { nickname?: string; mobileNumber?: string; email?: string; password?: string; confirmPassword?: string } = {};
        if (emailResult.exists) newErrors.email = emailResult.error;
        if (mobileResult.exists) newErrors.mobileNumber = mobileResult.error;
        setErrors(newErrors);
        return;
      }

      // All validations passed, proceed
      onNext({
        nickname: nickname.trim(),
        mobileNumber: mobileNumber.replace(/\s/g, ''),
        email: email.trim(),
        password: password,
      });
    } catch (error) {
      console.error('Error during final validation:', error);
      setErrors({ email: 'Unable to validate. Please try again.' });
    } finally {
      setIsValidating({});
    }
  };

  const validateEmailExists = async (emailValue: string): Promise<{ exists: boolean; error?: string }> => {
    try {
      const { FirebaseUserService } = await import('../../../../data/services/UserService');
      const service = new FirebaseUserService();
      return await service.checkEmailExists(emailValue);
    } catch (error) {
      console.error('Error validating email:', error);
      return { exists: false, error: 'Unable to validate email. Please try again.' };
    }
  };

  const validateMobileExists = async (mobileValue: string): Promise<{ exists: boolean; error?: string }> => {
    try {
      const { FirebaseUserService } = await import('../../../../data/services/UserService');
      const service = new FirebaseUserService();
      return await service.checkMobileExists(mobileValue);
    } catch (error) {
      console.error('Error validating mobile:', error);
      return { exists: false, error: 'Unable to validate mobile number. Please try again.' };
    }
  };

  const handleEmailBlur = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return; // Skip validation if email is empty or invalid format
    }

    setIsValidating(prev => ({ ...prev, email: true }));
    setErrors(prev => ({ ...prev, email: '' }));

    try {
      const result = await validateEmailExists(email.trim());
      if (result.exists) {
        setErrors(prev => ({ ...prev, email: result.error }));
        setValidationStatus(prev => ({ ...prev, email: 'invalid' }));
      } else {
        setValidationStatus(prev => ({ ...prev, email: 'valid' }));
      }
    } catch (error) {
      console.error('Error checking email:', error);
      // On error, allow user to continue instead of blocking them
      setValidationStatus(prev => ({ ...prev, email: 'valid' }));
    } finally {
      setIsValidating(prev => ({ ...prev, email: false }));
    }
  };

  const handleMobileBlur = async () => {
    const cleanedNumber = mobileNumber.replace(/\D/g, '');
    if (!cleanedNumber || !/^\d{10}$/.test(cleanedNumber)) {
      return; // Skip validation if mobile is empty or invalid format
    }

    setIsValidating(prev => ({ ...prev, mobile: true }));
    setErrors(prev => ({ ...prev, mobileNumber: '' }));

    try {
      const result = await validateMobileExists(cleanedNumber);
      if (result.exists) {
        setErrors(prev => ({ ...prev, mobileNumber: result.error }));
        setValidationStatus(prev => ({ ...prev, mobile: 'invalid' }));
      } else {
        setValidationStatus(prev => ({ ...prev, mobile: 'valid' }));
      }
    } catch (error) {
      console.error('Error checking mobile:', error);
    } finally {
      setIsValidating(prev => ({ ...prev, mobile: false }));
    }
  };

  const formatPhoneNumber = (text: string) => {
    // Remove all non-digits
    const digits = text.replace(/\D/g, '');

    // Limit to 10 digits
    if (digits.length <= 10) {
      setMobileNumber(digits);
      // Clear errors and validation status when user starts typing
      if (errors.mobileNumber) {
        setErrors(prev => ({ ...prev, mobileNumber: '' }));
      }
      setValidationStatus(prev => ({ ...prev, mobile: undefined }));
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    // Clear errors and validation status when user starts typing
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: '' }));
    }
    setValidationStatus(prev => ({ ...prev, email: undefined }));
  };

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="pt-16 pb-8 px-6">
          <View className="flex-row items-center mb-6">
            {onBack && (
              <TouchableOpacity onPress={onBack} className="mr-4">
                <View className="w-10 h-10 rounded-full bg-white items-center justify-center">
                  <Text className="text-lg">←</Text>
                </View>
              </TouchableOpacity>
            )}
            <View className="flex-1">
              <Text className="text-3xl font-bold text-gray-800">
                Create Account
              </Text>
              <Text className="text-lg text-gray-600 mt-2">
                Let&apos;s get you started with BunkSafe
              </Text>
            </View>
          </View>
        </View>

        {/* Progress Indicator */}
        <View className="px-6 mb-8">
          <View className="flex-row items-center">
            <View className="flex-1 h-2 bg-green-500 rounded-full" />
            <View className="flex-1 h-2 bg-gray-200 rounded-full ml-2" />
            <View className="flex-1 h-2 bg-gray-200 rounded-full ml-2" />
            <View className="flex-1 h-2 bg-gray-200 rounded-full ml-2" />
            <View className="flex-1 h-2 bg-gray-200 rounded-full ml-2" />
            <View className="flex-1 h-2 bg-gray-200 rounded-full ml-2" />
          </View>
          <Text className="text-sm text-gray-500 mt-2 text-center">Step 1 of 6</Text>
        </View>

        {/* Form */}
        <View className="px-6">
          {/* Welcome Card */}
          <View className="bg-white rounded-2xl p-6 mb-6 border border-gray-100">
            <Text className="text-center text-6xl mb-4">👋</Text>
            <Text className="text-xl font-semibold text-center text-gray-800 mb-2">
              Welcome to BunkSafe!
            </Text>
            <Text className="text-gray-600 text-center leading-6">
              We need some basic information to create your account and get you started.
            </Text>
          </View>

          {/* Form Fields */}
          <View className="bg-white rounded-2xl p-6 border border-gray-100">
            <CustomInput
              label="Nickname"
              value={nickname}
              onChangeText={setNickname}
              placeholder="Enter your nickname"
              error={errors.nickname}
              leftIcon="person-outline"
            />

            <CustomInput
              label="Mobile Number"
              value={mobileNumber}
              onChangeText={formatPhoneNumber}
              onBlur={handleMobileBlur}
              placeholder="Enter your mobile number"
              keyboardType="numeric"
              error={errors.mobileNumber}
              leftIcon="call-outline"
            />

            {/* Mobile validation feedback */}
            {isValidating.mobile && (
              <View className="bg-blue-50 p-3 rounded-xl mt-2 border border-blue-200">
                <Text className="text-blue-800 text-sm font-medium">
                  🔍 Checking mobile number availability...
                </Text>
              </View>
            )}
            {validationStatus.mobile === 'valid' && !errors.mobileNumber && (
              <View className="bg-green-50 p-3 rounded-xl mt-2 border border-green-200">
                <Text className="text-green-800 text-sm font-medium">
                  ✅ Mobile number is available
                </Text>
              </View>
            )}
            {errors.mobileNumber && (
              <View className="bg-red-50 p-3 rounded-xl mt-2 border border-red-200">
                <Text className="text-red-800 text-sm font-medium">
                  ❌ {errors.mobileNumber}
                </Text>
              </View>
            )}

            <CustomInput
              label="Email Address"
              value={email}
              onChangeText={handleEmailChange}
              onBlur={handleEmailBlur}
              placeholder="Enter your email address"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              leftIcon="mail-outline"
            />

            {/* Email validation feedback */}
            {isValidating.email && (
              <View className="bg-blue-50 p-3 rounded-xl mt-2 border border-blue-200">
                <Text className="text-blue-800 text-sm font-medium">
                  🔍 Checking email availability...
                </Text>
              </View>
            )}
            {validationStatus.email === 'valid' && !errors.email && (
              <View className="bg-green-50 p-3 rounded-xl mt-2 border border-green-200">
                <Text className="text-green-800 text-sm font-medium">
                  ✅ Email is available
                </Text>
              </View>
            )}
            {errors.email && (
              <View className="bg-red-50 p-3 rounded-xl mt-2 border border-red-200">
                <Text className="text-red-800 text-sm font-medium">
                  ❌ {errors.email}
                </Text>
              </View>
            )}

            <CustomInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              error={errors.password}
              leftIcon="lock-closed-outline"
            />

            <CustomInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm your password"
              secureTextEntry
              error={errors.confirmPassword}
              leftIcon="lock-closed-outline"
            />
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View className="p-6 bg-white border-t border-gray-100">
        <CustomButton
          title={
            isValidating.email || isValidating.mobile
              ? 'Validating...'
              : 'Continue'
          }
          onPress={handleNext}
          disabled={
            !nickname.trim() ||
            !mobileNumber.trim() ||
            !email.trim() ||
            !password ||
            !confirmPassword ||
            password !== confirmPassword ||
            isValidating.email ||
            isValidating.mobile ||
            validationStatus.email === 'invalid' ||
            validationStatus.mobile === 'invalid'
          }
          loading={isValidating.email || isValidating.mobile}
        />
      </View>
    </View>
  );
};
