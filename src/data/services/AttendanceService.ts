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
    reason?: string,
    subject?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const today = new Date().toISOString().split("T")[0];
      const attendanceId = `${userId}_${classId}_${today}`;
      const now = new Date().toISOString();

      // Fetch subject name if not provided
      let subjectName = subject;
      if (!subjectName) {
        const schedule = await this.classroomService.getClassroomSchedule(classroomId);
        const classInfo = schedule?.classes.find(c => c.id === classId);
        subjectName = classInfo?.name || "Unknown Subject";
      }

      const attendanceRecord: AttendanceRecord = {
        id: attendanceId,
        userId,
        classroomId,
        classId,
        subject: subjectName,
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
      console.log("✅ Attendance record saved:", attendanceId);

      // Update attendance streak if present
      if (status === "present") {
        console.log("📊 Status is present, updating streak...");
        try {
          await this.updateAttendanceStreak(userId);
          console.log("✅ Streak update completed");
        } catch (streakError) {
          console.error("❌ Streak update failed:", streakError);
          // Don't fail the entire operation if streak update fails
        }
      }

      // Update cached attendance stats
      await this.updateAttendanceStats(userId, classroomId, classId, status);

      return { success: true };
    } catch (error) {
      console.error("❌ Error marking attendance:", error);
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
      console.log("✅ Attendance record updated:", attendanceId, "status:", status);

      // Update attendance streak if present
      if (status === "present") {
        console.log("📊 Status changed to present, updating streak...");
        try {
          await this.updateAttendanceStreak(userId);
          console.log("✅ Streak update completed after status change");
        } catch (streakError) {
          console.error("❌ Streak update failed:", streakError);
          // Don't fail the entire operation if streak update fails
        }
      }

      // Update cached attendance stats for the updated record
      const attendanceRef = doc(db, "attendance", attendanceId);
      const attendanceSnap = await getDoc(attendanceRef);
      if (attendanceSnap.exists()) {
        const record = attendanceSnap.data() as AttendanceRecord;
        await this.updateAttendanceStats(userId, record.classroomId, classId, status);
      }

      return { success: true };
    } catch (error) {
      console.error("❌ Error updating attendance:", error);
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

  // Auto-mark unmarked attendance as absent for past dates
  async autoMarkUnmarkedAsAbsent(userId: string, targetDate?: string): Promise<void> {
    try {
      const dateToCheck = targetDate || new Date(Date.now() - 86400000).toISOString().split("T")[0]; // Yesterday
      console.log(`🤖 Auto-marking unmarked attendance as absent for: ${dateToCheck}`);

      // Get day of week for the target date
      const targetDateObj = new Date(dateToCheck + 'T00:00:00');
      const dayIndex = targetDateObj.getDay();
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const dayName = dayNames[dayIndex];

      // Get user's classrooms
      const classrooms = await this.classroomService.getUserClassrooms(userId);
      let unmarkedCount = 0;

      for (const classroom of classrooms) {
        // Get schedule for this classroom
        const schedule = await this.classroomService.getClassroomSchedule(classroom.id);

        if (schedule) {
          // Filter classes for that day
          const dayClasses = schedule.classes.filter(cls => cls.day === dayName);

          for (const cls of dayClasses) {
            // Check if attendance is already marked
            const attendanceId = `${userId}_${cls.id}_${dateToCheck}`;
            const existingRecord = await this.getAttendanceRecord(userId, cls.id, dateToCheck);

            if (!existingRecord) {
              // Mark as absent with auto-generated reason
              const now = new Date().toISOString();
              const attendanceRecord: AttendanceRecord = {
                id: attendanceId,
                userId,
                classroomId: classroom.id,
                classId: cls.id,
                subject: cls.name,
                date: dateToCheck,
                status: 'absent',
                reason: 'Auto-marked as absent (not manually marked)',
                markedAt: now,
                updatedAt: now,
              };

              await setDoc(doc(db, "attendance", attendanceId), attendanceRecord);
              
              // Update cached stats
              await this.updateAttendanceStats(userId, classroom.id, cls.id, 'absent');
              
              unmarkedCount++;
              console.log(`  ✅ Auto-marked ${cls.name} as absent for ${dateToCheck}`);
            }
          }
        }
      }

      console.log(`🎯 Auto-marked ${unmarkedCount} classes as absent for ${dateToCheck}`);
    } catch (error) {
      console.error("❌ Error auto-marking attendance:", error);
    }
  }

  // Update attendance streak
  private async updateAttendanceStreak(userId: string): Promise<void> {
    try {
      const today = new Date().toISOString().split("T")[0];
      const yesterday = new Date(Date.now() - 86400000)
        .toISOString()
        .split("T")[0];

      console.log("🔥 Updating streak for user:", userId, "today:", today, "yesterday:", yesterday);

      const streakRef = doc(db, "attendanceStreaks", userId);
      const streakSnap = await getDoc(streakRef);

      let streak: AttendanceStreak;

      if (streakSnap.exists()) {
        const existingStreak = streakSnap.data() as AttendanceStreak;
        console.log("📈 Existing streak found:", {
          currentStreak: existingStreak.currentStreak,
          lastCheckedDate: existingStreak.lastCheckedDate,
          totalDaysMarked: existingStreak.totalDaysMarked
        });

        if (existingStreak.lastCheckedDate === yesterday) {
          // Continue streak
          console.log("✅ Continuing streak from yesterday");
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
        } else if (existingStreak.lastCheckedDate === today) {
          // Check if this is the first attendance today (streak is 0)
          if (existingStreak.currentStreak === 0 && existingStreak.totalDaysMarked === 0) {
            console.log("🎯 First attendance today, starting streak at 1");
            streak = {
              ...existingStreak,
              currentStreak: 1,
              lastCheckedDate: today,
              totalDaysMarked: 1,
              longestStreak: 1,
              updatedAt: new Date().toISOString(),
            };
          } else {
            // Already counted today, just update timestamp
            console.log("ℹ️ Already counted today, just updating timestamp");
            streak = {
              ...existingStreak,
              updatedAt: new Date().toISOString(),
            };
          }
        } else {
          // Reset streak (gap detected)
          console.log("🔄 Resetting streak - gap detected between", existingStreak.lastCheckedDate, "and", today);
          streak = {
            ...existingStreak,
            currentStreak: 1,
            lastCheckedDate: today,
            totalDaysMarked: existingStreak.totalDaysMarked + 1,
            updatedAt: new Date().toISOString(),
          };
        }
      } else {
        // Create new streak
        console.log("🆕 Creating new streak");
        streak = {
          userId,
          currentStreak: 1,
          lastCheckedDate: today,
          totalDaysMarked: 1,
          longestStreak: 1,
          updatedAt: new Date().toISOString(),
        };
      }

      console.log("💾 Saving streak:", {
        currentStreak: streak.currentStreak,
        lastCheckedDate: streak.lastCheckedDate,
        totalDaysMarked: streak.totalDaysMarked,
        longestStreak: streak.longestStreak
      });

      await setDoc(streakRef, streak);
      console.log("✅ Streak setDoc completed");
      
      // Verify the save
      const verifySnap = await getDoc(streakRef);
      if (verifySnap.exists()) {
        const savedData = verifySnap.data();
        console.log("✅ Verified streak in DB:", {
          currentStreak: savedData.currentStreak,
          lastCheckedDate: savedData.lastCheckedDate,
          totalDaysMarked: savedData.totalDaysMarked
        });
      } else {
        console.error("❌ Streak document not found after save!");
      }
    } catch (error) {
      console.error("❌ Error updating attendance streak:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
    }
  }

  // Update cached attendance statistics
  private async updateAttendanceStats(
    userId: string,
    classroomId: string,
    classId: string,
    newStatus: 'present' | 'absent'
  ): Promise<void> {
    try {
      const statsId = `${userId}_${classroomId}_${classId}`;
      const statsRef = doc(db, "attendanceStats", statsId);
      const statsSnap = await getDoc(statsRef);

      // Get all attendance records for this class to calculate totals
      const attendanceQuery = query(
        collection(db, "attendance"),
        where("userId", "==", userId),
        where("classId", "==", classId)
      );
      const attendanceSnapshot = await getDocs(attendanceQuery);
      
      const totalClasses = attendanceSnapshot.size;
      const attendedClasses = attendanceSnapshot.docs.filter(
        doc => doc.data().status === 'present'
      ).length;
      
      const absentClasses = totalClasses - attendedClasses;
      const attendancePercentage = totalClasses > 0 
        ? Math.round((attendedClasses / totalClasses) * 10000) / 100 
        : 0;

      const now = new Date().toISOString();
      const today = now.split('T')[0];

      if (statsSnap.exists()) {
        // Update existing stats
        await updateDoc(statsRef, {
          totalClasses,
          attendedClasses,
          absentClasses,
          attendancePercentage,
          lastMarkedDate: today,
          lastMarkedStatus: newStatus,
          updatedAt: now
        });
      } else {
        // Create new stats entry (get subject info from classroom schedule)
        const schedule = await this.classroomService.getClassroomSchedule(classroomId);
        const classSchedule = schedule?.classes.find((c) => c.id === classId);
        
        await setDoc(statsRef, {
          id: statsId,
          userId,
          classroomId,
          classId,
          subject: classSchedule?.name || 'Unknown',
          instructor: classSchedule?.instructor || 'Unknown',
          totalClasses,
          attendedClasses,
          absentClasses,
          attendancePercentage,
          lastMarkedDate: today,
          lastMarkedStatus: newStatus,
          createdAt: now,
          updatedAt: now
        });
      }
    } catch (error) {
      console.error("Error updating attendance stats:", error);
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

  // Get cached attendance stats (fast lookup)
  async getAttendanceStatsFromCache(
    userId: string,
    classId: string
  ): Promise<{
    totalClasses: number;
    attendedClasses: number;
    attendancePercentage: number;
  } | null> {
    try {
      const statsQuery = query(
        collection(db, "attendanceStats"),
        where("userId", "==", userId),
        where("classId", "==", classId)
      );
      const statsSnapshot = await getDocs(statsQuery);
      
      if (statsSnapshot.empty) {
        return null;
      }

      const stats = statsSnapshot.docs[0].data();
      return {
        totalClasses: stats.totalClasses || 0,
        attendedClasses: stats.attendedClasses || 0,
        attendancePercentage: stats.attendancePercentage || 0
      };
    } catch (error) {
      console.error("Error getting cached attendance stats:", error);
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
        classroomId: "", // Will be filled by caller
        subject: "", // Will be filled by caller
        instructor: "", // Will be filled by caller
        totalClassesSoFar: totalClasses,
        totalAttendedSoFar: attendedClasses,
        totalAbsences: absentClasses,
        currentAttendancePercentage: Math.round(attendancePercentage * 100) / 100,
        requiredAttendancePercentage: requiredPercentage,
        expectedTotalForSemester: 0, // Will be calculated by caller
        remainingClasses: 0, // Will be calculated by caller
        classesToAttend,
        classesCanSkip,
        isAttendanceCritical: attendancePercentage < requiredPercentage,
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
              totalClasses: summary?.totalClassesSoFar || 0,
              attendedClasses: summary?.totalAttendedSoFar || 0,
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
      console.log('🔍 getDashboardData called for userId:', userId);
      
      // Get user info
      let user = await this.userService.getUserById(userId);
      if (!user) {
        console.error('❌ User document not found for userId:', userId);
        console.warn('💡 Attempting to create basic user document...');
        
        // Try to get user from Firebase Auth and create document
        try {
          const { auth } = await import('../../config/firebase');
          const currentUser = auth.currentUser;
          
          if (currentUser && currentUser.uid === userId) {
            // Create a basic user document
            await this.userService.createUserProfile(userId, {
              email: currentUser.email || '',
              name: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
              nickname: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
              mobileNumber: currentUser.phoneNumber || '',
              collegeName: '',
              createdAt: new Date().toISOString(),
              onboardingCompleted: false,
              attendanceTarget: 75,
            });
            
            console.log('✅ Basic user document created, retrying...');
            user = await this.userService.getUserById(userId);
          }
        } catch (createError) {
          console.error('Failed to auto-create user document:', createError);
        }
        
        if (!user) {
          console.error('💡 User needs to complete onboarding');
          return null;
        }
      }

      console.log('✅ User found:', user.nickname || user.name);
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
      console.error("Full error details:", JSON.stringify(error, null, 2));
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      return null;
    }
  }

}