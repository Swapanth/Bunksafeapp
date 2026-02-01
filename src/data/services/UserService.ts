import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    setDoc,
    updateDoc,
    where,
} from "firebase/firestore";
import { db } from "../../config/firebase";

export interface UserProfile {
  name: string;
  nickname: string;
  mobileNumber: string;
  collegeName: string;
  email: string;
  university?: string;
  department?: string;
  yearOfStudy?: string;
  avatar?: string;
  attendanceTarget?: number;
  preferences?: {
    whatsappNotifications: boolean;
    emailNotifications: boolean;
    attendanceReminders: boolean;
  };
  profileVisibility?: "public" | "friends" | "private";
  classroomId?: string;
  semesterStartDate?: string;
  semesterEndDate?: string;
  createdAt: string;
  onboardingCompleted: boolean;
}

export class FirebaseUserService {
  // Create or update user profile
  async createUserProfile(
    userId: string,
    profileData: Partial<UserProfile>
  ): Promise<void> {
    try {
      console.log("🔥 FirebaseUserService: Creating user profile for:", userId);
      console.log("Profile data:", profileData);

      const userRef = doc(db, "users", userId);
      console.log("Firestore document reference created");

      const dataToStore = {
        ...profileData,
        createdAt: profileData.createdAt || new Date().toISOString(),
        onboardingCompleted: profileData.onboardingCompleted || false,
      };

      console.log("Final data to store:", dataToStore);
      console.log("Writing to Firestore...");

      await setDoc(userRef, dataToStore, { merge: true });

      // Also create entry in registry for existence checks
      if (profileData.email || profileData.mobileNumber) {
        const registryRef = doc(db, "userRegistry", userId);
        const registryData: any = { userId };

        if (profileData.email) {
          registryData.email = profileData.email.trim().toLowerCase();
        }
        if (profileData.mobileNumber) {
          registryData.mobileNumber = profileData.mobileNumber.replace(
            /\D/g,
            ""
          );
        }

        await setDoc(registryRef, registryData, { merge: true });
        console.log("✅ User registry entry created");
      }

      console.log("✅ User profile successfully written to Firestore!");
      console.log("Document path: users/" + userId);
    } catch (error) {
      console.error("❌ Error creating user profile in Firestore:", error);
      console.error("Error details:", error);
      throw error;
    }
  }

  // Get user profile
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        return userSnap.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error("Error getting user profile:", error);
      throw error;
    }
  }

  // Get user by ID (alias for getUserProfile for consistency)
  async getUserById(userId: string): Promise<UserProfile | null> {
    return this.getUserProfile(userId);
  }

  // Update user profile
  async updateUserProfile(
    userId: string,
    updates: Partial<UserProfile>
  ): Promise<void> {
    try {
      console.log("Updating user profile for:", userId);
      console.log("Updates to apply:", updates);

      // Filter out undefined values to prevent Firestore errors
      const cleanUpdates: any = {};
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          cleanUpdates[key] = value;
        }
      });

      console.log("Cleaned updates (no undefined values):", cleanUpdates);

      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, cleanUpdates);

      // Update registry if email or mobile number changed
      if (cleanUpdates.email || cleanUpdates.mobileNumber) {
        const registryRef = doc(db, "userRegistry", userId);
        const registryUpdates: any = {};

        if (cleanUpdates.email) {
          registryUpdates.email = cleanUpdates.email.trim().toLowerCase();
        }
        if (cleanUpdates.mobileNumber) {
          registryUpdates.mobileNumber = cleanUpdates.mobileNumber.replace(
            /\D/g,
            ""
          );
        }

        await updateDoc(registryRef, registryUpdates);
        console.log("✅ User registry updated");
      }

      console.log("✅ User profile updated successfully");
    } catch (error) {
      console.error("❌ Error updating user profile:", error);
      throw error;
    }
  }

  // Complete onboarding
  async completeOnboarding(userId: string, onboardingData: any): Promise<void> {
    try {
      const profileData: Partial<UserProfile> = {
        nickname: onboardingData.nickname,
        mobileNumber: onboardingData.mobileNumber,
        email: onboardingData.email,
        collegeName: onboardingData.university,
        university: onboardingData.university,
        department: onboardingData.department,
        yearOfStudy: onboardingData.yearOfStudy,
        attendanceTarget: onboardingData.attendanceTarget,
        preferences: {
          whatsappNotifications: onboardingData.whatsappNotifications || false,
          emailNotifications: onboardingData.emailNotifications || false,
          attendanceReminders: onboardingData.attendanceReminders || false,
        },
        profileVisibility: onboardingData.profileVisibility || "public",
        onboardingCompleted: true,
      };

      // Only add classroomId if it's defined and not null
      if (onboardingData.classroomId && onboardingData.classroomId !== null) {
        profileData.classroomId = onboardingData.classroomId;
      }

      // Add semester dates if provided
      if (onboardingData.semesterStartDate) {
        profileData.semesterStartDate = onboardingData.semesterStartDate;
      }
      if (onboardingData.semesterEndDate) {
        profileData.semesterEndDate = onboardingData.semesterEndDate;
      }

      console.log("Final profile data for Firestore:", profileData);
      await this.updateUserProfile(userId, profileData);
    } catch (error) {
      console.error("Error completing onboarding:", error);
      throw error;
    }
  }

  // Check if user exists by email
  async checkUserExists(email: string): Promise<boolean> {
    try {
      console.log("🔍 Checking user existence for email:", email);

      // Use userRegistry collection which allows public reads
      const userRegistryRef = collection(db, "userRegistry");
      const q = query(
        userRegistryRef,
        where("email", "==", email.toLowerCase().trim())
      );
      const querySnapshot = await getDocs(q);

      const exists = !querySnapshot.empty;
      console.log("👤 User exists in Firestore:", exists);
      return exists;
    } catch (error) {
      console.error("❌ Error checking user existence:", error);

      // If it's a permissions error, provide more context
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "permission-denied"
      ) {
        console.error(
          "🚫 Permission denied - make sure Firestore rules allow querying users by email"
        );
        console.error(
          "💡 Check that the user is authenticated and rules permit email queries"
        );
      }

      return false;
    }
  }

  // Check if email is already registered
  async checkEmailExists(
    email: string
  ): Promise<{ exists: boolean; error?: string }> {
    try {
      console.log("🔍 Checking if email exists:", email);

      if (!email || typeof email !== "string") {
        return { exists: false, error: "Email is required" };
      }

      const trimmedEmail = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        return { exists: false, error: "Please enter a valid email address" };
      }

      // Check in the public registry collection
      const registryRef = collection(db, "userRegistry");
      const q = query(registryRef, where("email", "==", trimmedEmail));
      const querySnapshot = await getDocs(q);

      console.log(
        `📊 Found ${querySnapshot.size} users with email: ${trimmedEmail}`
      );

      if (!querySnapshot.empty) {
        console.log("❌ Email already exists");
        return {
          exists: true,
          error:
            "This email is already registered. Please use a different email or try logging in.",
        };
      }

      console.log("✅ Email is available");
      return { exists: false };
    } catch (error) {
      console.error("❌ Error checking email:", error);
      return {
        exists: false,
        error: "Unable to verify email. Please try again.",
      };
    }
  }

  // Check if mobile number is already registered
  async checkMobileExists(
    mobileNumber: string
  ): Promise<{ exists: boolean; error?: string }> {
    try {
      console.log("🔍 Checking if mobile number exists:", mobileNumber);

      if (!mobileNumber || typeof mobileNumber !== "string") {
        return { exists: false, error: "Mobile number is required" };
      }

      const cleanedNumber = mobileNumber.replace(/\D/g, "");
      if (!/^\d{10}$/.test(cleanedNumber)) {
        return {
          exists: false,
          error: "Please enter a valid 10-digit mobile number",
        };
      }

      // Check in the public registry collection
      const registryRef = collection(db, "userRegistry");
      const q = query(registryRef, where("mobileNumber", "==", cleanedNumber));
      const querySnapshot = await getDocs(q);

      console.log(
        `📊 Found ${querySnapshot.size} users with mobile: ${cleanedNumber}`
      );

      if (!querySnapshot.empty) {
        console.log("❌ Mobile number already exists");
        return {
          exists: true,
          error:
            "This mobile number is already registered. Please use a different number or try logging in.",
        };
      }

      console.log("✅ Mobile number is available");
      return { exists: false };
    } catch (error) {
      console.error("❌ Error checking mobile number:", error);
      return {
        exists: false,
        error: "Unable to verify mobile number. Please try again.",
      };
    }
  }

  // Search users by university
  async getUsersByUniversity(university: string): Promise<UserProfile[]> {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("university", "==", university));
      const querySnapshot = await getDocs(q);

      const users: UserProfile[] = [];
      querySnapshot.forEach((doc) => {
        users.push(doc.data() as UserProfile);
      });

      return users;
    } catch (error) {
      console.error("Error getting users by university:", error);
      return [];
    }
  }
}
