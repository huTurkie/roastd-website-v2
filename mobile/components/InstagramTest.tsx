import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import Constants from 'expo-constants';

let Share: any;
if (Constants.appOwnership !== 'expo') {
  Share = require('react-native-share').default;
} else {
  Share = { Social: { INSTAGRAM_STORIES: 'instagram_stories' }, shareSingle: async () => { /* no-op */ } };
}

const InstagramTest = () => {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log('InstagramTest:', message);
  };

  const createTestImages = async () => {
    addResult('Creating test images...');
    
    try {
      // Create a simple test background image (solid color)
      const backgroundSvg = `
        <svg width="1080" height="1920" xmlns="http://www.w3.org/2000/svg">
          <rect width="1080" height="1920" fill="#FF6B47"/>
          <text x="540" y="960" text-anchor="middle" fill="white" font-size="48" font-family="Arial">
            Test Background Image
          </text>
        </svg>
      `;
      
      // Create a simple test sticker (white rectangle with text)
      const stickerSvg = `
        <svg width="400" height="100" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="100" fill="white" stroke="#FF6B47" stroke-width="4" rx="20"/>
          <text x="200" y="35" text-anchor="middle" fill="#333" font-size="16" font-family="Arial">
            Test Sticker
          </text>
          <text x="200" y="65" text-anchor="middle" fill="#FF6B47" font-size="14" font-family="Arial">
            Roastd.link
          </text>
        </svg>
      `;

      const backgroundPath = `${FileSystem.documentDirectory}test_background.svg`;
      const stickerPath = `${FileSystem.documentDirectory}test_sticker.svg`;

      await FileSystem.writeAsStringAsync(backgroundPath, backgroundSvg);
      await FileSystem.writeAsStringAsync(stickerPath, stickerSvg);

      addResult(`✅ Test images created: ${backgroundPath}, ${stickerPath}`);
      return { backgroundPath, stickerPath };
    } catch (error) {
      addResult(`❌ Failed to create test images: ${error}`);
      return null;
    }
  };

  const testInstagramIntegration = async () => {
    setTestResults([]);
    addResult('Starting Instagram integration test...');

    const images = await createTestImages();
    if (!images) return;

    try {
      if (Platform.OS === 'android') {
        addResult('Testing Android Instagram integration...');
        
        const backgroundContentUri = await FileSystem.getContentUriAsync(images.backgroundPath);
        const stickerContentUri = await FileSystem.getContentUriAsync(images.stickerPath);
        
        addResult(`Background URI: ${backgroundContentUri}`);
        addResult(`Sticker URI: ${stickerContentUri}`);

        const intentData = {
          data: backgroundContentUri,
          flags: 1,
          type: 'image/svg+xml',
          extra: {
            'com.instagram.platform.extra.BACKGROUND_IMAGE': backgroundContentUri,
            'com.instagram.platform.extra.STICKER_IMAGE': stickerContentUri,
          },
        };

        addResult('Intent data prepared successfully');
        addResult('Attempting to launch Instagram...');
        
        // This will actually try to open Instagram
        await IntentLauncher.startActivityAsync('com.instagram.share.ADD_TO_STORY', intentData);
        addResult('✅ Instagram launched successfully');
        
      } else if (Platform.OS === 'ios') {
        addResult('Testing iOS Instagram integration...');
        
        const backgroundBase64 = await FileSystem.readAsStringAsync(images.backgroundPath, { 
          encoding: FileSystem.EncodingType.Base64 
        });
        const stickerBase64 = await FileSystem.readAsStringAsync(images.stickerPath, { 
          encoding: FileSystem.EncodingType.Base64 
        });

        addResult(`Background base64 length: ${backgroundBase64.length}`);
        addResult(`Sticker base64 length: ${stickerBase64.length}`);

        const shareOptions = {
          social: Share.Social.INSTAGRAM_STORIES,
          backgroundImage: `data:image/svg+xml;base64,${backgroundBase64}`,
          stickerImage: `data:image/svg+xml;base64,${stickerBase64}`,
        };

        addResult('Share options prepared successfully');
        addResult('Attempting to share to Instagram...');

        if (Share.shareSingle) {
          await Share.shareSingle(shareOptions);
          addResult('✅ Instagram share initiated successfully');
        } else {
          addResult('❌ Share functionality not available');
        }
      }

    } catch (error: any) {
      addResult(`❌ Instagram integration failed: ${error.message}`);
      if (error.message.includes('No Activity found')) {
        addResult('💡 Instagram app may not be installed');
      }
    }
  };

  const testFileFormats = async () => {
    setTestResults([]);
    addResult('Testing different file formats...');

    try {
      // Test PNG format
      const pngData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
      const pngPath = `${FileSystem.documentDirectory}test.png`;
      await FileSystem.writeAsStringAsync(pngPath, pngData, { encoding: FileSystem.EncodingType.Base64 });
      
      const pngInfo = await FileSystem.getInfoAsync(pngPath);
      addResult(`✅ PNG test file created: ${pngInfo.size} bytes`);

      // Test JPEG format
      const jpegData = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A';
      const jpegPath = `${FileSystem.documentDirectory}test.jpg`;
      await FileSystem.writeAsStringAsync(jpegPath, jpegData, { encoding: FileSystem.EncodingType.Base64 });
      
      const jpegInfo = await FileSystem.getInfoAsync(jpegPath);
      addResult(`✅ JPEG test file created: ${jpegInfo.size} bytes`);

      addResult('🎉 File format tests completed');

    } catch (error) {
      addResult(`❌ File format test failed: ${error}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Instagram Integration Test</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={testInstagramIntegration}>
          <Text style={styles.buttonText}>Test Instagram Integration</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={testFileFormats}>
          <Text style={styles.buttonText}>Test File Formats</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={clearResults}>
          <Text style={styles.buttonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Test Results:</Text>
        {testResults.map((result, index) => (
          <Text key={index} style={styles.resultText}>{result}</Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#FF6B47',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  clearButton: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  resultsContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    flex: 1,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  resultText: {
    fontSize: 12,
    marginBottom: 5,
    fontFamily: 'monospace',
    color: '#333',
  },
});

export default InstagramTest;
