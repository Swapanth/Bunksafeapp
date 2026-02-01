import { AppState, AppStateStatus } from 'react-native';

/**
 * Service to track the current active chat and app state
 * Used to determine whether to send push notifications for messages
 */
export class ChatStateTracker {
  private static instance: ChatStateTracker;
  private activeConversationId: string | null = null;
  private appState: AppStateStatus = 'active';
  private appStateListener: any = null;

  private constructor() {
    this.initializeAppStateListener();
  }

  static getInstance(): ChatStateTracker {
    if (!ChatStateTracker.instance) {
      ChatStateTracker.instance = new ChatStateTracker();
    }
    return ChatStateTracker.instance;
  }

  /**
   * Initialize listener for app state changes (foreground/background)
   */
  private initializeAppStateListener(): void {
    this.appStateListener = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      console.log('📱 App state changed:', this.appState, '->', nextAppState);
      this.appState = nextAppState;
    });
  }

  /**
   * Set the currently active conversation
   * Call this when user opens a chat screen
   */
  setActiveConversation(conversationId: string): void {
    console.log('💬 Setting active conversation:', conversationId);
    console.log('   Previous:', this.activeConversationId);
    this.activeConversationId = conversationId;
  }

  /**
   * Clear the active conversation
   * Call this when user leaves a chat screen
   */
  clearActiveConversation(): void {
    // Only log and clear if there was actually an active conversation
    if (this.activeConversationId !== null) {
      console.log('💬 Clearing active conversation');
      console.log('   Previous:', this.activeConversationId);
      this.activeConversationId = null;
    }
  }

  /**
   * Check if a conversation is currently active and app is in foreground
   * Returns true if notifications should be suppressed
   */
  shouldSuppressNotification(conversationId: string): boolean {
    const isActiveChat = this.activeConversationId === conversationId;
    const isAppInForeground = this.appState === 'active';
    const shouldSuppress = isActiveChat && isAppInForeground;

    console.log('🔔 Notification check:', {
      conversationId,
      activeConversationId: this.activeConversationId,
      appState: this.appState,
      shouldSuppress,
    });

    return shouldSuppress;
  }

  /**
   * Check if app is in foreground
   */
  isAppActive(): boolean {
    return this.appState === 'active';
  }

  /**
   * Get current app state
   */
  getAppState(): AppStateStatus {
    return this.appState;
  }

  /**
   * Cleanup listener (call when app is unmounting)
   */
  cleanup(): void {
    if (this.appStateListener) {
      this.appStateListener.remove();
      this.appStateListener = null;
    }
  }
}

export const chatStateTracker = ChatStateTracker.getInstance();
