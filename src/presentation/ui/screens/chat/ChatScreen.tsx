import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

interface Message {
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

interface ChatScreenProps {
  contactId: string;
  contactName: string;
  contactAvatar: string;
  contactStatus: 'online' | 'offline' | 'studying' | 'away';
  isClassroomChat?: boolean;
  classroomName?: string;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  contactId = 'c1',
  contactName = 'Sarah Williams',
  contactAvatar = '👩‍🎓',
  contactStatus = 'online',
  isClassroomChat = false,
  classroomName = 'Computer Science 101'
}) => {
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: '1',
      senderId: 'c1',
      senderName: 'Sarah Williams',
      senderAvatar: '👩‍🎓',
      content: 'Hey! Are you ready for tomorrow\'s exam?',
      timestamp: new Date(Date.now() - 3600000),
      type: 'text',
      isRead: true,
    },
    {
      id: '2',
      senderId: 'me',
      senderName: 'You',
      senderAvatar: '👤',
      content: 'Yeah, I\'ve been studying all week. How about you?',
      timestamp: new Date(Date.now() - 3500000),
      type: 'text',
      isRead: true,
    },
    {
      id: '3',
      senderId: 'c1',
      senderName: 'Sarah Williams',
      senderAvatar: '👩‍🎓',
      content: 'Same here! Want to have a quick review session before class?',
      timestamp: new Date(Date.now() - 3400000),
      type: 'text',
      isRead: true,
    },
    {
      id: '4',
      senderId: 'me',
      senderName: 'You',
      senderAvatar: '👤',
      content: 'That sounds great! Should we meet in the library?',
      timestamp: new Date(Date.now() - 300000),
      type: 'text',
      isRead: false,
    },
  ]);

  const [newMessage, setNewMessage] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);

  const scrollViewRef = React.useRef<ScrollView>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#10b981';
      case 'studying': return '#f59e0b';
      case 'away': return '#6b7280';
      case 'offline': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Active now';
      case 'studying': return 'Studying';
      case 'away': return 'Away';
      case 'offline': return 'Last seen recently';
      default: return 'Last seen recently';
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

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: Date.now().toString(),
        senderId: 'me',
        senderName: 'You',
        senderAvatar: '👤',
        content: newMessage.trim(),
        timestamp: new Date(),
        type: 'text',
        isRead: false,
      };
      
      setMessages(prev => [...prev, message]);
      setNewMessage('');
      
      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleStartStudySession = () => {
    Alert.alert(
      'Start Study Session',
      `Would you like to start a study session with ${contactName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start Session', 
          onPress: () => {
            const message: Message = {
              id: Date.now().toString(),
              senderId: 'me',
              senderName: 'You',
              senderAvatar: '👤',
              content: `Started a study session`,
              timestamp: new Date(),
              type: 'study-session',
              isRead: false,
            };
            setMessages(prev => [...prev, message]);
          }
        }
      ]
    );
  };

  const handleCallUser = () => {
    Alert.alert('Video Call', `Calling ${contactName}...`);
  };

  const handleMoreActions = () => {
    Alert.alert(
      contactName,
      'Choose an action',
      [
        { text: 'View Profile', onPress: () => console.log('View Profile') },
        { text: 'Start Study Session', onPress: handleStartStudySession },
        { text: 'Share Location', onPress: () => console.log('Share Location') },
        { text: 'Block User', style: 'destructive', onPress: () => console.log('Block User') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  React.useEffect(() => {
    // Simulate typing indicator
    const interval = setInterval(() => {
      setIsTyping(prev => !prev);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <KeyboardAvoidingView 
      className="flex-1" 
      style={{ backgroundColor: '#fafafa' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View className="bg-white border-b border-gray-100 pt-12 pb-4 px-6">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity className="mr-4">
              <Ionicons name="arrow-back" size={24} color="#6b7280" />
            </TouchableOpacity>
            
            <View className="relative mr-3">
              <Text className="text-2xl">{contactAvatar}</Text>
              <View 
                className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-white"
                style={{ backgroundColor: getStatusColor(contactStatus) }}
              />
            </View>
            
            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-800">
                {contactName}
              </Text>
              <Text className="text-sm text-gray-600">
                {isClassroomChat ? `in ${classroomName}` : getStatusText(contactStatus)}
                {isTyping && contactStatus === 'online' && !isClassroomChat && (
                  <Text className="text-green-500"> • typing...</Text>
                )}
              </Text>
            </View>
          </View>
          
          <View className="flex-row space-x-3">
            <TouchableOpacity onPress={handleCallUser}>
              <Ionicons name="videocam-outline" size={24} color="#6b7280" />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handleMoreActions}>
              <Ionicons name="ellipsis-vertical" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Messages */}
      <ScrollView 
        ref={scrollViewRef}
        className="flex-1 px-4 py-4"
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((message, index) => {
          const isMyMessage = message.senderId === 'me';
          const showAvatar = !isMyMessage && (
            index === 0 || 
            messages[index - 1].senderId !== message.senderId ||
            message.timestamp.getTime() - messages[index - 1].timestamp.getTime() > 300000
          );
          
          return (
            <View
              key={message.id}
              className={`flex-row mb-3 ${isMyMessage ? 'justify-end' : 'justify-start'}`}
            >
              {!isMyMessage && (
                <View className="mr-2" style={{ width: 32 }}>
                  {showAvatar ? (
                    <Text className="text-xl">{message.senderAvatar}</Text>
                  ) : null}
                </View>
              )}
              
              <View
                className={`max-w-3/4 px-4 py-3 rounded-2xl ${
                  isMyMessage 
                    ? 'bg-green-500' 
                    : message.type === 'study-session'
                    ? 'bg-green-100 border border-green-200'
                    : 'bg-white border border-gray-200'
                }`}
              >
                {!isMyMessage && showAvatar && isClassroomChat && (
                  <Text className="text-xs font-semibold text-gray-700 mb-1">
                    {message.senderName}
                  </Text>
                )}
                
                {message.type === 'study-session' ? (
                  <View className="flex-row items-center">
                    <Ionicons name="book" size={16} color="#10b981" />
                    <Text className="text-green-700 font-semibold ml-2">
                      {message.content}
                    </Text>
                  </View>
                ) : (
                  <Text 
                    className={`text-base ${
                      isMyMessage ? 'text-white' : 'text-gray-800'
                    }`}
                  >
                    {message.content}
                  </Text>
                )}
                
                <View className={`flex-row items-center justify-end mt-1 ${
                  isMyMessage ? 'space-x-1' : ''
                }`}>
                  <Text 
                    className={`text-xs ${
                      isMyMessage ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </Text>
                  
                  {isMyMessage && (
                    <Ionicons 
                      name={message.isRead ? 'checkmark-done' : 'checkmark'} 
                      size={12} 
                      color="#dbeafe" 
                    />
                  )}
                </View>
              </View>
            </View>
          );
        })}
        
        {/* Typing Indicator */}
        {isTyping && contactStatus === 'online' && (
          <View className="flex-row items-center mb-3">
            <View className="mr-2" style={{ width: 32 }}>
              <Text className="text-xl">{contactAvatar}</Text>
            </View>
            <View className="bg-gray-200 px-4 py-3 rounded-2xl">
              <View className="flex-row space-x-1">
                <View className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" />
                <View className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                <View className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Message Input */}
      <View className="bg-white border-t border-gray-100 p-4">
        <View className="flex-row items-end space-x-3">
          <TouchableOpacity className="p-2">
            <Ionicons name="add" size={24} color="#6b7280" />
          </TouchableOpacity>
          
          <View className="flex-1 bg-gray-100 rounded-2xl px-4 py-3">
            <TextInput
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type a message..."
              className="text-base text-gray-800"
              multiline
              maxLength={1000}
              returnKeyType="send"
              onSubmitEditing={handleSendMessage}
            />
          </View>
          
          <TouchableOpacity onPress={handleStartStudySession} className="p-2">
            <Ionicons name="book-outline" size={24} color="#6b7280" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={handleSendMessage}
            className="bg-green-500 p-2 rounded-full"
            disabled={!newMessage.trim()}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color="#ffffff" 
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

ChatScreen.displayName = 'ChatScreen';
