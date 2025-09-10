import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, Switch, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AppHeader from '@/components/AppHeader';
import { getUserInfo, isUserRegistered, clearUserInfo, UserInfo, saveUserInfo } from '../../lib/userHelpers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';

export default function SettingsScreen() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedUsername, setEditedUsername] = useState('');
  const [editedEmail, setEditedEmail] = useState('');
  const router = useRouter();

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
    if (userInfo) {
      setEditedUsername(userInfo.username);
      setEditedEmail(userInfo.email);
      setIsEditingProfile(true);
    }
  };

  const handleSaveProfile = async () => {
    if (!editedUsername.trim() || !editedEmail.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    if (editedUsername.length < 3 || editedUsername.length > 20) {
      Alert.alert('Error', 'Username must be between 3 and 20 characters.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editedEmail)) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'User not authenticated.');
        return;
      }

      // Check if username is being changed and if it already exists
      if (editedUsername !== userInfo?.username) {
        const { data: existingUser, error: checkError } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', editedUsername)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Username check error:', checkError);
          Alert.alert('Error', 'Failed to verify username availability. Please try again.');
          return;
        }

        if (existingUser) {
          Alert.alert('Username Taken', 'This username is already taken. Please choose a different username.');
          return;
        }
      }

      // Update profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          username: editedUsername,
          email: editedEmail,
        })
        .eq('id', user.id);

      if (error) {
        console.error('Profile update error:', error);
        if (error.code === '23505') {
          Alert.alert('Username Taken', 'This username is already taken. Please choose a different username.');
        } else {
          Alert.alert('Error', 'Failed to update profile. Please try again.');
        }
        return;
      }

      // Update local storage
      await saveUserInfo(editedUsername, editedEmail);
      
      // Update local state
      setUserInfo({ username: editedUsername, email: editedEmail });
      setIsEditingProfile(false);
      
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setEditedUsername('');
    setEditedEmail('');
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

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? You will need to log in again to access your account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              // Sign out from Supabase
              await supabase.auth.signOut();
              
              // Clear local user data
              await clearUserInfo();
              await AsyncStorage.clear();
              
              // Reset state
              setUserInfo(null);
              setNotificationsEnabled(false);
              
              // Navigate to onboarding welcome screen
              router.replace('/onboarding');
              
              Alert.alert('Success', 'You have been signed out successfully');
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
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
                  {isEditingProfile ? (
                    <TextInput
                      style={styles.editInput}
                      value={editedUsername}
                      onChangeText={setEditedUsername}
                      placeholder="Enter username"
                    />
                  ) : (
                    <Text style={styles.userInfoValue}>{userInfo.username}</Text>
                  )}
                </View>
              </View>
              
              <View style={styles.userInfoRow}>
                <Ionicons name="mail-outline" size={20} color="#666" />
                <View style={styles.userInfoText}>
                  <Text style={styles.userInfoLabel}>Email</Text>
                  {isEditingProfile ? (
                    <TextInput
                      style={styles.editInput}
                      value={editedEmail}
                      onChangeText={setEditedEmail}
                      placeholder="Enter email"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  ) : (
                    <Text style={styles.userInfoValue}>{userInfo.email}</Text>
                  )}
                </View>
              </View>
              
              {isEditingProfile ? (
                <View style={styles.editActions}>
                  <TouchableOpacity style={styles.cancelButton} onPress={handleCancelEdit}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
                  <Text style={styles.editButtonText}>Edit Profile</Text>
                </TouchableOpacity>
              )}
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
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          <TouchableOpacity style={styles.clearButton} onPress={handleClearData}>
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            <Text style={styles.clearButtonText}>Clear User Data</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  editInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#F8F8F8',
    marginTop: 4,
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
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
  signOutButton: {
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
  signOutButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
  },
});
