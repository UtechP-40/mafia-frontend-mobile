import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../hooks/useAuth';

// Configure WebBrowser for auth session
WebBrowser.maybeCompleteAuthSession();

interface SocialLoginButtonsProps {
  onSuccess?: () => void;
}

export const SocialLoginButtons: React.FC<SocialLoginButtonsProps> = ({
  onSuccess,
}) => {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const { socialLogin } = useAuth();

  // Google OAuth configuration
  const googleAuthConfig = {
    clientId: Platform.select({
      ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      default: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    }),
    scopes: ['openid', 'profile', 'email'],
    additionalParameters: {},
    customParameters: {},
  };

  const [googleRequest, googleResponse, googlePromptAsync] = AuthSession.useAuthRequest(
    {
      clientId: googleAuthConfig.clientId!,
      scopes: googleAuthConfig.scopes,
      responseType: AuthSession.ResponseType.Token,
      redirectUri: AuthSession.makeRedirectUri({
        scheme: 'com.mobilemania.app',
        path: 'auth',
      }),
    },
    {
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    }
  );

  // Apple OAuth configuration (iOS only)
  const [appleRequest, appleResponse, applePromptAsync] = AuthSession.useAuthRequest(
    {
      clientId: 'com.mobilemania.app',
      scopes: ['name', 'email'], // Use string literals instead of enum
      responseType: AuthSession.ResponseType.IdToken,
      redirectUri: AuthSession.makeRedirectUri({
        scheme: 'com.mobilemania.app',
        path: 'auth',
      }),
    },
    {
      authorizationEndpoint: 'https://appleid.apple.com/auth/authorize',
    }
  );

  React.useEffect(() => {
    if (googleResponse?.type === 'success') {
      handleGoogleSuccess(googleResponse.authentication);
    } else if (googleResponse?.type === 'error') {
      setIsGoogleLoading(false);
      Alert.alert('Google Sign In Failed', 'Please try again.');
    }
  }, [googleResponse]);

  React.useEffect(() => {
    if (appleResponse?.type === 'success') {
      handleAppleSuccess(appleResponse.authentication);
    } else if (appleResponse?.type === 'error') {
      setIsAppleLoading(false);
      Alert.alert('Apple Sign In Failed', 'Please try again.');
    }
  }, [appleResponse]);

  const handleGoogleSuccess = async (authentication: any) => {
    try {
      if (authentication?.accessToken) {
        // Get user info from Google
        const userInfoResponse = await fetch(
          `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${authentication.accessToken}`
        );
        const userInfo = await userInfoResponse.json();

        // Send to your backend for authentication
        await socialLogin({
          provider: 'google',
          token: authentication.accessToken,
          userInfo,
        });

        onSuccess?.();
      }
    } catch (error) {
      console.error('Google login error:', error);
      Alert.alert('Google Sign In Failed', 'Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleAppleSuccess = async (authentication: any) => {
    try {
      if (authentication?.idToken) {
        // Send to your backend for authentication
        await socialLogin({
          provider: 'apple',
          token: authentication.idToken,
        });

        onSuccess?.();
      }
    } catch (error) {
      console.error('Apple login error:', error);
      Alert.alert('Apple Sign In Failed', 'Please try again.');
    } finally {
      setIsAppleLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      await googlePromptAsync();
    } catch (error) {
      setIsGoogleLoading(false);
      console.error('Google login initiation error:', error);
      Alert.alert('Error', 'Failed to initiate Google sign in.');
    }
  };

  const handleAppleLogin = async () => {
    try {
      setIsAppleLoading(true);
      await applePromptAsync();
    } catch (error) {
      setIsAppleLoading(false);
      console.error('Apple login initiation error:', error);
      Alert.alert('Error', 'Failed to initiate Apple sign in.');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.socialButton, styles.googleButton]}
        onPress={handleGoogleLogin}
        disabled={isGoogleLoading || !googleRequest}
      >
        <Ionicons name="logo-google" size={20} color="#ffffff" />
        <Text style={styles.socialButtonText}>
          {isGoogleLoading ? 'Signing in...' : 'Continue with Google'}
        </Text>
      </TouchableOpacity>

      {Platform.OS === 'ios' && (
        <TouchableOpacity
          style={[styles.socialButton, styles.appleButton]}
          onPress={handleAppleLogin}
          disabled={isAppleLoading || !appleRequest}
        >
          <Ionicons name="logo-apple" size={20} color="#ffffff" />
          <Text style={styles.socialButtonText}>
            {isAppleLoading ? 'Signing in...' : 'Continue with Apple'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
  },
  googleButton: {
    backgroundColor: '#db4437',
  },
  appleButton: {
    backgroundColor: '#000000',
  },
  socialButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
});