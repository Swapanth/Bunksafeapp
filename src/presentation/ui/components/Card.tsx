import React from 'react';
import { View, ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'glass' | 'colored';
  className?: string;
  style?: ViewStyle;
  color?: 'white' | 'primary' | 'secondary';
  padding?: 'none' | 'small' | 'medium' | 'large';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className = '',
  style,
  color = 'white',
  padding = 'medium',
}) => {
  const baseClasses = 'rounded-2xl border';
  
  const variantClasses = {
    default: 'bg-white border-gray-100',
    elevated: 'bg-white border-gray-50',
    glass: 'bg-white/80 border-white/20',
    colored: color === 'primary' ? 'bg-primary-50 border-primary-100' : 
             color === 'secondary' ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-100',
  };

  const paddingClasses = {
    none: '',
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8',
  };

  const cardClasses = `${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`;

  const shadowStyle = variant === 'elevated' ? {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  } : variant === 'default' ? {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  } : {};

  return (
    <View 
      className={cardClasses}
      style={[shadowStyle, style]}
    >
      {children}
    </View>
  );
};
