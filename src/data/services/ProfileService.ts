import { User } from "../../domain/model/User";
import {
  AppInfo,
  ProfileDataService,
  SettingsSection,
  ToggleSetting,
  UserProfile,
} from "../../presentation/ui/screens/profile/useProfileData";

export const createRealProfileService = (user: User): ProfileDataService => {
  return {
    getUserProfile: async (): Promise<UserProfile> => {
      // Convert your User model to UserProfile format
      return {
        name: user.name || user.nickname || "User",
        email: user.email,
        avatar: "👨‍🎓", // Default student avatar
        level: "Student", // Default level
        joinDate: "Recently", // You can add createdAt to User model later
        studyStreak: 5, // Default streak - you can fetch this from backend
        stats: {
          level: "Intermediate",
          progress: "75%",
        },
      };
    },

    updateUserProfile: async (updates: Partial<UserProfile>) => {
      // Here you would typically make an API call to update the user profile
      // For now, we'll just simulate the API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // You can implement actual API calls here
      console.log("Updating user profile:", updates);

      // Example API call structure:
      // const response = await fetch(`/api/users/${user.id}`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(updates)
      // });
    },

    getToggleSettings: async (): Promise<Omit<ToggleSetting, "onChange">[]> => {
      // You can fetch user preferences from your backend or local storage
      await new Promise((resolve) => setTimeout(resolve, 300));

      return [
        {
          id: "darkMode",
          icon: "moon-outline",
          label: "Dark Mode",
          description: "Switch to dark theme",
          value: false, // Default to false, you can store this in AsyncStorage
        },
        {
          id: "notifications",
          icon: "notifications-outline",
          label: "Push Notifications",
          description: "Receive app notifications",
          value: true, // Default to true
        },
        {
          id: "studyReminders",
          icon: "alarm-outline",
          label: "Study Reminders",
          description: "Get reminded to study",
          value: true,
        },
        {
          id: "soundEffects",
          icon: "volume-high-outline",
          label: "Sound Effects",
          description: "Play sounds for actions",
          value: true,
        },
      ];
    },

    updateToggleSetting: async (id: string, value: boolean) => {
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Update user preferences
      console.log(`Updating ${id} to ${value} for user ${user.id}`);

      // Example API call:
      // await fetch(`/api/users/${user.id}/preferences`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ [id]: value })
      // });
    },

    getSettingSections: async (): Promise<SettingsSection[]> => {
      await new Promise((resolve) => setTimeout(resolve, 200));

      return [
        {
          id: "account",
          title: "👤 Account Settings",
          items: [
            {
              id: "editProfile",
              icon: "person-outline",
              label: "Edit Profile",
              action: () => {
                console.log("Edit profile for user:", user.id);
                // The modal will be opened by the ProfileScreen component
                // when this action is triggered
              },
            },
            {
              id: "changePassword",
              icon: "lock-closed-outline",
              label: "Change Password",
              action: () => console.log("Change password"),
            },
          ],
        },

        {
          id: "support",
          title: "🛠️ Support & Help",
          items: [
            {
              id: "help",
              icon: "help-circle-outline",
              label: "Help Center",
              action: () => console.log("Help center"),
            },
            {
              id: "feedback",
              icon: "chatbubble-outline",
              label: "Send Feedback",
              action: () => console.log("Send feedback"),
            },
            {
              id: "about",
              icon: "information-circle-outline",
              label: "About BunkSafe",
              action: () => console.log("About app"),
            },
          ],
        },
      ];
    },

    getAppInfo: async (): Promise<AppInfo> => {
      await new Promise((resolve) => setTimeout(resolve, 100));

      return {
        version: "v1.2.0",
        tagline: "Built with ❤️ for students",
      };
    },

    changePassword: async (currentPassword: string, newPassword: string) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Here you would typically:
      // 1. Verify the current password
      // 2. Update the password in your backend
      console.log(`Changing password for user ${user.id}`);

      // Example API call structure:
      // const response = await fetch(`/api/users/${user.id}/change-password`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ currentPassword, newPassword })
      // });
      //
      // if (!response.ok) {
      //   throw new Error('Invalid current password or password change failed');
      // }
    },
  };
};
