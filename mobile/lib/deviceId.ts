import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = 'roastd_device_id';

// Generate a unique device ID
function generateDeviceId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'device_';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Get or create device ID
export async function getDeviceId(): Promise<string> {
  try {
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    
    if (!deviceId) {
      deviceId = generateDeviceId();
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
      console.log('📱 Generated new device ID:', deviceId);
    } else {
      console.log('📱 Using existing device ID:', deviceId);
    }
    
    return deviceId;
  } catch (error) {
    console.error('Error getting device ID:', error);
    // Fallback to generating a new ID each time if storage fails
    return generateDeviceId();
  }
}
