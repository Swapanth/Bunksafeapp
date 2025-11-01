import { useCallback, useEffect, useState } from 'react';
import { AppInfo, ProfileDataService, SettingsSection, ToggleSetting, UserProfile } from './useProfileData';

// Optimized hook with progressive loading and caching
export const useOptimizedProfileData = (service?: ProfileDataService) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [toggleSettings, setToggleSettings] = useState<ToggleSetting[]>([]);
  const [settingSections, setSettingSections] = useState<SettingsSection[]>([]);
  const [appInfo, setAppInfo] = useState<AppInfo>({ version: 'v1.0.0', tagline: 'Built with ❤️' });
  
  // Separate loading states for progressive loading
  const [userLoading, setUserLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cache for reducing API calls
  const [cache, setCache] = useState<{
    user?: UserProfile;
    settings?: ToggleSetting[];
    sections?: SettingsSection[];
    appInfo?: AppInfo;
    timestamp?: number;
  }>({});

  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Check if cache is valid
  const isCacheValid = useCallback(() => {
    return cache.timestamp && (Date.now() - cache.timestamp) < CACHE_DURATION;
  }, [cache.timestamp]);

  // Load user profile first (most important)
  const loadUserProfile = useCallback(async () => {
    if (cache.user && isCacheValid()) {
      setUser(cache.user);
      return;
    }

    setUserLoading(true);
    setError(null);

    try {
      const profileService = service || createOptimizedProfileService();
      const userProfile = await profileService.getUserProfile();
      
      setUser(userProfile);
      setCache(prev => ({ ...prev, user: userProfile, timestamp: Date.now() }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setUserLoading(false);
    }
  }, [service, cache.user, isCacheValid]);

  // Load settings in background
  const loadSettings = useCallback(async () => {
    if (cache.settings && cache.sections && cache.appInfo && isCacheValid()) {
      setToggleSettings(cache.settings);
      setSettingSections(cache.sections);
      setAppInfo(cache.appInfo);
      return;
    }

    setSettingsLoading(true);

    try {
      const profileService = service || createOptimizedProfileService();
      
      // Load settings in parallel but don't block user profile
      const [toggles, sections, info] = await Promise.all([
        profileService.getToggleSettings(),
        profileService.getSettingSections(),
        profileService.getAppInfo(),
      ]);

      const togglesWithHandlers = createToggleSettings(toggles);
      
      setToggleSettings(togglesWithHandlers);
      setSettingSections(sections);
      setAppInfo(info);
      
      setCache(prev => ({
        ...prev,
        settings: togglesWithHandlers,
        sections,
        appInfo: info,
        timestamp: Date.now()
      }));
    } catch (err) {
      console.warn('Failed to load settings:', err);
      // Don't set error for settings - they're secondary
    } finally {
      setSettingsLoading(false);
    }
  }, [service, cache.settings, cache.sections, cache.appInfo, isCacheValid]);

  // Progressive loading: user first, then settings
  const loadProfileData = useCallback(async () => {
    await loadUserProfile();
    // Load settings after user profile is loaded
    setTimeout(() => loadSettings(), 100);
  }, [loadUserProfile, loadSettings]);

  // Update user profile with optimistic updates
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user) return;

    // Optimistic update
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);

    try {
      const profileService = service || createOptimizedProfileService();
      await profileService.updateUserProfile(updates);
      
      // Update cache
      setCache(prev => ({ ...prev, user: updatedUser, timestamp: Date.now() }));
    } catch (err) {
      // Revert on error
      setUser(user);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    }
  }, [service, user]);

  // Update toggle setting with optimistic updates
  const updateToggleSetting = useCallback(async (id: string, value: boolean) => {
    // Optimistic update
    setToggleSettings(prev => 
      prev.map(setting => 
        setting.id === id ? { ...setting, value } : setting
      )
    );

    try {
      const profileService = service || createOptimizedProfileService();
      await profileService.updateToggleSetting(id, value);
    } catch (err) {
      // Revert on error
      setToggleSettings(prev => 
        prev.map(setting => 
          setting.id === id ? { ...setting, value: !value } : setting
        )
      );
      setError(err instanceof Error ? err.message : 'Failed to update setting');
    }
  }, [service]);

  // Create toggle settings with proper onChange handlers
  const createToggleSettings = useCallback((settings: Omit<ToggleSetting, 'onChange'>[]) => {
    return settings.map(setting => ({
      ...setting,
      onChange: (value: boolean) => updateToggleSetting(setting.id, value),
    }));
  }, [updateToggleSetting]);

  // Load data on mount
  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  return {
    user,
    toggleSettings,
    settingSections,
    appInfo,
    loading: userLoading, // Only show loading for critical user data
    settingsLoading,
    error,
    loadProfileData,
    updateProfile,
    updateToggleSetting,
  };
};

// Optimized profile service with reduced delays
const createOptimizedProfileService = (): ProfileDataService => {
  return {
    getUserProfile: async () => {
      // Reduced delay for better UX
      await new Promise(resolve => setTimeout(resolve, 200));
      return {
        name: 'John Doe',
        email: 'john@example.com',
        avatar: '👤',
        level: 'Premium',
        joinDate: 'January 2024',
        studyStreak: 15,
        stats: {
          level: 'Advanced',
          progress: '75%',
        },
      };
    },

    updateUserProfile: async (updates) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log('Profile updated:', updates);
    },

    getToggleSettings: async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
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
        {
          id: 'autoSync',
          icon: 'sync-outline',
          label: 'Auto Sync',
          description: 'Automatically sync data',
          value: true,
        },
      ];
    },

    updateToggleSetting: async (id, value) => {
      await new Promise(resolve => setTimeout(resolve, 50));
      console.log(`Setting ${id} updated to:`, value);
    },

    getSettingSections: async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
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
              id: 'changePassword',
              icon: 'lock-closed-outline',
              label: 'Change Password',
              action: () => console.log('Change password'),
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
          id: 'preferences',
          title: 'Preferences',
          items: [
            {
              id: 'privacy',
              icon: 'shield-outline',
              label: 'Privacy Settings',
              action: () => console.log('Privacy settings'),
            },
            {
              id: 'backup',
              icon: 'cloud-upload-outline',
              label: 'Backup & Sync',
              action: () => console.log('Backup settings'),
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
            {
              id: 'feedback',
              icon: 'chatbubble-outline',
              label: 'Send Feedback',
              action: () => console.log('Send feedback'),
            },
          ],
        },
      ];
    },

    getAppInfo: async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
      return {
        version: 'v1.2.0',
        tagline: 'Built with ❤️ for students worldwide',
      };
    },

    changePassword: async (currentPassword: string, newPassword: string) => {
      await new Promise(resolve => setTimeout(resolve, 300));
      console.log('Password changed successfully');
    },
  };
};