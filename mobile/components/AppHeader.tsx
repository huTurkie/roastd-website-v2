import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';

interface AppHeaderProps {
  activeTab: 'play' | 'inbox' | 'settings';
}

export default function AppHeader({ activeTab }: AppHeaderProps) {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="eye-outline" size={28} color="#BDBDBD" />
        </View>
        <View style={styles.headerCenter}>
          <TouchableOpacity onPress={() => router.push('/')}>
            <Text style={[styles.tabText, activeTab === 'play' && styles.activeTabText]}>PLAY</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/inbox')} style={styles.inboxButton}>
            <Text style={[styles.tabText, activeTab === 'inbox' && styles.activeTabText]}>INBOX</Text>
            {activeTab === 'inbox' && <View style={styles.redDot} />}
          </TouchableOpacity>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => router.push('/settings')}>
            <Ionicons name="settings-outline" size={24} color="#BDBDBD" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 60,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  headerLeft: {
    flex: 1,
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 2,
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D3D3D3',
    marginHorizontal: 12,
  },
  activeTabText: {
    color: '#000',
  },
  inboxButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4757',
    marginLeft: 4,
  },
});
