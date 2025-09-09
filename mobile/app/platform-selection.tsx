import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Dimensions, Platform, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import UserRegistration from '@/components/UserRegistration';

const { width, height } = Dimensions.get('window');

export default function PlatformSelectionScreen() {
  const router = useRouter();
  const [selectedPlatform, setSelectedPlatform] = useState('Instagram');
  const [showRegistration, setShowRegistration] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleContinue = () => {
    setShowRegistration(true);
  };

  const handleRegistrationComplete = (userInfo: any) => {
    setShowRegistration(false);
    router.replace('/username-setup');
  };

  const handleRegistrationCancel = () => {
    setShowRegistration(false);
  };

  const platforms = [
    {
      name: 'Instagram',
      icon: 'logo-instagram',
      color: '#E4405F',
      selected: selectedPlatform === 'Instagram'
    },
    {
      name: 'Snapchat',
      icon: 'logo-snapchat',
      color: '#FFFC00',
      selected: selectedPlatform === 'Snapchat'
    },
    {
      name: 'WhatsApp',
      icon: 'logo-whatsapp',
      color: '#25D366',
      selected: selectedPlatform === 'WhatsApp'
    }
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Where do you{'\n'}want to use Roastd?</Text>
        </View>

        {/* Platform Selection */}
        <View style={styles.platformContainer}>
          {platforms.map((platform) => (
            <TouchableOpacity
              key={platform.name}
              style={[
                styles.platformButton,
                platform.selected && styles.platformButtonSelected
              ]}
              onPress={() => setSelectedPlatform(platform.name)}
            >
              <View style={styles.platformContent}>
                <View style={[styles.iconContainer, { backgroundColor: platform.color }]}>
                  <Ionicons name={platform.icon as any} size={24} color="#ffffff" />
                </View>
                <Text style={styles.platformText}>{platform.name}</Text>
                {platform.selected && (
                  <View style={styles.selectedIndicator}>
                    <View style={styles.selectedDot} />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <LinearGradient
            colors={['#FEDA77', '#F58529', '#DD2A7B', '#8134AF', '#515BD4']}
            locations={[0, 0.25, 0.5, 0.75, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.continueButton}
          >
            <TouchableOpacity style={styles.continueButtonInner} onPress={handleContinue}>
              <Text style={styles.continueText}>Continue</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </SafeAreaView>

      <UserRegistration
        visible={showRegistration}
        onComplete={handleRegistrationComplete}
        onCancel={handleRegistrationCancel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3A4A5C',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 20 : 10,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 36,
  },
  platformContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    gap: 16,
  },
  platformButton: {
    backgroundColor: '#4A5A6C',
    borderRadius: 25,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  platformButtonSelected: {
    borderColor: '#ffffff',
    backgroundColor: '#5A6A7C',
  },
  platformContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  platformText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'android' ? 60 : 40,
  },
  continueButton: {
    borderRadius: 25,
    shadowColor: '#DD2A7B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  continueButtonInner: {
    paddingVertical: 18,
    paddingHorizontal: 40,
    alignItems: 'center',
    borderRadius: 25,
  },
  continueText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
