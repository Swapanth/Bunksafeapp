import { useCallback, useEffect, useState } from 'react';
import { InteractionManager } from 'react-native';

// Types (these should ideally be imported from a shared types file)
export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  level: string;
  joinDate: string;
  studyStreak: number;
  stats: {
    level: string;
    progress: string;
  };
}

export interface ToggleSetting {
  id: string;
  icon: string;
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

export interface MenuItem {
  id: string;
  icon: string;
  label: string;
  action: () => void;
}

export interface SettingsSection {
  id: string;
  title: string;
  items: MenuItem[];
}

export interface AppInfo {
  version: string;
  tagline: string;
}

// Profile data service interface
export interface ProfileDataService {
  getUserProfile: () => Promise<UserProfile>;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
  getToggleSettings: () => Promise<Omit<ToggleSetting, 'onChange'>[]>;
  updateToggleSetting: (id: string, value: boolean) => Promise<void>;
  getSettingSections: () => Promise<SettingsSection[]>;
  getAppInfo: () => Promise<AppInfo>;
  changePassword?: (currentPassword: string, newPassword: string) => Promise<void>;
}

// Hook for managing profile data
export const useProfileData = (service?: ProfileDataService) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [toggleSettings, setToggleSettings] = useState<ToggleSetting[]>([]);
  const [settingSections, setSettingSections] = useState<SettingsSection[]>([]);
  const [appInfo, setAppInfo] = useState<AppInfo>({ version: 'v1.0.0', tagline: 'Built with ❤️' });
  const [loading, setLoading] = useState(false); // Start false for instant render
  const [error, setError] = useState<string | null>(null);

  // Update toggle setting
  const updateToggleSetting = useCallback(async (id: string, value: boolean) => {
    try {
      const profileService = service || createDefaultProfileService();
      await profileService.updateToggleSetting(id, value);
      setToggleSettings(prev => 
        prev.map(setting => 
          setting.id === id ? { ...setting, value } : setting
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update setting');
    }
  }, [service]);

  // Create toggle settings with proper onChange handlers
  const createToggleSettings = useCallback((settings: Omit<ToggleSetting, 'onChange'>[]) => {
    return settings.map(setting => ({
      ...setting,
      onChange: (value: boolean) => {
        // Optimistically update the UI first
        setToggleSettings(prev => 
          prev.map(s => s.id === setting.id ? { ...s, value } : s)
        );
        
        // Then update the backend
        updateToggleSetting(setting.id, value).catch((err) => {
          // Revert on error
          setToggleSettings(prev => 
            prev.map(s => s.id === setting.id ? { ...s, value: !value } : s)
          );
          console.error('Failed to update setting:', err);
        });
      },
    }));
  }, [updateToggleSetting]);

  // Load all profile data
  const loadProfileData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Use default service if none provided
      const profileService = service || createDefaultProfileService();
      
      const [userProfile, toggles, sections, info] = await Promise.all([
        profileService.getUserProfile(),
        profileService.getToggleSettings(),
        profileService.getSettingSections(),
        profileService.getAppInfo(),
      ]);

      setUser(userProfile);
      // Create toggle settings with proper onChange handlers
      setToggleSettings(createToggleSettings(toggles));
      setSettingSections(sections);
      setAppInfo(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  }, [service, createToggleSettings]);

  // Update user profile
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user) return;

    try {
      const profileService = service || createDefaultProfileService();
      await profileService.updateUserProfile(updates);
      setUser(prev => prev ? { ...prev, ...updates } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    }
  }, [service, user]);

  // Load data on mount - deferred for instant UI
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setLoading(true);
      loadProfileData();
    });

    return () => task.cancel();
  }, [loadProfileData]);

  return {
    user,
    toggleSettings,
    settingSections,
    appInfo,
    loading,
    error,
    loadProfileData,
    updateProfile,
    updateToggleSetting,
    createToggleSettings,
  };
};

// Default profile data service implementation
export const createDefaultProfileService = (): ProfileDataService => {
  return {
    getUserProfile: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        name: 'Default User',
        email: 'user@example.com',
        avatar: '👤',
        level: 'Free',
        joinDate: 'Recently',
        studyStreak: 0,
        stats: {
          level: 'Beginner',
          progress: '0%',
        },
      };
    },

    updateUserProfile: async (updates) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('Profile updated:', updates);
    },

    getToggleSettings: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return [
        {
          id: 'darkMode',
          icon: 'moon-outline',
          label: 'Dark Mode',
          description: 'Switch to dark theme',
          value: false,
        },
        {
          id: 'notifications',
          icon: 'notifications-outline',
          label: 'Push Notifications',
          description: 'Receive app notifications',
          value: true,
        },
      ];
    },

    updateToggleSetting: async (id, value) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      console.log(`Setting ${id} updated to:`, value);
    },

    getSettingSections: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return [
        {
          id: 'account',
          title: 'Account Settings',
          items: [
            {
              id: 'editProfile',
              icon: 'person-outline',
              label: 'Edit Profile',
              action: () => console.log('Edit profile'),
            },
            {
              id: 'language',
              icon: 'language-outline',
              label: 'Language',
              action: () => console.log('Language settings'),
            },
          ],
        },
        {
          id: 'support',
          title: 'Support',
          items: [
            {
              id: 'help',
              icon: 'help-circle-outline',
              label: 'Help Center',
              action: () => console.log('Help center'),
            },
          ],
        },
      ];
    },

    getAppInfo: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 200));
      return {
        version: 'v1.0.0',
        tagline: 'Built with ❤️ for students',
      };
    },

    changePassword: async (currentPassword: string, newPassword: string) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Password changed successfully');
    },
  };
};