import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import AppHeader from '@/components/AppHeader';
import UserRegistration from '@/components/UserRegistration';
import { getUserInfo, isUserRegistered, UserInfo } from '../../lib/userHelpers';
import MessageDetailModal from '@/components/MessageDetailModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface InboxMessage {
  id: string;
  prompt: string;
  roast: string;
  created_at: string;
  user_id: string;
  original_photo_url: string;
  generated_photo_url: string;
  link_code?: string;
  roast_prompt?: string;
  updated_prompt?: string;
  is_read?: boolean;
}

export default function InboxScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<InboxMessage | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showUserRegistration, setShowUserRegistration] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  const toggleSwitch = async (value: boolean) => {
    try {
      await AsyncStorage.setItem('notificationsEnabled', value.toString());
      setNotificationsEnabled(value);
      
      if (value) {
        Alert.alert(
          'Notifications Enabled',
          'You will receive notifications for new messages. You can manage notification permissions in your device settings.'
        );
      }
    } catch (error) {
      console.error('Error updating notification settings:', error);
    }
  };

  // Demo message that should always be present
  const demoMessage: InboxMessage = {
    id: 'demo-1',
    prompt: 'Swap their outfit with someone famous 🔥',
    roast: 'This is a demo roast message.',
    created_at: new Date().toISOString(),
    user_id: 'demo-user',
    original_photo_url: 'https://placehold.co/600x400/png',
    generated_photo_url: 'https://placehold.co/600x400/png',
    is_read: false,
  };

  const fetchMessages = async () => {
    try {
      console.log('📬 Fetching messages from Supabase inbox table...');

      if (!userInfo) {
        console.log('⚠️ No user info available, showing demo message only');
        setMessages([demoMessage]);
        return;
      }

      // Fetch AI-generated messages from inbox table filtered by user
      const { data, error } = await supabase
        .from('inbox')
        .select(`
          *,
          roast_sessions!inner(username, creator_email)
        `)
        .eq('roast_sessions.username', userInfo.username)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching inbox messages:', error);
        Alert.alert('Error', 'Failed to load messages. Please try again.');
        // If there's an error, at least show the demo message
        setMessages([demoMessage]);
        return;
      }

      console.log('📬 Fetched inbox messages from Supabase:', data?.length || 0);
      
      // All inbox records are AI-processed by definition (inserted by nano-banana function)
      const processedMessages = data || [];
      
      console.log('🤖 AI-processed inbox messages:', processedMessages.length);
      
      // Map inbox data to InboxMessage format
      const mappedMessages: InboxMessage[] = processedMessages.map(inboxRecord => ({
        id: inboxRecord.id.toString(),
        prompt: inboxRecord.prompt || 'New AI roast request',
        roast: 'AI roast generated!', // These are AI-generated images
        created_at: inboxRecord.created_at,
        user_id: inboxRecord.user_id || 'anonymous',
        original_photo_url: inboxRecord.original_photo_url || 'https://placehold.co/600x400/png',
        generated_photo_url: inboxRecord.ai_image_url || inboxRecord.generated_photo_url || 'https://placehold.co/600x400/png',
        link_code: inboxRecord.recipient_identifier, // Using recipient_identifier as link reference
        roast_prompt: inboxRecord.prompt,
        updated_prompt: inboxRecord.prompt,
        is_read: false // Default to unread for new messages
      }));
      
      // Always include demo message first, then add real messages
      const allMessages = [demoMessage, ...mappedMessages];
      console.log('📬 Total messages (including demo):', allMessages.length);
      
      setMessages(allMessages);
    } catch (error) {
      console.error('Error fetching inbox messages:', error);
      Alert.alert('Error', 'Failed to load messages. Please try again.');
      // If there's an error, at least show the demo message
      setMessages([demoMessage]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMessages();
  };

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'a day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return messageTime.toLocaleDateString();
  };

  const markAsRead = async (messageId: string) => {
    // is_read column doesn't exist in database - removing this functionality
    return;
  };

  const handleMessagePress = (message: InboxMessage) => {
    // Mark message as read when opened
    setMessages(prevMessages => 
      prevMessages.map(msg => 
        msg.id === message.id ? { ...msg, is_read: true } : msg
      )
    );
    setSelectedMessage(message);
    setModalVisible(true);
  };

  useEffect(() => {
    const checkUserAndFetch = async () => {
      try {
        const registered = await isUserRegistered();
        if (!registered) {
          setShowUserRegistration(true);
        } else {
          const user = await getUserInfo();
          setUserInfo(user);
          console.log('👤 User loaded in inbox:', user);
        }
      } catch (error) {
        console.error('Error checking user registration:', error);
        setShowUserRegistration(true);
      }
    };

    const loadNotificationSettings = async () => {
      try {
        const notificationState = await AsyncStorage.getItem('notificationsEnabled');
        setNotificationsEnabled(notificationState === 'true');
      } catch (error) {
        console.error('Error loading notification settings:', error);
      }
    };

    checkUserAndFetch();
    loadNotificationSettings();
  }, []);

  useEffect(() => {
    if (userInfo) {
      fetchMessages();
    }
  }, [userInfo]);

  const renderMessage = ({ item }: { item: InboxMessage }) => (
    <TouchableOpacity 
      style={styles.messageItem}
      onPress={() => handleMessagePress(item)}
    >
      <View style={styles.iconContainer}>
        <View style={[styles.messageIcon, { backgroundColor: item.is_read ? '#f0f0f0' : '#FF4444' }]}>
          <Ionicons 
            name="mail" 
            size={32} 
            color={item.is_read ? "white" : "white"} 
          />
        </View>
      </View>
      <View style={styles.messageContent}>
        <Text style={styles.messageTitle}>
          New Message!
        </Text>
        <Text style={styles.timestamp}>{formatTimestamp(item.created_at)}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#D3D3D3" />
    </TouchableOpacity>
  );

  const ListHeader = () => {
    // Only show notifications card if notifications are disabled
    if (notificationsEnabled) {
      return null;
    }

    return (
      <View style={styles.notificationsCard}>
        <View>
          <Text style={styles.notificationsTitle}>Turn on Notifications 🔔</Text>
          <Text style={styles.notificationsSubtitle}>Get notified when you get new messages</Text>
        </View>
        <Switch
          trackColor={{ false: '#E9E9EA', true: '#F14060' }}
          thumbColor={'#fff'}
          ios_backgroundColor="#E9E9EA"
          onValueChange={toggleSwitch}
          value={notificationsEnabled}
        />
      </View>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="mail-outline" size={64} color="#D3D3D3" />
      <Text style={styles.emptyTitle}>No messages yet</Text>
      <Text style={styles.emptySubtitle}>Your roast messages will appear here</Text>
    </View>
  );

  if (loading) {
    return (
      <>
        <SafeAreaView style={styles.container}>
          <AppHeader activeTab="inbox" />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#F14060" />
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        </SafeAreaView>
        
        <UserRegistration
          visible={showUserRegistration}
          onComplete={async (userInfo) => {
            setUserInfo(userInfo);
            setShowUserRegistration(false);
            console.log('👤 User registration completed in inbox:', userInfo);
          }}
          onCancel={() => {
            setShowUserRegistration(false);
          }}
        />
      </>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader activeTab="inbox" />
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={EmptyState}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={[
          styles.listContentContainer,
          messages.length === 0 && styles.emptyListContainer
        ]}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
      <TouchableOpacity style={styles.floatingButtonContainer}>
        <LinearGradient
          colors={['#E1306C', '#C13584', '#833AB4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.floatingButton}
        >
          <Text style={styles.buttonText}>Who sent these?</Text>
        </LinearGradient>
      </TouchableOpacity>
      <MessageDetailModal
        message={selectedMessage}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onDeleteMessage={(messageId) => {
          // Prevent deletion of demo message
          if (messageId === 'demo-1') {
            console.log('⚠️ Cannot delete demo message');
            return;
          }
          // Remove message from local state and ensure demo message is preserved
          setMessages(prevMessages => {
            const filteredMessages = prevMessages.filter(msg => msg.id !== messageId);
            // Always ensure demo message is present
            const hasDemo = filteredMessages.some(msg => msg.id === 'demo-1');
            if (!hasDemo) {
              const demoMessage: InboxMessage = {
                id: 'demo-1',
                prompt: 'Swap their outfit with someone famous 🔥',
                roast: 'This is a demo roast message.',
                created_at: new Date().toISOString(),
                user_id: 'demo-user',
                original_photo_url: 'https://placehold.co/600x400/png',
                generated_photo_url: 'https://placehold.co/600x400/png',
                is_read: false,
              };
              return [demoMessage, ...filteredMessages];
            }
            return filteredMessages;
          });
          console.log('🗑️ Message deleted:', messageId);
        }}
        onReportMessage={(messageId) => {
          console.log('🚩 Message reported:', messageId);
          // Could implement server-side reporting here
        }}
      />
      
      <UserRegistration
        visible={showUserRegistration}
        onComplete={async (userInfo) => {
          setUserInfo(userInfo);
          setShowUserRegistration(false);
          console.log('👤 User registration completed in inbox:', userInfo);
        }}
        onCancel={() => {
          setShowUserRegistration(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContentContainer: {
    padding: 16,
    paddingBottom: 120, // Extra padding to avoid overlap with floating button
  },
  notificationsCard: {
    backgroundColor: '#F7F7F7',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  notificationsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  notificationsSubtitle: {
    color: '#666',
    marginTop: 4,
    fontSize: 14,
  },
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconContainer: {
    marginRight: 16,
  },
  messageIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContent: {
    flex: 1,
  },
  messageTitle: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  timestamp: {
    color: '#999',
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 72,
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 40, // Raised a bit higher
    left: 16,
    right: 16,
  },
  floatingButton: {
    height: 56,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  messagePreview: {
    color: '#666',
    fontSize: 14,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyListContainer: {
    flexGrow: 1,
  },
});