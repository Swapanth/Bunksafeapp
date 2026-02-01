import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { BackHandler, Text, TouchableOpacity, View } from 'react-native';
import { createRealProfileService } from '../../../data/services/ProfileService';
import { User } from '../../../domain/model/User';
import { ChatScreen } from '../screens/chat/ChatScreen';
import { ClassroomScreen } from '../screens/classroom/ClassroomScreen';
import { DashboardScreen } from '../screens/main/DashboardScreen';
import { FriendsScreen } from '../screens/main/FriendsScreen';
import { TasksScreen } from '../screens/main/TasksScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';

type TabScreen = 'dashboard' | 'tasks' | 'friends' | 'classroom';

interface MainAppProps {
  user: User;
  onLogout: () => void;
}

interface ChatContact {
  contactId: string;
  contactName: string;
  contactAvatar: string;
}

export const MainApp: React.FC<MainAppProps> = React.memo(({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<TabScreen>('dashboard');
  const [chatContact, setChatContact] = useState<ChatContact | null>(null);
  
  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // If in chat screen, go back to previous screen
      if (chatContact) {
        setChatContact(null);
        return true;
      }
      
      // If not on dashboard, go back to dashboard
      if (activeTab !== 'dashboard') {
        setActiveTab('dashboard');
        return true;
      }
      
      // If already on dashboard, allow default behavior (exit app)
      return false;
    });

    return () => backHandler.remove();
  }, [activeTab, chatContact]);
  
  // Memoize tabs to prevent recreation
  const tabs = useMemo(() => [
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
  ], []);

  // Memoize callbacks to prevent unnecessary re-renders
  const handleNavigateToChat = React.useCallback((contactId: string, contactName: string, contactAvatar: string) => {
    setChatContact({ contactId, contactName, contactAvatar });
  }, []);

  const handleBackFromChat = React.useCallback(() => {
    setChatContact(null);
  }, []);

  // Memoize profile service to prevent recreation
  const profileService = useMemo(() => createRealProfileService(user), [user.id]);

  const renderScreen = () => {
    // Show chat screen if a contact is selected
    if (chatContact) {
      return (
        <ChatScreen
          contactId={chatContact.contactId}
          contactName={chatContact.contactName}
          contactAvatar={chatContact.contactAvatar}
          contactStatus="online"
          currentUserId={user.id}
          currentUserName={user.name || user.nickname || 'User'}
          currentUserAvatar="👤"
          onBack={handleBackFromChat}
        />
      );
    }

    // Render only the active screen for better performance
    switch (activeTab) {
      case 'dashboard':
        return <DashboardScreen userId={user.id} />;
      case 'tasks':
        return <TasksScreen user={user} />;
      case 'friends':
        return <FriendsScreen user={user} onNavigateToChat={handleNavigateToChat} />;
      case 'classroom':
        return <ClassroomScreen userId={user.id} />;
      case 'profile':
        return <ProfileScreen service={profileService} onLogout={onLogout} />;
      default:
        return <DashboardScreen userId={user.id} />;
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: '#fafafa' }}>
      {/* Main Content */}
      <View className="flex-1">
        {renderScreen()}
      </View>

      {/* Bottom Navigation - Hide when in chat */}
      {!chatContact && (
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
      )}
    </View>
  );
});

MainApp.displayName = 'MainApp';
