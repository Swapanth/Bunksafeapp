import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface Conversation {
  id: string;
  contactId: string;
  contactName: string;
  contactAvatar: string;
  lastMessage: string;
  timestamp: Date;
  unreadCount: number;
  isOnline: boolean;
  isClassroomChat: boolean;
  classroomName?: string;
  isTyping: boolean;
  lastMessageType: 'text' | 'image' | 'file' | 'study-session';
}

export const ChatListScreen: React.FC = () => {
  const [conversations, setConversations] = React.useState<Conversation[]>([
    {
      id: '1',
      contactId: 'c1',
      contactName: 'Sarah Williams',
      contactAvatar: '👩‍🎓',
      lastMessage: 'That sounds great! Should we meet in the library?',
      timestamp: new Date(Date.now() - 300000), // 5 minutes ago
      unreadCount: 2,
      isOnline: true,
      isClassroomChat: false,
      isTyping: true,
      lastMessageType: 'text',
    },
    {
      id: '2',
      contactId: 'group1',
      contactName: 'Computer Science 101',
      contactAvatar: '📚',
      lastMessage: 'Prof. Anderson: Assignment deadline extended to Friday',
      timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
      unreadCount: 5,
      isOnline: true,
      isClassroomChat: true,
      classroomName: 'Computer Science 101',
      isTyping: false,
      lastMessageType: 'text',
    },
    {
      id: '3',
      contactId: 'c2',
      contactName: 'David Kim',
      contactAvatar: '👨‍💼',
      lastMessage: 'Thanks for the study notes!',
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      unreadCount: 0,
      isOnline: false,
      isClassroomChat: false,
      isTyping: false,
      lastMessageType: 'text',
    },
    {
      id: '4',
      contactId: 'group2',
      contactName: 'Math Study Squad',
      contactAvatar: '🧮',
      lastMessage: 'You: Started a study session',
      timestamp: new Date(Date.now() - 7200000), // 2 hours ago
      unreadCount: 0,
      isOnline: true,
      isClassroomChat: true,
      classroomName: 'Math Study Squad',
      isTyping: false,
      lastMessageType: 'study-session',
    },
    {
      id: '5',
      contactId: 'c3',
      contactName: 'Emma Wilson',
      contactAvatar: '👩‍🦰',
      lastMessage: 'Good luck with the exam tomorrow! 🍀',
      timestamp: new Date(Date.now() - 86400000), // 1 day ago
      unreadCount: 0,
      isOnline: true,
      isClassroomChat: false,
      isTyping: false,
      lastMessageType: 'text',
    },
  ]);

  const [selectedChats, setSelectedChats] = React.useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = React.useState(false);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes < 1 ? 'now' : `${minutes}m`;
    } else if (hours < 24) {
      return `${hours}h`;
    } else if (hours < 48) {
      return 'yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const getLastMessagePreview = (conversation: Conversation) => {
    if (conversation.isTyping) {
      return <Text className="text-green-500 text-sm italic">typing...</Text>;
    }
    
    let messageText = conversation.lastMessage;
    
    if (conversation.lastMessageType === 'study-session') {
      return (
        <View className="flex-row items-center">
          <Ionicons name="book" size={12} color="#10b981" />
          <Text className="text-green-600 text-sm ml-1">{messageText}</Text>
        </View>
      );
    }
    
    return (
      <Text 
        className={`text-sm ${conversation.unreadCount > 0 ? 'text-gray-800 font-medium' : 'text-gray-600'}`}
        numberOfLines={1}
      >
        {messageText}
      </Text>
    );
  };

  const handleLongPress = (conversationId: string) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedChats([conversationId]);
    }
  };

  const handleChatPress = (conversation: Conversation) => {
    if (isSelectionMode) {
      if (selectedChats.includes(conversation.id)) {
        setSelectedChats(prev => prev.filter(id => id !== conversation.id));
        if (selectedChats.length === 1) {
          setIsSelectionMode(false);
        }
      } else {
        setSelectedChats(prev => [...prev, conversation.id]);
      }
    } else {
      // Navigate to chat screen
      console.log('Opening chat with:', conversation.contactName);
    }
  };

  const handleDeleteChats = () => {
    setConversations(prev => prev.filter(conv => !selectedChats.includes(conv.id)));
    setSelectedChats([]);
    setIsSelectionMode(false);
  };

  const handleMarkAsRead = () => {
    setConversations(prev => prev.map(conv => 
      selectedChats.includes(conv.id) ? { ...conv, unreadCount: 0 } : conv
    ));
    setSelectedChats([]);
    setIsSelectionMode(false);
  };

  const totalUnreadCount = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  return (
    <View className="flex-1" style={{ backgroundColor: '#fafafa' }}>
      {/* Header */}
      <View className="bg-white border-b border-gray-100">
        <View className="px-6 pt-16 pb-6">
          {isSelectionMode ? (
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <TouchableOpacity 
                  onPress={() => {
                    setIsSelectionMode(false);
                    setSelectedChats([]);
                  }}
                  className="mr-4"
                >
                  <Ionicons name="arrow-back" size={24} color="#6b7280" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-800">
                  {selectedChats.length} selected
                </Text>
              </View>
              
              <View className="flex-row space-x-4">
                <TouchableOpacity onPress={handleMarkAsRead}>
                  <Ionicons name="checkmark-done" size={24} color="#6b7280" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDeleteChats}>
                  <Ionicons name="trash" size={24} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-3xl font-bold text-gray-800 mb-2">
                  💬 Chats
                </Text>
                <Text className="text-gray-600">
                  {totalUnreadCount > 0 ? `${totalUnreadCount} unread messages` : 'Stay connected with your study buddies'}
                </Text>
              </View>
              
              <TouchableOpacity className="bg-green-500 p-3 rounded-full">
                <Ionicons name="create-outline" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Quick Actions */}
      {!isSelectionMode && (
        <View className="px-6 py-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row space-x-4">
              <TouchableOpacity className="bg-white rounded-2xl p-4 border border-gray-200 items-center min-w-[80px]">
                <View className="bg-green-500 p-3 rounded-full mb-2">
                  <Ionicons name="people" size={20} color="#ffffff" />
                </View>
                <Text className="text-xs text-gray-700 font-medium">Study Groups</Text>
              </TouchableOpacity>
              
              <TouchableOpacity className="bg-white rounded-2xl p-4 border border-gray-200 items-center min-w-[80px]">
                <View className="bg-purple-500 p-3 rounded-full mb-2">
                  <Ionicons name="school" size={20} color="#ffffff" />
                </View>
                <Text className="text-xs text-gray-700 font-medium">Classrooms</Text>
              </TouchableOpacity>
              
              <TouchableOpacity className="bg-white rounded-2xl p-4 border border-gray-200 items-center min-w-[80px]">
                <View className="bg-green-500 p-3 rounded-full mb-2">
                  <Ionicons name="person-add" size={20} color="#ffffff" />
                </View>
                <Text className="text-xs text-gray-700 font-medium">New Chat</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Chat List */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-2">
          {conversations.map((conversation) => (
            <TouchableOpacity
              key={conversation.id}
              className={`bg-white rounded-2xl p-4 mb-3 border ${
                selectedChats.includes(conversation.id) 
                  ? 'border-green-500 bg-blue-50' 
                  : 'border-gray-100'
              }`}
              activeOpacity={0.7}
              onPress={() => handleChatPress(conversation)}
              onLongPress={() => handleLongPress(conversation.id)}
            >
              <View className="flex-row items-center">
                <View className="relative mr-4">
                  <Text className="text-3xl">{conversation.contactAvatar}</Text>
                  {conversation.isOnline && !conversation.isClassroomChat && (
                    <View className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white" />
                  )}
                  {conversation.isClassroomChat && (
                    <View className="absolute -bottom-1 -right-1 w-3 h-3 bg-purple-500 rounded-full border border-white" />
                  )}
                </View>
                
                <View className="flex-1">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-lg font-bold text-gray-800 flex-1" numberOfLines={1}>
                      {conversation.contactName}
                    </Text>
                    <Text className="text-xs text-gray-500 ml-2">
                      {formatTime(conversation.timestamp)}
                    </Text>
                  </View>
                  
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 mr-2">
                      {getLastMessagePreview(conversation)}
                    </View>
                    
                    {conversation.unreadCount > 0 && (
                      <View className="bg-green-500 rounded-full min-w-[20px] h-5 items-center justify-center px-2">
                        <Text className="text-white text-xs font-bold">
                          {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  {conversation.isClassroomChat && conversation.classroomName && (
                    <Text className="text-xs text-purple-600 mt-1">
                      📚 {conversation.classroomName}
                    </Text>
                  )}
                </View>
                
                {isSelectionMode && (
                  <View className="ml-2">
                    <Ionicons 
                      name={selectedChats.includes(conversation.id) ? 'checkmark-circle' : 'ellipse-outline'} 
                      size={24} 
                      color={selectedChats.includes(conversation.id) ? '#3b82f6' : '#d1d5db'} 
                    />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Bottom Padding */}
        <View className="h-8" />
      </ScrollView>
    </View>
  );
};

ChatListScreen.displayName = 'ChatListScreen';
