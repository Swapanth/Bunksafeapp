import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import {
  Classmate,
  CreateFriendRequestData,
  CreateStudyGroupData,
  Friend,
  FriendRequest,
  StudyGroup,
  UpdateFriendData,
} from "../../domain/model/Friend";

export class FirebaseFriendService {
  private readonly FRIENDS_COLLECTION = "friends";
  private readonly FRIEND_REQUESTS_COLLECTION = "friendRequests";
  private readonly STUDY_GROUPS_COLLECTION = "studyGroups";
  private readonly USERS_COLLECTION = "users";

  // Friend Requests
  async sendFriendRequest(
    fromUserId: string,
    fromUserName: string,
    fromUserAvatar: string,
    requestData: CreateFriendRequestData
  ): Promise<string> {
    try {
      console.log(
        "🔥 Sending friend request from",
        fromUserId,
        "to",
        requestData.toUserId
      );

      // Check if request already exists
      const existingRequest = await this.checkExistingFriendRequest(
        fromUserId,
        requestData.toUserId
      );
      if (existingRequest) {
        throw new Error("Friend request already sent");
      }

      const now = new Date();
      const requestToCreate = {
        fromUserId,
        toUserId: requestData.toUserId,
        fromUserName,
        fromUserAvatar,
        toUserName: requestData.toUserName,
        toUserAvatar: requestData.toUserAvatar,
        status: "pending",
        message: requestData.message || "",
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      };

      const docRef = await addDoc(
        collection(db, this.FRIEND_REQUESTS_COLLECTION),
        requestToCreate
      );
      console.log("✅ Friend request sent successfully with ID:", docRef.id);

      return docRef.id;
    } catch (error) {
      console.error("❌ Error sending friend request:", error);
      throw error;
    }
  }

  async checkExistingFriendRequest(
    fromUserId: string,
    toUserId: string
  ): Promise<boolean> {
    try {
      const q = query(
        collection(db, this.FRIEND_REQUESTS_COLLECTION),
        where("fromUserId", "==", fromUserId),
        where("toUserId", "==", toUserId),
        where("status", "==", "pending")
      );

      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error("❌ Error checking existing friend request:", error);
      return false;
    }
  }

  // Subscribe to friend requests for a user
  subscribeToFriendRequests(
    userId: string,
    callback: (requests: FriendRequest[]) => void
  ): () => void {
    console.log("🔥 Subscribing to friend requests for user:", userId);

    // Use simple query without orderBy to avoid index requirement
    const q = query(
      collection(db, this.FRIEND_REQUESTS_COLLECTION),
      where("toUserId", "==", userId),
      where("status", "==", "pending")
    );

    return onSnapshot(
      q,
      (querySnapshot) => {
        const requests: FriendRequest[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          requests.push({
            id: doc.id,
            fromUserId: data.fromUserId,
            toUserId: data.toUserId,
            fromUserName: data.fromUserName,
            fromUserAvatar: data.fromUserAvatar,
            toUserName: data.toUserName,
            toUserAvatar: data.toUserAvatar,
            status: data.status,
            message: data.message,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          });
        });

        // Sort manually by createdAt (most recent first)
        requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        console.log(
          "🔄 Real-time update: received",
          requests.length,
          "friend requests"
        );
        callback(requests);
      },
      (error) => {
        console.error("❌ Error in friend requests subscription:", error);
        callback([]);
      }
    );
  }

  async acceptFriendRequest(requestId: string): Promise<void> {
    try {
      console.log("🔥 Accepting friend request:", requestId);

      // Get the request details
      const requestRef = doc(db, this.FRIEND_REQUESTS_COLLECTION, requestId);
      const requestSnap = await getDoc(requestRef);

      if (!requestSnap.exists()) {
        throw new Error("Friend request not found");
      }

      const requestData = requestSnap.data();

      // Create friendship records for both users
      await this.createFriendship(
        requestData.fromUserId,
        requestData.toUserId,
        requestData
      );
      await this.createFriendship(
        requestData.toUserId,
        requestData.fromUserId,
        {
          ...requestData,
          fromUserId: requestData.toUserId,
          toUserId: requestData.fromUserId,
          fromUserName: requestData.toUserName,
          fromUserAvatar: requestData.toUserAvatar,
          toUserName: requestData.fromUserName,
          toUserAvatar: requestData.fromUserAvatar,
        }
      );

      // Update request status
      await updateDoc(requestRef, {
        status: "accepted",
        updatedAt: Timestamp.fromDate(new Date()),
      });

      console.log("✅ Friend request accepted successfully");
    } catch (error) {
      console.error("❌ Error accepting friend request:", error);
      throw error;
    }
  }

  private async createFriendship(
    userId: string,
    friendUserId: string,
    requestData: any
  ): Promise<void> {
    const now = new Date();
    const friendshipData = {
      userId,
      friendUserId,
      name:
        userId === requestData.fromUserId
          ? requestData.toUserName
          : requestData.fromUserName,
      avatar:
        userId === requestData.fromUserId
          ? requestData.toUserAvatar
          : requestData.fromUserAvatar,
      status: "offline",
      lastSeen: Timestamp.fromDate(now),
      streak: 0,
      level: "Bronze",
      commonSubjects: [],
      isBestFriend: false,
      friendshipDate: Timestamp.fromDate(now),
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    };

    await addDoc(collection(db, this.FRIENDS_COLLECTION), friendshipData);
  }

  async declineFriendRequest(requestId: string): Promise<void> {
    try {
      console.log("🔥 Declining friend request:", requestId);

      const requestRef = doc(db, this.FRIEND_REQUESTS_COLLECTION, requestId);
      await updateDoc(requestRef, {
        status: "declined",
        updatedAt: Timestamp.fromDate(new Date()),
      });

      console.log("✅ Friend request declined successfully");
    } catch (error) {
      console.error("❌ Error declining friend request:", error);
      throw error;
    }
  }

  // Friends
  subscribeToFriends(
    userId: string,
    callback: (friends: Friend[]) => void
  ): () => void {
    console.log("🔥 Subscribing to friends for user:", userId);

    // Use simple query without orderBy to avoid index requirement
    const q = query(
      collection(db, this.FRIENDS_COLLECTION),
      where("userId", "==", userId)
    );

    return onSnapshot(
      q,
      (querySnapshot) => {
        const friends: Friend[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          friends.push({
            id: doc.id,
            userId: data.friendUserId,
            name: data.name,
            avatar: data.avatar,
            email: data.email,
            university: data.university,
            status: data.status || "offline",
            lastSeen: data.lastSeen?.toDate() || new Date(),
            streak: data.streak || 0,
            level: data.level || "Bronze",
            commonSubjects: data.commonSubjects || [],
            isBestFriend: data.isBestFriend || false,
            friendshipDate: data.friendshipDate?.toDate() || new Date(),
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          });
        });

        // Sort manually by friendshipDate (most recent first)
        friends.sort(
          (a, b) => b.friendshipDate.getTime() - a.friendshipDate.getTime()
        );

        console.log("🔄 Real-time update: received", friends.length, "friends");
        callback(friends);
      },
      (error) => {
        console.error("❌ Error in friends subscription:", error);
        callback([]);
      }
    );
  }

  async updateFriend(
    friendId: string,
    updates: UpdateFriendData
  ): Promise<void> {
    try {
      console.log("🔥 Updating friend:", friendId);

      const friendRef = doc(db, this.FRIENDS_COLLECTION, friendId);
      const updateData = {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date()),
      };

      await updateDoc(friendRef, updateData);
      console.log("✅ Friend updated successfully");
    } catch (error) {
      console.error("❌ Error updating friend:", error);
      throw error;
    }
  }

  async removeFriend(friendId: string): Promise<void> {
    try {
      console.log("🔥 Removing friend:", friendId);

      const friendRef = doc(db, this.FRIENDS_COLLECTION, friendId);
      await deleteDoc(friendRef);

      console.log("✅ Friend removed successfully");
    } catch (error) {
      console.error("❌ Error removing friend:", error);
      throw error;
    }
  }

  // Classmates (from same university/classroom)
  async getClassmates(
    userId: string,
    classroomId?: string
  ): Promise<Classmate[]> {
    try {
      console.log("🔥 Fetching classmates for user:", userId);

      // If specific classroomId is provided, get classmates from that classroom
      if (classroomId) {
        return await this.getClassmatesFromClassroom(userId, classroomId);
      }

      // Otherwise, get classmates from all classrooms the user is a member of
      const classroomsQuery = query(
        collection(db, "classrooms"),
        where("members", "array-contains", userId)
      );
      const classroomsSnapshot = await getDocs(classroomsQuery);
      
      console.log("📚 User is member of", classroomsSnapshot.size, "classrooms");

      if (classroomsSnapshot.empty) {
        console.log("⚠️ User is not a member of any classroom");
        return [];
      }

      // Get classmates from all classrooms and deduplicate
      const classmatesMap = new Map<string, Classmate>();

      for (const classroomDoc of classroomsSnapshot.docs) {
        const classroomId = classroomDoc.id;
        const classmates = await this.getClassmatesFromClassroom(userId, classroomId);
        
        // Add to map (deduplicates by userId)
        classmates.forEach(classmate => {
          if (!classmatesMap.has(classmate.userId)) {
            classmatesMap.set(classmate.userId, classmate);
          }
        });
      }

      const allClassmates = Array.from(classmatesMap.values());
      console.log("✅ Found", allClassmates.length, "unique classmates across all classrooms");
      
      return allClassmates;
    } catch (error) {
      console.error("❌ Error fetching classmates:", error);
      throw error;
    }
  }

  private async getClassmatesFromClassroom(
    userId: string,
    classroomId: string
  ): Promise<Classmate[]> {
    try {
      console.log("🔥 Fetching classmates from classroom:", classroomId);

      // Get classroom document to access members list
      const classroomRef = doc(db, "classrooms", classroomId);
      const classroomSnap = await getDoc(classroomRef);

      if (!classroomSnap.exists()) {
        console.log("⚠️ Classroom not found:", classroomId);
        return [];
      }

      const classroomData = classroomSnap.data();
      const members = classroomData.members || [];

      console.log("📋 Classroom members:", members.length, "members -", members);

      if (!members.includes(userId)) {
        console.log("⚠️ User is not a member of this classroom");
        return [];
      }

      // Get user's friends to check friendship status
      const friendsQuery = query(
        collection(db, this.FRIENDS_COLLECTION),
        where("userId", "==", userId)
      );
      const friendsSnapshot = await getDocs(friendsQuery);
      const friendIds = new Set();
      friendsSnapshot.forEach((doc) => {
        friendIds.add(doc.data().friendUserId);
      });

      // Get public profiles for classroom members
      const classmates: Classmate[] = [];

      for (const memberId of members) {
        if (memberId !== userId) {
          // Exclude current user
          try {
            console.log("👤 Fetching profile for member:", memberId);
            
            // Try userProfiles collection first
            let profileRef = doc(db, "userProfiles", memberId);
            let profileSnap = await getDoc(profileRef);

            // If not found, try users collection as fallback
            if (!profileSnap.exists()) {
              console.log("🔄 Trying users collection for:", memberId);
              profileRef = doc(db, "users", memberId);
              profileSnap = await getDoc(profileRef);
            }

            if (profileSnap.exists()) {
              const data = profileSnap.data();
              console.log("✅ Profile found for:", memberId, "- Name:", data.displayName || data.name || data.nickname);
              classmates.push({
                id: memberId,
                userId: memberId,
                name: data.displayName || data.name || data.nickname || "Unknown",
                avatar: data.avatar || "👤",
                email: data.email || "",
                status: data.status || "offline",
                lastSeen: data.lastSeen?.toDate() || new Date(),
                classroom: classroomId,
                year: data.year || "Unknown",
                isOnline: data.status === "online",
                isFriend: friendIds.has(memberId),
                friendRequestSent: false, // This would need additional logic
                commonSubjects: data.subjects || [],
              });
            } else {
              console.warn("⚠️ No profile found in userProfiles or users collection for member:", memberId);
            }
          } catch (error) {
            console.warn(
              "⚠️ Could not fetch profile for member:",
              memberId,
              error
            );
          }
        }
      }

      console.log("✅ Fetched", classmates.length, "classmates from classroom");
      return classmates;
    } catch (error) {
      console.error("❌ Error fetching classmates from classroom:", error);
      throw error;
    }
  }

  private async getClassmatesFromProfiles(
    userId: string
  ): Promise<Classmate[]> {
    try {
      console.log("🔥 Fetching classmates from public profiles");

      // Get current user's profile to find their university/school
      const currentUserProfileRef = doc(db, "userProfiles", userId);
      const currentUserProfileSnap = await getDoc(currentUserProfileRef);

      if (!currentUserProfileSnap.exists()) {
        console.log("⚠️ Current user profile not found");
        return [];
      }

      const currentUserProfile = currentUserProfileSnap.data();
      const university =
        currentUserProfile.university || currentUserProfile.school;

      if (!university) {
        console.log("⚠️ User has no university/school information");
        return [];
      }

      // Query public profiles from same university
      const q = query(
        collection(db, "userProfiles"),
        where("university", "==", university)
      );

      const querySnapshot = await getDocs(q);
      const classmates: Classmate[] = [];

      // Get user's friends to check friendship status
      const friendsQuery = query(
        collection(db, this.FRIENDS_COLLECTION),
        where("userId", "==", userId)
      );
      const friendsSnapshot = await getDocs(friendsQuery);
      const friendIds = new Set();
      friendsSnapshot.forEach((doc) => {
        friendIds.add(doc.data().friendUserId);
      });

      querySnapshot.forEach((doc) => {
        if (doc.id !== userId) {
          // Exclude current user
          const data = doc.data();
          classmates.push({
            id: doc.id,
            userId: doc.id,
            name: data.displayName || data.name || "Unknown",
            avatar: data.avatar || "👤",
            email: data.email || "",
            status: data.status || "offline",
            lastSeen: data.lastSeen?.toDate() || new Date(),
            classroom: data.classroomId || "Unknown",
            year: data.year || "Unknown",
            isOnline: data.status === "online",
            isFriend: friendIds.has(doc.id),
            friendRequestSent: false, // This would need additional logic
            commonSubjects: data.subjects || [],
          });
        }
      });

      console.log("✅ Fetched", classmates.length, "classmates from profiles");
      return classmates;
    } catch (error) {
      console.error("❌ Error fetching classmates from profiles:", error);
      throw error;
    }
  }

  // Study Groups
  async createStudyGroup(
    userId: string,
    userName: string,
    groupData: CreateStudyGroupData
  ): Promise<string> {
    try {
      console.log("🔥 Creating study group:", groupData.name);

      const now = new Date();
      const groupToCreate = {
        ...groupData,
        members: [userId],
        memberDetails: [
          {
            userId,
            name: userName,
            avatar: "👤", // This should come from user profile
            role: "admin",
          },
        ],
        createdBy: userId,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      };

      const docRef = await addDoc(
        collection(db, this.STUDY_GROUPS_COLLECTION),
        groupToCreate
      );
      console.log("✅ Study group created successfully with ID:", docRef.id);

      return docRef.id;
    } catch (error) {
      console.error("❌ Error creating study group:", error);
      throw error;
    }
  }

  subscribeToStudyGroups(
    userId: string,
    callback: (groups: StudyGroup[]) => void
  ): () => void {
    console.log("🔥 Subscribing to study groups for user:", userId);

    // Use simple query without orderBy to avoid index requirement
    // We'll sort the results manually on the client side
    const q = query(
      collection(db, this.STUDY_GROUPS_COLLECTION),
      where("members", "array-contains", userId)
    );

    return onSnapshot(
      q,
      (querySnapshot) => {
        const groups: StudyGroup[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          groups.push({
            id: doc.id,
            name: data.name,
            description: data.description,
            subject: data.subject,
            members: data.members || [],
            memberDetails: data.memberDetails || [],
            nextSession: data.nextSession?.toDate(),
            color: data.color,
            isPublic: data.isPublic || false,
            classroomId: data.classroomId,
            createdBy: data.createdBy,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          });
        });

        // Sort manually by updatedAt (most recent first)
        groups.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

        console.log(
          "🔄 Real-time update: received",
          groups.length,
          "study groups"
        );
        callback(groups);
      },
      (error) => {
        console.error("❌ Error in study groups subscription:", error);
        callback([]);
      }
    );
  }

  async joinStudyGroup(
    groupId: string,
    userId: string,
    userName: string
  ): Promise<void> {
    try {
      console.log("🔥 Joining study group:", groupId);

      const groupRef = doc(db, this.STUDY_GROUPS_COLLECTION, groupId);
      await updateDoc(groupRef, {
        members: arrayUnion(userId),
        memberDetails: arrayUnion({
          userId,
          name: userName,
          avatar: "👤",
          role: "member",
        }),
        updatedAt: Timestamp.fromDate(new Date()),
      });

      console.log("✅ Joined study group successfully");
    } catch (error) {
      console.error("❌ Error joining study group:", error);
      throw error;
    }
  }

  async leaveStudyGroup(groupId: string, userId: string): Promise<void> {
    try {
      console.log("🔥 Leaving study group:", groupId);

      const groupRef = doc(db, this.STUDY_GROUPS_COLLECTION, groupId);

      // Get current group data to find the member details to remove
      const groupSnap = await getDoc(groupRef);
      if (groupSnap.exists()) {
        const groupData = groupSnap.data();
        const memberToRemove = groupData.memberDetails?.find(
          (member: any) => member.userId === userId
        );

        await updateDoc(groupRef, {
          members: arrayRemove(userId),
          memberDetails: memberToRemove
            ? arrayRemove(memberToRemove)
            : arrayRemove({ userId }),
          updatedAt: Timestamp.fromDate(new Date()),
        });
      }

      console.log("✅ Left study group successfully");
    } catch (error) {
      console.error("❌ Error leaving study group:", error);
      throw error;
    }
  }
}
