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

// Update roast session prompt by link code
export async function updateRoastPrompt(
  linkCode: string,
  newPrompt: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('roast_sessions')
      .update({ roast_prompt: newPrompt })
      .eq('link_code', linkCode);

    if (error) {
      console.error('Error updating roast prompt:', error);
      return false;
    }

    console.log('✅ Roast prompt updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating roast prompt:', error);
    return false;
  }
}

// Set updated prompt for a roast session by link code
export async function setUpdatedPrompt(
  linkCode: string,
  newPrompt: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('roast_sessions')
      .update({ updated_prompt: newPrompt })
      .eq('link_code', linkCode)
      .select();

    if (error) {
      console.error('Error setting updated_prompt:', error);
      return false;
    }

    if (!data || data.length === 0) {
      console.error('No rows were updated - link_code might not exist:', linkCode);
      return false;
    }

    console.log('✅ Updated prompt set successfully');
    return true;
  } catch (error) {
    console.error('Error in setUpdatedPrompt:', error);
    return false;
  }
}

// Generate AI image using nano-banana function
export async function generateAIImage(
  linkCode: string,
  prompt: string
): Promise<boolean> {
  try {
    console.log('🎨 [generateAIImage] STARTING - Link code:', linkCode, 'Prompt:', prompt);
    
    // First get the session ID from the link code
    console.log('🔍 [generateAIImage] Querying roast_sessions table for link_code:', linkCode);
    const { data: sessionData, error: sessionError } = await supabase
      .from('roast_sessions')
      .select('session_id')
      .eq('link_code', linkCode)
      .single();

    console.log('📊 [generateAIImage] Session query result:', { sessionData, sessionError });

    if (sessionError || !sessionData) {
      console.error('❌ [generateAIImage] Error finding session for link code:', sessionError);
      return false;
    }

    console.log('✅ [generateAIImage] Found session_id:', sessionData.session_id);

    // Call the nano-banana function
    console.log('🚀 [generateAIImage] Calling nano-banana function with:', { 
      sessionId: sessionData.session_id, 
      prompt: prompt 
    });
    
    const { data, error } = await supabase.functions.invoke('nano-banana', {
      body: { 
        sessionId: sessionData.session_id,
        prompt: prompt
      },
    });

    console.log('📡 [generateAIImage] Nano-banana function response:', { data, error });

    if (error) {
      console.error('❌ [generateAIImage] Error calling nano-banana function:', error);
      console.error('❌ [generateAIImage] Error details:', JSON.stringify(error, null, 2));
      return false;
    }

    console.log('✅ [generateAIImage] AI image generation initiated successfully');
    console.log('📋 [generateAIImage] Response data:', JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('💥 [generateAIImage] Exception caught:', error);
    console.error('💥 [generateAIImage] Exception stack:', error.stack);
    return false;
  }
}
