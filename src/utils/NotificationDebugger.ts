import { chatStateTracker } from '../data/services/ChatStateTracker';
import { NotificationBackendService } from '../data/services/NotificationBackendService';
import { NotificationClientService } from '../data/services/NotificationClientService';

/**
 * Utility class to help debug notification issues
 */
export class NotificationDebugger {
  static async checkNotificationSetup(userId: string): Promise<void> {
    console.log('\n=== 🔍 NOTIFICATION DEBUG REPORT ===\n');
    
    try {
      // 1. Check Client Service
      console.log('1️⃣ Checking Notification Client Service...');
      const clientService = NotificationClientService.getInstance();
      const pushToken = clientService.getExpoPushToken();
      
      if (pushToken) {
        console.log('✅ Push token exists:', pushToken.substring(0, 30) + '...');
      } else {
        console.log('❌ No push token found');
      }
      
      // 2. Check Backend Settings
      console.log('\n2️⃣ Checking Backend Notification Settings...');
      const backendService = NotificationBackendService.getInstance();
      const settings = await backendService.getUserNotificationSettings(userId);
      
      if (settings) {
        console.log('✅ User settings found:');
        console.log('   - Message Notifications:', settings.messageNotifications ?? 'undefined (defaults to true)');
        console.log('   - Task Created:', settings.taskCreated);
        console.log('   - Push Token:', settings.expoPushToken ? settings.expoPushToken.substring(0, 30) + '...' : 'MISSING');
      } else {
        console.log('❌ No user settings found in Firestore');
      }
      
      // 3. Check App State
      console.log('\n3️⃣ Checking App State Tracker...');
      const appState = chatStateTracker.getAppState();
      console.log('   - App State:', appState);
      console.log('   - Is Active:', chatStateTracker.isAppActive());
      
      // 4. Summary
      console.log('\n=== 📊 SUMMARY ===');
      const hasToken = !!pushToken;
      const hasSettings = !!settings;
      const hasBackendToken = !!(settings?.expoPushToken);
      const notificationsEnabled = settings?.messageNotifications ?? true;
      
      if (hasToken && hasSettings && hasBackendToken && notificationsEnabled) {
        console.log('✅ Everything looks good! Notifications should work.');
      } else {
        console.log('❌ Issues detected:');
        if (!hasToken) console.log('   - Missing local push token');
        if (!hasSettings) console.log('   - Missing user settings in Firestore');
        if (hasSettings && !hasBackendToken) console.log('   - Push token not saved to Firestore');
        if (!notificationsEnabled) console.log('   - Message notifications are disabled');
      }
      
      console.log('\n=== END DEBUG REPORT ===\n');
      
    } catch (error) {
      console.error('❌ Error during debug check:', error);
    }
  }
  
  /**
   * Test sending a notification
   */
  static async testMessageNotification(
    userId: string,
    senderName: string = 'Test User',
    message: string = 'This is a test message'
  ): Promise<void> {
    console.log('\n=== 🧪 TESTING MESSAGE NOTIFICATION ===\n');
    
    try {
      const backendService = NotificationBackendService.getInstance();
      
      console.log('Attempting to send test notification...');
      console.log('To:', userId);
      console.log('From:', senderName);
      console.log('Message:', message);
      
      await backendService.triggerMessageNotification(
        userId,
        senderName,
        message,
        'test-conversation-id'
      );
      
      console.log('\n✅ Test notification sent! Check your device.\n');
    } catch (error) {
      console.error('\n❌ Test notification failed:', error, '\n');
    }
  }
  
  /**
   * Check if notification would be suppressed for a conversation
   */
  static checkSuppressionStatus(conversationId: string): void {
    console.log('\n=== 🔕 SUPPRESSION CHECK ===');
    const shouldSuppress = chatStateTracker.shouldSuppressNotification(conversationId);
    console.log('Conversation ID:', conversationId);
    console.log('Would suppress notification:', shouldSuppress);
    console.log('Reason:', shouldSuppress ? 'User is viewing this chat' : 'Notification will be sent');
    console.log('=========================\n');
  }
}

// Export for easy console access
(global as any).NotificationDebugger = NotificationDebugger;

export default NotificationDebugger;
