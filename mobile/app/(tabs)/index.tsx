import React, { useEffect, useRef, useState, forwardRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Image,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { pickImage, uploadPhoto, createRoastSession, generateLinkCode, updateRoastPrompt } from '../../lib/uploadHelpers';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Linking from 'expo-linking';
import * as Sharing from 'expo-sharing';
import { NativeModules } from 'react-native';
import Constants from 'expo-constants';
import { Link } from 'expo-router';
import AppHeader from '@/components/AppHeader';

let Share: any;
if (Constants.appOwnership !== 'expo') {
  Share = require('react-native-share').default;
} else {
  Share = { Social: { INSTAGRAM_STORIES: 'instagram_stories' }, shareSingle: async () => { /* no-op */ } };
}

const FACEBOOK_APP_ID = '1736377773679733';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const storyWidth = 540;
const storyHeight = 960;

interface BackgroundOption { type: string; value: string | string[]; }

interface ShareableViewProps {
  uploadedImageUri: string | null;
  currentPrompt: string;
  background: BackgroundOption;
  translateX: Animated.SharedValue<number>;
  translateY: Animated.SharedValue<number>;
  scale: Animated.SharedValue<number>;
}

const ShareableView = React.forwardRef<ViewShot, ShareableViewProps>(
  ({ uploadedImageUri, currentPrompt, background, translateX, translateY, scale }, ref) => {
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    }));

    return (
      <ViewShot ref={ref} options={{ format: 'jpg', quality: 0.9 }} style={styles.shareableViewContainer}>
        <View style={styles.shareableCard}>
          {uploadedImageUri && (
            <Image
              source={{ uri: uploadedImageUri }}
              style={styles.shareableImage}
              resizeMode="cover"
            />
          )}
          <Animated.View style={[styles.draggableContainer, animatedStyle]}>
            <View style={styles.unifiedContainer}>
              {background.type === 'gradient' ? (
                <LinearGradient
                  colors={background.value as string[] as [string, string, ...string[]]}
                  style={styles.promptBackground}
                >
                  <Text style={styles.mainText}>{currentPrompt}</Text>
                </LinearGradient>
              ) : (
                <LinearGradient
                  colors={[background.value as string, background.value as string] as [string, string]}
                  style={styles.promptBackground}
                >
                  <Text style={styles.mainText}>{currentPrompt}</Text>
                </LinearGradient>
              )}
              <View style={styles.linkPlaceholder}>
                <Text style={styles.linkPlaceholderText}>Paste your </Text>
                <View style={styles.linkButton}>
                  <Ionicons name="link" size={12} color="#007AFF" />
                  <Text style={styles.linkButtonText}> LINK</Text>
                </View>
                <Text style={styles.linkPlaceholderText}> here</Text>
              </View>
            </View>
          </Animated.View>
        </View>
      </ViewShot>
    );
  }
);

const prompts = [
  'roast this photo ',
  'Make me look cooler ',
  'Turn me into a superhero ',
  'Make this funnier ',
  'Roast my outfit',
];

function HomeScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [roastLink, setRoastLink] = useState('');
  const [currentPrompt, setCurrentPrompt] = useState(prompts[0]);
  const [promptIndex, setPromptIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImageUri, setUploadedImageUri] = useState<string | null>(null);

  const viewShotRef = useRef<ViewShot>(null);
  const shareViewShotRef = useRef<ViewShot>(null);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const backgroundOptions: Array<BackgroundOption> = [
    { type: 'solid', value: 'rgba(0, 0, 0, 0.2)' },
    { type: 'gradient', value: ['#8a3ab9', '#e95950', '#fccc63'] },
    { type: 'solid', value: 'rgba(255, 255, 255, 0.25)' },
    { type: 'solid', value: 'rgba(225, 48, 108, 0.3)' },
    { type: 'solid', value: 'rgba(131, 58, 180, 0.3)' },
  ];
  const [bgIndex, setBgIndex] = useState(0);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = savedScale.value * event.scale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const dragGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = savedTranslateX.value + event.translationX;
      translateY.value = savedTranslateY.value + event.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const composedGesture = Gesture.Simultaneous(dragGesture, pinchGesture);

  const animatedProps = useAnimatedProps(() => {
    return {
      style: {
        transform: [
          { translateX: translateX.value },
          { translateY: translateY.value },
          { scale: scale.value },
        ],
      },
    };
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  useEffect(() => {
    const testSupabaseConnection = async () => {
      try {
        console.log(' Testing Supabase client initialization...');
        console.log(' Supabase client created:', !!supabase);

        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error(' Supabase connection error:', error.message);
        } else {
          console.log(' Supabase connection successful! Session:', session ? 'User logged in' : 'No user session (expected)');
        }
      } catch (err) {
        console.error(' Supabase client error:', err);
      }
    };

    testSupabaseConnection();
  }, []);

  useEffect(() => {
    const bounce = () => {
    };

    const rotate = () => {
    };

    bounce();
    rotate();
  }, []);

  const handleDicePress = async () => {
    const currentIndex = prompts.indexOf(currentPrompt);
    const nextIndex = (currentIndex + 1) % prompts.length;
    const newPrompt = prompts[nextIndex];
    setCurrentPrompt(newPrompt);

    // If a photo has already been uploaded, update its prompt in the database
    if (roastLink) {
      try {
        const linkCode = roastLink.split('code=')[1];
        if (linkCode) {
          console.log(`Dice pressed. Updating prompt to "${newPrompt}" for link code: ${linkCode}`);
          await updateRoastPrompt(linkCode, newPrompt);
        }
      } catch (error) {
        console.error('Failed to update prompt on dice press:', error);
        // Optionally, inform the user that the update failed
      }
    }
  };

  const handleShare = async () => {
    if (!roastLink) {
      Alert.alert('No Link!', 'Please upload a photo to generate a link first.');
      return;
    }

    try {
      const uri = await captureRef(shareViewShotRef, {
        format: 'jpg',
        quality: 0.9,
        result: 'tmpfile',
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
        await Clipboard.setStringAsync(roastLink);

        const canOpenInstagram = await Linking.canOpenURL('instagram-stories://share');

        if (canOpenInstagram) {
          const base64Image = await captureRef(shareViewShotRef, {
            format: 'jpg',
            quality: 0.9,
            result: 'base64',
          });

          if (!base64Image) {
            Alert.alert('Oops!', 'Could not capture the image for sharing.');
            return;
          }

          const imageUriBase64 = `data:image/jpeg;base64,${base64Image}`;

          const shareOptions: any = {
            social: Share.Social.INSTAGRAM_STORIES,
            backgroundImage: imageUriBase64,
            appId: FACEBOOK_APP_ID,
          };

          if (Share.shareSingle && Constants.appOwnership !== 'expo') {
            await Share.shareSingle(shareOptions);

            Alert.alert(
              'Link Copied!',
              'Instagram Stories opened! Your roast link is copied to clipboard. Paste it in your story!'
            );
          } else if (Constants.appOwnership === 'expo') {
            Alert.alert(
              'Instagram Sharing Unavailable',
              'Instagram Stories sharing is only supported in development builds. Your link has been copied.'
            );
            await Clipboard.setStringAsync(roastLink);
          } else {
            Alert.alert('Error', 'Sharing functionality is not available.');
          }
        } else {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/jpeg',
            dialogTitle: 'Share to Instagram Stories',
          });
        }
      }
    } catch (error: any) {
      console.error('Sharing error:', error);
      if (error.message.includes('No Activity found to handle Intent')) {
        Alert.alert('Error', 'Could not open Instagram. Please make sure it is installed.');
      } else {
        Alert.alert('Error', 'An unexpected error occurred during sharing. Please try again.');
      }
    }
  };

  const handleCopyLink = async () => {
    if (roastLink) {
      try {
        await Clipboard.setStringAsync(roastLink);
        Alert.alert('Copied!', 'Your roast link has been copied with the current prompt.');
      } catch (error) {
        console.error('Error in handleCopyLink:', error);
        await Clipboard.setStringAsync(roastLink);
        Alert.alert('Copied!', 'Your roast link has been copied.');
      }
    } else {
      Alert.alert('No Link!', 'Please upload a photo to generate a link first.');
    }
  };

  const handleUploadPress = async () => {
    const uri = await pickImage();
    if (!uri) {
      setIsUploading(false);
      return;
    }

    try {
      setIsUploading(true);

      const timestamp = Date.now();
      const fileName = `roast_${timestamp}.jpg`;
      const linkCode = generateLinkCode();

      const photoPath = await uploadPhoto(uri, fileName);
      if (!photoPath) {
        Alert.alert('Upload Failed', 'Could not upload your photo. Please try again.');
        setIsUploading(false);
        return;
      }

      const sessionId = await createRoastSession(
        null,
        photoPath,
        currentPrompt,
        linkCode
      );

      if (!sessionId) {
        Alert.alert('Session Failed', 'Could not create roast session. Please try again.');
        setIsUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('roast-photos')
        .getPublicUrl(photoPath);

      const publicUrl = urlData.publicUrl;

      // IMPORTANT: Replace YOUR_LOCAL_IP with your computer's local IP address.
      const localRoastLink = `http://YOUR_LOCAL_IP:8000/unique-pic-id/index.html?code=${linkCode}`;

      Alert.alert(
        'Upload Successful!',
        `Your local roast link is ready: ${localRoastLink}`
      );

      console.log(` Roast session created! Link code: ${linkCode}`);
      console.log(` Public photo URL: ${publicUrl}`);

      setUploadedImageUri(uri);
      setRoastLink(localRoastLink);
      setIsUploading(false);
    } catch (error) {
      console.error('Upload process failed:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleColorPress = () => {
    setBgIndex((prevIndex) => (prevIndex + 1) % backgroundOptions.length);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ position: 'absolute', top: -2000, left: -2000 }}>
        <ShareableView
          ref={shareViewShotRef}
          uploadedImageUri={uploadedImageUri}
          currentPrompt={currentPrompt}
          background={backgroundOptions[bgIndex]}
          translateX={translateX}
          translateY={translateY}
          scale={scale}
        />
      </View>

      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <AppHeader activeTab="play" />
        <View style={styles.content}>
          <View style={styles.cardContainer}>
            <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }}>
              <View style={styles.card}>
                {uploadedImageUri ? (
                  <Image
                    source={{ uri: uploadedImageUri }}
                    style={styles.uploadedImage}
                    resizeMode="cover"
                  />
                ) : null}
                <GestureDetector gesture={composedGesture}>
                  <Animated.View style={[styles.draggableContainer, animatedStyle]}>
                    <View style={styles.unifiedContainer}>
                      {backgroundOptions[bgIndex].type === 'gradient' ? (
                        <LinearGradient
                          colors={backgroundOptions[bgIndex].value as string[] as [string, string, ...string[]]}
                          style={styles.promptBackground}
                        >
                          <Text style={styles.mainText}>{currentPrompt}</Text>
                        </LinearGradient>
                      ) : (
                        <LinearGradient
                          colors={[backgroundOptions[bgIndex].value as string, backgroundOptions[bgIndex].value as string] as [string, string]}
                          style={styles.promptBackground}
                        >
                          <Text style={styles.mainText}>{currentPrompt}</Text>
                        </LinearGradient>
                      )}
                      <View style={styles.linkPlaceholder}>
                        <Text style={styles.linkPlaceholderText}>Paste your </Text>
                        <View style={styles.linkButton}>
                          <Ionicons name="link" size={12} color="#007AFF" />
                          <Text style={styles.linkButtonText}> LINK</Text>
                        </View>
                        <Text style={styles.linkPlaceholderText}> here</Text>
                      </View>
                    </View>
                  </Animated.View>
                </GestureDetector>
              </View>
            </ViewShot>

            <TouchableOpacity style={styles.colorButton} onPress={handleColorPress}>
              <LinearGradient
                colors={backgroundOptions[bgIndex].type === 'gradient' ? (backgroundOptions[bgIndex].value as string[] as [string, string, ...string[]]) : [backgroundOptions[bgIndex].value as string, backgroundOptions[bgIndex].value as string] as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.colorGradient}
              >
                <Text style={styles.colorButtonText}>Color</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.diceIcon} onPress={handleDicePress}>
              <Text style={styles.diceEmoji}>🎲</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dotsContainer} />

          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Step 1: Upload a photo</Text>
            <TouchableOpacity style={styles.uploadButton} onPress={handleUploadPress}>
              <Ionicons name="camera" size={16} color="#007bff" />
              <Text style={styles.uploadButtonText}>Choose Photo</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Step 2: Copy your link</Text>
            <Text style={styles.linkText}>
              {roastLink || 'roastd.link/my-link'}
            </Text>
            <TouchableOpacity style={styles.copyButton} onPress={handleCopyLink}>
              <Ionicons name="link" size={16} color="#ff4757" />
              <Text style={styles.copyButtonText}>copy link</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Step 3: Share link on your story</Text>
            <TouchableOpacity onPress={handleShare}>
              <LinearGradient
                colors={['#E1306C', '#C13584', '#833AB4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.shareButton}
              >
                <Text style={styles.shareButtonText}>Share!</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const AnimatedShareableWrapper = ({ animatedProps, children }: any) => {
  const animatedStyle = useAnimatedStyle(() => {
    return animatedProps.value.style;
  });

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerLeft: {
    flex: 1,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
    justifyContent: 'center',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  playText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginRight: 20,
  },
  inboxText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ccc',
    marginRight: 5,
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4757',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 0, // Adjusted from 20 to move content up
  },
  cardContainer: {
    position: 'relative',
  },
  card: {
    backgroundColor: '#8B6F47',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 380, // Increased height
    position: 'relative',
  },
  uploadedImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
  },
  mainText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  diceIcon: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorButton: {
    position: 'absolute',
    bottom: 15,
    left: 15,
    width: 35,
    height: 35,
    borderRadius: 17.5,
    overflow: 'hidden',
  },
  colorGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 17.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorButtonText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  diceEmoji: {
    fontSize: 28,
    color: '#fff',
  },
  dotsContainer: {
    marginVertical: 10,
  },
  stepContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginVertical: 10, // Reduced vertical margin
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
    textAlign: 'center',
  },
  linkText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#007AFF',
    backgroundColor: 'transparent',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 25,
  },
  uploadButtonText: {
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ff3b30',
    backgroundColor: 'transparent',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 25,
  },
  copyButtonText: {
    color: '#ff3b30',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  shareButton: {
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkPlaceholder: {
    backgroundColor: '#FFF',
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  linkPlaceholderText: {
    color: '#007AFF',
    fontSize: 14,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#007AFF',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginHorizontal: 4,
  },
  linkButtonText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  unifiedContainer: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  promptBackground: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  gradientBackground: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  draggableContainer: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 10,
  },
  shareableViewContainer: {
    width: 1080 / 2,
    height: 1920 / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareableCard: {
    width: '100%',
    height: '100%',
    backgroundColor: '#8B6F47',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  shareableImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
  },
});

export default HomeScreen;
