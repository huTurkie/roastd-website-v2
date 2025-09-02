import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Switch, TouchableOpacity, FlatList, Text, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '@/components/AppHeader';
import { supabase } from '@/lib/supabase';

interface InboxMessage {
  id: string;
  prompt: string;
  roast: string;
  created_at: string;
  user_id: string;
  original_photo_url: string;
  generated_photo_url: string;
}

export default function InboxScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const toggleSwitch = () => setNotificationsEnabled(previousState => !previousState);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('inbox')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching messages:', error);
        Alert.alert('Error', 'Failed to load messages. Please try again.');
        return;
      }

      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      Alert.alert('Error', 'Failed to load messages. Please try again.');
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
    // TODO: Navigate to message detail screen or show roast content
    Alert.alert(
      'Roast Message',
      message.roast,
      [{ text: 'OK', style: 'default' }]
    );
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const renderMessage = ({ item }: { item: InboxMessage }) => (
    <TouchableOpacity 
      style={styles.messageItem}
      onPress={() => handleMessagePress(item)}
    >
      <View style={styles.iconContainer}>
        <LinearGradient
          colors={['#8a3ab9', '#e95950', '#fccc63']}
          style={styles.messageIcon}
        >
          <View style={{ justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="mail" size={32} color="white" />
            <View style={{ position: 'absolute' }}>
              <Ionicons name="heart" size={16} color="#e95950" />
            </View>
          </View>
        </LinearGradient>
      </View>
      <View style={styles.messageContent}>
        <Text style={styles.messageTitle}>
          Roast Message
        </Text>
        <Text style={styles.messagePreview} numberOfLines={1}>
          {item.prompt}
        </Text>
        <Text style={styles.timestamp}>{formatTimestamp(item.created_at)}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#D3D3D3" />
    </TouchableOpacity>
  );

  const ListHeader = () => (
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

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="mail-outline" size={64} color="#D3D3D3" />
      <Text style={styles.emptyTitle}>No messages yet</Text>
      <Text style={styles.emptySubtitle}>Your roast messages will appear here</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader activeTab="inbox" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F14060" />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      </SafeAreaView>
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