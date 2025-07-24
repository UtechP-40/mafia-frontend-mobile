import React from 'react';
import { Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <Text style={{ color: '#fff', fontSize: 18 }}>Mobile Mafia Game</Text>
        <Text style={{ color: '#ccc', fontSize: 14, marginTop: 10 }}>Testing SafeAreaProvider</Text>
        <StatusBar style="light" />
      </View>
    </SafeAreaProvider>
  );
}