export interface Classroom {
  id: string;
  name: string;
  description: string;
  code: string; // 6-digit code for joining
  createdBy: string; // User ID of creator
  university: string;
  department: string;
  attendanceTarget: number;
  members: string[]; // Array of user IDs
  createdAt: string;
  updatedAt: string;
}

export interface ClassroomMember {
  userId: string;
  nickname: string;
  email: string;
  joinedAt: string;
  role: 'admin' | 'member';
}

export interface Schedule {
  id: string;
  classroomId: string;
  classes: ClassSchedule[];
  semesterStartDate?: string;
  semesterEndDate?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClassSchedule {
  code: string;
  subject: any;
  id: string;
  name: string;
  instructor: string;
  day: string;
  startTime: string;
  endTime: string;
  location: string;
}