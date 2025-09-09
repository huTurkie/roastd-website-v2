import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, SafeAreaView, Dimensions, Platform, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import StickerCreator, { StickerCreatorRef } from './StickerCreator';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS } from 'react-native-reanimated';

let Share: any;
if (Constants.appOwnership !== 'expo') {
  Share = require('react-native-share').default;
} else {
  Share = { Social: { INSTAGRAM_STORIES: 'instagram_stories' }, shareSingle: async () => { /* no-op */ } };
}

const FACEBOOK_APP_ID = '1736377773679733';

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
  onDeleteMessage?: (messageId: string) => void;
  onReportMessage?: (messageId: string) => void;
}

export default function MessageDetailModal({ visible, message, onClose, onDeleteMessage, onReportMessage }: MessageDetailModalProps) {
  // All hooks must be called before any conditional logic
  const viewShotRef = useRef<ViewShot>(null);
  const backgroundViewShotRef = useRef<ViewShot>(null);
  const stickerCreatorRef = useRef<StickerCreatorRef>(null);
  const [currentGradientIndex, setCurrentGradientIndex] = useState(0);
  const [selectedSocial, setSelectedSocial] = useState('instagram');
  const [isShowingOriginal, setIsShowingOriginal] = useState(false);
  const [isCapturingBackground, setIsCapturingBackground] = useState(false);
  const [previewStickerUri, setPreviewStickerUri] = useState<string | null>(null);
  const [showGestureHint, setShowGestureHint] = useState(true);
  const [showGestureHints, setShowGestureHints] = useState(true);
  const [showInteractiveModal, setShowInteractiveModal] = useState(false);
  const [isCapturingShare, setIsCapturingShare] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  // Shared values for draggable sticker (same as main screen)
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(-50);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(-50);
  
  // Gesture hint animation
  const hintOpacity = useSharedValue(1);
  const hintScale = useSharedValue(1);
  const topHintOpacity = useSharedValue(1);
  const bottomHintOpacity = useSharedValue(1);

  // Animated styles for sticker - MUST be before conditional logic
  const animatedStickerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  // Animated styles for Instagram sticker (scaled to canvas)
  const animatedInstagramStickerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value * (1080 / width) },
        { translateY: translateY.value * (1920 / height) },
        { scale: scale.value },
      ],
    };
  });

  // Animated styles for gesture hint - MUST be before conditional logic
  const animatedHintStyle = useAnimatedStyle(() => {
    return {
      opacity: hintOpacity.value,
      transform: [{ scale: hintScale.value }],
    };
  });

  // Animated styles for new gesture hints
  const topHintStyle = useAnimatedStyle(() => {
    return {
      opacity: topHintOpacity.value,
    };
  });

  const bottomHintStyle = useAnimatedStyle(() => {
    return {
      opacity: bottomHintOpacity.value,
    };
  });

  // Pan gesture for dragging sticker - MUST be before conditional logic
  const panGesture = Gesture.Pan()
    .onBegin(() => {
      'worklet';
      // Hide gesture hint when user starts interacting
      hintOpacity.value = withSpring(0, { duration: 300 });
      hintScale.value = withSpring(0.8, { duration: 300 });
      topHintOpacity.value = withTiming(0, { duration: 200 });
    })
    .onUpdate((event) => {
      'worklet';
      translateX.value = savedTranslateX.value + event.translationX;
      translateY.value = savedTranslateY.value + event.translationY;
    })
    .onEnd(() => {
      'worklet';
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onFinalize(() => {
      runOnJS(setShowGestureHints)(false);
    });

  // Pinch gesture for scaling sticker - MUST be before conditional logic
  const pinchGesture = Gesture.Pinch()
    .onBegin(() => {
      'worklet';
      // Hide gesture hint when user starts interacting
      hintOpacity.value = withSpring(0, { duration: 300 });
      hintScale.value = withSpring(0.8, { duration: 300 });
      topHintOpacity.value = withTiming(0, { duration: 200 });
    })
    .onUpdate((event) => {
      'worklet';
      scale.value = savedScale.value * event.scale;
    })
    .onEnd(() => {
      'worklet';
      savedScale.value = scale.value;
    })
    .onFinalize(() => {
      runOnJS(setShowGestureHints)(false);
    });

  // Combined gesture - MUST be before conditional logic
  const combinedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

  const cycleGradient = () => {
    setCurrentGradientIndex((prevIndex) => (prevIndex + 1) % gradients.length);
  };

  const handleDeleteMessage = () => {
    if (!message) return;
    
    // Prevent deletion of demo message
    if (message.id === 'demo-1') {
      setShowOptionsMenu(false);
      setTimeout(() => {
        Alert.alert(
          'Cannot Delete',
          'This is a demo message and cannot be deleted.',
          [{ 
            text: 'OK', 
            style: 'default'
          }]
        );
      }, 100);
      return;
    }
    
    setShowOptionsMenu(false);
    setTimeout(() => {
      Alert.alert(
        'Delete Message',
        'Are you sure you want to delete this message? This action cannot be undone.',
        [
          { 
            text: 'Cancel', 
            style: 'cancel'
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              onDeleteMessage?.(message.id);
              onClose();
            },
          },
        ]
      );
    }, 100);
  };

  const handleReportMessage = () => {
    if (!message) return;
    
    setShowOptionsMenu(false);
    setTimeout(() => {
      Alert.alert(
        'Report Message',
        'Are you sure you want to report this message? Our team will review it.',
        [
          { 
            text: 'Cancel', 
            style: 'cancel'
          },
          {
            text: 'Report',
            style: 'destructive',
            onPress: () => {
              onReportMessage?.(message.id);
              Alert.alert('Reported', 'Thank you for reporting. We will review this message.');
            },
          },
        ]
      );
    }, 100);
  };

  if (!message) {
    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <SafeAreaView style={styles.container}>
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={28} color="#A9A9A9" />
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: '#666', fontSize: 16 }}>No message selected</Text>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    );
  }

  const handleReplyPress = () => {
    // Reset gesture hint when reply is pressed
    hintOpacity.value = 1;
    hintScale.value = 1;
    setShowGestureHint(true);
  };

  const handleInteractiveShare = async () => {
    try {
      // Hide gesture hints before capture
      setShowGestureHints(false);
      topHintOpacity.value = withTiming(0, { duration: 200 });
      
      // Wait a moment for the animation to complete
      await new Promise(resolve => setTimeout(resolve, 250));

      // Capture the main ViewShot which includes the positioned prompt
      if (!viewShotRef.current) {
        Alert.alert('Error', 'Cannot capture image. Please try again.');
        return;
      }

      const compositeUri = await captureRef(viewShotRef, {
        format: 'png',
        quality: 1.0,
        result: 'tmpfile',
        width: 1080,
        height: 1920,
      });

      if (!compositeUri) {
        Alert.alert('Error', 'Could not capture image.');
        return;
      }

      // Share captured image directly to Instagram without any modifications
      if (Platform.OS === 'android') {
        const contentUri = await FileSystem.getContentUriAsync(compositeUri);
        await IntentLauncher.startActivityAsync('com.instagram.share.ADD_TO_STORY', {
          data: contentUri,
          flags: 1,
          type: 'image/png',
        });
      } else if (Platform.OS === 'ios') {
        const base64Image = await FileSystem.readAsStringAsync(compositeUri, { encoding: FileSystem.EncodingType.Base64 });
        const imageUriBase64 = `data:image/png;base64,${base64Image}`;

        const shareOptions = {
          social: Share.Social.INSTAGRAM_STORIES,
          backgroundImage: imageUriBase64,
          appId: FACEBOOK_APP_ID,
        };

        if (Share.shareSingle && Constants.appOwnership !== 'expo') {
          await Share.shareSingle(shareOptions);
        } else {
          Alert.alert('Instagram Sharing Unavailable', 'Instagram sharing is not available in Expo Go. Please use a development build or production app.');
        }
      } else {
        await Sharing.shareAsync(compositeUri.uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share to Instagram Stories',
        });
      }

      setShowInteractiveModal(false);
    } catch (error: any) {
      console.error('Interactive sharing error:', error);
      setIsCapturingBackground(false);
      if (error.message.includes('No Activity found to handle Intent')) {
        Alert.alert('Error', 'Could not open Instagram. Please make sure it is installed.');
      } else {
        Alert.alert('Error', 'An unexpected error occurred during sharing.');
      }
    }
  };

  const handleShare = async () => {
    try {
      // Trigger off-screen rendering of shareable content with watermark
      setIsCapturingShare(true);
      
      // Wait for next render cycle to ensure the hidden ViewShot is rendered
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Check if ref is available after rendering
      if (!viewShotRef.current) {
        setIsCapturingShare(false);
        Alert.alert('Error', 'Cannot capture view for sharing. Please try again.');
        return;
      }
      
      const uri = await captureRef(viewShotRef, {
        format: 'jpg',
        quality: 0.9,
        result: 'tmpfile',
        width: 1080, // Explicitly set width for Instagram Stories
        height: 1920, // Full Instagram Story height
      });
      
      // Hide the off-screen content
      setIsCapturingShare(false);

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
          appId: FACEBOOK_APP_ID,
        };

        if (Share.shareSingle) {
          await Share.shareSingle(shareOptions);
        } else {
          Alert.alert('Error', 'Sharing functionality is not available.');
        }
      }
    } catch (error: any) {
      console.error('Sharing error:', error);
      setIsCapturingShare(false); // Ensure state is reset on error
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
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.modalContainer}>
          <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setShowOptionsMenu(true)} style={styles.menuButton}>
                <Ionicons name="ellipsis-horizontal" size={28} color="#A9A9A9" />
              </TouchableOpacity>
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
            <ScrollView 
              style={styles.content} 
              contentContainerStyle={styles.scrollContentContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* Show Coming Soon card for non-Instagram platforms */}
              {(selectedSocial === 'snapchat' || selectedSocial === 'whatsapp') ? (
                <View style={styles.comingSoonContainer}>
                  <LinearGradient
                    colors={['#FEDA77', '#F58529', '#DD2A7B', '#8134AF', '#515BD4']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.comingSoonGradient}
                  >
                    <Ionicons 
                      name={selectedSocial === 'snapchat' ? 'logo-snapchat' : 'logo-whatsapp'} 
                      size={48} 
                      color="white" 
                    />
                    <Text style={styles.comingSoonTitle}>Coming Soon</Text>
                    <Text style={styles.comingSoonSubtitle}>
                      {selectedSocial === 'snapchat' ? 'Snapchat' : 'WhatsApp'} sharing will be available soon!
                    </Text>
                  </LinearGradient>
                </View>
              ) : (
                <>
                  {/* ViewShot wraps the main card to capture exactly what user sees */}
                  <ViewShot 
                    ref={viewShotRef} 
                    options={{ format: 'png', quality: 1.0, width: undefined, height: undefined }} 
                    style={styles.mainCard}
                  >
                {/* Generated Image */}
                <View style={styles.imageWrapper}>
                  <Image 
                    source={{ uri: isShowingOriginal ? message.original_photo_url : message.generated_photo_url || 'https://picsum.photos/400/600' }} 
                    style={styles.generatedImage}
                    resizeMode="cover"
                  />
                </View>
                
                {/* Draggable Prompt Card with Profile Section */}
                <GestureDetector gesture={combinedGesture}>
                  <Animated.View style={[styles.promptContainer, animatedStickerStyle]}>
                    <LinearGradient
                      colors={gradients[currentGradientIndex]}
                      style={styles.promptGradient}
                    >
                      <View style={styles.promptContentWrapper}>
                        {/* Profile Section */}
                        <View style={styles.profileSection}>
                          <View style={styles.profileIconContainer}>
                            <Ionicons 
                              name="person-circle-outline" 
                              size={32} 
                              color={currentGradientIndex === gradients.length - 1 ? '#666' : 'white'} 
                            />
                          </View>
                          <Text style={[styles.profileLabel, currentGradientIndex === gradients.length - 1 && styles.profileLabelBlack]}>
                            Anon Friend
                          </Text>
                        </View>
                        
                        {/* Prompt Text */}
                        <View style={styles.promptTextContainer}>
                          <Text style={[styles.promptText, currentGradientIndex === gradients.length - 1 && styles.promptTextBlack]}>
                            {message.updated_prompt || message.roast_prompt || message.prompt || "No prompt available"}
                          </Text>
                        </View>
                      </View>
                    </LinearGradient>
                  </Animated.View>
                </GestureDetector>

                {/* Watermark */}
                <View style={styles.watermarkCapture}>
                  <Image 
                    source={require('../assets/images/footer3.png')}
                    style={styles.watermarkCaptureImage}
                    resizeMode="contain"
                  />
                </View>
                </ViewShot>

                {/* Gesture Hints - Outside ViewShot so they don't get captured */}
                {showGestureHints && (
                  <Animated.View style={[styles.messageDetailTopHint, topHintStyle]}>
                    <Text style={styles.messageDetailHintSubText}>Drag to move, pinch to resize, tap Reply to share on your story</Text>
                    <Text style={styles.messageDetailHintText}>Move me 👇</Text>
                  </Animated.View>
                )}

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
                  <TouchableOpacity onPress={handleShare} style={styles.replyButton}>
                    <Ionicons name="logo-instagram" size={20} color="#fff" />
                    <Text style={styles.replyButtonText}>reply</Text>
                  </TouchableOpacity>
                </View>
                </>
              )}
            </ScrollView>

            {/* Options Menu Modal */}
            {showOptionsMenu && (
              <Modal
                visible={showOptionsMenu}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowOptionsMenu(false)}
                presentationStyle="overFullScreen"
              >
                <TouchableOpacity 
                  style={styles.optionsOverlay} 
                  activeOpacity={1} 
                  onPress={() => setShowOptionsMenu(false)}
                >
                  <TouchableOpacity activeOpacity={1}>
                    <View style={styles.optionsMenu}>
                      <TouchableOpacity 
                        style={styles.optionItem} 
                        onPress={handleDeleteMessage}
                      >
                        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                        <Text style={[styles.optionText, styles.deleteText]}>Delete Message</Text>
                      </TouchableOpacity>
                      
                      <View style={styles.optionSeparator} />
                      
                      <TouchableOpacity 
                        style={styles.optionItem} 
                        onPress={handleReportMessage}
                      >
                        <Ionicons name="flag-outline" size={20} color="#FF9500" />
                        <Text style={[styles.optionText, styles.reportText]}>Report Message</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </TouchableOpacity>
              </Modal>
            )}
          </SafeAreaView>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
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
  menuButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'transparent',
  },
  mainCard: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginTop: 10,
  },
  promptContainer: {
    position: 'absolute',
    top: '45%',
    left: 20,
    right: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  promptGradient: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  promptContentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  profileSection: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 60,
  },
  profileIconContainer: {
    marginBottom: 4,
  },
  profileLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
    textAlign: 'center',
  },
  profileLabelBlack: {
    color: '#666',
  },
  promptTextContainer: {
    flex: 1,
  },
  // Hidden Instagram Stories canvas - Fixed dimensions
  hiddenInstagramCanvas: {
    position: 'absolute',
    left: -9999,
    top: -9999,
    width: 1080,
    height: 1920,
    backgroundColor: '#000',
  },
  instagramBackgroundImage: {
    width: 1080,
    height: 1920,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  instagramPromptContainer: {
    position: 'absolute',
    top: 50,
    left: 50,
    width: 200,
    height: 80,
    zIndex: 10,
  },
  instagramPromptGradient: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  instagramPromptText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    lineHeight: 24,
  },
  instagramWatermark: {
    position: 'absolute',
    bottom: 50,
    right: 50,
    width: 200,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  instagramWatermarkLogo: {
    width: 180,
    height: 50,
  },
  watermarkCapture: {
    position: 'absolute',
    bottom: 5,
    right: -20,
    width: 120,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  watermarkCaptureImage: {
    width: 100,
    height: 30,
  },
  scrollContentContainer: {
    alignItems: 'center',
    justifyContent: 'space-between',
    flexGrow: 1,
    backgroundColor: 'transparent',
  },
  promptText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    textAlign: 'left',
    lineHeight: 24,
  },
  promptTextBlack: {
    color: 'black',
  },
  imageWrapper: {
    width: '100%',
    height: height * 0.65,
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: -10,
  },
  generatedImage: {
    width: '100%',
    height: '100%',
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
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  toggleButtonText: {
    fontSize: 14,
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
  replyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Interactive Modal Styles
  interactiveModalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  interactiveContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  instructionsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    marginHorizontal: 20,
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsText: {
    flex: 1,
    fontSize: 16,
    color: '#495057',
    fontWeight: '500',
  },
  checkmarkButton: {
    backgroundColor: '#28a745',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  interactiveContent: {
    flex: 1,
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  interactiveBackgroundImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  stickerContainer: {
    position: 'absolute',
    top: 100,
    left: 50,
    zIndex: 10,
  },
  interactiveSticker: {
    width: 200,
    height: 80,
  },
  gestureHint: {
    position: 'absolute',
    top: -40,
    left: '50%',
    transform: [{ translateX: -50 }],
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 20,
  },
  gestureHintText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  interactiveCloseButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    padding: 8,
    zIndex: 30,
  },
  // Hidden background capture styles
  hiddenBackgroundContainer: {
    position: 'absolute',
    left: -9999,
    top: -9999,
    width: 1080,
    height: 1920,
    backgroundColor: '#000',
  },
  backgroundImage: {
    width: '100%',
    height: 1800,
    resizeMode: 'cover',
  },
  backgroundWatermarkContainer: {
    position: 'absolute',
    bottom: 5,
    right: -30,
    width: 200,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundWatermarkLogo: {
    width: 180,
    height: 50,
  },
  stickerContainer: {
    position: 'absolute',
    top: 100,
    left: 50,
    zIndex: 10,
  },
  interactiveSticker: {
    width: 200,
    height: 80,
  },
  gestureHint: {
    position: 'absolute',
    top: -40,
    left: '50%',
    transform: [{ translateX: -50 }],
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 20,
  },
  gestureHintText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  messageDetailTopHint: {
    position: 'absolute',
    top: 68,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    zIndex: 15,
    alignItems: 'center',
  },
  messageDetailHintText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  messageDetailHintSubText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    opacity: 0.9,
  },
  // Options Menu Styles
  optionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsMenu: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  deleteText: {
    color: '#FF3B30',
  },
  reportText: {
    color: '#FF9500',
  },
  optionSeparator: {
    height: 1,
    backgroundColor: '#E5E5E7',
    marginHorizontal: 20,
  },
  // Coming Soon Styles
  comingSoonContainer: {
    width: '100%',
    marginTop: 20,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  comingSoonGradient: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  comingSoonTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  comingSoonSubtitle: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 22,
  },
});
