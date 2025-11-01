import { doc, getDoc, setDoc, Timestamp, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebase";

export interface UserProfile {
  userId: string;
  displayName: string;
  name: string;
  email: string;
  avatar: string;
  university?: string;
  school?: string;
  year?: string;
  classroomId?: string;
  subjects?: string[];
  status: 'online' | 'offline' | 'studying' | 'away';
  lastSeen: Date;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class UserProfileService {
  private readonly USER_PROFILES_COLLECTION = "userProfiles";

  async createOrUpdateProfile(userId: string, profileData: Partial<UserProfile>): Promise<void> {
    try {
      console.log("🔥 Creating/updating user profile for:", userId);
      
      const now = new Date();
      const profileRef = doc(db, this.USER_PROFILES_COLLECTION, userId);
      
      // Check if profile exists
      const existingProfile = await getDoc(profileRef);
      
      if (existingProfile.exists()) {
        // Update existing profile
        const updateData = {
          ...profileData,
          updatedAt: Timestamp.fromDate(now),
        };
        
        await updateDoc(profileRef, updateData);
        console.log("✅ User profile updated successfully");
      } else {
        // Create new profile
        const newProfile: UserProfile = {
          userId,
          displayName: profileData.displayName || profileData.name || 'User',
          name: profileData.name || 'User',
          email: profileData.email || '',
          avatar: profileData.avatar || '👤',
          university: profileData.university,
          school: profileData.school,
          year: profileData.year,
          classroomId: profileData.classroomId,
          subjects: profileData.subjects || [],
          status: profileData.status || 'offline',
          lastSeen: profileData.lastSeen || now,
          isPublic: profileData.isPublic !== false, // Default to true
          createdAt: now,
          updatedAt: now,
        };
        
        await setDoc(profileRef, {
          ...newProfile,
          lastSeen: Timestamp.fromDate(newProfile.lastSeen),
          createdAt: Timestamp.fromDate(newProfile.createdAt),
          updatedAt: Timestamp.fromDate(newProfile.updatedAt),
        });
        
        console.log("✅ User profile created successfully");
      }
    } catch (error) {
      console.error("❌ Error creating/updating user profile:", error);
      throw error;
    }
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const profileRef = doc(db, this.USER_PROFILES_COLLECTION, userId);
      const profileSnap = await getDoc(profileRef);
      
      if (!profileSnap.exists()) {
        return null;
      }
      
      const data = profileSnap.data();
      return {
        userId: data.userId,
        displayName: data.displayName,
        name: data.name,
        email: data.email,
        avatar: data.avatar,
        university: data.university,
        school: data.school,
        year: data.year,
        classroomId: data.classroomId,
        subjects: data.subjects || [],
        status: data.status,
        lastSeen: data.lastSeen?.toDate() || new Date(),
        isPublic: data.isPublic !== false,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    } catch (error) {
      console.error("❌ Error getting user profile:", error);
      throw error;
    }
  }

  async updateStatus(userId: string, status: 'online' | 'offline' | 'studying' | 'away'): Promise<void> {
    try {
      const profileRef = doc(db, this.USER_PROFILES_COLLECTION, userId);
      await updateDoc(profileRef, {
        status,
        lastSeen: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
      });
    } catch (error) {
      console.error("❌ Error updating user status:", error);
      throw error;
    }
  }

  async updateClassroom(userId: string, classroomId: string): Promise<void> {
    try {
      const profileRef = doc(db, this.USER_PROFILES_COLLECTION, userId);
      await updateDoc(profileRef, {
        classroomId,
        updatedAt: Timestamp.fromDate(new Date()),
      });
    } catch (error) {
      console.error("❌ Error updating user classroom:", error);
      throw error;
    }
  }
}