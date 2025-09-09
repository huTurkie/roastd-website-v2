import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

interface UserRegistrationProps {
  visible: boolean;
  onComplete: (username: string, email: string) => void;
  onCancel: () => void;
}

export default function UserRegistration({ visible, onComplete, onCancel }: UserRegistrationProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateUsername = (username: string) => {
    return username.length >= 3 && username.length <= 20 && /^[a-zA-Z0-9_]+$/.test(username);
  };

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (isSignUp && !password.trim()) {
      Alert.alert('Error', 'Please enter a password');
      return;
    }

    if (!isSignUp && !password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        // Sign up with email and password
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: email,
          password: password,
        });

        if (signUpError) {
          console.error('Sign up error:', signUpError);
          Alert.alert('Error', signUpError.message || 'Failed to create account. Please try again.');
          setLoading(false);
          return;
        }

        if (!authData.user) {
          Alert.alert('Error', 'Failed to create user account. Please try again.');
          setLoading(false);
          return;
        }

        // Get stored onboarding data from AsyncStorage
        const storedUsername = await AsyncStorage.getItem('userUsername');
        const storedPlatform = await AsyncStorage.getItem('userPlatformPreference');
        const storedAgeRange = await AsyncStorage.getItem('userAgeRange');

        // Create complete profile with all collected data
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            username: storedUsername,
            email: email,
            platform_preference: storedPlatform,
            age_range: storedAgeRange,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          Alert.alert('Error', 'Failed to save profile. Please try again.');
          setLoading(false);
          return;
        }

        // Clear temporary storage
        await AsyncStorage.multiRemove(['userUsername', 'userPlatformPreference', 'userAgeRange']);
        
        // Save email to AsyncStorage
        await AsyncStorage.setItem('userEmail', email);
        onComplete('', email);
      } else {
        // Sign in with existing credentials
        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

        if (signInError) {
          console.error('Sign in error:', signInError);
          Alert.alert('Error', signInError.message || 'Failed to sign in. Please check your credentials.');
          setLoading(false);
          return;
        }

        await AsyncStorage.setItem('userEmail', email);
        onComplete('', email);
      }
    } catch (error) {
      console.error('Error during authentication:', error);
      Alert.alert('Error', 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        <KeyboardAvoidingView 
          style={styles.container} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
        <View style={styles.header}>
          <Image 
            source={require('@/assets/images/footer3.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.subtitle}>Create your profile to get started</Text>
          
          {/* Toggle Buttons */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity 
              style={[styles.toggleButton, isSignUp && styles.toggleButtonActive]}
              onPress={() => setIsSignUp(true)}
            >
              <Text style={[styles.toggleText, isSignUp && styles.toggleTextActive]}>Sign Up</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleButton, !isSignUp && styles.toggleButtonActive]}
              onPress={() => setIsSignUp(false)}
            >
              <Text style={[styles.toggleText, !isSignUp && styles.toggleTextActive]}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.form}>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder={isSignUp ? "Enter your email" : "Enter your email to sign in"}
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.hint}>
              {isSignUp ? "We'll use this to identify your roasts" : "Enter the email you used to sign up"}
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder={isSignUp ? "Create a password" : "Enter your password"}
              placeholderTextColor="#999"
              secureTextEntry={true}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.hint}>
              {isSignUp ? "Choose a secure password" : "Enter your account password"}
            </Text>
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            <LinearGradient
              colors={['#FF6B6B', '#F14060']}
              style={styles.submitGradient}
            >
              <Text style={styles.submitText}>
                {loading ? (isSignUp ? 'Creating Profile...' : 'Signing In...') : (isSignUp ? 'Get Started 🔥' : 'Sign In 🔥')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Login Buttons */}
          <View style={styles.socialContainer}>
            <TouchableOpacity style={styles.googleButton}>
              <Ionicons name="logo-google" size={20} color="#4285F4" />
              <Text style={styles.socialButtonText}>Sign in with Google</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.appleButton}>
              <Ionicons name="logo-apple" size={20} color="#000" />
              <Text style={styles.socialButtonTextApple}>Continue with Apple</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Your info stays private and is only used to separate your roasts from others
          </Text>
        </View>
      </KeyboardAvoidingView>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    padding: 8,
  },
  logo: {
    width: 280,
    height: 80,
    marginBottom: -20,
  },
  subtitle: {
    fontSize: 16,
    color: '#b8c6db',
    textAlign: 'center',
  },
  form: {
    flex: 1,
    paddingHorizontal: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#F8F8F8',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  submitButton: {
    marginTop: 20,
    borderRadius: 25,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 12,
    color: '#b8c6db',
    textAlign: 'center',
    lineHeight: 18,
  },
  socialContainer: {
    marginBottom: 24,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
  },
  socialButtonTextApple: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginLeft: 12,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#b8c6db',
    opacity: 0.3,
  },
  dividerText: {
    fontSize: 14,
    color: '#b8c6db',
    marginHorizontal: 16,
    fontWeight: '500',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    padding: 4,
    marginTop: 24,
    width: 220,
    alignSelf: 'center',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 80,
  },
  toggleButtonActive: {
    backgroundColor: '#fff',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#b8c6db',
    textAlign: 'center',
    numberOfLines: 1,
  },
  toggleTextActive: {
    color: '#333',
  },
});
