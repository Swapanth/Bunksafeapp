import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration - prioritize app.json extra for development builds
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || Constants.expoConfig?.extra?.firebaseApiKey,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || Constants.expoConfig?.extra?.firebaseAuthDomain,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || Constants.expoConfig?.extra?.firebaseProjectId,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || Constants.expoConfig?.extra?.firebaseStorageBucket,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || Constants.expoConfig?.extra?.firebaseMessagingSenderId,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || Constants.expoConfig?.extra?.firebaseAppId,
};

// Debug: Log which source is being used
console.log('🔧 Firebase Config Source:', {
  fromEnv: !!process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  fromExtra: !!Constants.expoConfig?.extra?.firebaseApiKey,
  projectId: firebaseConfig.projectId,
  hasAllKeys: !!(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId)
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence for React Native
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
export const db = getFirestore(app);

// Explicit initialization function to ensure module is not tree-shaken
export const initializeFirebase = () => {
  console.log('Firebase initialized');
  return { app, auth, db };
};

// Auto-initialize
initializeFirebase();

export default app;
