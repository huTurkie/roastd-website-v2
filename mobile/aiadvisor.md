# Instagram Stories Watermark Implementation Request

## OBJECTIVE

We need to implement a "roastd.link" watermark that appears **ONLY** when images are shared to Instagram Stories from our React Native Expo app. 

### Key Requirements:
- ✅ Watermark appears as a footer at the bottom of Instagram Stories shared content
- ❌ Watermark NEVER visible in the mobile app UI
- ✅ Must work with Expo Managed Workflow (no native linking)
- ✅ Professional styling matching existing gradient design
- ✅ Positioned at bottom of shared image with proper padding

### Current Problem:
Users can share AI-generated roast images to Instagram Stories, but there's no branding/watermark in the shared content. We want to add "roastd.link" as a footer that only appears in the shared image, never in the app interface itself.

### Technical Challenge:
The watermark must be dynamically added during the ViewShot capture process without ever being visible to users in the mobile app UI. Previous attempts using conditional rendering caused the watermark to briefly flash on screen, which is unacceptable.

## Project Context

**App Name:** Roastd - **Platform:** React Native with Expo Managed Workflow
- **Expo SDK Version:** ~53.0.22  
**React Native Version:** 0.74.5  
**Development Environment:** macOS with Expo CLI  
**Target Platforms:** iOS and Android  
**Current Issue:** Need to add "roastd.link" watermark/footer to images ONLY when sharing to Instagram Stories, not visible in mobile app UI

## App Architecture Overview

### Core Functionality
Roastd is a social media app that generates AI-powered "roast" images based on user photos. The app workflow:

1. **User uploads a photo** via camera or gallery
2. **AI generates a roasted version** with humorous commentary
3. **User can view both original and roasted versions**
4. **User can share the roasted image** to Instagram Stories
5. **App needs branding** on shared content for viral marketing

### Technical Stack
- **Frontend:** React Native with Expo (Managed Workflow)
- **State Management:** React Hooks (useState, useRef)
- **Image Handling:** react-native-view-shot for capturing
- **File System:** expo-file-system for file operations
- **Sharing:** expo-intent-launcher (Android) + react-native-share (iOS)
- **UI Components:** expo-linear-gradient, @expo/vector-icons
- **Backend:** Supabase (not relevant for this issue)

### App Structure
```
mobile/
├── app/
│   ├── (tabs)/
│   │   └── index.tsx (main feed)
│   └── _layout.tsx
├── components/
│   ├── MessageDetailModal.tsx (MAIN FILE - handles sharing)
│   ├── InboxScreen.tsx
│   └── other components...
├── assets/
├── package.json
└── app.json (Expo configuration)
```

## Problem Description

We have a React Native Expo app that allows users to share generated roast images to Instagram Stories. Currently, the shared images have no branding. We need to add a "roastd.link" watermark that:

1. **ONLY appears in Instagram Stories** when shared
2. **NEVER appears in the mobile app interface**
3. Should be positioned at the bottom of the image like a footer
4. Should look professional with a semi-transparent background
5. **Must work in Expo managed workflow** (no native code/linking)
6. **Should not affect app performance** or user experience

## User Flow Context

### Current User Journey
1. User opens app and sees inbox of roasted images
2. User taps on a roasted image to view in full screen modal (`MessageDetailModal`)
3. Modal shows:
   - Gradient prompt card at top
   - Generated roasted image below
   - UI buttons at bottom (color cycle, toggle original/roasted, share)
4. User taps "Share" button
5. App captures the prompt + image using ViewShot
6. App opens Instagram Stories with the captured image
7. **PROBLEM:** No branding on shared image

### Desired User Journey
Same as above, but step 6 should include "roastd.link" watermark at bottom of shared image, while step 3 shows NO watermark in the mobile interface.

## Business Context

### Why This Matters
- **Viral Marketing:** Users sharing branded content drives app downloads
- **Brand Recognition:** "roastd.link" helps users find the app
- **Competitive Advantage:** Apps like NGL, BeReal do this successfully
- **User Acquisition:** Organic growth through social sharing

### Success Examples
- **NGL:** Adds "ngl.link" to shared anonymous messages
- **BeReal:** Adds timestamp and "BeReal." branding
- **VSCO:** Adds subtle watermark to shared photos
- **TikTok:** Adds watermark to downloaded videos

## Detailed Technical Context

### Expo Managed Workflow Constraints
- **No Native Modules:** Cannot use packages requiring `react-native link` or native code
- **Limited File System Access:** Must use expo-file-system APIs
- **Sandboxed Environment:** Cannot access native iOS/Android APIs directly
- **Package Restrictions:** Only Expo SDK and pure JavaScript packages allowed

### Current Image Capture Process
1. **ViewShot Component:** Wraps the content to be captured
2. **captureRef Function:** Takes screenshot of ViewShot content
3. **File System:** Saves captured image to temporary directory
4. **Platform-Specific Sharing:**
   - **Android:** Uses expo-intent-launcher with Instagram intent
   - **iOS:** Uses react-native-share with base64 encoded image

### Image Dimensions & Format
- **Capture Size:** 1080x1400 pixels (optimized for Instagram Stories)
- **Format:** JPEG with 0.9 quality
- **Storage:** Temporary file system location
- **Instagram Stories Aspect Ratio:** 9:16 (1080x1920), but we use 1400 height to avoid full-screen

### Current Styling System
The app uses a gradient-based design system:

```tsx
const gradients = [
  ['#E1306C', '#C13584', '#833AB4'], // Instagram-like
  ['#434343', '#000000'], // Black
  ['#FDCB52', '#ED5564'], // Orange/Red
  ['#FF6B6B', '#FF8E53'], // Warm
  ['#4D9FFF', '#6B6BFF'], // Blue
  ['#A076F9', '#6B6BFF'], // Purple
  ['#50C878', '#A0D6B4'], // Green
  ['#FFC3A0', '#FFAFBD'], // Pink/Peach
  ['#2193b0', '#6dd5ed'], // Teal
  ['rgba(255,255,255,0)', 'rgba(255,255,255,0)'], // Transparent
];
```

### Message Data Structure
```tsx
interface InboxMessage {
  id: string;
  prompt: string; // Original user prompt
  roast: string; // AI-generated roast text
  created_at: string;
  user_id: string;
  original_photo_url: string; // User's original photo
  generated_photo_url: string; // AI-generated roasted image
  roast_prompt?: string; // AI-generated prompt for the roast
  updated_prompt?: string; // Modified prompt text
}
```

## Current Implementation

### File: `mobile/components/MessageDetailModal.tsx`

This is the COMPLETE current implementation of the modal that handles image sharing:

```tsx
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, SafeAreaView, Dimensions, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import Constants from 'expo-constants';

let Share: any;
if (Constants.appOwnership !== 'expo') {
  Share = require('react-native-share').default;
} else {
  Share = { Social: { INSTAGRAM_STORIES: 'instagram_stories' }, shareSingle: async () => { /* no-op */ } };
}

const { width, height } = Dimensions.get('window');

const gradients = [
  ['#E1306C', '#C13584', '#833AB4'], // Share Button Gradient
  ['#434343', '#000000'], // Black
  ['#FDCB52', '#ED5564'], // Balanced Instagram-like
  ['#FF6B6B', '#FF8E53'], // Orange/Red
  ['#4D9FFF', '#6B6BFF'], // Blue
  ['#A076F9', '#6B6BFF'], // Purple
  ['#50C878', '#A0D6B4'], // Green
  ['#FFC3A0', '#FFAFBD'], // Pink/Peach
  ['#2193b0', '#6dd5ed'], // Teal
  ['rgba(255,255,255,0)', 'rgba(255,255,255,0)'], // Transparent
];

interface InboxMessage {
  id: string;
  prompt: string;
  roast: string;
  created_at: string;
  user_id: string;
  original_photo_url: string;
  generated_photo_url: string;
  roast_prompt?: string;
  updated_prompt?: string;
}

interface MessageDetailModalProps {
  visible: boolean;
  message: InboxMessage | null;
  onClose: () => void;
}

export default function MessageDetailModal({ visible, message, onClose }: MessageDetailModalProps) {
  if (!message) return null;

  const viewShotRef = useRef<ViewShot>(null);
  const [currentGradientIndex, setCurrentGradientIndex] = useState(0);
  const [selectedSocial, setSelectedSocial] = useState('instagram');
  const [isShowingOriginal, setIsShowingOriginal] = useState(false);

  const cycleGradient = () => {
    setCurrentGradientIndex((prevIndex) => (prevIndex + 1) % gradients.length);
  };

  const handleShare = async () => {
    if (!viewShotRef.current) {
      Alert.alert('Error', 'Cannot capture view for sharing.');
      return;
    }

    try {
      const uri = await captureRef(viewShotRef, {
        format: 'jpg',
        quality: 0.9,
        result: 'tmpfile',
        width: 1080, // Explicitly set width for Instagram Stories
        height: 1400, // Reduced height so image doesn't fill full screen in stories
      });

      if (!uri) {
        Alert.alert('Oops!', 'Could not capture the image for sharing.');
        return;
      }

      if (Platform.OS === 'android') {
        const contentUri = await FileSystem.getContentUriAsync(uri);
        await IntentLauncher.startActivityAsync('com.instagram.share.ADD_TO_STORY', {
          data: contentUri,
          flags: 1,
          type: 'image/jpeg',
          extra: {
            'com.instagram.platform.extra.BACKGROUND_IMAGE': contentUri,
          },
        });
      } else if (Platform.OS === 'ios') {
        const base64Image = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
        const imageUriBase64 = `data:image/jpeg;base64,${base64Image}`;

        const shareOptions = {
          social: Share.Social.INSTAGRAM_STORIES,
          backgroundImage: imageUriBase64,
        };

        if (Share.shareSingle) {
          await Share.shareSingle(shareOptions);
        } else {
          Alert.alert('Error', 'Sharing functionality is not available.');
        }
      }
    } catch (error: any) {
      console.error('Sharing error:', error);
      if (error.message.includes('No Activity found to handle Intent')) {
        Alert.alert('Error', 'Could not open Instagram. Please make sure it is installed.');
      } else {
        Alert.alert('Error', 'An unexpected error occurred during sharing.');
      }
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.modalContainer}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <View style={styles.socialSelector}>
              <TouchableOpacity 
                style={[styles.socialButton, selectedSocial === 'instagram' && styles.socialButtonActive]}
                onPress={() => setSelectedSocial('instagram')}
              >
                <Ionicons name="logo-instagram" size={20} color={selectedSocial === 'instagram' ? '#E1306C' : '#A9A9A9'} />
                <Text style={[styles.socialButtonText, selectedSocial === 'instagram' && styles.socialButtonTextActive]}>
                  Instagram
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#A9A9A9" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Main Card */}
            <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }} style={styles.mainCard}>
              {/* Prompt Card */}
              <LinearGradient
                colors={gradients[currentGradientIndex]}
                style={styles.promptContainer}
              >
                <Text style={[styles.promptText, currentGradientIndex === gradients.length - 1 && styles.promptTextBlack]}>
                  {message.updated_prompt || message.roast_prompt || message.prompt || "No prompt available"}
                </Text>
              </LinearGradient>

              {/* Generated Image */}
              <Image 
                source={{ uri: isShowingOriginal ? message.original_photo_url : message.generated_photo_url || 'https://picsum.photos/400/600' }} 
                style={styles.generatedImage}
                resizeMode="cover"
              />
            </ViewShot>

            <View style={styles.footerContainer}>
              <View style={styles.buttonRow}>
                {/* Color Cycle Button */}
                <TouchableOpacity onPress={cycleGradient} style={styles.gradientCircleButton}>
                  <LinearGradient
                    colors={['#FF8E53', '#FF6B6B', '#56CCF2', '#2F80ED']}
                    style={styles.gradientCircle}
                  />
                </TouchableOpacity>

                {/* Image Toggle Button */}
                <TouchableOpacity onPress={() => setIsShowingOriginal(!isShowingOriginal)} style={styles.toggleButton}>
                  <LinearGradient
                    colors={['#FEDA77', '#F58529', '#DD2A7B', '#8134AF', '#515BD4']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.toggleButtonGradient}
                  >
                    <Text style={styles.toggleButtonText}>
                      {isShowingOriginal ? 'Roastd' : 'Original'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Share Button */}
              <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
                <MaskedView
                  style={styles.shareButtonMask}
                  maskElement={
                    <View style={styles.shareButtonMaskInner}>
                      <Text style={styles.shareButtonMaskText}>Share to Stories</Text>
                    </View>
                  }
                >
                  <LinearGradient
                    colors={gradients[0]}
                    style={styles.shareButtonGradient}
                  />
                </MaskedView>
              </TouchableOpacity>

              {/* Reply Button */}
              <TouchableOpacity style={styles.replyButton}>
                <Ionicons name="chatbubble-outline" size={20} color="white" style={styles.replyIcon} />
                <Text style={styles.replyText}>Reply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

// COMPLETE STYLESHEET
const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  socialSelector: {
    flexDirection: 'row',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 10,
  },
  socialButtonActive: {
    backgroundColor: 'rgba(225, 48, 108, 0.2)',
  },
  socialButtonText: {
    color: '#A9A9A9',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  socialButtonTextActive: {
    color: '#E1306C',
  },
  closeButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  mainCard: {
    width: '100%',
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    overflow: 'hidden',
  },
  promptContainer: {
    padding: 20,
    minHeight: 80,
    justifyContent: 'center',
  },
  promptText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
  },
  promptTextBlack: {
    color: 'black',
  },
  generatedImage: {
    width: '100%',
    height: 400,
  },
  footerContainer: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  gradientCircleButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  gradientCircle: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  toggleButtonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  shareButton: {
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 15,
  },
  shareButtonMask: {
    flex: 1,
    height: 50,
  },
  shareButtonMaskInner: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButtonMaskText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'black',
  },
  shareButtonGradient: {
    flex: 1,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 15,
    borderRadius: 25,
  },
  replyIcon: {
    marginRight: 8,
  },
  replyText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

## Complete Package.json Dependencies

```json
{
  "name": "mobile",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "dependencies": {
    "@expo/vector-icons": "^14.1.0",
    "@react-native-async-storage/async-storage": "^2.1.2",
    "@react-native-masked-view/masked-view": "0.3.2",
    "@react-navigation/bottom-tabs": "^7.3.10",
    "@react-navigation/elements": "^2.3.8",
    "@react-navigation/native": "^7.1.6",
    "@supabase/supabase-js": "^2.56.0",
    "base-64": "^1.0.0",
    "expo": "~53.0.22",
    "expo-blur": "~14.1.5",
    "expo-clipboard": "~7.1.5",
    "expo-constants": "~17.1.7",
    "expo-dev-client": "~5.2.4",
    "expo-file-system": "~18.1.11",
    "expo-font": "~13.3.2",
    "expo-haptics": "~14.1.4",
    "expo-image": "~2.4.0",
    "expo-image-picker": "~16.1.4",
    "expo-intent-launcher": "~12.1.5",
    "expo-linear-gradient": "~14.1.5",
    "expo-linking": "~7.1.7",
    "expo-router": "~5.1.5",
    "expo-sharing": "~13.1.5",
    "expo-splash-screen": "~0.30.10",
    "expo-status-bar": "~2.2.3",
    "expo-symbols": "~0.4.5",
    "expo-system-ui": "~5.0.11",
    "expo-web-browser": "~14.2.0",
    "lottie-react-native": "7.2.2",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "react-native": "^0.79.5",
    "react-native-gesture-handler": "~2.24.0",
    "react-native-image-marker": "^1.2.6",
    "react-native-reanimated": "~3.17.4",
    "react-native-safe-area-context": "5.4.0",
    "react-native-screens": "~4.11.1",
    "react-native-share": "^12.2.0",
    "react-native-svg": "15.11.2",
    "react-native-url-polyfill": "^2.0.0",
    "react-native-view-shot": "4.0.3",
    "react-native-web": "~0.20.0",
    "react-native-webview": "13.13.5"
  }
}
```

## Project File Structure

```
mobile/
├── app/
│   ├── (tabs)/
│   │   ├── inbox.tsx          # Main inbox screen with message list
│   │   └── _layout.tsx        # Tab navigation layout
│   ├── +not-found.tsx
│   └── _layout.tsx
├── components/
│   ├── MessageDetailModal.tsx  # Modal for viewing/sharing messages
│   ├── AppHeader.tsx          # App header component
│   └── UserRegistration.tsx   # User registration modal
├── lib/
│   ├── supabase.ts           # Supabase client configuration
│   └── userHelpers.ts        # User management utilities
├── assets/
│   ├── fonts/
│   └── images/
└── package.json
```

## Complete Inbox Screen Code

The inbox screen handles message listing and opens the MessageDetailModal:

```tsx
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
}

export default function InboxScreen() {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<InboxMessage | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  const handleMessagePress = (message: InboxMessage) => {
    setSelectedMessage(message);
    setModalVisible(true);
  };

  const fetchMessages = async () => {
    try {
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
        return;
      }

      const mappedMessages: InboxMessage[] = data.map(inboxRecord => ({
        id: inboxRecord.id.toString(),
        prompt: inboxRecord.prompt || 'New AI roast request',
        roast: 'AI roast generated!',
        created_at: inboxRecord.created_at,
        user_id: inboxRecord.user_id || 'anonymous',
        original_photo_url: inboxRecord.original_photo_url || 'https://placehold.co/600x400/png',
        generated_photo_url: inboxRecord.ai_image_url || inboxRecord.generated_photo_url || 'https://placehold.co/600x400/png',
        link_code: inboxRecord.recipient_identifier,
        roast_prompt: inboxRecord.prompt,
        updated_prompt: inboxRecord.prompt
      }));
      
      setMessages(mappedMessages);
    } catch (error) {
      console.error('Error fetching inbox messages:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader activeTab="inbox" />
      <FlatList
        data={messages}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.messageItem}
            onPress={() => handleMessagePress(item)}
          >
            <View style={styles.messageContent}>
              <Text style={styles.messageTitle}>New Message!</Text>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={item => item.id}
      />
      <MessageDetailModal
        message={selectedMessage}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}
```

## ViewShot Usage Examples

Here's how ViewShot is currently implemented in the MessageDetailModal:

```tsx
import ViewShot, { captureRef } from 'react-native-view-shot';

export default function MessageDetailModal({ visible, message, onClose }: MessageDetailModalProps) {
  const viewShotRef = useRef<ViewShot>(null);

  const handleShare = async () => {
    if (!viewShotRef.current) {
      Alert.alert('Error', 'Cannot capture view for sharing.');
      return;
    }

    try {
      // Capture the ViewShot content as image
      const uri = await captureRef(viewShotRef, {
        format: 'jpg',
        quality: 0.9,
        result: 'tmpfile',
        width: 1080,
        height: 1400,
      });

      if (!uri) {
        Alert.alert('Oops!', 'Could not capture the image for sharing.');
        return;
      }

      // Platform-specific sharing logic
      if (Platform.OS === 'android') {
        const contentUri = await FileSystem.getContentUriAsync(uri);
        await IntentLauncher.startActivityAsync('com.instagram.share.ADD_TO_STORY', {
          data: contentUri,
          flags: 1,
          type: 'image/jpeg',
          extra: {
            'com.instagram.platform.extra.BACKGROUND_IMAGE': contentUri,
          },
        });
      } else if (Platform.OS === 'ios') {
        const base64Image = await FileSystem.readAsStringAsync(uri, { 
          encoding: FileSystem.EncodingType.Base64 
        });
        const imageUriBase64 = `data:image/jpeg;base64,${base64Image}`;

        const shareOptions = {
          social: Share.Social.INSTAGRAM_STORIES,
          backgroundImage: imageUriBase64,
        };

        if (Share.shareSingle) {
          await Share.shareSingle(shareOptions);
        }
      }
    } catch (error: any) {
      console.error('Sharing error:', error);
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.modalContainer}>
        <SafeAreaView style={styles.safeArea}>
          {/* ViewShot captures everything inside this component */}
          <ViewShot 
            ref={viewShotRef} 
            options={{ format: 'jpg', quality: 0.9 }} 
            style={styles.mainCard}
          >
            {/* Prompt Card with Gradient */}
            <LinearGradient
              colors={gradients[currentGradientIndex]}
              style={styles.promptContainer}
            >
              <Text style={styles.promptText}>
                {message.updated_prompt || message.roast_prompt || message.prompt}
              </Text>
            </LinearGradient>

            {/* Generated Image */}
            <Image 
              source={{ uri: message.generated_photo_url }} 
              style={styles.generatedImage}
              resizeMode="cover"
            />

            {/* THIS IS WHERE WATERMARK SHOULD GO - ONLY VISIBLE DURING CAPTURE */}
            {/* Currently no watermark implementation */}
          </ViewShot>

          {/* UI Elements OUTSIDE ViewShot - NOT captured in image */}
          <View style={styles.footerContainer}>
            <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
              <Text style={styles.shareButtonText}>Share to Stories</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
```

## Key ViewShot Configuration

```tsx
// ViewShot capture configuration
const uri = await captureRef(viewShotRef, {
  format: 'jpg',           // Output format
  quality: 0.9,           // Image quality (0-1)
  result: 'tmpfile',      // Save to temporary file
  width: 1080,            // Fixed width for Instagram Stories
  height: 1400,           // Fixed height for Instagram Stories
});
```

## What We've Tried (All Failed)

### Attempt 1: react-native-image-marker
- **Issue:** Not compatible with Expo, requires native linking
- **Error:** "The package 'react-native-image-marker' doesn't seem to be linked"

### Attempt 2: Conditional Rendering with State
- **Approach:** Used `isSharing` state to show/hide watermark during capture
- **Issue:** Watermark appeared in mobile UI, which we don't want
- **Code Attempted:**
```tsx
const [isSharing, setIsSharing] = useState(false);

const handleShare = async () => {
  setIsSharing(true); // Show watermark
  
  const uri = await captureRef(viewShotRef, {
    format: 'jpg',
    quality: 0.9,
    result: 'tmpfile',
    width: 1080,
    height: 1400,
  });
  
  setIsSharing(false); // Hide watermark
  // ... sharing logic
};

// In JSX inside ViewShot:
{isSharing && (
  <View style={styles.watermarkContainer}>
    <Text style={styles.watermarkText}>roastd.link</Text>
  </View>
)}
```
- **Problem:** The watermark briefly flashes on screen during the state change

### Attempt 3: expo-image-manipulator
- **Approach:** Tried using Expo's built-in image manipulation to add text overlay
- **Issue:** Limited text rendering capabilities, complex positioning
- **Error:** Difficult to match existing gradient styling

### Attempt 4: react-native-svg with Text
- **Approach:** Render SVG text overlay on captured image
- **Issue:** Complex integration with ViewShot, styling inconsistencies
- **Problem:** SVG text doesn't match LinearGradient styling from prompt card

## Supabase Integration Details

### Database Schema
The app uses Supabase with the following relevant tables:

```sql
-- inbox table structure
CREATE TABLE inbox (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id TEXT,
  prompt TEXT,
  original_photo_url TEXT,
  ai_image_url TEXT,
  generated_photo_url TEXT,
  recipient_identifier TEXT,
  processing_status TEXT DEFAULT 'pending'
);

-- roast_sessions table structure  
CREATE TABLE roast_sessions (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  username TEXT UNIQUE,
  creator_email TEXT,
  session_data JSONB
);
```

### Data Flow
1. **Message Creation:** AI processes photos and creates entries in `inbox` table
2. **Message Fetching:** Inbox screen queries messages joined with `roast_sessions` by username
3. **Message Display:** Each message contains `original_photo_url` and `ai_image_url`/`generated_photo_url`
4. **Sharing:** ViewShot captures the modal content and shares to Instagram Stories

### Supabase Client Configuration
```tsx
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## User Flow Context

### Complete User Journey
1. **User Registration:** User enters username via `UserRegistration` component
2. **Inbox Loading:** App fetches messages from Supabase filtered by username
3. **Message Selection:** User taps message in inbox list
4. **Modal Opens:** `MessageDetailModal` displays with prompt + generated image
5. **Sharing:** User taps "Share to Stories" → ViewShot captures → Instagram opens
6. **Problem:** No watermark appears in shared image

### Current UI Elements in Modal
- **Header:** Instagram selector and close button (NOT captured)
- **ViewShot Content:** 
  - Gradient prompt card with text
  - Generated AI image
  - **Missing:** Watermark footer
- **Footer:** Share button, toggle buttons, reply button (NOT captured)

## Technical Constraints Summary

### Expo Managed Workflow Limitations
- **No Native Modules:** Cannot use packages requiring native linking
- **No Custom Native Code:** Must use Expo-compatible solutions only
- **Build Restrictions:** Cannot eject to bare workflow
- **Package Compatibility:** Must work with Expo SDK 53

### Instagram Stories Requirements  
- **Image Dimensions:** 1080x1920 recommended, currently using 1080x1400
- **File Format:** JPEG preferred
- **Sharing Method:** 
  - Android: `expo-intent-launcher` with Instagram intent
  - iOS: `react-native-share` with base64 encoded image

### Watermark Design Requirements
- **Positioning:** Bottom of image with padding
- **Styling:** Match prompt gradient style (semi-transparent black background, white bold text)
- **Content:** "roastd.link" text
- **Visibility:** Only in shared image, never in mobile UI
- **Size:** Proportional to image, readable but not intrusive

## Expected Solution Requirements

The ideal solution should:

1. **Add watermark ONLY during ViewShot capture**
2. **Never show watermark in mobile app UI**
3. **Use Expo-compatible packages only**
4. **Match existing gradient styling**
5. **Position watermark at bottom with proper padding**
6. **Maintain current sharing functionality**
7. **Work on both iOS and Android**
8. **Not impact app performance**

## Code Integration Points

### Where to Add Watermark Logic
The watermark should be added inside the ViewShot component in `MessageDetailModal.tsx`:

```tsx
<ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }} style={styles.mainCard}>
  {/* Existing prompt card */}
  <LinearGradient colors={gradients[currentGradientIndex]} style={styles.promptContainer}>
    <Text style={styles.promptText}>{message.prompt}</Text>
  </LinearGradient>

  {/* Existing generated image */}
  <Image source={{ uri: message.generated_photo_url }} style={styles.generatedImage} />

  {/* NEW: Watermark should go here - only visible during capture */}
  {/* SOLUTION NEEDED */}
</ViewShot>
```

### Required Styling
The watermark should use similar styling to the prompt card:

```tsx
const watermarkStyles = {
  watermarkContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  watermarkText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
};
```

### Attempt 3: Canvas/ImageManipulator
- **Issue:** Complex implementation, compatibility issues with Expo

## Requirements

### Must Have:
1. **Expo compatibility** - No native linking required
2. **Watermark only in shared content** - Never visible in mobile app
3. **Professional appearance** - Semi-transparent background, clean typography
4. **Cross-platform** - Works on both iOS and Android

### Desired Watermark Style:
```tsx
// Similar to existing prompt style
<LinearGradient
  colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.6)']}
  style={styles.watermarkContainer}
>
  <Text style={styles.watermarkText}>roastd.link</Text>
</LinearGradient>
```

### Positioning:
- Bottom of the image
- 20px margins from edges
- Height: ~50px
- Rounded corners (15px)

## Technical Constraints

1. **Expo Environment** - Cannot use packages requiring native code
2. **ViewShot Usage** - Currently using `react-native-view-shot` for capture
3. **File System** - Using `expo-file-system` for file operations
4. **Sharing** - Using `expo-intent-launcher` (Android) and `react-native-share` (iOS)

## Inspiration

Apps like NGL successfully add watermarks only to shared content without showing them in the mobile interface. We need a similar approach.

## Expected Solution

The ideal solution should:

1. **Dynamically add watermark** only during the sharing process
2. **Use Expo-compatible libraries** only
3. **Maintain clean mobile UI** - no watermark visible to users
4. **Professional watermark design** - matches app aesthetic
5. **Reliable cross-platform** functionality

## Current File Structure

```
mobile/
├── components/
│   └── MessageDetailModal.tsx (main file to modify)
├── package.json (Expo dependencies)
└── app.json (Expo configuration)
```

## Package.json Dependencies (Relevant)

```json
{
  "dependencies": {
    "expo": "~51.0.28",
    "expo-file-system": "~17.0.1",
    "expo-intent-launcher": "~11.0.1",
    "expo-linear-gradient": "~13.0.2",
    "react-native-view-shot": "3.8.0",
    "react-native-share": "^10.2.1"
  }
}
```

## Question for AI Advisor

How can we implement a watermark that only appears in Instagram Stories sharing (not in mobile UI) using Expo-compatible libraries? Please provide a complete working solution with code examples.