import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ViewShot, { captureRef } from 'react-native-view-shot';

interface StickerCreatorProps {}

export interface StickerCreatorRef {
  createSticker: (options: {
    text: string;
    gradientColors: string[];
    width: number;
    height: number;
  }) => Promise<string | null>;
}

interface StickerOptions {
  text: string;
  gradientColors: string[];
  width: number;
  height: number;
}

const StickerCreator = forwardRef<StickerCreatorRef, StickerCreatorProps>((props, ref) => {
  const viewShotRef = useRef<ViewShot>(null);
  const [currentSticker, setCurrentSticker] = React.useState<StickerOptions | null>(null);

  useImperativeHandle(ref, () => ({
    createSticker: async (options: StickerOptions) => {
      try {
        console.log('🎨 Creating sticker with options:', options);
        
        // Set the sticker options to trigger render
        setCurrentSticker(options);
        
        // Wait for render
        await new Promise(resolve => setTimeout(resolve, 300));
        
        if (!viewShotRef.current) {
          console.error('❌ ViewShot ref not available');
          return null;
        }

        // Capture the sticker as transparent PNG
        const uri = await captureRef(viewShotRef, {
          format: 'png',
          quality: 1.0,
          result: 'tmpfile',
          width: options.width,
          height: options.height,
        });

        console.log('✅ Sticker created successfully:', uri);
        
        // Clear the sticker after capture
        setCurrentSticker(null);
        
        return uri;
      } catch (error) {
        console.error('❌ Error creating sticker:', error);
        setCurrentSticker(null);
        return null;
      }
    },
  }));

  return (
    <View style={styles.container}>
      {currentSticker && (
        <ViewShot
          ref={viewShotRef}
          options={{ 
            format: 'png', 
            quality: 1.0,
            width: currentSticker.width,
            height: currentSticker.height
          }}
          style={[
            styles.stickerContainer,
            {
              width: currentSticker.width,
              height: currentSticker.height,
            }
          ]}
        >
          <LinearGradient
            colors={currentSticker.gradientColors}
            style={styles.stickerGradient}
          >
            <View style={styles.stickerContent}>
              {/* Profile Section */}
              <View style={styles.profileSection}>
                <View style={styles.profileIconContainer}>
                  <Text style={styles.profileIcon}>👤</Text>
                </View>
                <Text style={styles.profileLabel}>Anon Friend</Text>
              </View>
              
              {/* Text Content */}
              <View style={styles.textContainer}>
                <Text style={styles.stickerText} numberOfLines={3}>
                  {currentSticker.text}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </ViewShot>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: -9999,
    top: -9999,
    opacity: 0,
  },
  stickerContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  stickerGradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  profileSection: {
    alignItems: 'center',
    marginRight: 12,
    minWidth: 50,
  },
  profileIconContainer: {
    marginBottom: 4,
  },
  profileIcon: {
    fontSize: 24,
    color: 'white',
  },
  profileLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: 'white',
    textAlign: 'center',
  },
  textContainer: {
    flex: 1,
  },
  stickerText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    textAlign: 'left',
    lineHeight: 20,
  },
});

export default StickerCreator;
