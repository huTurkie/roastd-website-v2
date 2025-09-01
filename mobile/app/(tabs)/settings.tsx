import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import AppHeader from '@/components/AppHeader';

export default function SettingsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <AppHeader activeTab="settings" />
      <View style={styles.content}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.description}>Manage your app settings here.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
