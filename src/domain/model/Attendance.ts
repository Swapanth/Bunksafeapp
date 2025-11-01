export interface AttendanceRecord {
  id: string;
  userId: string;
  classroomId: string;
  classId: string; // Reference to ClassSchedule id
  date: string; // ISO date string (YYYY-MM-DD)
  status: 'present' | 'absent';
  reason?: string; // Optional reason for absence
  markedAt: string; // ISO timestamp when attendance was marked
  updatedAt?: string; // ISO timestamp when attendance was last updated
}

export interface AttendanceStreak {
  userId: string;
  currentStreak: number;
  lastCheckedDate: string; // ISO date string
  totalDaysMarked: number;
  longestStreak: number;
  updatedAt: string;
}

export interface AttendanceSummary {
  classId: string;
  className: string;
  instructor: string;
  totalClasses: number;
  attendedClasses: number;
  absentClasses: number;
  attendancePercentage: number;
  requiredAttendancePercentage: number;
  isAttendanceCritical: boolean;
  classesToAttend: number; // Classes needed to maintain required percentage
  classesCanSkip: number; // Classes that can be skipped while maintaining required percentage
}

export interface SemesterInfo {
  startDate?: string;
  endDate?: string;
  totalWorkingDays: number;
  elapsedWorkingDays: number;
  remainingWorkingDays: number;
  progressPercentage: number;
  targetAttendancePercentage: number;
  requiredAttendanceDays: number;
  canSkipDays: number;
  isOnTrack: boolean;
  currentPerformancePercentage: number;
  targetDaysForSemester: number;
  projectedFinalPercentage: number;
}

export interface DashboardData {
  userName: string;
  todaysClasses: TodaysClass[];
  attendanceStreak: AttendanceStreak;
  attendanceSummary: AttendanceSummary[];
  overallAttendancePercentage: number;
  totalTasks: number;
  semesterInfo?: SemesterInfo;
}

export interface TodaysClass {
  id: string;
  classId: string; // Reference to ClassSchedule id
  classroomId: string; // Reference to Classroom id
  subject: string;
  time: string;
  instructor: string;
  room: string;
  isCheckedIn: boolean;
  attendanceStatus?: 'present' | 'absent';
  reason?: string;
  totalClasses: number;
  attendedClasses: number;
  requiredAttendancePercentage: number;
}