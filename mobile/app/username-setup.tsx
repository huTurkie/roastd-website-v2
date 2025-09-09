import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function UsernameSetupScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const validateUsername = (username: string) => {
    return username.length >= 3 && username.length <= 20 && /^[a-zA-Z0-9_]+$/.test(username);
  };

  const handleSubmit = async () => {
    if (!validateUsername(username)) {
      Alert.alert('Invalid Username', 'Username must be 3-20 characters long and contain only letters, numbers, and underscores.');
      return;
    }

    setLoading(true);
    try {
      // Save username to AsyncStorage
      await AsyncStorage.setItem('userUsername', username);
      
      // TODO: Add username to Supabase user profile
      // const { data: { user } } = await supabase.auth.getUser();
      // await supabase.from('profiles').upsert({
      //   id: user.id,
      //   username: username,
      //   updated_at: new Date().toISOString(),
      // });

      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error saving username:', error);
      Alert.alert('Error', 'Failed to save username. Please try again.');
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
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Image 
            source={require('@/assets/images/footer3.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Choose Your Username</Text>
          <Text style={styles.subtitle}>This is how others will see you on Roastd</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter your username"
              placeholderTextColor="#999"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
              autoFocus={true}
            />
            <Text style={styles.hint}>3-20 characters, letters, numbers, and underscores only</Text>
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, (!validateUsername(username) || loading) && styles.submitButtonDisabled]} 
            onPress={handleSubmit}
            disabled={!validateUsername(username) || loading}
          >
            <LinearGradient
              colors={['#FEDA77', '#F58529', '#DD2A7B', '#8134AF', '#515BD4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitGradient}
            >
              <Text style={styles.submitText}>
                {loading ? 'Setting Up...' : 'Complete Setup 🔥'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            You can change your username later in settings
          </Text>
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
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 60,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#b8c6db',
    textAlign: 'center',
  },
  form: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  inputContainer: {
    marginBottom: 32,
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
    fontSize: 18,
    backgroundColor: '#F8F8F8',
    color: '#333',
  },
  hint: {
    fontSize: 12,
    color: '#b8c6db',
    marginTop: 6,
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 24,
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
});
