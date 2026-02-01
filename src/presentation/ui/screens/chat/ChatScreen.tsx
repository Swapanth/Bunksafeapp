import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    AppState,
    AppStateStatus,
    BackHandler,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { ChatMessage, chatService } from '../../../../data/services/ChatService';
import { chatStateTracker } from '../../../../data/services/ChatStateTracker';
import { useTheme } from '../../../context/ThemeContext';

interface ChatScreenProps {
  contactId: string;
  contactName: string;
  contactAvatar: string;
  contactStatus: 'online' | 'offline' | 'studying' | 'away';
  isClassroomChat?: boolean;
  classroomName?: string;
  onBack?: () => void;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar: string;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  contactId,
  contactName,
  contactAvatar,
  contactStatus = 'online',
  isClassroomChat = false,
  classroomName = 'Computer Science 101',
  onBack,
  currentUserId,
  currentUserName,
  currentUserAvatar
}) => {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isScreenActive, setIsScreenActive] = useState(true);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const isMountedRef = useRef(true);
  const isVisibleRef = useRef(true);
  const lastInteractionRef = useRef<number>(Date.now());

  // Update last interaction time on any user activity
  const updateLastInteraction = () => {
    lastInteractionRef.current = Date.now();
  };

  // Track if component is still visible/mounted
  useEffect(() => {
    isMountedRef.current = true;
    isVisibleRef.current = true;
    lastInteractionRef.current = Date.now();
    console.log('💬 ChatScreen mounted/visible');

    // For web: listen to visibility changes
    const handleVisibilityChange = () => {
      if (Platform.OS === 'web') {
        const isHidden = (document as any).hidden;
        console.log('🌐 Document visibility changed:', isHidden ? 'hidden' : 'visible');
        if (isHidden) {
          console.log('🔕 Page hidden - clearing active conversation');
          isVisibleRef.current = false;
          chatStateTracker.clearActiveConversation();
        } else if (isVisibleRef.current && conversationId) {
          console.log('🔔 Page visible - restoring active conversation');
          chatStateTracker.setActiveConversation(conversationId);
        }
      }
    };

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      isMountedRef.current = false;
      isVisibleRef.current = false;
      console.log('💬 ChatScreen unmounted/hidden - clearing active conversation');
      chatStateTracker.clearActiveConversation();

      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [conversationId]);

  // Handle Android back button in chat screen
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (onBack) {
        onBack();
        return true; // Prevent default behavior
      }
      return false; // Allow default if no onBack handler
    });

    return () => backHandler.remove();
  }, [onBack]);

  // Handle app state changes (foreground/background)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      console.log('📱 ChatScreen - App state changed:', appStateRef.current, '->', nextAppState);

      // When app goes to background or inactive, clear active conversation
      if (appStateRef.current === 'active' && nextAppState.match(/inactive|background/)) {
        console.log('🔕 App going to background - clearing active conversation');
        setIsScreenActive(false);
        isVisibleRef.current = false;
        chatStateTracker.clearActiveConversation();
      }
      // When app comes back to foreground, restore active conversation if this screen is visible
      else if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('🔔 App coming to foreground');
        if (conversationId && isScreenActive && isMountedRef.current && isVisibleRef.current) {
          console.log('✅ Restoring active conversation:', conversationId);
          chatStateTracker.setActiveConversation(conversationId);
        }
      }

      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [conversationId, isScreenActive]);

  // Initialize conversation and subscribe to messages
  useEffect(() => {
    let unsubscribeMessages: (() => void) | null = null;

    const initializeChat = async () => {
      try {
        setIsLoading(true);
        setIsScreenActive(true);
        console.log('💬 Initializing chat with:', contactName);

        // Get or create conversation
        const convId = await chatService.getOrCreateConversation(
          currentUserId,
          currentUserName,
          currentUserAvatar,
          contactId,
          contactName,
          contactAvatar
        );
        setConversationId(convId);

        // Register this chat as active
        console.log('✅ Setting active conversation:', convId);
        chatStateTracker.setActiveConversation(convId);

        // Subscribe to messages
        unsubscribeMessages = chatService.subscribeToMessages(convId, (newMessages) => {
          setMessages(newMessages);
          setIsLoading(false);
        });

        // Mark messages as read
        await chatService.markMessagesAsRead(convId, currentUserId);
      } catch (error) {
        console.error('❌ Error initializing chat:', error);
        setIsLoading(false);
        Alert.alert('Error', 'Failed to load chat. Please try again.');
      }
    };

    initializeChat();

    return () => {
      console.log('🧹 ChatScreen cleanup - clearing active conversation');
      if (unsubscribeMessages) {
        unsubscribeMessages();
      }
      // Clear active conversation when leaving chat screen
      setIsScreenActive(false);
      chatStateTracker.clearActiveConversation();
    };
  }, [contactId, currentUserId]);

  // Mark messages as read when screen is focused
  useEffect(() => {
    if (conversationId) {
      chatService.markMessagesAsRead(conversationId, currentUserId);
    }
  }, [conversationId, currentUserId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return '#10b981';
      case 'studying':
        return '#f59e0b';
      case 'away':
        return '#6b7280';
      case 'offline':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return 'Active now';
      case 'studying':
        return 'Studying';
      case 'away':
        return 'Away';
      case 'offline':
        return 'Last seen recently';
      default:
        return 'Last seen recently';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes < 1 ? 'now' : `${minutes}m`;
    } else if (hours < 24) {
      return `${hours}h`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() && conversationId) {
      updateLastInteraction(); // Mark activity
      const messageText = newMessage.trim();
      setNewMessage(''); // Clear input immediately for better UX

      try {
        await chatService.sendMessage(
          conversationId,
          currentUserId,
          currentUserName,
          currentUserAvatar,
          messageText,
          'text'
        );

        // Scroll to bottom after sending
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } catch (error) {
        console.error('❌ Error sending message:', error);
        Alert.alert('Error', 'Failed to send message. Please try again.');
        setNewMessage(messageText); // Restore message on error
      }
    }
  };

  const handleBackPress = () => {
    console.log('⬅️ Back button pressed - marking screen as inactive');
    setIsScreenActive(false);
    isMountedRef.current = false;
    isVisibleRef.current = false; // Immediate clear
    console.log('🔕 Immediately clearing active conversation');
    chatStateTracker.clearActiveConversation();

    if (onBack) {
      onBack();
    }
  };

  const handleClearChat = () => {
    console.log('🔴 handleClearChat called - showing alert');
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to delete all messages in this conversation? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            console.log('❌ User cancelled clear chat');
            setShowOptionsMenu(false);
          },
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            console.log('🔴 Clear button pressed in alert');
            setShowOptionsMenu(false);
            
            console.log('📋 ConversationId:', conversationId);
            
            if (!conversationId) {
              console.error('❌ No conversation ID found');
              Alert.alert('Error', 'No conversation to clear');
              return;
            }

            try {
              console.log('🗑️ Starting clear chat for conversation:', conversationId);
              
              // Clear messages from database
              await chatService.clearAllMessages(conversationId);
              
              console.log('✅ Chat cleared successfully from database');
              // Messages will be cleared automatically through the subscription
              Alert.alert('Success', 'Chat cleared successfully');
            } catch (error) {
              console.error('❌ Error in handleClearChat:', error);
              if (error instanceof Error) {
                console.error('❌ Error details:', error.message);
                Alert.alert('Error', `Failed to clear chat: ${error.message}`);
              } else {
                Alert.alert('Error', 'Failed to clear chat. Please try again.');
              }
            }
          },
        },
      ]
    );
  };

  const handleToggleTheme = () => {
    toggleTheme();
    setShowOptionsMenu(false);
  };

  // Additional safety: Clear active conversation if component becomes inactive
  // This handles cases where navigation happens without unmounting or pressing back
  // Also implements auto-clear after inactivity (user probably navigated away)
  useEffect(() => {
    let hasCleared = false; // Track if we've already cleared to avoid spam

    const checkInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastInteraction = now - lastInteractionRef.current;

      // Only proceed if we haven't already cleared
      if (hasCleared) return;

      // If no interaction for 3 seconds, assume user navigated away
      if (timeSinceLastInteraction > 3000 && conversationId) {
        console.log('⚠️ No interaction for 3+ seconds - clearing active conversation');
        chatStateTracker.clearActiveConversation();
        setIsScreenActive(false);
        hasCleared = true;
      }

      // Also check if screen is marked inactive
      if ((!isScreenActive || !isMountedRef.current || !isVisibleRef.current) && conversationId) {
        console.log('⚠️ Safety check: Screen inactive but conversation still set, clearing...');
        chatStateTracker.clearActiveConversation();
        hasCleared = true;
      }
    }, 500); // Check every 500ms for faster response

    return () => {
      clearInterval(checkInterval);
    };
  }, [isScreenActive, conversationId]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 16, color: theme.colors.textSecondary, fontSize: 16, fontWeight: '500' }}>
          Loading chat...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} 
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
        {/* Header - Elevated with subtle shadow */}
        <View style={{ backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
          <View className="px-4 pt-12 pb-3">
            <View className="flex-row items-center">
              <TouchableOpacity 
                onPress={handleBackPress} 
                className="mr-3 p-2 -ml-2"
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={26} color={theme.colors.iconColor} />
              </TouchableOpacity>

              {/* Avatar with status indicator */}
              <View className="relative mr-3">
                <View className="w-11 h-11 rounded-full bg-gradient-to-br from-green-400 to-green-600 items-center justify-center shadow-sm">
                  <Text className="text-white text-lg font-semibold">
                    {contactAvatar}
                  </Text>
                </View>
                <View 
                  className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white"
                  style={{ backgroundColor: getStatusColor(contactStatus) }}
                />
              </View>

              {/* Contact info */}
              <View className="flex-1">
                <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '600', letterSpacing: -0.5 }}>
                  {contactName}
                </Text>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 14, fontWeight: '500', marginTop: 2 }}>
                  {isClassroomChat ? `in ${classroomName}` : getStatusText(contactStatus)}
                </Text>
              </View>

              {/* More options button */}
              <TouchableOpacity 
                className="p-2" 
                activeOpacity={0.7}
                onPress={() => setShowOptionsMenu(!showOptionsMenu)}
              >
                <Ionicons name="ellipsis-vertical" size={22} color={theme.colors.iconColorSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Options Menu Dropdown */}
        {showOptionsMenu && (
          <View style={{ position: 'absolute', top: 96, right: 16, backgroundColor: theme.colors.card, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, width: 200, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5, zIndex: 50 }}>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight }}
              activeOpacity={0.7}
              onPress={handleToggleTheme}
            >
              <Ionicons 
                name={isDarkMode ? "sunny" : "moon"} 
                size={20} 
                color={theme.colors.iconColorSecondary} 
              />
              <Text style={{ marginLeft: 12, color: theme.colors.text, fontSize: 16 }}>
                {isDarkMode ? 'Light Theme' : 'Dark Theme'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center px-4 py-3"
              activeOpacity={0.7}
              onPress={() => {
                console.log('🔴 Clear Chat button clicked in menu');
                handleClearChat();
              }}
            >
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
              <Text className="ml-3 text-red-500 text-base">
                Clear Chat
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Overlay to close menu when clicking outside */}
        {showOptionsMenu && (
          <TouchableOpacity 
            className="absolute inset-0 z-40"
            activeOpacity={1}
            onPress={() => setShowOptionsMenu(false)}
          />
        )}

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4"
          contentContainerStyle={{ paddingVertical: 16, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 ? (
            <View className="items-center justify-center py-20">
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: isDarkMode ? theme.colors.surface : '#d1fae5', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Text className="text-4xl">{contactAvatar}</Text>
              </View>
              <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '600', marginBottom: 8 }}>
                Start a conversation
              </Text>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 16, textAlign: 'center', paddingHorizontal: 32 }}>
                Send a message to {contactName}
              </Text>
            </View>
          ) : (
            messages.map((message, index) => {
              const isMyMessage = message.senderId === currentUserId;
              const showAvatar =
                !isMyMessage &&
                (index === 0 ||
                  messages[index - 1].senderId !== message.senderId ||
                  message.timestamp.getTime() - messages[index - 1].timestamp.getTime() > 300000);

              return (
                <View
                  key={message.id}
                  className={`flex-row mb-3 ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Avatar for received messages */}
                  {!isMyMessage && (
                    <View className="mr-2" style={{ width: 32 }}>
                      {showAvatar ? (
                        <View className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 items-center justify-center">
                          <Text className="text-white text-sm font-medium">
                            {message.senderAvatar}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  )}

                  <View className={`flex-1 ${isMyMessage ? 'items-end' : 'items-start'}`}>
                    {/* Sender name for classroom chats */}
                    {!isMyMessage && showAvatar && isClassroomChat && (
                      <Text style={{ color: theme.colors.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 4, marginLeft: 4 }}>
                        {message.senderName}
                      </Text>
                    )}

                    {/* Message bubble */}
                    <View
                      style={{
                        maxWidth: '75%',
                        borderRadius: 16,
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        backgroundColor: message.type === 'study-session'
                          ? (isDarkMode ? '#78350f' : '#fef3c7')
                          : isMyMessage
                          ? theme.colors.primary
                          : theme.colors.chatBubbleReceived,
                        borderWidth: message.type === 'study-session' ? 1 : (isMyMessage ? 0 : 1),
                        borderColor: message.type === 'study-session' ? (isDarkMode ? '#92400e' : '#fcd34d') : theme.colors.border,
                        shadowColor: isMyMessage ? theme.colors.primary : theme.colors.shadow,
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: isMyMessage ? 0.15 : 0.08,
                        shadowRadius: 3,
                        elevation: 2,
                      }}
                    >
                      {message.type === 'study-session' ? (
                        <Text className="text-amber-900 text-sm font-medium leading-5">
                          📚 {message.content}
                        </Text>
                      ) : (
                        <Text
                          style={{
                            fontSize: 16,
                            lineHeight: 20,
                            color: isMyMessage ? '#ffffff' : theme.colors.chatBubbleText
                          }}
                        >
                          {message.content}
                        </Text>
                      )}

                      {/* Timestamp and read status */}
                      <View className="flex-row items-center justify-end mt-1">
                        <Text
                          style={{
                            fontSize: 12,
                            color: isMyMessage ? '#d1fae5' : theme.colors.textTertiary
                          }}
                        >
                          {formatTime(message.timestamp)}
                        </Text>
                        {isMyMessage && (
                          <Ionicons
                            name={message.isRead ? 'checkmark-done' : 'checkmark'}
                            size={14}
                            color={message.isRead ? '#d1fae5' : '#a7f3d0'}
                            style={{ marginLeft: 4 }}
                          />
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Message Input - Fixed at bottom */}
        <View style={{ backgroundColor: theme.colors.surface, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingHorizontal: 16, paddingVertical: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.chatInputBackground, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: theme.colors.border }}>
            {/* Attachment button */}
            <TouchableOpacity className="mr-3 p-1" activeOpacity={0.7}>
              <Ionicons name="add-circle-outline" size={24} color={theme.colors.primary} />
            </TouchableOpacity>

            {/* Text input */}
            <TextInput
              value={newMessage}
              onChangeText={(text) => {
                setNewMessage(text);
                updateLastInteraction();
              }}
              onFocus={updateLastInteraction}
              placeholder="Type a message..."
              placeholderTextColor={theme.colors.placeholder}
              style={{ flex: 1, fontSize: 16, color: theme.colors.text, paddingVertical: 8, fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto' }}
              multiline
              maxLength={1000}
              returnKeyType="send"
              onSubmitEditing={handleSendMessage}
              blurOnSubmit={false}
            />

            {/* Send button */}
            <TouchableOpacity
              onPress={handleSendMessage}
              className={`ml-3 p-2 rounded-full ${
                newMessage.trim() ? 'bg-green-600' : 'bg-gray-200'
              }`}
              activeOpacity={0.8}
              disabled={!newMessage.trim()}
              style={{
                shadowColor: '#10b981',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: newMessage.trim() ? 0.3 : 0,
                shadowRadius: 4,
                elevation: newMessage.trim() ? 3 : 0,
              }}
            >
              <Ionicons
                name="send"
                size={20}
                color={newMessage.trim() ? '#ffffff' : '#9ca3af'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
  );
};

ChatScreen.displayName = 'ChatScreen';