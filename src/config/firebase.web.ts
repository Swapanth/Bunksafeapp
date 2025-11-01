import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { Config } from './AppConfig';

// Firebase configuration from environment variables
const firebaseConfig = {
    apiKey: Config.firebase.apiKey,
    authDomain: Config.firebase.authDomain,
    projectId: Config.firebase.projectId,
    storageBucket: Config.firebase.storageBucket,
    messagingSenderId: Config.firebase.messagingSenderId,
    appId: Config.firebase.appId,
  };
// Initialize Firebase app (only if not already initialized)
let app: FirebaseApp;
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  // Initialize Auth
const auth: Auth = getAuth(app);

  // Initialize Firestore
const db: Firestore = getFirestore(app);
  
export { auth, db };
export default app;
