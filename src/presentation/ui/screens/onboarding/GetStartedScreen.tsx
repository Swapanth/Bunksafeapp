import React, { useEffect, useState } from 'react';
import {
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface Feature {
  icon: string;
  title: string;
  description: string;
  color: string;
}

const features: Feature[] = [
  {
    icon: '👤',
    title: 'User Management',
    description: 'Complete user profiles and preferences with customizable settings',
    color: '#3B82F6'
  },
  {
    icon: '🏫',
    title: 'Classroom Management',
    description: 'Create, join, and manage classrooms effortlessly',
    color: '#10B981'
  },
  {
    icon: '✅',
    title: 'Attendance Tracking',
    description: 'Real-time attendance marking for every class session',
    color: '#F59E0B'
  },
  {
    icon: '📋',
    title: 'Task Management',
    description: 'Personal and classroom task management with deadlines',
    color: '#EF4444'
  },
  {
    icon: '🎮',
    title: 'Gamification',
    description: 'Points, achievements, and leaderboards to boost engagement',
    color: '#8B5CF6'
  },
  {
    icon: '👥',
    title: 'Social Features',
    description: 'Friend system with real-time notifications and messaging',
    color: '#06B6D4'
  },
  {
    icon: '📁',
    title: 'Resource Sharing',
    description: 'File and link sharing within classrooms seamlessly',
    color: '#84CC16'
  },
  {
    icon: '📅',
    title: 'Calendar Integration',
    description: 'Event management and scheduling with smart reminders',
    color: '#F97316'
  },
  {
    icon: '📊',
    title: 'Analytics',
    description: 'Comprehensive analytics and reporting for insights',
    color: '#EC4899'
  },
  {
    icon: '⚡',
    title: 'Real-time Features',
    description: 'Live updates and instant synchronization across devices',
    color: '#14B8A6'
  }
];

interface GetStartedScreenProps {
  onComplete: () => void;
  onSkip: () => void;
}

export const GetStartedScreen: React.FC<GetStartedScreenProps> = ({ onComplete, onSkip }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Simple fade in effect using state
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const FeatureCard: React.FC<{ feature: Feature; index: number }> = ({ feature, index }) => {
    const [cardVisible, setCardVisible] = useState(false);

    useEffect(() => {
      const timer = setTimeout(() => {
        setCardVisible(true);
      }, index * 100 + 200);

      return () => clearTimeout(timer);
    }, [index]);

    return (
      <View
        style={{
          opacity: cardVisible ? 1 : 0,
        }}
        className="mb-4 mx-4"
      >
        <View 
          className="p-6 rounded-2xl bg-white border border-gray-100"
        >
          <View className="flex-row items-center mb-3">
            <View 
              className="w-12 h-12 rounded-xl justify-center items-center mr-4"
              style={{ backgroundColor: `${feature.color}15` }}
            >
              <Text className="text-2xl">{feature.icon}</Text>
            </View>
            <Text 
              className="text-xl font-bold flex-1"
              style={{ color: feature.color }}
            >
              {feature.title}
            </Text>
          </View>
          <Text className="text-gray-600 text-base leading-6">
            {feature.description}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1" style={{ backgroundColor: '#F8FAFC' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      {/* Header */}
      <View
        style={{
          opacity: isVisible ? 1 : 0,
        }}
        className="pt-16 pb-8 px-6"
      >
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-3xl font-bold text-gray-800">
            Get Started
          </Text>
          <TouchableOpacity
            onPress={onSkip}
            className="px-4 py-2 rounded-full"
            style={{ backgroundColor: '#E5E7EB' }}
          >
            <Text className="text-gray-600 font-medium">Skip</Text>
          </TouchableOpacity>
        </View>
        
        <Text className="text-lg text-gray-600 leading-7">
          Discover all the amazing features that will revolutionize your classroom experience
        </Text>
      </View>

      {/* Features List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {features.map((feature, index) => (
          <FeatureCard key={index} feature={feature} index={index} />
        ))}
      </ScrollView>

      {/* Bottom Action Area */}
      <View
        className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100"
        style={{
          opacity: isVisible ? 1 : 0,
        }}
      >
        <TouchableOpacity
          onPress={onComplete}
          className="py-4 px-8 rounded-2xl border border-primary-400"
          style={{ 
            backgroundColor: '#22C55E',
          }}
        >
          <Text className="text-white text-lg font-bold text-center">
            Let&apos;s Get Started! 🚀
          </Text>
        </TouchableOpacity>
        
        <View className="flex-row justify-center mt-4">
          <View className="flex-row space-x-2">
            {[...Array(3)].map((_, index) => (
              <View
                key={index}
                className="w-2 h-2 rounded-full"
                style={{ 
                  backgroundColor: index === 1 ? '#22C55E' : '#E5E7EB' 
                }}
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};
