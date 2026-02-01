export interface AttendanceRecord {
  id: string;
  userId: string;
  classroomId: string;
  classId: string; // Reference to ClassSchedule id
  subject: string; // Subject name for easy filtering and display
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

// Real-time statistics per subject (stored in DB, updated with each mark)
export interface SubjectAttendanceStats {
  id: string; // Format: {userId}_{classroomId}_{classId}
  userId: string;
  classroomId: string;
  classId: string;
  subject: string;
  instructor: string;
  
  // Current period (app tracked)
  totalClasses: number;
  attendedClasses: number;
  absentClasses: number;
  attendancePercentage: number; // Cached percentage for fast access
  
  
  // Metadata
  lastMarkedDate?: string;
  lastMarkedStatus?: 'present' | 'absent';
  updatedAt: string;
  createdAt: string;
}

// Calculated summary (NOT stored in DB, computed from SubjectAttendanceStats)
export interface AttendanceSummary {
  classId: string;
  classroomId: string;
  subject: string;
  instructor: string;
  
  
  totalClassesSoFar: number;
  totalAttendedSoFar: number;
  totalAbsences: number;
  currentAttendancePercentage: number;
  
  // Requirements and predictions
  requiredAttendancePercentage: number;
  TotalClassesForSemester: number;
  remainingClasses: number;
  classesToAttend: number;
  classesCanSkip: number;
  isAttendanceCritical: boolean;
  
  // Quick display
  lastMarkedDate?: string;
  lastMarkedStatus?: 'present' | 'absent';
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
  totalClasses: number; // Classes tracked in app so far
  attendedClasses: number; // Classes attended in app so far
  requiredAttendancePercentage: number;
  TotalClassesForSemester?: number; // Total expected for entire semester
}