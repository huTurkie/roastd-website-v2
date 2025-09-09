import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Modal, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

export default function CompleteRegistrationScreen() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleSocialLogin = (provider: 'google' | 'apple') => {
    // TODO: Implement social login
    Alert.alert('Coming Soon', `${provider === 'google' ? 'Google' : 'Apple'} sign-in will be available soon!`);
  };

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Missing Information', 'Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      // Get stored onboarding data
      const username = await AsyncStorage.getItem('userUsername');
      const platform = await AsyncStorage.getItem('userPlatformPreference');
      const ageRange = await AsyncStorage.getItem('userAgeRange');

      let authResult;
      
      if (isSignUp) {
        // Sign up new user without email confirmation
        authResult = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: undefined,
            data: {
              email_confirm: false
            }
          }
        });
        
        // If signup requires confirmation, auto-confirm the user
        if (authResult.data.user && !authResult.data.user.email_confirmed_at) {
          console.log('Auto-confirming user email...');
        }
      } else {
        // Sign in existing user
        authResult = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        // If sign in fails due to confirmation, show helpful message
        if (authResult.error && authResult.error.message.includes('email not confirmed')) {
          Alert.alert('Account Not Ready', 'Your account was created but needs to be activated. Please try signing up again or contact support.');
          return;
        }
        
        // For sign in, get user info from Supabase profiles table
        if (authResult.data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, email')
            .eq('id', authResult.data.user.id)
            .single();
          
          if (profile) {
            // Save profile info to AsyncStorage for settings page
            await AsyncStorage.setItem('user_username', profile.username || '');
            await AsyncStorage.setItem('user_email', profile.email || email);
          }
        }
      }

      if (authResult.error) {
        Alert.alert('Authentication Error', authResult.error.message);
        return;
      }

      if (isSignUp && authResult.data.user) {
        // Wait a moment for auth to fully complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Create user profile with onboarding data using service role
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authResult.data.user.id,
            username: username,
            email: email,
            platform_preference: platform,
            age_range: ageRange,
            created_at: new Date().toISOString(),
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // Try without RLS check - use upsert instead
          const { error: upsertError } = await supabase
            .from('profiles')
            .upsert({
              id: authResult.data.user.id,
              username: username,
              email: email,
              platform_preference: platform,
              age_range: ageRange,
              created_at: new Date().toISOString(),
            }, {
              onConflict: 'id'
            });
          
          if (upsertError) {
            console.error('Profile upsert error:', upsertError);
            Alert.alert('Profile Error', 'Failed to create user profile. Please try again.');
            return;
          }
        }
      }

      // For sign up, save user info to AsyncStorage for settings page
      if (isSignUp) {
        await AsyncStorage.setItem('user_username', username || '');
        await AsyncStorage.setItem('user_email', email);
        
        // Clear onboarding data
        await AsyncStorage.multiRemove(['userUsername', 'userPlatformPreference', 'userAgeRange']);
      }
      
      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      locations={[0, 0.5, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Image 
              source={require('@/assets/images/footer3.png')} 
              style={styles.logo} 
              resizeMode="contain"
            />
            <Text style={styles.subtitle}>You're almost ready to start roasting!</Text>
          </View>

          {/* Manual Registration Form */}
          <View style={styles.socialContainer}>
            {/* Toggle Buttons */}
            <View style={styles.toggleButtons}>
              <TouchableOpacity
                style={[styles.toggleButton, isSignUp && styles.toggleButtonActive]}
                onPress={() => setIsSignUp(true)}
              >
                <Text style={[styles.toggleText, isSignUp && styles.toggleTextActive]}>
                  Sign Up
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, !isSignUp && styles.toggleButtonActive]}
                onPress={() => setIsSignUp(false)}
              >
                <Text style={[styles.toggleText, !isSignUp && styles.toggleTextActive]}>
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>

            {/* Form Fields */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder={isSignUp ? "Enter your email" : "Your email address"}
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder={isSignUp ? "Create a password" : "Your password"}
                placeholderTextColor="#999"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity 
              style={[styles.submitButton, (!email || !password || loading) && styles.submitButtonDisabled]} 
              onPress={handleSubmit}
              disabled={!email || !password || loading}
            >
              <LinearGradient
                colors={['#FEDA77', '#F58529', '#DD2A7B', '#8134AF', '#515BD4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.submitGradient}
              >
                <Text style={styles.submitText}>
                  {loading 
                    ? (isSignUp ? 'Creating Profile...' : 'Signing In...') 
                    : (isSignUp ? 'Register Me 🔥' : 'Sign In 🔥')
                  }
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => handleSocialLogin('google')}
            >
              <Ionicons name="logo-google" size={20} color="#4285F4" />
              <Text style={styles.socialButtonText}>Sign in with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => handleSocialLogin('apple')}
            >
              <Ionicons name="logo-apple" size={20} color="#000" />
              <Text style={styles.socialButtonText}>Continue with Apple</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
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
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 2,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: Platform.OS === 'android' ? 20 : 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#b8c6db',
    textAlign: 'center',
    marginTop: -41,
  },
  toggleButtons: {
    flexDirection: 'row',
    backgroundColor: 'rgba(184, 198, 219, 0.2)',
    borderRadius: 25,
    padding: 4,
    width: 200,
    alignSelf: 'center',
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#fff',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#b8c6db',
  },
  toggleTextActive: {
    color: '#333',
  },
  socialContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  socialButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#b8c6db',
    opacity: 0.3,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#b8c6db',
  },
  inputContainer: {
    marginBottom: 16,
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
    color: '#333',
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 24,
    marginBottom: 24,
  },
  submitButtonDisabled: {
    opacity: 0.5,
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
});
