import React, { useState } from 'react';
import { View, StyleSheet, Switch, TouchableOpacity, FlatList, Text } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '@/components/AppHeader';

const messages = [
  {
    id: '1',
    type: 'new',
    title: 'New Message!',
    timestamp: '3 hours ago',
  },
  {
    id: '2',
    type: 'new',
    title: 'New Message!',
    timestamp: '5 hours ago',
  },
  {
    id: '3',
    type: 'new',
    title: 'New Message!',
    timestamp: '20 hours ago',
  },
  {
    id: '4',
    type: 'new',
    title: 'New Message!',
    timestamp: 'a day ago',
  },
  {
    id: '5',
    type: 'new',
    title: 'New Message!',
    timestamp: 'a day ago',
  },
  {
    id: '6',
    type: 'new',
    title: 'New Message!',
    timestamp: '2 days ago',
  },
  {
    id: '7',
    type: 'new',
    title: 'New Message!',
    timestamp: '3 days ago',
  },
  {
    id: '8',
    type: 'new',
    title: 'New Message!',
    timestamp: '4 days ago',
  },
];

export default function InboxScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const toggleSwitch = () => setNotificationsEnabled(previousState => !previousState);

  const renderMessage = ({ item }) => (
    <TouchableOpacity style={styles.messageItem}>
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
        <Text style={[styles.messageTitle, styles.newMessageTitle]}>
          {item.title}
        </Text>
        <Text style={styles.timestamp}>{item.timestamp}</Text>
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

  return (
    <ThemedView style={styles.container}>
      <AppHeader activeTab="inbox" />
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        ListHeaderComponent={ListHeader}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContentContainer}
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
    </ThemedView>
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
  newMessageTitle: {
    color: '#F14060',
    fontWeight: 'bold',
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
});