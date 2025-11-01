import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

interface CustomInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
  className?: string;
  leftIcon?: string;
}

export const CustomInput: React.FC<CustomInputProps> = ({
  label,
  value,
  onChangeText,
  onBlur,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error,
  className = '',
  leftIcon,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const inputContainerClasses = `flex-row items-center border-2 rounded-xl ${
    error
      ? 'border-red-400 bg-red-50'
      : isFocused
      ? 'border-primary-500 bg-primary-50'
      : 'border-gray-200 bg-white'
  }`;

  const inputClasses = `flex-1 px-4 py-4 text-base text-gray-800 ${
    leftIcon ? 'pl-2' : ''
  }`;

  return (
    <View className={`mb-4 ${className}`}>
      <Text className="text-gray-700 font-semibold mb-3 ml-1 text-base">{label}</Text>
      <View 
        className={inputContainerClasses}
      >
        {leftIcon && (
          <View className="pl-4">
            <Ionicons
              name={leftIcon as any}
              size={20}
              color={isFocused ? '#22c55e' : '#9CA3AF'}
            />
          </View>
        )}
        <TextInput
          className={inputClasses}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            onBlur?.();
          }}
        />
        {secureTextEntry && (
          <TouchableOpacity
            className="pr-4"
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={isFocused ? '#22c55e' : '#9CA3AF'}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text className="text-red-500 text-sm mt-2 ml-1 font-medium">{error}</Text>
      )}
    </View>
  );
};
