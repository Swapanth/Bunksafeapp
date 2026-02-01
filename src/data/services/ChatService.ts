import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where,
    writeBatch
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { chatStateTracker } from './ChatStateTracker';
import { NotificationBackendService } from './NotificationBackendService';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'image' | 'file' | 'study-session';
  isRead: boolean;
  replyTo?: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  participantDetails: {
    [userId: string]: {
      name: string;
      avatar: string;
    };
  };
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: {
    [userId: string]: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export class FirebaseChatService {
  private readonly CONVERSATIONS_COLLECTION = 'conversations';
  private readonly MESSAGES_COLLECTION = 'messages';
  private notificationService: NotificationBackendService;

  constructor() {
    this.notificationService = NotificationBackendService.getInstance();
  }

  /**
   * Get or create a conversation between two users
   */
  async getOrCreateConversation(
    userId1: string,
    user1Name: string,
    user1Avatar: string,
    userId2: string,
    user2Name: string,
    user2Avatar: string
  ): Promise<string> {
    try {
      // Check if conversation already exists
      const conversationsRef = collection(db, this.CONVERSATIONS_COLLECTION);
      const q = query(
        conversationsRef,
        where('participants', 'array-contains', userId1)
      );

      const snapshot = await getDocs(q);
      const existingConversation = snapshot.docs.find(doc => {
        const participants = doc.data().participants as string[];
        return participants.includes(userId2);
      });

      if (existingConversation) {
        console.log('💬 Found existing conversation:', existingConversation.id);
        return existingConversation.id;
      }

      // Create new conversation
      console.log('💬 Creating new conversation between', userId1, 'and', userId2);
      const newConversation: Omit<Conversation, 'id'> = {
        participants: [userId1, userId2],
        participantDetails: {
          [userId1]: { name: user1Name, avatar: user1Avatar },
          [userId2]: { name: user2Name, avatar: user2Avatar },
        },
        unreadCount: {
          [userId1]: 0,
          [userId2]: 0,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await addDoc(conversationsRef, {
        ...newConversation,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log('✅ Created conversation:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error getting/creating conversation:', error);
      throw error;
    }
  }

  /**
   * Send a message in a conversation
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    senderName: string,
    senderAvatar: string,
    content: string,
    type: 'text' | 'image' | 'file' | 'study-session' = 'text',
    replyTo?: string
  ): Promise<string> {
    try {
      console.log('💬 Sending message in conversation:', conversationId);

      const messagesRef = collection(
        db,
        this.CONVERSATIONS_COLLECTION,
        conversationId,
        this.MESSAGES_COLLECTION
      );

      const messageData = {
        senderId,
        senderName,
        senderAvatar,
        content,
        type,
        isRead: false,
        timestamp: serverTimestamp(),
        ...(replyTo && { replyTo }),
      };

      const docRef = await addDoc(messagesRef, messageData);

      // Update conversation metadata
      const conversationRef = doc(db, this.CONVERSATIONS_COLLECTION, conversationId);
      const conversationDoc = await getDoc(conversationRef);
      
      if (conversationDoc.exists()) {
        const data = conversationDoc.data();
        const participants = data.participants as string[];
        const otherUserId = participants.find(id => id !== senderId);
        
        const unreadCount = data.unreadCount || {};
        if (otherUserId) {
          unreadCount[otherUserId] = (unreadCount[otherUserId] || 0) + 1;
        }

        await updateDoc(conversationRef, {
          lastMessage: content,
          lastMessageTime: serverTimestamp(),
          updatedAt: serverTimestamp(),
          unreadCount,
        });

        // Send push notification to recipient if they're not viewing this chat
        if (otherUserId) {
          const shouldSuppress = chatStateTracker.shouldSuppressNotification(conversationId);
          
          console.log('💬 Message sent to:', otherUserId, '| Should suppress notification:', shouldSuppress);
          
          if (!shouldSuppress) {
            console.log('📩 Attempting to send message notification to:', otherUserId);
            // Send notification asynchronously, don't wait for it
            this.notificationService.triggerMessageNotification(
              otherUserId,
              senderName,
              content,
              conversationId
            ).catch(error => {
              console.error('❌ Failed to send message notification:', error);
            });
          } else {
            console.log('🔕 Suppressing notification - user is viewing this chat');
          }
        } else {
          console.log('⚠️ No other user found in conversation');
        }
      }

      console.log('✅ Message sent:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error sending message:', error);
      throw error;
    }
  }

  /**
   * Subscribe to messages in a conversation
   */
  subscribeToMessages(
    conversationId: string,
    onMessagesUpdate: (messages: ChatMessage[]) => void
  ): () => void {
    console.log('👂 Subscribing to messages in conversation:', conversationId);

    const messagesRef = collection(
      db,
      this.CONVERSATIONS_COLLECTION,
      conversationId,
      this.MESSAGES_COLLECTION
    );

    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const messages: ChatMessage[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            senderId: data.senderId,
            senderName: data.senderName,
            senderAvatar: data.senderAvatar,
            content: data.content,
            timestamp: data.timestamp?.toDate() || new Date(),
            type: data.type || 'text',
            isRead: data.isRead || false,
            replyTo: data.replyTo,
          };
        });

        console.log('📨 Received', messages.length, 'messages');
        onMessagesUpdate(messages);
      },
      (error) => {
        console.error('❌ Error subscribing to messages:', error);
      }
    );

    return unsubscribe;
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      console.log('👁️ Marking messages as read for user:', userId);

      const messagesRef = collection(
        db,
        this.CONVERSATIONS_COLLECTION,
        conversationId,
        this.MESSAGES_COLLECTION
      );

      // Query for unread messages only
      const q = query(
        messagesRef,
        where('isRead', '==', false)
      );

      const snapshot = await getDocs(q);
      
      // Filter out messages sent by the current user and update the rest
      const updatePromises = snapshot.docs
        .filter(doc => doc.data().senderId !== userId)
        .map(doc => updateDoc(doc.ref, { isRead: true }));

      await Promise.all(updatePromises);

      // Update conversation unread count
      const conversationRef = doc(db, this.CONVERSATIONS_COLLECTION, conversationId);
      const conversationDoc = await getDoc(conversationRef);
      
      if (conversationDoc.exists()) {
        const data = conversationDoc.data();
        const unreadCount = data.unreadCount || {};
        unreadCount[userId] = 0;

        await updateDoc(conversationRef, { unreadCount });
      }

      console.log('✅ Marked', updatePromises.length, 'messages as read');
    } catch (error) {
      console.error('❌ Error marking messages as read:', error);
      throw error;
    }
  }

  /**
   * Get user's conversations
   */
  subscribeToConversations(
    userId: string,
    onConversationsUpdate: (conversations: Conversation[]) => void
  ): () => void {
    console.log('👂 Subscribing to conversations for user:', userId);

    const conversationsRef = collection(db, this.CONVERSATIONS_COLLECTION);
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const conversations: Conversation[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            participants: data.participants,
            participantDetails: data.participantDetails,
            lastMessage: data.lastMessage,
            lastMessageTime: data.lastMessageTime?.toDate(),
            unreadCount: data.unreadCount || {},
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          };
        });

        console.log('💬 Received', conversations.length, 'conversations');
        onConversationsUpdate(conversations);
      },
      (error) => {
        console.error('❌ Error subscribing to conversations:', error);
      }
    );

    return unsubscribe;
  }

  /**
   * Delete a message
   */
  async deleteMessage(conversationId: string, messageId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting message:', messageId);

      const messageRef = doc(
        db,
        this.CONVERSATIONS_COLLECTION,
        conversationId,
        this.MESSAGES_COLLECTION,
        messageId
      );

      await updateDoc(messageRef, {
        content: 'This message was deleted',
        type: 'text',
      });

      console.log('✅ Message deleted');
    } catch (error) {
      console.error('❌ Error deleting message:', error);
      throw error;
    }
  }

  /**
   * Clear all messages in a conversation
   */
  async clearAllMessages(conversationId: string): Promise<void> {
    try {
      console.log('🗑️ Clearing all messages in conversation:', conversationId);

      const messagesRef = collection(
        db,
        this.CONVERSATIONS_COLLECTION,
        conversationId,
        this.MESSAGES_COLLECTION
      );

      console.log('📂 Fetching messages from path:', `${this.CONVERSATIONS_COLLECTION}/${conversationId}/${this.MESSAGES_COLLECTION}`);
      const messagesSnapshot = await getDocs(messagesRef);
      
      console.log(`📊 Found ${messagesSnapshot.size} messages to delete`);
      
      if (messagesSnapshot.empty) {
        console.log('✅ No messages to clear');
        return;
      }

      // Use batch to delete all messages efficiently
      const batch = writeBatch(db);
      let batchCount = 0;
      
      messagesSnapshot.docs.forEach((messageDoc) => {
        console.log(`🗑️ Adding to batch: ${messageDoc.id}`);
        batch.delete(messageDoc.ref);
        batchCount++;
      });

      console.log(`📦 Committing batch deletion of ${batchCount} messages...`);
      await batch.commit();
      console.log('✅ Batch commit successful');

      // Update conversation to remove last message
      const conversationRef = doc(db, this.CONVERSATIONS_COLLECTION, conversationId);
      console.log('📝 Updating conversation document...');
      await updateDoc(conversationRef, {
        lastMessage: null,
        lastMessageTime: null,
        updatedAt: new Date(),
      });

      console.log(`✅ Successfully cleared ${messagesSnapshot.size} messages from conversation`);
    } catch (error) {
      console.error('❌ Error clearing messages:', error);
      if (error instanceof Error) {
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
      }
      throw error;
    }
  }
}

export const chatService = new FirebaseChatService();
