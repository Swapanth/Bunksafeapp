import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { createRealProfileService } from '../../../data/services/ProfileService';
import { User } from '../../../domain/model/User';
import { ClassroomScreen } from '../screens/classroom/ClassroomScreen';
import { DashboardScreen } from '../screens/main/DashboardScreen';
import { FriendsScreen } from '../screens/main/FriendsScreen';
import { TasksScreen } from '../screens/main/TasksScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';

type TabScreen = 'dashboard' | 'tasks' | 'friends' | 'classroom' | 'profile';

interface MainAppProps {
  user: User;
  onLogout: () => void;
}

export const MainApp: React.FC<MainAppProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<TabScreen>('dashboard');
  const tabs = [
    {
      id: 'dashboard' as TabScreen,
      label: 'Home',
      icon: 'home',
      activeIcon: 'home',
    },
    {
      id: 'classroom' as TabScreen,
      label: 'Classroom',
      icon: 'bar-chart-outline',
      activeIcon: 'bar-chart',
    },

    {
      id: 'friends' as TabScreen,
      label: 'Friends',
      icon: 'people-outline',
      activeIcon: 'people',
    },
    {
      id: 'tasks' as TabScreen,
      label: 'Tasks',
      icon: 'checkbox-outline',
      activeIcon: 'checkbox',
    },
    {
      id: 'profile' as TabScreen,
      label: 'Profile',
      icon: 'person-outline',
      activeIcon: 'person',
    },
  ];

  // Memoize screens to prevent unnecessary re-renders
  const screens = useMemo(() => ({
    dashboard: <DashboardScreen userId={user.id} />,
    tasks: <TasksScreen user={user} />,
    friends: <FriendsScreen user={user} />,
    classroom: <ClassroomScreen userId={user.id} />,
    profile: <ProfileScreen service={createRealProfileService(user)} onLogout={onLogout} />
  }), [user, onLogout]);

  const renderScreen = () => {
    return screens[activeTab] || screens.dashboard;
  };

  return (
    <View className="flex-1" style={{ backgroundColor: '#fafafa' }}>
      {/* Main Content */}
      <View className="flex-1">
        {renderScreen()}
      </View>

      {/* Bottom Navigation */}
      <View className="bg-white border-gray-200" style={{ paddingBottom: 34 }}>
        <View className="flex-row justify-around items-center py-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                className="items-center py-2 px-3 min-w-[60px]"
                activeOpacity={0.7}
              >
                <View className={`p-2 rounded-xl ${isActive ? 'bg-green-50' : ''}`}>
                  <Ionicons
                    name={isActive ? tab.activeIcon as any : tab.icon as any}
                    size={24}
                    color={isActive ? '#16c213' : '#9ca3af'}
                  />
                </View>
                <Text
                  className={`text-xs font-medium mt-1 ${isActive ? 'text-green-600' : 'text-gray-500'
                    }`}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};
