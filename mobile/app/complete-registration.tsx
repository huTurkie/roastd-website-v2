import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Modal, Image } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

const GoogleLogo = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24">
    <Path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <Path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <Path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <Path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </Svg>
);

export default function CompleteRegistrationScreen() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleSocialLogin = (provider: string) => {
    Alert.alert('Social Login', `${provider} login will be implemented soon!`);
  };

  const handleLinkPress = (type: 'terms' | 'privacy') => {
    // Placeholder for future external link navigation
    Alert.alert('Coming Soon', `${type === 'terms' ? 'Terms of Service' : 'Privacy Policy'} will open in browser soon!`);
  };

  const handleForgotPassword = () => {
    router.push('/forgot-password');
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
        // Sign up new user
        authResult = await supabase.auth.signUp({
          email,
          password,
        }, {
          emailRedirectTo: undefined,
        });
        
        // Handle sign up errors
        if (authResult.error) {
          if (authResult.error.message.includes('already registered') || 
              authResult.error.message.includes('User already registered')) {
            Alert.alert(
              'Account Already Exists',
              'An account with this email already exists. Please use Sign In instead.',
              [
                {
                  text: 'Switch to Sign In',
                  onPress: () => setIsSignUp(false)
                }
              ]
            );
            return;
          }
        }
        
      } else {
        // Sign in existing user
        authResult = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
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
            console.log('Sign-in: Profile data saved to AsyncStorage:', { username: profile.username, email: profile.email });
          } else {
            console.log('Sign-in: No profile found, saving email only');
            await AsyncStorage.setItem('user_email', email);
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
        
        // Check if username already exists
        const { data: existingUser, error: checkError } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', username)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Username check error:', checkError);
          Alert.alert('Error', 'Failed to verify username availability. Please try again.');
          return;
        }

        if (existingUser) {
          Alert.alert('Username Taken', 'This username is already taken. Please choose a different username and try again.');
          return;
        }
        
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
          // Check if it's a unique constraint violation
          if (profileError.code === '23505') {
            console.error('Username already taken:', profileError.message);
            Alert.alert('Username Taken', 'This username is already taken. Please choose a different username and try again.');
            return;
          } else if (profileError.code === '23503') {
            // Foreign key constraint violation - user exists but not in auth table
            // This is expected when user already exists, so don't log as error
            console.log('User account already exists, redirecting to sign in');
            Alert.alert(
              'Account Already Exists',
              'An account with this email already exists. Please use Sign In instead.',
              [
                {
                  text: 'Switch to Sign In',
                  onPress: () => setIsSignUp(false)
                }
              ]
            );
            return;
          } else {
            console.error('Profile creation error:', profileError);
          }
          
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
            if (upsertError.code === '23505') {
              console.error('Username already taken:', upsertError.message);
              Alert.alert('Username Taken', 'This username is already taken. Please choose a different username and try again.');
            } else if (upsertError.code === '23503') {
              // Foreign key constraint violation - user exists but not in auth table
              // This is expected when user already exists, so don't log as error
              console.log('User account already exists during upsert, redirecting to sign in');
              Alert.alert(
                'Account Already Exists',
                'An account with this email already exists. Please use Sign In instead.',
                [
                  {
                    text: 'Switch to Sign In',
                    onPress: () => setIsSignUp(false)
                  }
                ]
              );
            } else {
              console.error('Profile upsert error:', upsertError);
              Alert.alert('Profile Error', 'Failed to create user profile. Please try again.');
            }
            return;
          }
        }
      }

      // For sign up, save user info to AsyncStorage for settings page
      if (isSignUp) {
        // Get the actual username from the created profile (in case it was auto-generated)
        const { data: createdProfile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', authResult.data.user.id)
          .single();
        
        const finalUsername = createdProfile?.username || username || '';
        
        await AsyncStorage.setItem('user_username', finalUsername);
        await AsyncStorage.setItem('user_email', email);
        console.log('Sign-up: User data saved to AsyncStorage:', { username: finalUsername, email });
        
        // Clear onboarding data
        await AsyncStorage.multiRemove(['userUsername', 'userPlatformPreference', 'userAgeRange']);
      } else {
        // For sign in, ensure we have the user data saved
        console.log('Sign-in: User authenticated successfully');
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

            {/* Forgot Password Link - Only show for Sign In */}
            {!isSignUp && (
              <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPasswordContainer}>
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>
            )}

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity 
              style={styles.socialButtonRounded}
              onPress={() => handleSocialLogin('google')}
            >
              <GoogleLogo />
              <Text style={styles.socialButtonTextRounded}>Continue with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.socialButtonRounded}
              onPress={() => handleSocialLogin('apple')}
            >
              <Ionicons name="logo-apple" size={20} color="#000" />
              <Text style={styles.socialButtonTextRounded}>Continue with Apple</Text>
            </TouchableOpacity>

            {/* Terms and Privacy Footer */}
            {isSignUp && (
              <Text style={styles.termsText}>
                By continuing you agree to our{' '}
                <Text style={styles.linkText} onPress={() => handleLinkPress('terms')}>
                  terms of service
                </Text>
                {' '}and{' '}
                <Text style={styles.linkText} onPress={() => handleLinkPress('privacy')}>
                  privacy policy
                </Text>
              </Text>
            )}
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
  socialButtonRounded: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  socialButtonTextRounded: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
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
  termsText: {
    fontSize: 10,
    color: '#b8c6db',
    textAlign: 'center',
    marginTop: 20,
    marginHorizontal: 20,
    lineHeight: 14,
  },
  linkText: {
    fontSize: 10,
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  forgotPasswordText: {
    fontSize: 12,
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
});
