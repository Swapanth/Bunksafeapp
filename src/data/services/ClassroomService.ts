import {
  arrayRemove,
  arrayUnion,
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
import { Classroom, ClassSchedule, Schedule } from "../../domain/model/Classroom";

export class FirebaseClassroomService {
  // Generate a unique 6-digit classroom code
  private generateClassroomCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Check if classroom code already exists
  private async isCodeUnique(code: string): Promise<boolean> {
    try {
      const classroomsRef = collection(db, "classrooms");
      const q = query(classroomsRef, where("code", "==", code));
      const querySnapshot = await getDocs(q);
      return querySnapshot.empty;
    } catch (error) {
      console.error("Error checking code uniqueness:", error);
      return false;
    }
  }

  // Create a new classroom
  async createClassroom(
    creatorId: string,
    name: string,
    description: string,
    university: string,
    department: string,
    attendanceTarget: number
  ): Promise<{ success: boolean; classroom?: Classroom; error?: string }> {
    try {
      console.log("🏫 Creating classroom:", { name, description, university, department });

      // Generate unique code
      let code = this.generateClassroomCode();
      let attempts = 0;
      while (!(await this.isCodeUnique(code)) && attempts < 10) {
        code = this.generateClassroomCode();
        attempts++;
      }

      if (attempts >= 10) {
        return { success: false, error: "Failed to generate unique classroom code" };
      }

      const classroomId = doc(collection(db, "classrooms")).id;
      const now = new Date().toISOString();

      const classroom: Classroom = {
        id: classroomId,
        name,
        description,
        code,
        createdBy: creatorId,
        university,
        department,
        attendanceTarget,
        members: [creatorId], // Creator is automatically a member
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(doc(db, "classrooms", classroomId), classroom);

      console.log("✅ Classroom created successfully with code:", code);
      console.log("📝 Classroom data:", { id: classroomId, name, code, members: classroom.members });
      return { success: true, classroom };
    } catch (error) {
      console.error("❌ Error creating classroom:", error);
      return { success: false, error: "Failed to create classroom" };
    }
  }

  // Check if a classroom exists by code (without joining)
  async checkClassroomExists(classroomCode: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log("🔍 Checking if classroom exists with code:", classroomCode);

      // Validate classroom code format
      if (!classroomCode || typeof classroomCode !== 'string') {
        return { success: false, error: "Classroom code is required" };
      }

      const trimmedCode = classroomCode.trim();
      if (!/^\d{6}$/.test(trimmedCode)) {
        return { success: false, error: "Please enter a valid 6-digit classroom code" };
      }

      // Find classroom by code
      const classroomsRef = collection(db, "classrooms");
      const q = query(classroomsRef, where("code", "==", trimmedCode));
      const querySnapshot = await getDocs(q);

      console.log(`🔍 Searching for classroom with code: ${trimmedCode}`);
      console.log(`📊 Found ${querySnapshot.size} classrooms`);

      if (querySnapshot.empty) {
        console.log("❌ No classroom found with this code");
        return { success: false, error: "Classroom not found. Please check the code and try again." };
      }

      const classroomDoc = querySnapshot.docs[0];
      const classroom = classroomDoc.data();
      console.log(`✅ Found classroom: ${classroom.name}`);

      return { success: true };
    } catch (error) {
      console.error("❌ Error checking classroom:", error);
      return { success: false, error: "Unable to verify classroom code. Please try again." };
    }
  }

  // Join a classroom by code
  async joinClassroom(
    userId: string,
    classroomCode: string
  ): Promise<{ success: boolean; classroom?: Classroom; error?: string }> {
    try {
      console.log("🔗 Joining classroom with code:", classroomCode);

      // Validate classroom code format
      if (!classroomCode || typeof classroomCode !== 'string') {
        return { success: false, error: "Classroom code is required" };
      }

      const trimmedCode = classroomCode.trim();
      if (!/^\d{6}$/.test(trimmedCode)) {
        return { success: false, error: "Please enter a valid 6-digit classroom code" };
      }

      // Find classroom by code
      const classroomsRef = collection(db, "classrooms");
      const q = query(classroomsRef, where("code", "==", trimmedCode));
      const querySnapshot = await getDocs(q);

      console.log(`🔍 Searching for classroom with code: ${trimmedCode}`);
      console.log(`📊 Found ${querySnapshot.size} classrooms`);

      if (querySnapshot.empty) {
        console.log("❌ No classroom found with this code");
        return { success: false, error: "Classroom not found. Please check the code and try again." };
      }

      const classroomDoc = querySnapshot.docs[0];
      const classroom = classroomDoc.data() as Classroom;

      // Check if user is already a member
      if (classroom.members.includes(userId)) {
        console.log("⚠️ User is already a member of this classroom");
        return { success: false, error: "You are already a member of this classroom." };
      }

      console.log(`✅ Found classroom: ${classroom.name} (${classroom.members.length} members)`);
      console.log(`👤 Adding user ${userId} to classroom ${classroom.id}`);

      // Add user to classroom members
      await updateDoc(doc(db, "classrooms", classroom.id), {
        members: arrayUnion(userId),
        updatedAt: new Date().toISOString(),
      });

      const updatedClassroom = { ...classroom, members: [...classroom.members, userId] };

      console.log("✅ Successfully joined classroom:", classroom.name);
      return { success: true, classroom: updatedClassroom };
    } catch (error) {
      console.error("❌ Error joining classroom:", error);
      return { success: false, error: "Failed to join classroom" };
    }
  }

  // Get classroom by ID
  async getClassroom(classroomId: string): Promise<Classroom | null> {
    try {
      const classroomRef = doc(db, "classrooms", classroomId);
      const classroomSnap = await getDoc(classroomRef);

      if (classroomSnap.exists()) {
        return classroomSnap.data() as Classroom;
      }
      return null;
    } catch (error) {
      console.error("Error getting classroom:", error);
      return null;
    }
  }

  // Get classrooms where user is a member
  async getUserClassrooms(userId: string): Promise<Classroom[]> {
    try {
      const classroomsRef = collection(db, "classrooms");
      const q = query(classroomsRef, where("members", "array-contains", userId));
      const querySnapshot = await getDocs(q);

      const classrooms: Classroom[] = [];
      querySnapshot.forEach((doc) => {
        classrooms.push(doc.data() as Classroom);
      });

      return classrooms;
    } catch (error) {
      console.error("Error getting user classrooms:", error);
      return [];
    }
  }

  // Create or update schedule for a classroom
  async createSchedule(
    classroomId: string,
    createdBy: string,
    classes: ClassSchedule[],
    semesterStartDate?: string,
    semesterEndDate?: string
  ): Promise<{ success: boolean; schedule?: Schedule; error?: string }> {
    try {
      console.log("📅 Creating schedule for classroom:", classroomId);

      const scheduleId = doc(collection(db, "schedules")).id;
      const now = new Date().toISOString();

      const schedule: Schedule = {
        id: scheduleId,
        classroomId,
        classes,
        createdBy,
        createdAt: now,
        updatedAt: now,
      };

      // Add semester dates if provided
      if (semesterStartDate) {
        schedule.semesterStartDate = semesterStartDate;
      }
      if (semesterEndDate) {
        schedule.semesterEndDate = semesterEndDate;
      }

      await setDoc(doc(db, "schedules", scheduleId), schedule);

      console.log("✅ Schedule created successfully with semester dates");
      return { success: true, schedule };
    } catch (error) {
      console.error("❌ Error creating schedule:", error);
      return { success: false, error: "Failed to create schedule" };
    }
  }

  // Get schedule for a classroom
  async getClassroomSchedule(classroomId: string): Promise<Schedule | null> {
    try {
      const schedulesRef = collection(db, "schedules");
      const q = query(schedulesRef, where("classroomId", "==", classroomId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data() as Schedule;
      }
      return null;
    } catch (error) {
      console.error("Error getting classroom schedule:", error);
      return null;
    }
  }

  // Update schedule for a classroom
  async updateSchedule(
    scheduleId: string,
    classes: ClassSchedule[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log("📅 Updating schedule:", scheduleId);

      await updateDoc(doc(db, "schedules", scheduleId), {
        classes,
        updatedAt: new Date().toISOString(),
      });

      console.log("✅ Schedule updated successfully");
      return { success: true };
    } catch (error) {
      console.error("❌ Error updating schedule:", error);
      return { success: false, error: "Failed to update schedule" };
    }
  }

  // Leave a classroom
  async leaveClassroom(
    userId: string,
    classroomId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await updateDoc(doc(db, "classrooms", classroomId), {
        members: arrayRemove(userId),
        updatedAt: new Date().toISOString(),
      });

      console.log("✅ Successfully left classroom");
      return { success: true };
    } catch (error) {
      console.error("❌ Error leaving classroom:", error);
      return { success: false, error: "Failed to leave classroom" };
    }
  }
}