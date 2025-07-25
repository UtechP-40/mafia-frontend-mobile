import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';

import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';
import { ForgotPasswordForm } from '../components/auth/ForgotPasswordForm';
import { SocialLoginButtons } from '../components/auth/SocialLoginButtons';
import { BiometricLogin } from '../components/auth/BiometricLogin';
import { OnboardingFlow } from '../components/auth/OnboardingFlow';
import { useAuth } from '../hooks/useAuth';
import { RootStackParamList } from '../types/navigation';

type AuthMode = 'login' | 'register' | 'forgot-password' | 'onboarding';
type AuthNavigationProp = StackNavigationProp<RootStackParamList, 'Auth'>;

export const AuthScreen: React.FC = () => {
  const navigation = useNavigation<AuthNavigationProp>();
  const [mode, setMode] = useState<AuthMode>('login');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    checkBiometricAvailability();
    checkFirstTimeUser();
  }, []);

  // Navigate to MainMenu when authenticated
  useEffect(() => {
    if (isAuthenticated && !showOnboarding) {
      navigation.replace('MainMenu');
    }
  }, [isAuthenticated, showOnboarding, navigation]);

  const checkBiometricAvailability = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(hasHardware && isEnrolled);
    } catch (error) {
      console.error('Error checking biometric availability:', error);
    }
  };

  const checkFirstTimeUser = async () => {
    // Check if this is a first-time user (implement based on your storage logic)
    // For now, we'll show onboarding for new registrations
  };

  const handleRegistrationSuccess = () => {
    setShowOnboarding(true);
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  if (showOnboarding) {
    return (
      <OnboardingFlow 
        onComplete={handleOnboardingComplete}
        user={user}
      />
    );
  }

  const renderAuthForm = () => {
    switch (mode) {
      case 'login':
        return (
          <LoginForm 
            onSwitchToRegister={() => setMode('register')}
            onSwitchToForgotPassword={() => setMode('forgot-password')}
          />
        );
      case 'register':
        return (
          <RegisterForm 
            onSwitchToLogin={() => setMode('login')}
            onRegistrationSuccess={handleRegistrationSuccess}
          />
        );
      case 'forgot-password':
        return (
          <ForgotPasswordForm 
            onSwitchToLogin={() => setMode('login')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Ionicons name="game-controller" size={64} color="#6366f1" />
            <Text style={styles.title}>Mobile Mafia</Text>
            <Text style={styles.subtitle}>
              {mode === 'login' ? 'Welcome back!' : 
               mode === 'register' ? 'Join the game' : 
               'Reset your password'}
            </Text>
          </View>

          <View style={styles.formContainer}>
            {renderAuthForm()}
          </View>

          {mode === 'login' && (
            <>
              {biometricAvailable && (
                <View style={styles.biometricContainer}>
                  <BiometricLogin />
                </View>
              )}
              
              <View style={styles.socialContainer}>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or continue with</Text>
                  <View style={styles.dividerLine} />
                </View>
                <SocialLoginButtons />
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: 32,
  },
  biometricContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  socialContainer: {
    marginTop: 24,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#374151',
  },
  dividerText: {
    color: '#9ca3af',
    fontSize: 14,
    marginHorizontal: 16,
  },
});