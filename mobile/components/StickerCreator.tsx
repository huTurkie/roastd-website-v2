import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { Ionicons } from '@expo/vector-icons';

interface StickerCreatorProps {
  text: string;
  style?: any;
}

export interface StickerCreatorRef {
  captureSticker: () => Promise<string | null>;
}

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

const StickerCreator = forwardRef<StickerCreatorRef, StickerCreatorProps>(({ text, style }, ref) => {
  const viewShotRef = useRef<ViewShot>(null);

  useImperativeHandle(ref, () => ({
    captureSticker: async () => {
      try {
        console.log('StickerCreator: Starting capture process...');
        
        if (!viewShotRef.current) {
          console.log('StickerCreator: ViewShot ref is null');
          return null;
        }

        // Wait for component to render properly
        await new Promise(resolve => setTimeout(resolve, 300));

        console.log('StickerCreator: Capturing sticker image...');
        const uri = await captureRef(viewShotRef, {
          format: 'png',
          quality: 1.0,
          result: 'tmpfile',
          width: 640,
          height: 480,
          snapshotContentContainer: false,
        });

        console.log('StickerCreator: Capture successful, URI:', uri);
        return uri;
      } catch (error) {
        console.error('StickerCreator: Error capturing sticker:', error);
        return null;
      }
    },
  }));

  return (
    <View style={[styles.visibleContainer, style]}>
      <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }} style={styles.stickerContainer}>
        {/* Main sticker content - matching place screen design */}
        <View style={styles.unifiedContainer}>
          {/* Gradient background for prompt */}
          <LinearGradient
            colors={gradients[0]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.promptBackground}
          >
            <Text style={styles.promptText} numberOfLines={2}>
              {text}
            </Text>
          </LinearGradient>
          
          {/* Link placeholder section */}
          <View style={styles.linkPlaceholder}>
            <Text style={styles.linkPlaceholderText}>Paste your </Text>
            <View style={styles.linkButton}>
              <Ionicons name="link" size={12} color="#007AFF" />
              <Text style={styles.linkButtonText}> LINK</Text>
            </View>
            <Text style={styles.linkPlaceholderText}> here</Text>
          </View>
        </View>
      </ViewShot>
    </View>
  );
});

const styles = StyleSheet.create({
  hiddenContainer: {
    position: 'absolute',
    left: -9999, // Position off-screen
    top: -9999, // Position off-screen
    width: 640,
    height: 480,
  },
  visibleContainer: {
    // Visible container for interactive modal
  },
  stickerContainer: {
    width: 640,
    height: 480,
    backgroundColor: 'rgba(255,255,255,0.01)', // Very slight background to ensure visibility
    alignItems: 'center',
    justifyContent: 'center',
  },
  unifiedContainer: {
    borderRadius: 18,
    overflow: 'hidden',
    width: 300,
    height: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 20,
    backgroundColor: '#FFFFFF', // Ensure solid background
  },
  promptBackground: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  promptText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  promptTextBlack: {
    color: 'black',
  },
  linkPlaceholder: {
    backgroundColor: '#FFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  linkPlaceholderText: {
    color: '#007AFF',
    fontSize: 12,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#007AFF',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginHorizontal: 2,
  },
  linkButtonText: {
    color: '#007AFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default StickerCreator;
