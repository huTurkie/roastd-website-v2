import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import UserRegistration from '@/components/UserRegistration';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();
  const [showRegistration, setShowRegistration] = useState(false);

  const handleGetStarted = () => {
    router.push('/platform-selection');
  };

  const handleSignIn = () => {
    setShowRegistration(true);
  };

  const handleRegistrationComplete = (userInfo: any) => {
    setShowRegistration(false);
    router.replace('/(tabs)');
  };

  const handleRegistrationCancel = () => {
    setShowRegistration(false);
  };

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      locations={[0, 0.5, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/images/footer3.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>


          {/* Get Started Button */}
          <View style={styles.buttonContainer}>
            <LinearGradient
              colors={['#FEDA77', '#F58529', '#DD2A7B', '#8134AF', '#515BD4']}
              locations={[0, 0.25, 0.5, 0.75, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.getStartedButton}
            >
              <TouchableOpacity style={styles.getStartedButtonInner} onPress={handleGetStarted}>
                <Text style={styles.getStartedText}>Get Started</Text>
              </TouchableOpacity>
            </LinearGradient>
            
            <TouchableOpacity style={styles.signInContainer} onPress={handleSignIn}>
              <Text style={styles.signInText}>
                Already have an account? <Text style={styles.signInLink}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <UserRegistration
        visible={showRegistration}
        onComplete={handleRegistrationComplete}
        onCancel={handleRegistrationCancel}
      />
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
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 50,
  },
  logoContainer: {
    flex: 3,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  logo: {
    width: width * 0.8,
    height: height * 0.35,
    maxWidth: 400,
    maxHeight: 300,
  },
  buttonContainer: {
    width: '100%',
    paddingBottom: 56, // Moved up by 0.5 inch (36pt) + original 20pt = 56pt
  },
  getStartedButton: {
    borderRadius: 25,
    shadowColor: '#DD2A7B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  getStartedButtonInner: {
    paddingVertical: 18,
    paddingHorizontal: 40,
    alignItems: 'center',
    borderRadius: 25,
  },
  getStartedText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  signInContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  signInText: {
    color: '#b8c6db',
    fontSize: 12,
    opacity: 0.8,
  },
  signInLink: {
    color: '#b8c6db',
    fontSize: 12,
    opacity: 0.8,
    textDecorationLine: 'underline',
  },
});
