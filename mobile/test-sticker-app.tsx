import React from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import StickerTest from './components/StickerTest';

export default function TestStickerApp() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />
      <StickerTest />
    </SafeAreaView>
  );
}
