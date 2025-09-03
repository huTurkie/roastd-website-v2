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
        width: 1080, // Explicitly set width for 9:16 aspect ratio
        height: 1920, // Explicitly set height for 9:16 aspect ratio
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
        <SafeAreaView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="ellipsis-horizontal" size={28} color="#A9A9A9" />
            <View style={styles.socialIcons}>
              <TouchableOpacity 
                style={[styles.socialIconWrapper, selectedSocial === 'instagram' && styles.selectedSocialIconWrapper]}
                onPress={() => setSelectedSocial('instagram')}
              >
                <Ionicons name="logo-instagram" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.socialIconWrapper, selectedSocial === 'snapchat' && styles.selectedSocialIconWrapper]}
                onPress={() => setSelectedSocial('snapchat')}
              >
                <Ionicons name="logo-snapchat" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.socialIconWrapper, selectedSocial === 'whatsapp' && styles.selectedSocialIconWrapper]}
                onPress={() => setSelectedSocial('whatsapp')}
              >
                <Ionicons name="logo-whatsapp" size={20} color="#fff" />
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
                  {"User 2 prompt"}
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

              {/* Footer Text */}
              <Text style={styles.footerText}>
                sent with love 🩷 from Roast Team
              </Text>

              {/* Reply Button */}
              <TouchableOpacity style={styles.replyButton} onPress={handleShare}>
                <Ionicons name="logo-instagram" size={20} color="white" style={styles.replyIcon} />
                <Text style={styles.replyText}>reply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  socialIcons: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  socialIconWrapper: {
    backgroundColor: '#A9A9A9',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  selectedSocialIconWrapper: {
    backgroundColor: '#000',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  mainCard: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginTop: 20,
  },
  promptContainer: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  promptText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    lineHeight: 24,
  },
  promptTextBlack: {
    color: 'black',
  },
  generatedImage: {
    width: '100%',
    height: height * 0.45,
  },
  footerContainer: {
    width: '100%',
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  gradientCircleButton: {
    marginRight: 16,
  },
  gradientCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  toggleButton: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  toggleButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    backgroundColor: 'transparent',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  replyButton: {
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 30,
    width: '100%',
    justifyContent: 'center',
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
