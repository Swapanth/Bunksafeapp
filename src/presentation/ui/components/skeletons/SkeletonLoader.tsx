import React from 'react';
import { Animated, View } from 'react-native';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
  animated?: boolean;
}

// Shared animation instance to reduce memory usage
let sharedAnimation: Animated.Value | null = null;
let animationStarted = false;

const getSharedAnimation = () => {
  if (!sharedAnimation) {
    sharedAnimation = new Animated.Value(0);
  }
  
  if (!animationStarted) {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(sharedAnimation, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true, // Use native driver for better performance
        }),
        Animated.timing(sharedAnimation, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    animationStarted = true;
  }
  
  return sharedAnimation;
};

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
  animated = true
}) => {
  const animatedValue = animated ? getSharedAnimation() : null;

  // For non-animated version, use static styling
  if (!animated) {
    return (
      <View
        style={[
          {
            width,
            height,
            borderRadius,
            backgroundColor: '#e5e7eb',
          },
          style,
        ]}
      />
    );
  }

  const opacity = animatedValue!.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#e5e7eb',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#f3f4f6',
          opacity,
        }}
      />
    </View>
  );
};