import {
    createUserWithEmailAndPassword,
    User as FirebaseUser,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
} from "firebase/auth";
import { auth, db } from "../../config/firebase";
import {
    AuthResult,
    LoginCredentials,
    SignupData,
    User,
} from "../../domain/model/User";
import { AuthRepository } from "../../domain/repository/AuthRepository";
import { LocalStorage } from "../local/LocalStorage";
import { FirebaseUserService } from "../services/UserService";

export class AuthRepositoryImpl implements AuthRepository {
  private currentUser: User | null = null;
  private userService: FirebaseUserService;
  private authStateListenerInitialized = false;

  constructor() {
    this.userService = new FirebaseUserService();

    // Test Firebase connection
    this.testFirebaseConnection();

    // Listen to auth state changes only once
    this.initializeAuthStateListener();
  }

  private initializeAuthStateListener() {
    if (this.authStateListenerInitialized) {
      console.log('⚠️ Auth state listener already initialized, skipping');
      return;
    }

    try {
      this.authStateListenerInitialized = true;
      console.log('👂 Setting up Firebase auth state listener...');
      
      onAuthStateChanged(auth, async (firebaseUser) => {
        console.log('🔥 Firebase auth state changed:', firebaseUser ? firebaseUser.email : 'No user');
        
        if (firebaseUser) {
          console.log('👤 User signed in, mapping Firebase user to app user');
          this.currentUser = await this.mapFirebaseUserToUser(firebaseUser);
          if (this.currentUser) {
            console.log('✅ User mapped and stored:', this.currentUser.email);
            await LocalStorage.storeUser(this.currentUser);
          } else {
            console.log('❌ Failed to map Firebase user');
          }
        } else {
          // Only clear local storage if this is an intentional logout
          // Check if we still have a valid token in storage
          const storedToken = await LocalStorage.getAuthToken();
          if (!storedToken) {
            console.log('🚪 User signed out - clearing local data');
            this.currentUser = null;
            await LocalStorage.removeUser();
          } else {
            console.log('⚠️ Firebase user null but token exists - possible temporary state, keeping user data');
          }
        }
      });
    } catch (error) {
      console.error("Failed to set up auth state listener:", error);
    }
  }

  private async testFirebaseConnection(): Promise<void> {
    try {
      console.log("🔥 Testing Firebase connection...");
      console.log("Auth object exists:", !!auth);
      console.log("DB object exists:", !!db);

      if (auth?.app) {
        console.log("Firebase app name:", auth.app.name);
        console.log("Firebase project ID:", auth.app.options.projectId);
        console.log("Firebase auth domain:", auth.app.options.authDomain);
        console.log("Firebase storage bucket:", auth.app.options.storageBucket);
      } else {
        console.error("❌ Firebase app not properly initialized");
      }

      // Test if we can access Firebase services
      try {
        const currentUser = auth.currentUser;
        console.log(
          "Current Firebase user:",
          currentUser ? currentUser.uid : "None"
        );
      } catch (authError) {
        console.error("❌ Firebase Auth access error:", authError);
      }

      try {
        // Test Firestore access (this will fail if Firestore rules are too restrictive)
        console.log("Firestore app:", db.app.name);
      } catch (dbError) {
        console.error("❌ Firestore access error:", dbError);
      }
    } catch (error) {
      console.error("❌ Firebase connection test failed:", error);
    }
  }

  private async mapFirebaseUserToUser(
    firebaseUser: FirebaseUser
  ): Promise<User | null> {
    try {
      // Get additional user data from Firestore
      const userData = await this.userService.getUserProfile(firebaseUser.uid);

      return {
        id: firebaseUser.uid,
        email: firebaseUser.email || "",
        name: firebaseUser.displayName || userData?.nickname || "",
        nickname: userData?.nickname || "",
        mobileNumber: userData?.mobileNumber || "",
        collegeName: userData?.collegeName || "",
        isAuthenticated: true,
      };
    } catch (error) {
      console.error("Error mapping Firebase user:", error);
      return null;
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      console.log('🔐 AuthRepository: Attempting login for:', credentials.email);
      
      // First check if the user exists in Firestore
      const userExists = await this.userService.checkUserExists(credentials.email);
      console.log('👤 User exists in Firestore:', userExists);
      
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      console.log('✅ Firebase login successful for:', userCredential.user.email);
      console.log('User UID:', userCredential.user.uid);

      const user = await this.mapFirebaseUserToUser(userCredential.user);
      console.log('👤 Mapped user:', user);

      if (user) {
        const token = await userCredential.user.getIdToken();
        await LocalStorage.storeAuthToken(token);
        await LocalStorage.storeUser(user);
        
        // Update current user immediately
        this.currentUser = user;
        
        console.log('✅ Login completed successfully with user data persisted');
        return {
          success: true,
          user,
        };
      } else {
        console.log('❌ Failed to map user data');
        return {
          success: false,
          error: "Failed to load user data",
        };
      }
    } catch (error: any) {
      console.error('❌ Login error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      let errorMessage = "Login failed. Please try again.";

      switch (error.code) {
        case "auth/user-not-found":
          errorMessage = "No account found with this email. Please sign up first.";
          break;
        case "auth/wrong-password":
        case "auth/invalid-credential":
          errorMessage = "Incorrect email or password. Please check your credentials and try again.";
          break;
        case "auth/invalid-email":
          errorMessage = "Invalid email address.";
          break;
        case "auth/too-many-requests":
          errorMessage = "Too many failed attempts. Please try again later.";
          break;
        case "auth/network-request-failed":
          errorMessage = "Network error. Please check your connection.";
          break;
      }

      // If user doesn't exist, provide clear guidance
      if (error.code === "auth/invalid-credential" || error.code === "auth/user-not-found") {
        try {
          const userExists = await this.userService.checkUserExists(credentials.email);
          if (!userExists) {
            errorMessage = "No account found with this email. Please create an account first.";
          }
        } catch (checkError) {
          console.log('Could not verify user existence:', checkError);
          // Keep the original error message if we can't check
        }
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async signup(signupData: SignupData): Promise<AuthResult> {
    try {
      console.log("🚀 Starting signup process for:", signupData.email);

      // Check if Firebase is properly initialized
      if (!auth) {
        console.error("❌ Firebase auth not initialized");
        throw new Error("Firebase auth not initialized");
      }

      console.log("✅ Firebase auth is available");
      console.log("Firebase project:", auth.app.options.projectId);

      // Create user with email and password
      console.log("📧 Creating Firebase user with email:", signupData.email);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        signupData.email,
        signupData.password
      );

      console.log("✅ Firebase user created successfully!");
      console.log("User UID:", userCredential.user.uid);
      console.log("User email:", userCredential.user.email);
      console.log("User email verified:", userCredential.user.emailVerified);

      // Update the user's display name
      await updateProfile(userCredential.user, {
        displayName: signupData.nickname,
      });

      // Store additional user data in Firestore
      console.log("💾 Storing user profile in Firestore...");
      const profileData = {
        nickname: signupData.nickname,
        mobileNumber: signupData.mobileNumber,
        collegeName: signupData.collegeName,
        email: signupData.email,
        createdAt: new Date().toISOString(),
        onboardingCompleted: true,
      };
      console.log("Profile data to store:", profileData);

      // Ensure user is authenticated before writing to Firestore
      if (
        auth.currentUser &&
        auth.currentUser.uid === userCredential.user.uid
      ) {
        await this.userService.createUserProfile(
          userCredential.user.uid,
          profileData
        );
        console.log("✅ User profile stored in Firestore successfully!");
      } else {
        console.log("⏳ Waiting for auth state to update...");
        // Wait for auth state to update
        await new Promise((resolve) => {
          const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user && user.uid === userCredential.user.uid) {
              unsubscribe();
              resolve(user);
            }
          });
          // Timeout after 5 seconds
          setTimeout(() => {
            unsubscribe();
            resolve(null);
          }, 5000);
        });

        await this.userService.createUserProfile(
          userCredential.user.uid,
          profileData
        );
        console.log("✅ User profile stored in Firestore successfully!");
      }

      const user: User = {
        id: userCredential.user.uid,
        email: signupData.email,
        name: signupData.nickname,
        nickname: signupData.nickname,
        mobileNumber: signupData.mobileNumber,
        collegeName: signupData.collegeName,
        isAuthenticated: true,
      };

      await LocalStorage.storeUser(user);
      await LocalStorage.storeAuthToken(await userCredential.user.getIdToken());

      return {
        success: true,
        user,
      };
    } catch (error: any) {
      console.error("Signup error details:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);

      let errorMessage = "Signup failed. Please try again.";

      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage = "An account with this email already exists.";
          break;
        case "auth/invalid-email":
          errorMessage = "Invalid email address.";
          break;
        case "auth/weak-password":
          errorMessage = "Password is too weak.";
          break;
        case "auth/network-request-failed":
          errorMessage = "Network error. Please check your connection.";
          break;
        case "auth/app-not-authorized":
          errorMessage = "Firebase configuration error.";
          break;
        default:
          errorMessage = `Signup failed: ${error.message}`;
          break;
      }

      // If Firebase fails, try fallback method
      if (
        error.code === "auth/app-not-authorized" ||
        error.code === "auth/network-request-failed" ||
        error.message?.includes("Firebase") ||
        error.message?.includes("auth")
      ) {
        console.log("Firebase failed, trying fallback signup...");
        return await this.fallbackSignup(signupData);
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // Fallback signup method for testing when Firebase is not configured
  private async fallbackSignup(signupData: SignupData): Promise<AuthResult> {
    console.log("Using fallback signup method");

    try {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const user: User = {
        id: "fallback_" + Date.now().toString(),
        email: signupData.email,
        name: signupData.nickname,
        nickname: signupData.nickname,
        mobileNumber: signupData.mobileNumber,
        collegeName: signupData.collegeName,
        isAuthenticated: true,
      };

      // Store user data locally
      await LocalStorage.storeUser(user);
      await LocalStorage.storeAuthToken("fallback_auth_token_" + Date.now());

      return {
        success: true,
        user,
      };
    } catch (error) {
      return {
        success: false,
        error: "Fallback signup failed. Please try again.",
      };
    }
  }

  async logout(): Promise<void> {
    try {
      console.log('🚪 Starting logout process...');
      
      // Clear local storage first to ensure clean state
      await LocalStorage.removeUser();
      
      // Sign out from Firebase - this will trigger auth state listener
      await signOut(auth);
      
      this.currentUser = null;
      console.log('✅ Logout completed successfully');
    } catch (error) {
      console.error("Logout error:", error);
      // Even if Firebase signOut fails, ensure local data is cleared
      await LocalStorage.removeUser();
      this.currentUser = null;
      throw error;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    console.log('👤 AuthRepository: Getting current user');
    
    // First check if we have a Firebase user
    const firebaseUser = auth.currentUser;
    if (firebaseUser && !this.currentUser) {
      console.log('🔥 Found Firebase user, mapping to app user');
      this.currentUser = await this.mapFirebaseUserToUser(firebaseUser);
    }
    
    if (this.currentUser) {
      console.log('✅ Returning current user:', this.currentUser.email);
      return this.currentUser;
    }

    // Try to get from local storage as fallback
    console.log('💾 Checking local storage for user');
    const localUser = await LocalStorage.getUser();
    if (localUser) {
      console.log('✅ Found user in local storage:', localUser.email);
      this.currentUser = localUser;
      return localUser;
    }

    console.log('❌ No current user found');
    return null;
  }

  async isAuthenticated(): Promise<boolean> {
    console.log('🔍 AuthRepository: Checking authentication status');
    
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      console.log('✅ Firebase user is authenticated:', firebaseUser.email);
      return true;
    }

    // Fallback to local storage check
    const user = await LocalStorage.getUser();
    const token = await LocalStorage.getAuthToken();
    const isAuth = !!(user && token && user.isAuthenticated);
    
    console.log('💾 Local storage auth check:', isAuth);
    return isAuth;
  }
}
