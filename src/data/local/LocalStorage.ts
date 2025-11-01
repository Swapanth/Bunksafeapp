// Persistent storage using AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';

class PersistentStorage {
  static async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Error setting item in AsyncStorage:', error);
      throw error;
    }
  }

  static async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Error getting item from AsyncStorage:', error);
      return null;
    }
  }

  static async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing item from AsyncStorage:', error);
      throw error;
    }
  }
}

const STORAGE_KEYS = {
  USER: '@bunksafe_user',
  AUTH_TOKEN: '@bunksafe_auth_token',
} as const;

export class LocalStorage {
  static async storeUser(user: any): Promise<void> {
    try {
      await PersistentStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (error) {
      console.error('Error storing user:', error);
    }
  }

  static async getUser(): Promise<any | null> {
    try {
      const userStr = await PersistentStorage.getItem(STORAGE_KEYS.USER);
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  static async removeUser(): Promise<void> {
    try {
      await PersistentStorage.removeItem(STORAGE_KEYS.USER);
      await PersistentStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Error removing user:', error);
    }
  }

  static async storeAuthToken(token: string): Promise<void> {
    try {
      await PersistentStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    } catch (error) {
      console.error('Error storing auth token:', error);
    }
  }

  static async getAuthToken(): Promise<string | null> {
    try {
      return await PersistentStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }
}
