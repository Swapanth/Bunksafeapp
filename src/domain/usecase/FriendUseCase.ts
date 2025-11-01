import { FirebaseFriendService } from "../../data/services/FriendService";
import {
    Classmate,
    CreateFriendRequestData,
    CreateStudyGroupData,
    Friend,
    FriendRequest,
    StudyGroup,
    UpdateFriendData
} from "../model/Friend";

export class FriendUseCase {
  private friendService: FirebaseFriendService;

  constructor() {
    this.friendService = new FirebaseFriendService();
  }

  // Friend Requests
  async sendFriendRequest(fromUserId: string, fromUserName: string, fromUserAvatar: string, requestData: CreateFriendRequestData): Promise<string> {
    return this.friendService.sendFriendRequest(fromUserId, fromUserName, fromUserAvatar, requestData);
  }

  subscribeToFriendRequests(userId: string, callback: (requests: FriendRequest[]) => void): () => void {
    return this.friendService.subscribeToFriendRequests(userId, callback);
  }

  async acceptFriendRequest(requestId: string): Promise<void> {
    return this.friendService.acceptFriendRequest(requestId);
  }

  async declineFriendRequest(requestId: string): Promise<void> {
    return this.friendService.declineFriendRequest(requestId);
  }

  // Friends
  subscribeToFriends(userId: string, callback: (friends: Friend[]) => void): () => void {
    return this.friendService.subscribeToFriends(userId, callback);
  }

  async updateFriend(friendId: string, updates: UpdateFriendData): Promise<void> {
    return this.friendService.updateFriend(friendId, updates);
  }

  async removeFriend(friendId: string): Promise<void> {
    return this.friendService.removeFriend(friendId);
  }

  async toggleBestFriend(friendId: string, isBestFriend: boolean): Promise<void> {
    return this.friendService.updateFriend(friendId, { isBestFriend });
  }

  // Classmates
  async getClassmates(userId: string, classroomId?: string): Promise<Classmate[]> {
    return this.friendService.getClassmates(userId, classroomId);
  }

  // Study Groups
  async createStudyGroup(userId: string, userName: string, groupData: CreateStudyGroupData): Promise<string> {
    return this.friendService.createStudyGroup(userId, userName, groupData);
  }

  subscribeToStudyGroups(userId: string, callback: (groups: StudyGroup[]) => void): () => void {
    return this.friendService.subscribeToStudyGroups(userId, callback);
  }

  async joinStudyGroup(groupId: string, userId: string, userName: string): Promise<void> {
    return this.friendService.joinStudyGroup(groupId, userId, userName);
  }

  async leaveStudyGroup(groupId: string, userId: string): Promise<void> {
    return this.friendService.leaveStudyGroup(groupId, userId);
  }
}