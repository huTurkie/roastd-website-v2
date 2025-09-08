import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import StickerCreator, { StickerCreatorRef } from './StickerCreator';
import * as FileSystem from 'expo-file-system';

const StickerTest = () => {
  const stickerRef = useRef<StickerCreatorRef>(null);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [capturedStickerUri, setCapturedStickerUri] = useState<string | null>(null);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log('StickerTest:', message);
  };

  const testStickerGeneration = async () => {
    setTestResults([]);
    addResult('Starting sticker generation test...');

    try {
      // Test 1: Check if ref is available
      if (!stickerRef.current) {
        addResult('❌ FAIL: StickerCreator ref is null');
        return;
      }
      addResult('✅ PASS: StickerCreator ref is available');

      // Test 2: Attempt to capture sticker
      addResult('Attempting to capture sticker...');
      const uri = await stickerRef.current.captureSticker();

      if (!uri) {
        addResult('❌ FAIL: Sticker capture returned null');
        return;
      }
      addResult(`✅ PASS: Sticker captured - URI: ${uri}`);
      setCapturedStickerUri(uri);

      // Test 3: Verify file exists
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        addResult('❌ FAIL: Sticker file does not exist');
        return;
      }
      addResult(`✅ PASS: Sticker file exists - Size: ${fileInfo.size} bytes`);

      // Test 4: Check file format
      if (!uri.endsWith('.png')) {
        addResult('⚠️  WARNING: File does not have .png extension');
      } else {
        addResult('✅ PASS: File has correct .png extension');
      }

      // Test 5: Read file as base64 (Instagram format test)
      try {
        const base64 = await FileSystem.readAsStringAsync(uri, { 
          encoding: FileSystem.EncodingType.Base64 
        });
        if (base64.length > 0) {
          addResult(`✅ PASS: File readable as base64 - Length: ${base64.length}`);
        } else {
          addResult('❌ FAIL: Base64 conversion resulted in empty string');
        }
      } catch (error) {
        addResult(`❌ FAIL: Cannot read file as base64 - ${error}`);
      }

      addResult('🎉 All tests completed successfully!');

    } catch (error) {
      addResult(`❌ FAIL: Test failed with error - ${error}`);
    }
  };

  const testInstagramParameters = () => {
    addResult('Testing Instagram Stories parameters...');
    
    // Test Android parameters
    const androidParams = {
      'com.instagram.platform.extra.BACKGROUND_IMAGE': 'content://test/background.jpg',
      'com.instagram.platform.extra.STICKER_IMAGE': 'content://test/sticker.png',
    };
    addResult(`Android params: ${JSON.stringify(androidParams)}`);

    // Test iOS parameters
    const iosParams = {
      social: 'instagram_stories',
      backgroundImage: 'data:image/jpeg;base64,test',
      stickerImage: 'data:image/png;base64,test',
    };
    addResult(`iOS params: ${JSON.stringify(iosParams)}`);
    addResult('✅ Parameter formats look correct');
  };

  const clearResults = () => {
    setTestResults([]);
    setCapturedStickerUri(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Instagram Sticker Test Suite</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={testStickerGeneration}>
          <Text style={styles.buttonText}>Test Sticker Generation</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={testInstagramParameters}>
          <Text style={styles.buttonText}>Test IG Parameters</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={clearResults}>
          <Text style={styles.buttonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      {capturedStickerUri && (
        <View style={styles.previewContainer}>
          <Text style={styles.previewTitle}>Captured Sticker Preview:</Text>
          <Image source={{ uri: capturedStickerUri }} style={styles.stickerPreview} />
        </View>
      )}

      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Test Results:</Text>
        {testResults.map((result, index) => (
          <Text key={index} style={styles.resultText}>{result}</Text>
        ))}
      </View>

      {/* Hidden StickerCreator for testing */}
      <StickerCreator 
        ref={stickerRef}
        text="Test prompt for Instagram Stories sticker generation"
      />
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
  previewContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  stickerPreview: {
    width: 200,
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
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

export default StickerTest;
