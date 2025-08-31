import { supabase } from './supabase';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

// Generate a random short code for the roast link
export function generateLinkCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Upload photo to Supabase Storage
export async function uploadPhoto(uri: string, fileName: string): Promise<string | null> {
  try {
    console.log('🚀 Starting direct upload with Expo FileSystem for:', fileName);

    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Supabase URL or Anon Key is not set in environment variables.');
      return null;
    }

    const uploadUrl = `${supabaseUrl}/storage/v1/object/roast-photos/${fileName}`;

    console.log(`📡 Uploading to: ${uploadUrl}`);

    const response = await FileSystem.uploadAsync(uploadUrl, uri, {
      httpMethod: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'image/jpeg',
        'x-upsert': 'false', // Prevent overwriting files
      },
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    });

    console.log('📬 Server Response Status:', response.status);
    console.log('📬 Server Response Body:', response.body);

    if (response.status >= 200 && response.status < 300) {
      console.log('✅ Direct upload successful!');
      // On successful upload, the path is the file name.
      return fileName;
    } else {
      console.error('❌ Direct upload failed.');
      return null;
    }

  } catch (error) {
    console.error('❌ Direct upload failed with exception:', error);
    return null;
  }
}

// Create a roast session in the database
export async function createRoastSession(
  creatorEmail: string | null,
  photoPath: string,
  prompt: string,
  linkCode: string
): Promise<string | null> {
  try {
    // Get the public URL for the uploaded photo
    const { data: urlData } = supabase.storage
      .from('roast-photos')
      .getPublicUrl(photoPath);

    if (!urlData || !urlData.publicUrl) {
      console.error('Database error: Could not get public URL for photo.');
      return null;
    }

    // Call the database function instead of a direct insert
    const { data, error } = await supabase.rpc('create_roast_session_for_anon', {
      photo_url: urlData.publicUrl,
      prompt: prompt,
      code: linkCode,
    });

    if (error) {
      console.error('Database RPC error:', error);
      return null;
    }

    return data; // The function returns the session_id directly
  } catch (error) {
    console.error('Error creating roast session:', error);
    return null;
  }
}

// Pick image from gallery or camera
export async function pickImage(): Promise<string | null> {
  try {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
      return null;
    }

    // Launch image picker
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
      preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Current,
    });

    if (!result.canceled && result.assets[0]) {
      return result.assets[0].uri;
    }

    return null;
  } catch (error) {
    console.error('Image picker error:', error);
    return null;
  }
}
