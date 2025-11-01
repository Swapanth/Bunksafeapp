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
import { calculateAttendanceWithPreRegistration, testSemesterCalculation } from "../../core/utils/SemesterUtils";
import {
  AttendanceRecord,
  AttendanceStreak,
  AttendanceSummary,
  DashboardData,
  SemesterInfo,
  TodaysClass,
} from "../../domain/model/Attendance";
import { FirebaseClassroomService } from "./ClassroomService";
import { FirebaseTaskService } from "./TaskService";
import { FirebaseUserService } from "./UserService";

export class FirebaseAttendanceService {
  private classroomService = new FirebaseClassroomService();
  private userService = new FirebaseUserService();
  private taskService = new FirebaseTaskService();

  // Mark attendance for a class
  async markAttendance(
    userId: string,
    classroomId: string,
    classId: string,
    status: "present" | "absent",
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const today = new Date().toISOString().split("T")[0];
      const attendanceId = `${userId}_${classId}_${today}`;
      const now = new Date().toISOString();

      const attendanceRecord: AttendanceRecord = {
        id: attendanceId,
        userId,
        classroomId,
        classId,
        date: today,
        status,
        markedAt: now,
        updatedAt: now,
      };

      // Only add reason field if status is absent and reason is provided
      if (status === "absent" && reason) {
        attendanceRecord.reason = reason;
      }

      await setDoc(doc(db, "attendance", attendanceId), attendanceRecord);

      // Update attendance streak if present
      if (status === "present") {
        await this.updateAttendanceStreak(userId);
      }

      return { success: true };
    } catch (error) {
      console.error("Error marking attendance:", error);
      return { success: false, error: "Failed to mark attendance" };
    }
  }

  // Update attendance record
  async updateAttendance(
    userId: string,
    classId: string,
    date: string,
    status: "present" | "absent",
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const attendanceId = `${userId}_${classId}_${date}`;
      const now = new Date().toISOString();

      const updateData: any = {
        status,
        updatedAt: now,
      };

      // Only add reason field if status is absent and reason is provided
      if (status === "absent" && reason) {
        updateData.reason = reason;
      }

      await updateDoc(doc(db, "attendance", attendanceId), updateData);

      return { success: true };
    } catch (error) {
      console.error("Error updating attendance:", error);
      return { success: false, error: "Failed to update attendance" };
    }
  }

  // Get attendance record for a specific date and class
  async getAttendanceRecord(
    userId: string,
    classId: string,
    date: string
  ): Promise<AttendanceRecord | null> {
    try {
      const attendanceId = `${userId}_${classId}_${date}`;
      const attendanceRef = doc(db, "attendance", attendanceId);
      const attendanceSnap = await getDoc(attendanceRef);

      if (attendanceSnap.exists()) {
        return attendanceSnap.data() as AttendanceRecord;
      }
      return null;
    } catch (error) {
      console.error("Error getting attendance record:", error);
      return null;
    }
  }

  // Update attendance streak
  private async updateAttendanceStreak(userId: string): Promise<void> {
    try {
      const today = new Date().toISOString().split("T")[0];
      const yesterday = new Date(Date.now() - 86400000)
        .toISOString()
        .split("T")[0];

      const streakRef = doc(db, "attendanceStreaks", userId);
      const streakSnap = await getDoc(streakRef);

      let streak: AttendanceStreak;

      if (streakSnap.exists()) {
        const existingStreak = streakSnap.data() as AttendanceStreak;

        if (existingStreak.lastCheckedDate === yesterday) {
          // Continue streak
          streak = {
            ...existingStreak,
            currentStreak: existingStreak.currentStreak + 1,
            lastCheckedDate: today,
            totalDaysMarked: existingStreak.totalDaysMarked + 1,
            longestStreak: Math.max(
              existingStreak.longestStreak,
              existingStreak.currentStreak + 1
            ),
            updatedAt: new Date().toISOString(),
          };
        } else if (existingStreak.lastCheckedDate !== today) {
          // Reset streak
          streak = {
            ...existingStreak,
            currentStreak: 1,
            lastCheckedDate: today,
            totalDaysMarked: existingStreak.totalDaysMarked + 1,
            updatedAt: new Date().toISOString(),
          };
        } else {
          // Already marked today
          return;
        }
      } else {
        // Create new streak
        streak = {
          userId,
          currentStreak: 1,
          lastCheckedDate: today,
          totalDaysMarked: 1,
          longestStreak: 1,
          updatedAt: new Date().toISOString(),
        };
      }

      await setDoc(streakRef, streak);
    } catch (error) {
      console.error("Error updating attendance streak:", error);
    }
  }

  // Get attendance streak for user
  async getAttendanceStreak(userId: string): Promise<AttendanceStreak | null> {
    try {
      const streakRef = doc(db, "attendanceStreaks", userId);
      const streakSnap = await getDoc(streakRef);

      if (streakSnap.exists()) {
        return streakSnap.data() as AttendanceStreak;
      }
      return null;
    } catch (error) {
      console.error("Error getting attendance streak:", error);
      return null;
    }
  }

  // Get attendance summary for a class
  async getAttendanceSummary(
    userId: string,
    classId: string,
    requiredPercentage: number = 75
  ): Promise<AttendanceSummary | null> {
    try {
      const attendanceRef = collection(db, "attendance");
      const q = query(
        attendanceRef,
        where("userId", "==", userId),
        where("classId", "==", classId)
      );
      const querySnapshot = await getDocs(q);

      const records: AttendanceRecord[] = [];
      querySnapshot.forEach((doc) => {
        records.push(doc.data() as AttendanceRecord);
      });

      if (records.length === 0) {
        return null;
      }

      const totalClasses = records.length;
      const attendedClasses = records.filter(
        (r) => r.status === "present"
      ).length;
      const absentClasses = totalClasses - attendedClasses;
      const attendancePercentage = (attendedClasses / totalClasses) * 100;

      // Calculate classes needed to attend to maintain required percentage
      const requiredAttendedClasses = Math.ceil(
        (requiredPercentage / 100) * totalClasses
      );
      const classesToAttend = Math.max(
        0,
        requiredAttendedClasses - attendedClasses
      );

      // Calculate classes that can be skipped while maintaining required percentage
      const maxAllowedAbsences = totalClasses - requiredAttendedClasses;
      const classesCanSkip = Math.max(0, maxAllowedAbsences - absentClasses);

      return {
        classId,
        className: "", // Will be filled by caller
        instructor: "", // Will be filled by caller
        totalClasses,
        attendedClasses,
        absentClasses,
        attendancePercentage: Math.round(attendancePercentage * 100) / 100,
        requiredAttendancePercentage: requiredPercentage,
        isAttendanceCritical: attendancePercentage < requiredPercentage,
        classesToAttend,
        classesCanSkip,
      };
    } catch (error) {
      console.error("Error getting attendance summary:", error);
      return null;
    }
  }

  // Get today's classes for dashboard
  private async getTodaysClasses(userId: string): Promise<TodaysClass[]> {
    try {
      const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
      const dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const todayName = dayNames[today];
      const todayDate = new Date().toISOString().split("T")[0];

      // Get user's classrooms
      const classrooms = await this.classroomService.getUserClassrooms(userId);
      const todaysClasses: TodaysClass[] = [];

      for (const classroom of classrooms) {
        // Get schedule for this classroom
        const schedule = await this.classroomService.getClassroomSchedule(
          classroom.id
        );

        if (schedule) {
          // Filter classes for today
          const todayClasses = schedule.classes.filter(
            (cls) => cls.day === todayName
          );

          for (const cls of todayClasses) {
            // Check if attendance is already marked for today
            const attendanceRecord = await this.getAttendanceRecord(
              userId,
              cls.id,
              todayDate
            );

            // Get attendance summary for this class
            const summary = await this.getAttendanceSummary(
              userId,
              cls.id,
              classroom.attendanceTarget
            );

            const todayClass: TodaysClass = {
              id: `${cls.id}_${todayDate}`,
              classId: cls.id,
              classroomId: classroom.id,
              subject: cls.name,
              time: `${cls.startTime} - ${cls.endTime}`,
              instructor: cls.instructor,
              room: cls.location,
              isCheckedIn: !!attendanceRecord,
              attendanceStatus: attendanceRecord?.status,
              reason: attendanceRecord?.reason,
              totalClasses: summary?.totalClasses || 0,
              attendedClasses: summary?.attendedClasses || 0,
              requiredAttendancePercentage: classroom.attendanceTarget,
            };

            todaysClasses.push(todayClass);
          }
        }
      }

      return todaysClasses;
    } catch (error) {
      console.error("Error getting today's classes:", error);
      return [];
    }
  }

  // Get dashboard data for user
  async getDashboardData(userId: string): Promise<DashboardData | null> {
    try {
      // Get user info
      const user = await this.userService.getUserById(userId);
      if (!user) {
        return null;
      }

      console.log('User data for semester info:', {
        semesterStartDate: user.semesterStartDate,
        semesterEndDate: user.semesterEndDate,
        attendanceTarget: user.attendanceTarget
      });

      // Get today's classes
      const todaysClasses = await this.getTodaysClasses(userId);

      // Get attendance streak
      let attendanceStreak = await this.getAttendanceStreak(userId);
      if (!attendanceStreak) {
        // Create default streak if none exists
        attendanceStreak = {
          userId,
          currentStreak: 0,
          lastCheckedDate: "",
          totalDaysMarked: 0,
          longestStreak: 0,
          updatedAt: new Date().toISOString(),
        };
      }
      // Get total tasks count for user
      const userTasks = await this.taskService.getUserTasks(userId);
      const totalTasks = userTasks.length;

      // Calculate overall attendance percentage
      let totalClasses = 0;
      let totalAttended = 0;

      for (const todayClass of todaysClasses) {
        totalClasses += todayClass.totalClasses;
        totalAttended += todayClass.attendedClasses;
      }

      const overallAttendancePercentage =
        totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 0;

      // Calculate semester information with pre-registration assumption
      let semesterInfo: SemesterInfo | undefined;
      if (user.semesterStartDate && user.semesterEndDate && user.createdAt) {
        console.log('Calculating semester info with dates:', user.semesterStartDate, user.semesterEndDate);
        console.log('User registration date:', user.createdAt);
        
        // Test the calculation with debug info
        const progress = testSemesterCalculation(user.semesterStartDate, user.semesterEndDate);
        const targetPercentage = user.attendanceTarget || 75;
        
        // Calculate more accurate attended days by counting actual attendance records
        // First, try to get actual attendance records for better accuracy
        let attendedDays = 0;
        try {
          // Get all attendance records for this user
          const attendanceQuery = query(
            collection(db, "attendance"),
            where("userId", "==", userId),
            where("status", "==", "present")
          );
          const attendanceSnapshot = await getDocs(attendanceQuery);
          
          // Count unique dates when user was present
          const presentDates = new Set<string>();
          attendanceSnapshot.forEach(doc => {
            const record = doc.data() as AttendanceRecord;
            presentDates.add(record.date);
          });
          attendedDays = presentDates.size;
        } catch (error) {
          console.warn("Could not fetch attendance records, using streak data:", error);
          // Fallback to attendance streak data
          attendedDays = attendanceStreak.totalDaysMarked;
        }
        
        // Use new calculation that considers pre-registration attendance
        const attendanceCalc = calculateAttendanceWithPreRegistration(
          user.semesterStartDate,
          user.semesterEndDate,
          user.createdAt, // Registration date
          attendedDays,   // Actual attended days since registration
          targetPercentage
        );

        semesterInfo = {
          startDate: user.semesterStartDate,
          endDate: user.semesterEndDate,
          totalWorkingDays: progress.totalWorkingDays,
          elapsedWorkingDays: progress.elapsedWorkingDays,
          remainingWorkingDays: attendanceCalc.remainingWorkingDays,
          progressPercentage: progress.progressPercentage,
          targetAttendancePercentage: targetPercentage,
          requiredAttendanceDays: attendanceCalc.requiredDays,
          canSkipDays: attendanceCalc.canSkipDays,
          isOnTrack: attendanceCalc.isOnTrack,
          currentPerformancePercentage: attendanceCalc.currentPerformancePercentage,
          targetDaysForSemester: attendanceCalc.targetDaysForSemester,
          projectedFinalPercentage: attendanceCalc.projectedFinalPercentage,
        };

        console.log('Calculated semester info with pre-registration:', semesterInfo);
      } else {
        console.log('Missing required data - semester dates or registration date:', {
          semesterStart: user.semesterStartDate,
          semesterEnd: user.semesterEndDate,
          createdAt: user.createdAt
        });
      }

      return {
        userName: user.nickname || user.name || "Student",
        todaysClasses,
        attendanceStreak,
        attendanceSummary: [],
        overallAttendancePercentage,
        totalTasks,
        semesterInfo,
      };
    } catch (error) {
      console.error("Error getting dashboard data:", error);
      return null;
    }
  }
}
