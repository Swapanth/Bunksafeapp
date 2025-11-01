import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  className = '',
}) => {
  const baseClasses = 'rounded-xl flex-row justify-center items-center';

  // Size variants
  const sizeClasses = {
    small: 'py-3 px-4',
    medium: 'py-4 px-6',
    large: 'py-5 px-8',
  };

  // Color variants
  const variantClasses = {
    primary: 'bg-primary-500',
    secondary: 'bg-white border-2 border-primary-500',
    ghost: 'bg-transparent',
  };

  const disabledClasses = disabled || loading ? 'opacity-50' : '';

  const buttonClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${disabledClasses} ${className}`;

  const textSizeClasses = {
    small: 'text-base',
    medium: 'text-lg',
    large: 'text-xl',
  };

  const textColorClasses = {
    primary: 'text-white',
    secondary: 'text-primary-500',
    ghost: 'text-primary-500',
  };

  const textClasses = `font-semibold ${textSizeClasses[size]} ${textColorClasses[variant]}`;

  const spinnerColor = variant === 'primary' ? 'white' : '#22c55e';

  return (
    <TouchableOpacity
      className={buttonClasses}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      <View className="flex-row items-center justify-center">
        {loading && (
          <ActivityIndicator
            size="small"
            color={spinnerColor}
            style={{ marginRight: 8 }}
          />
        )}
        <Text className={textClasses}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
};
