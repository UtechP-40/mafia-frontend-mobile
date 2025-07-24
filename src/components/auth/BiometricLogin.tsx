import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../hooks/useAuth';
import { storageService } from '../../services/storage';

export const BiometricLogin: React.FC = () => {
  const [biometricType, setBiometricType] = useState<LocalAuthentication.AuthenticationType[]>([]);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { login } = useAuth();

  useEffect(() => {
    checkBiometricTypes();
  }, []);

  const checkBiometricTypes = async () => {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      setBiometricType(types);
    } catch (error) {
      console.error('Error checking biometric types:', error);
    }
  };

  const getBiometricIcon = (): string => {
    if (biometricType.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'scan';
    }
    if (biometricType.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'finger-print';
    }
    return 'lock-closed';
  };

  const getBiometricLabel = (): string => {
    if (biometricType.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'Face ID';
    }
    if (biometricType.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'Fingerprint';
    }
    return 'Biometric';
  };

  const handleBiometricLogin = async () => {
    try {
      setIsAuthenticating(true);

      // Check if biometric credentials are stored
      const storedCredentials = await storageService.getObject('biometric_credentials') as {
        username: string;
        password: string;
      } | null;
      
      if (!storedCredentials) {
        Alert.alert(
          'Biometric Login Not Set Up',
          'Please log in with your password first to enable biometric authentication.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Authenticate with biometrics
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access Mobile Mafia',
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Password',
        disableDeviceFallback: false,
      });

      if (result.success) {
        // Use stored credentials to log in
        await login({
          username: storedCredentials.username,
          password: storedCredentials.password,
        });
      } else if (result.error === 'user_cancel') {
        // User cancelled, do nothing
      } else if (result.error === 'user_fallback') {
        // User chose to use password instead
      } else {
        Alert.alert(
          'Authentication Failed',
          'Biometric authentication failed. Please try again or use your password.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      Alert.alert(
        'Authentication Error',
        'An error occurred during biometric authentication. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  if (biometricType.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.biometricButton, isAuthenticating && styles.authenticating]}
        onPress={handleBiometricLogin}
        disabled={isAuthenticating}
      >
        <Ionicons
          name={getBiometricIcon() as any}
          size={32}
          color={isAuthenticating ? '#9ca3af' : '#6366f1'}
        />
        <Text style={[styles.biometricText, isAuthenticating && styles.authenticatingText]}>
          {isAuthenticating ? 'Authenticating...' : `Sign in with ${getBiometricLabel()}`}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6366f1',
    backgroundColor: 'transparent',
  },
  authenticating: {
    borderColor: '#9ca3af',
  },
  biometricText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  authenticatingText: {
    color: '#9ca3af',
  },
});