import React from 'react';
import { View } from 'react-native';

interface FastSkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
}

// Ultra-fast skeleton without animations for instant loading
export const FastSkeleton: React.FC<FastSkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style
}) => {
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
};

// Pre-built fast skeleton layouts
export const FastProfileSkeleton: React.FC = () => (
  <View className="flex-1" style={{ backgroundColor: '#fafafa' }}>
    <View className="px-6 pt-16 pb-6">
      <View className="bg-white rounded-3xl p-6 mb-6 border border-gray-100">
        <View className="items-center mb-6">
          <FastSkeleton width={80} height={80} borderRadius={40} style={{ marginBottom: 12 }} />
          <FastSkeleton width={150} height={24} style={{ marginBottom: 4 }} />
          <FastSkeleton width={120} height={16} />
        </View>
        <FastSkeleton width="100%" height={40} borderRadius={12} />
      </View>
      
      {[1, 2, 3].map((section) => (
        <View key={section} className="bg-white rounded-3xl p-6 mb-4 border border-gray-100">
          <FastSkeleton width={120} height={20} style={{ marginBottom: 16 }} />
          <View className="space-y-3">
            {[1, 2, 3].map((item) => (
              <View key={item} className="flex-row items-center justify-between py-2">
                <View className="flex-row items-center flex-1">
                  <FastSkeleton width={24} height={24} borderRadius={12} style={{ marginRight: 12 }} />
                  <View className="flex-1">
                    <FastSkeleton width={100} height={16} style={{ marginBottom: 2 }} />
                    <FastSkeleton width={150} height={12} />
                  </View>
                </View>
                <FastSkeleton width={40} height={20} borderRadius={10} />
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  </View>
);

export const FastListSkeleton: React.FC<{ items?: number }> = ({ items = 5 }) => (
  <View className="flex-1" style={{ backgroundColor: '#fafafa' }}>
    <View className="px-6 pt-16 pb-6">
      {Array.from({ length: items }).map((_, index) => (
        <View key={index} className="bg-white rounded-2xl p-4 mb-3 border border-gray-100">
          <View className="flex-row items-center">
            <FastSkeleton width={48} height={48} borderRadius={24} style={{ marginRight: 12 }} />
            <View className="flex-1">
              <FastSkeleton width="70%" height={18} style={{ marginBottom: 4 }} />
              <FastSkeleton width="50%" height={14} />
            </View>
            <FastSkeleton width={32} height={32} borderRadius={8} />
          </View>
        </View>
      ))}
    </View>
  </View>
);