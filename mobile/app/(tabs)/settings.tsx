import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '@/components/AppHeader';
import UserRegistration from '@/components/UserRegistration';
import { getUserInfo, isUserRegistered, clearUserInfo, UserInfo } from '../../lib/userHelpers';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [showUserRegistration, setShowUserRegistration] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const registered = await isUserRegistered();
        if (registered) {
          const user = await getUserInfo();
          setUserInfo(user);
        }
      } catch (error) {
        console.error('Error loading user info:', error);
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

    loadUserInfo();
    loadNotificationSettings();
  }, []);

  const handleEditProfile = () => {
    setShowUserRegistration(true);
  };

  const toggleNotifications = async (value: boolean) => {
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

  const handleClearData = () => {
    Alert.alert(
      'Clear User Data',
      'Are you sure you want to clear your user data? This will reset your username and email.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearUserInfo();
            setUserInfo(null);
            Alert.alert('Success', 'User data cleared successfully');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader activeTab="settings" />
      <View style={styles.content}>
        <Text style={styles.title}>Settings</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Profile</Text>
          
          {userInfo ? (
            <View style={styles.userInfoCard}>
              <View style={styles.userInfoRow}>
                <Ionicons name="person-outline" size={20} color="#666" />
                <View style={styles.userInfoText}>
                  <Text style={styles.userInfoLabel}>Username</Text>
                  <Text style={styles.userInfoValue}>{userInfo.username}</Text>
                </View>
              </View>
              
              <View style={styles.userInfoRow}>
                <Ionicons name="mail-outline" size={20} color="#666" />
                <View style={styles.userInfoText}>
                  <Text style={styles.userInfoLabel}>Email</Text>
                  <Text style={styles.userInfoValue}>{userInfo.email}</Text>
                </View>
              </View>
              
              <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.noUserCard}>
              <Text style={styles.noUserText}>No user profile set up</Text>
              <TouchableOpacity style={styles.setupButton} onPress={handleEditProfile}>
                <Text style={styles.setupButtonText}>Set Up Profile</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.notificationCard}>
            <View style={styles.notificationInfo}>
              <Ionicons name="notifications-outline" size={20} color="#666" />
              <View style={styles.notificationText}>
                <Text style={styles.notificationLabel}>Push Notifications</Text>
                <Text style={styles.notificationDescription}>Get notified when you receive new messages</Text>
              </View>
            </View>
            <Switch
              trackColor={{ false: '#E9E9EA', true: '#F14060' }}
              thumbColor={'#fff'}
              ios_backgroundColor="#E9E9EA"
              onValueChange={toggleNotifications}
              value={notificationsEnabled}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          <TouchableOpacity style={styles.clearButton} onPress={handleClearData}>
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            <Text style={styles.clearButtonText}>Clear User Data</Text>
          </TouchableOpacity>
        </View>
      </View>

      <UserRegistration
        visible={showUserRegistration}
        onComplete={async (newUserInfo) => {
          setUserInfo(newUserInfo);
          setShowUserRegistration(false);
          console.log('👤 User profile updated:', newUserInfo);
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
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  userInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  userInfoText: {
    marginLeft: 12,
    flex: 1,
  },
  userInfoLabel: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  userInfoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginTop: 2,
  },
  editButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 10,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  noUserCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noUserText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  setupButton: {
    backgroundColor: '#F14060',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  setupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clearButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
  },
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationText: {
    marginLeft: 12,
    flex: 1,
  },
  notificationLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  notificationDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});
