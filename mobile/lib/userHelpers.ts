import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserInfo {
  username: string;
  email: string;
}

// Get stored user info
export async function getUserInfo(): Promise<UserInfo | null> {
  try {
    const username = await AsyncStorage.getItem('user_username');
    const email = await AsyncStorage.getItem('user_email');
    
    if (username && email) {
      return { username, email };
    }
    return null;
  } catch (error) {
    console.error('Error getting user info:', error);
    return null;
  }
}

// Save user info
export async function saveUserInfo(username: string, email: string): Promise<boolean> {
  try {
    await AsyncStorage.setItem('user_username', username);
    await AsyncStorage.setItem('user_email', email);
    console.log('👤 User info saved:', { username, email });
    return true;
  } catch (error) {
    console.error('Error saving user info:', error);
    return false;
  }
}

// Clear user info (logout)
export async function clearUserInfo(): Promise<void> {
  try {
    await AsyncStorage.removeItem('user_username');
    await AsyncStorage.removeItem('user_email');
    console.log('👤 User info cleared');
  } catch (error) {
    console.error('Error clearing user info:', error);
  }
}

// Check if user is registered
export async function isUserRegistered(): Promise<boolean> {
  const userInfo = await getUserInfo();
  return userInfo !== null;
}
