export interface Friend {
  id: string;
  userId: string; // The friend's user ID
  name: string;
  avatar: string;
  email?: string;
  university?: string;
  status: 'online' | 'studying' | 'offline' | 'away';
  lastSeen: Date;
  streak: number;
  level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  commonSubjects: string[];
  isBestFriend: boolean;
  friendshipDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromUserName: string;
  fromUserAvatar: string;
  toUserName: string;
  toUserAvatar: string;
  status: 'pending' | 'accepted' | 'declined';
  message?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Classmate {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  email?: string;
  status: 'online' | 'studying' | 'offline' | 'away';
  lastSeen: Date;
  classroom: string;
  year: string;
  isOnline: boolean;
  isFriend: boolean;
  friendRequestSent: boolean;
  mutualFriends?: number;
  commonSubjects: string[];
}

export interface StudyGroup {
  id: string;
  name: string;
  description?: string;
  subject: string;
  members: string[]; // Array of user IDs
  memberDetails?: Array<{
    userId: string;
    name: string;
    avatar: string;
    role: 'admin' | 'member';
  }>;
  nextSession?: Date;
  color: string;
  isPublic: boolean;
  classroomId?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFriendRequestData {
  toUserId: string;
  toUserName: string;
  toUserAvatar: string;
  message?: string;
}

export interface UpdateFriendData {
  isBestFriend?: boolean;
  commonSubjects?: string[];
}

export interface CreateStudyGroupData {
  name: string;
  description?: string;
  subject: string;
  color: string;
  isPublic: boolean;
  classroomId?: string;
}