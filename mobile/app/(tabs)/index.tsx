import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';

export default function HomeScreen() {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const bounce = () => {
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]).start(() => bounce());
    };

    const rotate = () => {
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ]).start(() => rotate());
    };

    bounce();
    rotate();
  }, [bounceAnim, rotateAnim]);

  return (
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
        {/* Brown Card */}
        <View style={styles.card}>
          {/* Main Text */}
          <Text style={styles.mainText}>roast this photo 🔥😂</Text>
          
          {/* Camera Icon */}
          <TouchableOpacity style={styles.cameraIcon}>
            <Ionicons name="camera" size={24} color="#fff" />
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
          <Text style={styles.stepTitle}>Step 1: Upload your picture</Text>
          <TouchableOpacity style={styles.uploadButton}>
            <Ionicons name="camera" size={16} color="#007bff" />
            <Text style={styles.uploadButtonText}>Choose Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Step 2: Copy your link */}
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Step 2: Copy your link</Text>
          <Text style={styles.linkText}>ROASTIT.LINK/HASSB2527</Text>
          <TouchableOpacity style={styles.copyButton}>
            <Ionicons name="link" size={16} color="#ff4757" />
            <Text style={styles.copyButtonText}>copy link</Text>
          </TouchableOpacity>
        </View>

        {/* Step 3: Share link on your story */}
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Step 3: Share link on your story</Text>
          <TouchableOpacity style={styles.shareButton}>
            <Text style={styles.shareButtonText}>Share!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
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
  card: {
    backgroundColor: '#8B6F47',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 250,
    position: 'relative',
  },
  mainText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 40,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
    marginVertical: 15,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  linkText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ff4757',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  copyButtonText: {
    color: '#ff4757',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  shareButton: {
    backgroundColor: '#ff6b9d',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#007bff',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  uploadButtonText: {
    color: '#007bff',
    fontWeight: 'bold',
    marginLeft: 5,
  },
});
