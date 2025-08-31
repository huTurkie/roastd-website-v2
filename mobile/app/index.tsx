import 'react-native-url-polyfill/auto';
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
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { pickImage, uploadPhoto, createRoastSession, generateLinkCode } from '../lib/uploadHelpers';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Clipboard from 'expo-clipboard';
import * as IntentLauncher from 'expo-intent-launcher';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// A new, separate component specifically for capturing. It is rendered off-screen.
const ShareableView = forwardRef<ViewShot, { 
  uploadedImageUri: string | null; 
  currentPrompt: string; 
  background: any; 
  translateX: number; 
  translateY: number; 
  scale: number; 
}>(({ uploadedImageUri, currentPrompt, background, translateX, translateY, scale }, ref) => {
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
        {/* This container mimics the draggable text's position */}
        <Animated.View 
          style={[
            styles.draggableContainer, 
            {
              transform: [
                { translateX: translateX },
                { translateY: translateY },
                { scale: scale },
              ],
            }
          ]}
        >
          <View style={styles.unifiedContainer}>
            {background.type === 'gradient' ? (
              <LinearGradient
                colors={background.value as string[]}
                style={styles.promptBackground}
              >
                <Text style={styles.mainText}>{currentPrompt}</Text>
              </LinearGradient>
            ) : (
              <View
                style={[
                  styles.promptBackground,
                  { backgroundColor: background.value as string },
                ]}
              >
                <Text style={styles.mainText}>{currentPrompt}</Text>
              </View>
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
});

function HomeScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [roastLink, setRoastLink] = useState('');
  const [currentPrompt, setCurrentPrompt] = useState('roast this photo ');
  const [promptIndex, setPromptIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImageUri, setUploadedImageUri] = useState<string | null>(null);

  const viewShotRef = useRef<ViewShot>(null); // Ref for the original, visible view
  const shareViewShotRef = useRef<ViewShot>(null); // New ref for the hidden, shareable view

  // Gestures - using react-native-gesture-handler and reanimated
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const prompts = [
    'roast this photo ',
    'Make me look cooler ',
    'Turn me into a superhero ',
    'Make this funnier ',
    'Roast my outfit',
  ];

  const backgroundOptions = [
    { type: 'solid', value: 'rgba(0, 0, 0, 0.2)' },
    { type: 'gradient', value: ['#8a3ab9', '#e95950', '#fccc63'] },
    { type: 'solid', value: 'rgba(255, 255, 255, 0.25)' },
    'rgba(225, 48, 108, 0.3)', // Pink
    'rgba(131, 58, 180, 0.3)', // Purple
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

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  useEffect(() => {
    const testSupabaseConnection = async () => {
      try {
        console.log(' Testing Supabase client initialization...');
        console.log(' Supabase client created:', !!supabase);
        console.log(' Supabase URL from client:', supabase.supabaseUrl);

        // Simple test - just try to get the current session (no network required)
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
      // Removed bounce animation logic
    };

    const rotate = () => {
      // Removed rotate animation logic
    };

    bounce();
    rotate();
  }, []);

  const handleDicePress = () => {
    const nextIndex = (promptIndex + 1) % prompts.length;
    setPromptIndex(nextIndex);
    setCurrentPrompt(prompts[nextIndex]);
  };

  const handleShare = async () => {
    if (!roastLink) {
      Alert.alert('No Link!', 'Please upload a photo to generate a link first.');
      return;
    }

    try {
      // Wait for any pending animations to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      const uri = await captureRef(shareViewShotRef, {
        format: 'jpg',
        quality: 0.9,
        result: 'tmpfile',
      });

      if (!uri) {
        Alert.alert('Oops!', 'Could not capture the image for sharing.');
        return;
      }

      // Copy the link to the clipboard silently
      await Clipboard.setStringAsync(roastLink);

      // Proceed directly to sharing without a blocking alert
      if (Platform.OS === 'android') {
        try {
          const contentUri = await FileSystem.getContentUriAsync(uri);
          await IntentLauncher.startActivityAsync('com.instagram.share.ADD_TO_STORY', {
            type: 'image/jpeg',
            data: contentUri,
          });
        } catch (error) {
          Alert.alert('Error', 'Could not open Instagram. Please make sure it is installed.');
        }
      } else if (Platform.OS === 'ios') {
        try {
          const instagramUrl = `instagram-stories://share?backgroundImage=${encodeURIComponent(uri)}`;
          await Linking.openURL(instagramUrl);
        } catch (error) {
          console.error('iOS Instagram sharing failed:', error);
          try {
            if (await Sharing.isAvailableAsync()) {
              await Sharing.shareAsync(uri, {
                mimeType: 'image/jpeg',
                dialogTitle: 'Share to your story',
                UTI: 'public.jpeg',
              });
            }
          } catch (shareError) {
            console.error('Fallback sharing failed:', shareError);
            Alert.alert('Error', 'Could not open Instagram or the share sheet.');
          }
        }
      }
    } catch (error) {
      console.error('Sharing failed:', error);
      Alert.alert('Error', 'Could not share the image. Please try again.');
    }
  };

  const handleCopyLink = async () => {
    if (!roastLink) {
      Alert.alert('No Link!', 'Please upload a photo to generate a link first.');
      return;
    }
    await Clipboard.setStringAsync(roastLink);
    Alert.alert('Copied!', 'Your roast link has been copied.');
  };

  const handleUploadPress = async () => {
    const uri = await pickImage();
    if (!uri) {
      setIsUploading(false);
      return;
    }

    try {
      setIsUploading(true);

      // Generate unique filename and link code
      const timestamp = Date.now();
      const fileName = `roast_${timestamp}.jpg`;
      const linkCode = generateLinkCode();

      // Upload photo to Supabase Storage
      const photoPath = await uploadPhoto(uri, fileName);
      if (!photoPath) {
        Alert.alert('Upload Failed', 'Could not upload your photo. Please try again.');
        setIsUploading(false);
        return;
      }

      // Create roast session in database
      const sessionId = await createRoastSession(
        null, // Anonymous user
        photoPath,
        currentPrompt,
        linkCode
      );

      if (!sessionId) {
        Alert.alert('Session Failed', 'Could not create roast session. Please try again.');
        setIsUploading(false);
        return;
      }

      // Get the public URL to display and show success alert
      const { data: urlData } = supabase.storage
        .from('roast-photos')
        .getPublicUrl(photoPath);

      const publicUrl = urlData.publicUrl;

      Alert.alert(
        'Upload Successful!',
        `Your roast link is ready: https://roastd.link/${linkCode}\n\nYour photo is available at: ${publicUrl}`
      );

      console.log(` Roast session created! Link code: ${linkCode}`);
      console.log(` Public photo URL: ${publicUrl}`);

      // TODO: Navigate to a new screen to show the link
      // For now, just reset the state
      setUploadedImageUri(uri);
      setRoastLink(`https://roastd.link/${linkCode}`);
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
      {/* Hidden view for sharing. It is positioned off-screen and does not affect the layout. */}
      <View style={{ position: 'absolute', top: -2000, left: -2000 }}>
        <ShareableView
          ref={shareViewShotRef}
          uploadedImageUri={uploadedImageUri}
          currentPrompt={currentPrompt}
          background={backgroundOptions[bgIndex]}
          translateX={translateX.value}
          translateY={translateY.value}
          scale={scale.value}
        />
      </View>

      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="eye-outline" size={24} color="#666" />
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.playText}>PLAY</Text>
            <Text style={styles.inboxText}>INBOX</Text>
            <View style={styles.redDot} />
          </View>
          <View style={styles.headerRight}>
            <Ionicons name="settings-outline" size={24} color="#666" />
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* This container is the new positioning context for the card and buttons */}
          <View style={styles.cardContainer}>
            {/* ViewShot now only wraps the content to be captured */}
            <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }}>
              <View style={styles.card}>
                {uploadedImageUri ? (
                  <Image
                    source={{ uri: uploadedImageUri }}
                    style={styles.uploadedImage}
                    resizeMode="cover"
                  />
                ) : null}
                {/* Main Text */}
                <GestureDetector gesture={composedGesture}>
                  <Animated.View style={[styles.draggableContainer, animatedStyle]}>
                    <View style={styles.unifiedContainer}>
                      {backgroundOptions[bgIndex].type === 'gradient' ? (
                        <LinearGradient
                          colors={backgroundOptions[bgIndex].value as string[]}
                          style={styles.promptBackground}
                        >
                          <Text style={styles.mainText}>{currentPrompt}</Text>
                        </LinearGradient>
                      ) : (
                        <View
                          style={[
                            styles.promptBackground,
                            { backgroundColor: backgroundOptions[bgIndex].value as string },
                          ]}
                        >
                          <Text style={styles.mainText}>{currentPrompt}</Text>
                        </View>
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

            {/* Buttons are now SIBLINGS to ViewShot, not children */}
            {/* They are positioned absolutely relative to cardContainer */}
            <TouchableOpacity style={styles.colorButton} onPress={handleColorPress}>
              <LinearGradient
                colors={['#FF0000', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#FF00FF', '#FF0000']}
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

          {/* Dots Indicator */}
          <View style={styles.dotsContainer}>
            <View style={[styles.dot, styles.activeDot]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>

          {/* Step 1: Upload your picture */}
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitleSmall}>Step 1: Upload your picture</Text>
            <TouchableOpacity style={styles.uploadButton} onPress={handleUploadPress}>
              <Ionicons name="camera" size={16} color="#007bff" />
              <Text style={styles.uploadButtonText}>Choose Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Step 2: Copy your link */}
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitleMedium}>Step 2: Copy your link</Text>
            <Text style={styles.linkText}>
              {roastLink || 'roastd.link/my-link'}
            </Text>
            <TouchableOpacity style={styles.copyButton} onPress={handleCopyLink}>
              <Ionicons name="link" size={16} color="#ff4757" />
              <Text style={styles.copyButtonText}>copy link</Text>
            </TouchableOpacity>
          </View>

          {/* Step 3: Share link on your story */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
    paddingTop: 20,
  },
  cardContainer: {
    // This new container holds the card and the buttons,
    // establishing a positioning context for the absolute buttons.
    position: 'relative',
  },
  card: {
    backgroundColor: '#8B6F47',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 350,
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
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#007bff',
  },
  stepContainer: {
    marginVertical: 8,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
    textAlign: 'center',
  },
  stepTitleSmall: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
    textAlign: 'center',
  },
  stepTitleMedium: {
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
    width: 250,
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
    zIndex: 10, // Ensure it's on top
  },
  // --- STYLES FOR THE HIDDEN SHAREABLE VIEW ---
  shareableViewContainer: {
    width: 1080 / 2, // Using a fixed size for consistent, high-quality capture
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
    width: '100%',
    height: '100%',
  },
});

export default HomeScreen;
