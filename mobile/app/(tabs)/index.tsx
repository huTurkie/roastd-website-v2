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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { pickImage, uploadPhoto, createRoastSession, generateLinkCode, updateRoastPrompt, generateAIImage } from '../../lib/uploadHelpers';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Linking from 'expo-linking';
import * as Sharing from 'expo-sharing';
import { NativeModules } from 'react-native';
import Constants from 'expo-constants';
import AppHeader from '@/components/AppHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserInfo, isUserRegistered, UserInfo } from '../../lib/userHelpers';
import Svg, { Path, Circle } from 'react-native-svg';

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
                  <View style={styles.inclinedIcon}>
                    <Ionicons name="link" size={14} color="#007AFF" />
                  </View>
                  <Text style={[styles.linkButtonText, {color: '#007AFF'}]}>LINK</Text>
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
  'Roast this pic 😂',
  'Pair me with your favorite actor 🎭',
  'Turn me into a cartoon character 🎨',
  'Transform me into a meme character 😂',
  'Make me look cooler 😎',
  'Make me eat your favorite food 🍔',
  'Turn me into your favorite superhero 🦸',
  'Swap my outfit with your favorite famous person 👔',
  'Put me in a movie poster 🎬',
  'Turn me into an anime character 🎌',
  'Make me a celebrity for a day 🌟',
  'Make me wear your favorite outfit 👕',
  'Put me in your favorite country/city 🌍',
  'Turn me into a villain 😈',
  'Make me an animal / mythical creature 🐉',
  'Turn me into a Pixar character 🎥',
  'Turn me into a 3D style character 🖥️',
  'Put me in a famous painting 🖼️',
  'Put me in outer space 🚀',
  'Put me in a fantasy world 🏰',
  'Turn me into a robot / cyborg 🤖',
  'Make me a historical figure 👑',
  'Put me in a sports scene ⚽',
  'Make me tiny or giant in a scene 🔍',
  'Add a magical effect around me ✨',
  'Make this funnier 😅',
  'Roast my outfit 🔥',
];

function HomeScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [roastLink, setRoastLink] = useState('');
  const [currentPrompt, setCurrentPrompt] = useState(prompts[0]);
  const [promptIndex, setPromptIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImageUri, setUploadedImageUri] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [showGestureHints, setShowGestureHints] = useState(true);
  const [showShareInstructions, setShowShareInstructions] = useState(false);
  const [currentInstructionPage, setCurrentInstructionPage] = useState(1);
  const [selectedSocialPlatform, setSelectedSocialPlatform] = useState('instagram');

  const viewShotRef = useRef<ViewShot>(null);
  const shareViewShotRef = useRef<ViewShot>(null);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Gesture hint animations
  const topHintOpacity = useSharedValue(1);
  const bottomHintOpacity = useSharedValue(1);

  const backgroundOptions: Array<BackgroundOption> = [
    { type: 'solid', value: 'rgba(0, 0, 0, 0.2)' },
    { type: 'gradient', value: ['#8a3ab9', '#e95950', '#fccc63'] },
    { type: 'solid', value: 'rgba(255, 255, 255, 0.25)' },
    { type: 'solid', value: 'rgba(225, 48, 108, 0.3)' },
    { type: 'solid', value: 'rgba(131, 58, 180, 0.3)' },
  ];
  const [bgIndex, setBgIndex] = useState(0);

  const pinchGesture = Gesture.Pinch()
    .onBegin(() => {
      'worklet';
      // Hide gesture hints when user starts pinching
      topHintOpacity.value = withTiming(0, { duration: 300 });
      bottomHintOpacity.value = withTiming(0, { duration: 300 });
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
      // Hide hints permanently after first interaction (using runOnJS for state update)
      'worklet';
      runOnJS(setShowGestureHints)(false);
    });

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      'worklet';
      // Hide gesture hints when user starts dragging
      topHintOpacity.value = withTiming(0, { duration: 300 });
      bottomHintOpacity.value = withTiming(0, { duration: 300 });
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
      // Hide hints permanently after first interaction (using runOnJS for state update)
      'worklet';
      runOnJS(setShowGestureHints)(false);
    });

  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

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

  // Animated styles for gesture hints
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

    // Check if user is registered
    const checkUserRegistration = async () => {
      try {
        const registered = await isUserRegistered();
        if (!registered) {
          router.push('/complete-registration');
        } else {
          const user = await getUserInfo();
          setUserInfo(user);
          console.log('👤 User loaded:', user);
        }
      } catch (error) {
        console.error('Error checking user registration:', error);
        router.push('/complete-registration');
      }
    };

    // Load persisted image and roast link
    const loadPersistedData = async () => {
      try {
        const savedImageUri = await AsyncStorage.getItem('uploadedImageUri');
        const savedRoastLink = await AsyncStorage.getItem('roastLink');
        
        if (savedImageUri) {
          setUploadedImageUri(savedImageUri);
          console.log('📱 Restored uploaded image from storage');
        }
        
        if (savedRoastLink) {
          setRoastLink(savedRoastLink);
          console.log('📱 Restored roast link from storage');
        }
      } catch (error) {
        console.error('Error loading persisted data:', error);
      }
    };

    testSupabaseConnection();
    checkUserRegistration();
    loadPersistedData();
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
    console.log(' [handleDicePress] DICE BUTTON PRESSED');
    
    const currentIndex = prompts.indexOf(currentPrompt);
    const nextIndex = (currentIndex + 1) % prompts.length;
    const newPrompt = prompts[nextIndex];
    
    console.log(' [handleDicePress] Current prompt:', currentPrompt);
    console.log(' [handleDicePress] New prompt:', newPrompt);
    console.log(' [handleDicePress] Current roastLink:', roastLink);
    
    setCurrentPrompt(newPrompt);

    // Only update the prompt in database, DO NOT trigger AI generation
    // AI generation should only happen when user2 adds prompt on web
    if (roastLink) {
      console.log(' [handleDicePress] RoastLink exists, updating prompt only (no AI generation)');
      try {
        const linkCode = roastLink.split('/').pop();
        console.log(' [handleDicePress] Extracted link code:', linkCode);
        
        if (linkCode) {
          console.log(` [handleDicePress] Updating prompt to "${newPrompt}" for link code: ${linkCode}`);
          
          const updateResult = await updateRoastPrompt(linkCode, newPrompt);
          console.log(' [handleDicePress] updateRoastPrompt result:', updateResult);
          
          // REMOVED: AI generation should only happen from web interface
          console.log(' [handleDicePress] Prompt updated. AI generation will happen when user2 adds prompt on web.');
          
        } else {
          console.error(' [handleDicePress] Could not extract link code from roastLink:', roastLink);
        }
      } catch (error) {
        console.error(' [handleDicePress] Exception in dice press handler:', error);
        console.error(' [handleDicePress] Exception stack:', error.stack);
      }
    } else {
      console.log(' [handleDicePress] No roastLink available, only updating local prompt');
    }
    
    console.log(' [handleDicePress] DICE PRESS HANDLING COMPLETE');
  };

  const handleSharePress = async () => {
    if (!uploadedImageUri) {
      Alert.alert('Oops!', 'Please upload an image first!');
      return;
    }

    // Show share instructions modal
    setShowShareInstructions(true);
    setCurrentInstructionPage(1);
  };

  const handleActualShare = async () => {
    try {
      // Hide gesture hints before capture
      setShowGestureHints(false);
      topHintOpacity.value = withTiming(0, { duration: 200 });
      bottomHintOpacity.value = withTiming(0, { duration: 200 });
      
      // Wait a moment for the animation to complete
      await new Promise(resolve => setTimeout(resolve, 250));

      // Capture the main ViewShot without forcing dimensions to prevent squashing
      const uri = await captureRef(viewShotRef, {
        format: 'png',
        quality: 1.0,
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
          type: 'image/png',
        });
      } else if (Platform.OS === 'ios') {
        const base64Image = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
        const imageUriBase64 = `data:image/png;base64,${base64Image}`;

        const shareOptions: any = {
          social: Share.Social.INSTAGRAM_STORIES,
          backgroundImage: imageUriBase64,
          appId: FACEBOOK_APP_ID,
        };

        if (Share.shareSingle && Constants.appOwnership !== 'expo') {
          await Share.shareSingle(shareOptions);
        } else if (Constants.appOwnership === 'expo') {
          Alert.alert(
            'Instagram Sharing Unavailable',
            'Instagram Stories sharing is only supported in development builds.'
          );
        } else {
          Alert.alert('Error', 'Sharing functionality is not available.');
        }
      } else {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share to Instagram Stories',
        });
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
        userInfo?.email || null,
        photoPath,
        currentPrompt,
        linkCode,
        userInfo?.username
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

      // Production roast link using live website - simplified format
      const roastLink = `roastd.link/${linkCode}`;

      Alert.alert(
        'Upload Successful!',
        `Your roast link is ready: ${roastLink}`
      );

      console.log(` Roast session created! Link code: ${linkCode}`);
      console.log(` Public photo URL: ${publicUrl}`);

      setUploadedImageUri(uri);
      setRoastLink(roastLink);
      
      // Persist image and roast link to AsyncStorage
      await AsyncStorage.setItem('uploadedImageUri', uri);
      await AsyncStorage.setItem('roastLink', roastLink);
      console.log('📱 Saved uploaded image and roast link to storage');
      
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

  const renderShareInstructionsModal = () => {
    const getPages = () => {
      if (selectedSocialPlatform === 'instagram') {
        return [
          {
            title: "How to add the Link to your story",
            content: (
              <View style={styles.instructionPageContent}>
                <View style={styles.linkTextContainer}>
                  <Text style={[styles.instructionText, {marginBottom: 20}]}>Click the </Text>
                  <Svg width="20" height="20" viewBox="0 0 20 20" style={{marginHorizontal: 2}}>
                    <Path 
                      d="M 2 1 H 16 Q 19 1 19 4 V 14 L 15 19 H 2 Q 1 19 1 16 V 4 Q 1 1 2 1 Z"
                      fill="white" 
                      stroke="#999" 
                      strokeWidth="1"
                    />
                    <Path 
                      d="M 15 19 L 19 14"
                      stroke="#999" 
                      strokeWidth="1"
                    />
                    <Circle cx="6" cy="7" r="1" fill="#333"/>
                    <Circle cx="14" cy="7" r="1" fill="#333"/>
                    <Path 
                      d="M 5 11 Q 10 15 15 11"
                      fill="none" 
                      stroke="#333" 
                      strokeWidth="1.2" 
                      strokeLinecap="round"
                    />
                  </Svg>
                  <Text style={[styles.instructionText, {marginBottom: 20}]}> button</Text>
                </View>
                <Image 
                  source={require('../../assets/images/step-one.png')}
                  style={[styles.stepImage, {marginBottom: 20}]}
                  resizeMode="contain"
                />
              </View>
            )
          },
          {
            title: "How to add the Link to your story",
            content: (
              <View style={styles.instructionPageContent}>
                <View style={styles.linkTextContainer}>
                  <Text style={[styles.instructionText, {marginBottom: -15, fontSize: 16}]}>Click the </Text>
                  <View style={styles.linkButtonContainer}>
                    <View style={styles.inclinedIcon}>
                      <Ionicons name="link" size={16} color="#007AFF" />
                    </View>
                    <Text style={[styles.linkButtonText]}>LINK</Text>
                  </View>
                  <Text style={[styles.instructionText, {marginBottom: -15, fontSize: 16}]}> button</Text>
                </View>
                <Image 
                  source={require('../../assets/images/link.png')}
                  style={styles.stepImage}
                  resizeMode="contain"
                />
              </View>
            )
          },
          {
            title: "How to add the Link to your story", 
            content: (
              <View style={styles.instructionPageContent}>
                <Text style={[styles.instructionText, {marginBottom: 20}]}>Paste your link!</Text>
                <Image 
                  source={require('../../assets/images/paste.png')}
                  style={[styles.stepImage, {marginBottom: 20}]}
                  resizeMode="contain"
                />
              </View>
            )
          },
          {
            title: "How to add the Link to your story",
            content: (
              <View style={styles.instructionPageContent}>
                <Text style={[styles.instructionText, {marginBottom: 20}]}>Frame the link</Text>
                <Image 
                  source={require('../../assets/images/frame.png')}
                  style={[styles.stepImage, {marginBottom: 9}]}
                  resizeMode="contain"
                />
              </View>
            )
          }
        ];
      } else if (selectedSocialPlatform === 'snapchat') {
        return [
          {
            title: "Snapchat Sharing - Step 1",
            content: (
              <View style={styles.comingSoonContainer}>
                <LinearGradient
                  colors={['#FEDA77', '#F58529', '#DD2A7B', '#8134AF', '#515BD4']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.comingSoonGradient}
                >
                  <Ionicons name="logo-snapchat" size={48} color="white" />
                  <Text style={styles.comingSoonTitle}>Coming Soon</Text>
                  <Text style={styles.comingSoonSubtitle}>
                    Snapchat sharing will be available soon!
                  </Text>
                </LinearGradient>
              </View>
            )
          },
          {
            title: "Snapchat Sharing - Step 2",
            content: (
              <View style={styles.comingSoonContainer}>
                <LinearGradient
                  colors={['#FEDA77', '#F58529', '#DD2A7B', '#8134AF', '#515BD4']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.comingSoonGradient}
                >
                  <Ionicons name="logo-snapchat" size={48} color="white" />
                  <Text style={styles.comingSoonTitle}>Coming Soon</Text>
                  <Text style={styles.comingSoonSubtitle}>
                    Snapchat sharing will be available soon!
                  </Text>
                </LinearGradient>
              </View>
            )
          },
          {
            title: "Snapchat Sharing - Step 3",
            content: (
              <View style={styles.comingSoonContainer}>
                <LinearGradient
                  colors={['#FEDA77', '#F58529', '#DD2A7B', '#8134AF', '#515BD4']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.comingSoonGradient}
                >
                  <Ionicons name="logo-snapchat" size={48} color="white" />
                  <Text style={styles.comingSoonTitle}>Coming Soon</Text>
                  <Text style={styles.comingSoonSubtitle}>
                    Snapchat sharing will be available soon!
                  </Text>
                </LinearGradient>
              </View>
            )
          },
          {
            title: "Snapchat Sharing - Step 4",
            content: (
              <View style={styles.comingSoonContainer}>
                <LinearGradient
                  colors={['#FEDA77', '#F58529', '#DD2A7B', '#8134AF', '#515BD4']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.comingSoonGradient}
                >
                  <Ionicons name="logo-snapchat" size={48} color="white" />
                  <Text style={styles.comingSoonTitle}>Coming Soon</Text>
                  <Text style={styles.comingSoonSubtitle}>
                    Snapchat sharing will be available soon!
                  </Text>
                </LinearGradient>
              </View>
            )
          }
        ];
      } else if (selectedSocialPlatform === 'whatsapp') {
        return [
          {
            title: "WhatsApp Sharing - Step 1",
            content: (
              <View style={styles.comingSoonContainer}>
                <LinearGradient
                  colors={['#FEDA77', '#F58529', '#DD2A7B', '#8134AF', '#515BD4']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.comingSoonGradient}
                >
                  <Ionicons name="logo-whatsapp" size={48} color="white" />
                  <Text style={styles.comingSoonTitle}>Coming Soon</Text>
                  <Text style={styles.comingSoonSubtitle}>
                    WhatsApp sharing will be available soon!
                  </Text>
                </LinearGradient>
              </View>
            )
          },
          {
            title: "WhatsApp Sharing - Step 2",
            content: (
              <View style={styles.comingSoonContainer}>
                <LinearGradient
                  colors={['#FEDA77', '#F58529', '#DD2A7B', '#8134AF', '#515BD4']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.comingSoonGradient}
                >
                  <Ionicons name="logo-whatsapp" size={48} color="white" />
                  <Text style={styles.comingSoonTitle}>Coming Soon</Text>
                  <Text style={styles.comingSoonSubtitle}>
                    WhatsApp sharing will be available soon!
                  </Text>
                </LinearGradient>
              </View>
            )
          },
          {
            title: "WhatsApp Sharing - Step 3",
            content: (
              <View style={styles.comingSoonContainer}>
                <LinearGradient
                  colors={['#FEDA77', '#F58529', '#DD2A7B', '#8134AF', '#515BD4']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.comingSoonGradient}
                >
                  <Ionicons name="logo-whatsapp" size={48} color="white" />
                  <Text style={styles.comingSoonTitle}>Coming Soon</Text>
                  <Text style={styles.comingSoonSubtitle}>
                    WhatsApp sharing will be available soon!
                  </Text>
                </LinearGradient>
              </View>
            )
          },
          {
            title: "WhatsApp Sharing - Step 4",
            content: (
              <View style={styles.comingSoonContainer}>
                <LinearGradient
                  colors={['#FEDA77', '#F58529', '#DD2A7B', '#8134AF', '#515BD4']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.comingSoonGradient}
                >
                  <Ionicons name="logo-whatsapp" size={48} color="white" />
                  <Text style={styles.comingSoonTitle}>Coming Soon</Text>
                  <Text style={styles.comingSoonSubtitle}>
                    WhatsApp sharing will be available soon!
                  </Text>
                </LinearGradient>
              </View>
            )
          }
        ];
      }
      return [];
    };

    const pages = getPages();

    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowShareInstructions(false)}
          >
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>

          {/* Social media icons */}
          <View style={styles.socialIconsContainer}>
            <TouchableOpacity 
              style={[
                styles.socialIcon,
                selectedSocialPlatform === 'instagram' && styles.activeSocialIcon
              ]}
              onPress={() => {
                setSelectedSocialPlatform('instagram');
                setCurrentInstructionPage(1);
              }}
            >
              <Ionicons name="logo-instagram" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.socialIcon,
                selectedSocialPlatform === 'snapchat' && styles.activeSocialIcon
              ]}
              onPress={() => {
                setSelectedSocialPlatform('snapchat');
                setCurrentInstructionPage(1);
              }}
            >
              <Ionicons name="logo-snapchat" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.socialIcon,
                selectedSocialPlatform === 'whatsapp' && styles.activeSocialIcon
              ]}
              onPress={() => {
                setSelectedSocialPlatform('whatsapp');
                setCurrentInstructionPage(1);
              }}
            >
              <Ionicons name="logo-whatsapp" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Modal content */}
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{pages[currentInstructionPage - 1].title}</Text>
            
            {/* Page indicators */}
            <View style={styles.pageIndicators}>
              {[1, 2, 3, 4].map((page) => (
                <TouchableOpacity
                  key={page}
                  style={[
                    styles.pageIndicator,
                    currentInstructionPage === page && styles.activePageIndicator
                  ]}
                  onPress={() => setCurrentInstructionPage(page)}
                >
                  <Text style={[
                    styles.pageIndicatorText,
                    currentInstructionPage === page && styles.activePageIndicatorText
                  ]}>
                    {page}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Step subtitle for step 4 */}
            {currentInstructionPage === 4 && (
              <Text style={[styles.instructionText, {marginBottom: 20, fontSize: 18, fontWeight: '600', color: '#333'}]}>Frame the link</Text>
            )}

            {pages[currentInstructionPage - 1].content}

            {/* Next Step */}
            {currentInstructionPage === 4 ? (
              selectedSocialPlatform === 'instagram' ? (
                <TouchableOpacity
                  style={styles.instagramShareButton}
                  onPress={() => {
                    setShowShareInstructions(false);
                    handleActualShare();
                  }}
                >
                  <LinearGradient
                    colors={['#E1306C', '#C13584', '#833AB4']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.instagramGradient}
                  >
                    <Text style={[styles.nextStepButtonText, { numberOfLines: 1 }]}>Share on Instagram!</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.nextStepButton}
                  onPress={() => {
                    setShowShareInstructions(false);
                  }}
                >
                  <Text style={styles.nextStepButtonText}>Close</Text>
                </TouchableOpacity>
              )
            ) : (
              <TouchableOpacity
                style={styles.nextStepButton}
                onPress={() => {
                  setCurrentInstructionPage(currentInstructionPage + 1);
                }}
              >
                <Text style={styles.nextStepButtonText}>Next Step</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Share button at bottom */}
        </View>
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>

      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <AppHeader activeTab="play" />
        <View style={styles.content}>
          <View style={styles.cardContainer}>
            <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }} style={styles.viewShotContainer}>
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
                          <View style={styles.inclinedIcon}>
                            <Ionicons name="link" size={14} color="#007AFF" />
                          </View>
                          <Text style={[styles.linkButtonText, {color: '#007AFF'}]}>LINK</Text>
                        </View>
                        <Text style={styles.linkPlaceholderText}> here</Text>
                      </View>
                    </View>
                  </Animated.View>
                </GestureDetector>
                
                {/* Top Gesture Hint */}
                {showGestureHints && (
                  <Animated.View style={[styles.topGestureHint, topHintStyle]}>
                    <Text style={styles.gestureHintSubText}>Drag to move, pinch to resize</Text>
                    <Text style={styles.gestureHintText}>Move me 👇</Text>
                  </Animated.View>
                )}
                
                {/* Bottom Gesture Hint */}
                {showGestureHints && (
                  <Animated.View style={[styles.bottomGestureHint, bottomHintStyle]}>
                    <Text style={styles.gestureHintText}>👆 This is where you will paste your link</Text>
                    <Text style={styles.gestureHintSubText}>once you have shared it on your story</Text>
                  </Animated.View>
                )}
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
            <TouchableOpacity onPress={handleSharePress}>
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

        {/* Share Instructions Modal */}
        {showShareInstructions && renderShareInstructionsModal()}
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
    paddingTop: Platform.OS === 'ios' ? 0 : 15, // Add Android-specific top padding
  },
  cardContainer: {
    position: 'relative',
  },
  viewShotContainer: {
    backgroundColor: 'transparent',
  },
  card: {
    backgroundColor: '#8B6F47',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 410, // Increased by additional ~0.05 inch (5 pixels)
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
  watermark: {
    position: 'absolute',
    bottom: 5,
    right: -20,
    width: 120,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  watermarkImage: {
    width: 100,
    height: 30,
  },
  topGestureHint: {
    position: 'absolute',
    top: 84,
    left: '50%',
    transform: [{ translateX: -75 }],
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  bottomGestureHint: {
    position: 'absolute',
    bottom: 48,
    left: '50%',
    transform: [{ translateX: -64 }],
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    maxWidth: 200,
  },
  gestureHintText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  gestureHintSubText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
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
    marginVertical: 5,
  },
  stepContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginVertical: 5, // Further reduced vertical margin
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
    paddingVertical: 8,
    paddingHorizontal: 6,
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
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 4,
    paddingHorizontal: 3,
    paddingVertical: 1,
    marginHorizontal: 2,
  },
  linkButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  unifiedContainer: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  promptBackground: {
    paddingVertical: 4,
    paddingHorizontal: 12,
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
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    width: '90%',
    maxWidth: 350,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  socialIconsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 15,
  },
  socialIcon: {
    width: 50,
    height: 35,
    backgroundColor: '#333',
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeSocialIcon: {
    backgroundColor: '#E1306C',
    shadowColor: '#E1306C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  modalContent: {
    width: '100%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  pageIndicators: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  pageIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activePageIndicator: {
    backgroundColor: '#333',
  },
  pageIndicatorText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#999',
  },
  activePageIndicatorText: {
    color: 'white',
  },
  instructionPageContent: {
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  mockPhoneContainer: {
    alignItems: 'center',
  },
  mockPhone: {
    width: 200,
    height: 350,
    backgroundColor: '#000',
    borderRadius: 25,
    overflow: 'hidden',
    position: 'relative',
  },
  mockPhoneHeader: {
    backgroundColor: '#000',
    paddingTop: 10,
  },
  mockPhoneStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  mockPhoneTime: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  mockPhoneSignals: {
    flexDirection: 'row',
    gap: 3,
  },
  mockSignalDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'white',
  },
  mockInstagramHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  mockInstagramHeaderText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  mockPhoneContent: {
    flex: 1,
    position: 'relative',
  },
  mockStoryBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#4A90E2',
    opacity: 0.7,
  },
  mockProfileCircle: {
    position: 'absolute',
    bottom: 80,
    left: '50%',
    marginLeft: -25,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mockProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ccc',
  },
  mockLinkButton: {
    position: 'absolute',
    top: 60,
    right: 15,
    width: 35,
    height: 35,
    borderRadius: 17,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextStepButton: {
    backgroundColor: '#333',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 40,
    marginTop: -35,
  },
  instagramShareButton: {
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 3,
    minWidth: 250,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instagramGradient: {
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minWidth: 250,
  },
  nextStepButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalShareButton: {
    backgroundColor: '#E1306C',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 40,
    marginTop: 15,
    width: '100%',
  },
  modalShareButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  comingSoonContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  comingSoonGradient: {
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 250,
    minHeight: 150,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 15,
    textAlign: 'center',
  },
  comingSoonSubtitle: {
    fontSize: 16,
    color: 'white',
    marginTop: 10,
    textAlign: 'center',
    opacity: 0.9,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  stepImage: {
    width: 320,
    height: 320,
    marginTop: -40,
  },
  linkTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  inclinedIcon: {
    transform: [{ rotate: '-45deg' }],
  },
  linkButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  linkButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 1,
  },
  debugText: {
    position: 'absolute',
    top: 10,
    left: 10,
    fontSize: 12,
    color: '#666',
    zIndex: 10,
  },
});

export default HomeScreen;
