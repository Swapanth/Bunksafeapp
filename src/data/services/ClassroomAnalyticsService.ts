import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../config/firebase";
import { FirebaseClassroomService } from "./ClassroomService";
import { FirebaseAttendanceService } from "./FirebaseAttendanceService";

export interface ClassroomAnalytics {
  weeklyPerformance: WeeklyPerformanceData[];
  subjectDistribution: SubjectDistributionData[];
  weeklyStats: WeeklyStatsData[];
  classroomOverview: ClassroomOverviewData[];
}

export interface WeeklyPerformanceData {
  value: number;
  label: string;
}

export interface SubjectDistributionData {
  value: number;
  color: string;
  key: string;
}

export interface WeeklyStatsData {
  icon: string;
  label: string;
  value: string;
  change: string;
  color: string;
}

export interface GoalsProgressData {
  label: string;
  current: number;
  target: number;
  percentage: number;
  color: string;
}

export interface ClassroomOverviewData {
  name: string;
  description?: string;
  code?: string;
  studentCount: number;
  color?: string;
}

export class FirebaseClassroomAnalyticsService {
  private attendanceService = new FirebaseAttendanceService();
  private classroomService = new FirebaseClassroomService();

  async getClassroomAnalytics(
    userId: string
  ): Promise<ClassroomAnalytics | null> {
    try {
      // Get user's classrooms
      const classrooms = await this.classroomService.getUserClassrooms(userId);

      if (classrooms.length === 0) {
        return this.getDefaultAnalytics();
      }

      // Get attendance data for the past week
      const weeklyPerformance = await this.getWeeklyPerformanceData(
        userId,
        classrooms
      );
      const subjectDistribution = await this.getSubjectDistributionData(
        userId,
        classrooms
      );
      const weeklyStats = await this.getWeeklyStatsData(userId, classrooms);
      const classroomOverview = await this.getClassroomOverviewData(
        userId,
        classrooms
      );

      return {
        weeklyPerformance,
        subjectDistribution,
        weeklyStats,
        classroomOverview,
      };
    } catch (error) {
      console.error("Error getting classroom analytics:", error);
      return this.getDefaultAnalytics();
    }
  }

  private async getWeeklyPerformanceData(
    userId: string,
    classrooms: any[]
  ): Promise<WeeklyPerformanceData[]> {
    try {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const weeklyData: WeeklyPerformanceData[] = [];

      // Get the past 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        const dayName = days[date.getDay()];

        // Get attendance for this date
        const attendanceQuery = query(
          collection(db, "attendance"),
          where("userId", "==", userId),
          where("date", "==", dateStr)
        );

        const attendanceSnapshot = await getDocs(attendanceQuery);
        const totalClasses = attendanceSnapshot.size;
        const presentClasses = attendanceSnapshot.docs.filter(
          (doc) => doc.data().status === "present"
        ).length;

        const percentage =
          totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 0;

        weeklyData.push({
          value: Math.round(percentage),
          label: dayName,
        });
      }

      return weeklyData;
    } catch (error) {
      console.error("Error getting weekly performance data:", error);
      return this.getDefaultWeeklyPerformance();
    }
  }

  private async getSubjectDistributionData(
    userId: string,
    classrooms: any[]
  ): Promise<SubjectDistributionData[]> {
    try {
      const subjectMap = new Map<string, number>();
      const colors = [
        "#3b82f6",
        "#10b981",
        "#f59e0b",
        "#ef4444",
        "#8b5cf6",
        "#06b6d4",
        "#84cc16",
      ];

      // Get all schedules for user's classrooms
      for (const classroom of classrooms) {
        const schedule = await this.classroomService.getClassroomSchedule(
          classroom.id
        );
        if (schedule && schedule.classes) {
          schedule.classes.forEach((classItem) => {
            const subject = classItem.subject;
            subjectMap.set(subject, (subjectMap.get(subject) || 0) + 1);
          });
        }
      }

      // Convert to array and calculate percentages
      const totalClasses = Array.from(subjectMap.values()).reduce(
        (sum, count) => sum + count,
        0
      );
      const subjectData: SubjectDistributionData[] = [];

      let colorIndex = 0;
      subjectMap.forEach((count, subject) => {
        const percentage =
          totalClasses > 0 ? Math.round((count / totalClasses) * 100) : 0;
        subjectData.push({
          value: percentage,
          color: colors[colorIndex % colors.length],
          key: subject,
        });
        colorIndex++;
      });

      return subjectData.length > 0
        ? subjectData
        : this.getDefaultSubjectDistribution();
    } catch (error) {
      console.error("Error getting subject distribution data:", error);
      return this.getDefaultSubjectDistribution();
    }
  }

  private async getWeeklyStatsData(
    userId: string,
    classrooms: any[]
  ): Promise<WeeklyStatsData[]> {
    try {
      // Get all attendance data for the user (simplified query to avoid index requirement)
      const attendanceQuery = query(
        collection(db, "attendance"),
        where("userId", "==", userId)
      );

      const attendanceSnapshot = await getDocs(attendanceQuery);
      const attendanceRecords = attendanceSnapshot.docs.map((doc) =>
        doc.data()
      );

      // Filter for the past week in memory to avoid Firebase index requirement
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      const weekStartStr = weekStart.toISOString().split("T")[0];

      const weeklyRecords = attendanceRecords.filter(
        (record) => record.date >= weekStartStr
      );

      // Calculate stats
      const totalClasses = weeklyRecords.length;
      const presentClasses = weeklyRecords.filter(
        (record) => record.status === "present"
      ).length;
      const attendanceRate =
        totalClasses > 0
          ? Math.round((presentClasses / totalClasses) * 100)
          : 0;

      // Get attendance streak
      const streak = await this.attendanceService.getAttendanceStreak(userId);
      const currentStreak = streak?.currentStreak || 0;

      return [
        {
          icon: "time-outline",
          label: "Study Hours",
          value: `0h`,
          change: "+12%",
          color: "text-green-600",
        },
        {
          icon: "checkmark-circle-outline",
          label: "Tasks Completed",
          value: presentClasses.toString(),
          change: "+8%",
          color: "text-green-600",
        },
        {
          icon: "trending-up-outline",
          label: "Average Score",
          value: `${attendanceRate}%`,
          change: "+5%",
          color: "text-green-600",
        },
        {
          icon: "calendar-outline",
          label: "Attendance",
          value: `${attendanceRate}%`,
          change: currentStreak > 5 ? "+2%" : "-2%",
          color: currentStreak > 5 ? "text-green-600" : "text-red-600",
        },
      ];
    } catch (error) {
      console.error("Error getting weekly stats data:", error);
      return this.getDefaultWeeklyStats();
    }
  }

  private async getClassroomOverviewData(
    userId: string,
    classrooms: any[]
  ): Promise<ClassroomOverviewData[]> {
    try {
      const classroomOverview: ClassroomOverviewData[] = [];
      const colors = [
        "#3b82f6",
        "#10b981",
        "#f59e0b",
        "#ef4444",
        "#8b5cf6",
        "#06b6d4",
        "#84cc16",
      ];

      for (let i = 0; i < classrooms.length; i++) {
        const classroom = classrooms[i];

        // Use the members array that's already in the classroom data
        const studentCount = classroom.members ? classroom.members.length : 0;

        classroomOverview.push({
          name: classroom.name || "Unnamed Classroom",
          description: classroom.description || undefined,
          code: classroom.code || undefined,
          studentCount,
          color: colors[i % colors.length],
        });
      }

      return classroomOverview;
    } catch (error) {
      console.error("Error getting classroom overview data:", error);
      return this.getDefaultClassroomOverview();
    }
  }

  private getDefaultAnalytics(): ClassroomAnalytics {
    return {
      weeklyPerformance: this.getDefaultWeeklyPerformance(),
      subjectDistribution: this.getDefaultSubjectDistribution(),
      weeklyStats: this.getDefaultWeeklyStats(),
      classroomOverview: this.getDefaultClassroomOverview(),
    };
  }

  private getDefaultWeeklyPerformance(): WeeklyPerformanceData[] {
    return [
      { value: 0, label: "Mon" },
      { value: 0, label: "Tue" },
      { value: 0, label: "Wed" },
      { value: 0, label: "Thu" },
      { value: 0, label: "Fri" },
      { value: 0, label: "Sat" },
      { value: 0, label: "Sun" },
    ];
  }

  private getDefaultSubjectDistribution(): SubjectDistributionData[] {
    return [{ value: 100, color: "#9ca3af", key: "No Data Available" }];
  }

  private getDefaultWeeklyStats(): WeeklyStatsData[] {
    return [
      {
        icon: "checkmark-circle-outline",
        label: "Tasks Completed",
        value: "0",
        change: "0%",
        color: "text-gray-600",
      },
      {
        icon: "trending-up-outline",
        label: "Average Score",
        value: "0%",
        change: "0%",
        color: "text-gray-600",
      },
      {
        icon: "calendar-outline",
        label: "Attendance",
        value: "0%",
        change: "0%",
        color: "text-gray-600",
      },
    ];
  }

  private getDefaultClassroomOverview(): ClassroomOverviewData[] {
    return [];
  }
}
