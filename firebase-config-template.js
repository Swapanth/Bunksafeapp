// Firebase Configuration Template for BunkSafe
// Copy your Firebase config from Firebase Console and replace the values below

const firebaseConfig = {
  apiKey: "AIzaSyExample-Replace-With-Your-Actual-API-Key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com", 
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789012345678"
};

// Instructions:
// 1. Go to Firebase Console (https://console.firebase.google.com)
// 2. Create a new project named "BunkSafe" or similar
// 3. Enable Authentication (Email/Password provider)
// 4. Enable Firestore Database (start in test mode)
// 5. Go to Project Settings > Your apps > Add web app
// 6. Copy the config object and replace the values above
// 7. Run: npm run setup-firebase
// 8. Follow the prompts to configure your app

export default firebaseConfig;