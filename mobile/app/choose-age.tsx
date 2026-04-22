import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ChooseAgeScreen() {
  const router = useRouter();
  const [selectedAgeRange, setSelectedAgeRange] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleContinue = async () => {
    if (!selectedAgeRange) {
      Alert.alert('Please select your age range', 'Choose an age range to continue.');
      return;
    }

    setLoading(true);
    try {
      // Save age range to AsyncStorage
      await AsyncStorage.setItem('userAgeRange', selectedAgeRange);
      
      // Navigate to registration
      router.push('/complete-registration');
    } catch (error) {
      console.error('Error saving age range:', error);
      Alert.alert('Error', 'Failed to save age range. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const ageRanges = [
    'Under 14',
    '14–17',
    '18–20',
    '21–24',
    '25–29',
    '30–34',
    '35–39',
    '40–44',
    '45–49',
    '50–54',
    '55–59',
    '60–64',
    '65+'
  ];

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      locations={[0, 0.5, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>What's your age range?</Text>
          <Text style={styles.subtitle}>This helps us personalize your experience</Text>
        </View>

        {/* Age Range Selection */}
        <ScrollView style={styles.ageContainer} showsVerticalScrollIndicator={false}>
          {ageRanges.map((ageRange) => (
            <TouchableOpacity
              key={ageRange}
              style={[
                styles.ageButton,
                selectedAgeRange === ageRange && styles.ageButtonSelected
              ]}
              onPress={() => setSelectedAgeRange(ageRange)}
            >
              <Text style={[
                styles.ageText,
                selectedAgeRange === ageRange && styles.ageTextSelected
              ]}>
                {ageRange}
              </Text>
              {selectedAgeRange === ageRange && (
                <View style={styles.selectedIndicator}>
                  <View style={styles.selectedDot} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.continueButton, (!selectedAgeRange || loading) && styles.continueButtonDisabled]} 
            onPress={handleContinue}
            disabled={!selectedAgeRange || loading}
          >
            <LinearGradient
              colors={['#FEDA77', '#F58529', '#DD2A7B', '#8134AF', '#515BD4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.continueGradient}
            >
              <Text style={styles.continueText}>
                {loading ? 'Loading...' : 'Continue'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    paddingBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#b8c6db',
    textAlign: 'center',
  },
  ageContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  ageButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ageButtonSelected: {
    borderColor: '#ffffff',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  ageText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
  ageTextSelected: {
    fontWeight: '600',
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
    borderRadius: 12,
    overflow: 'hidden',
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
