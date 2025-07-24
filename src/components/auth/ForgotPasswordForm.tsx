import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { validateEmail } from '../../utils/validation';

interface ForgotPasswordFormProps {
  onSwitchToLogin: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onSwitchToLogin,
}) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // TODO: Implement password reset API call
      // await authService.requestPasswordReset(email);
      
      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setEmailSent(true);
    } catch (err) {
      setError('Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (error) {
      setError('');
    }
  };

  if (emailSent) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <Ionicons name="mail-outline" size={64} color="#22c55e" />
          <Text style={styles.successTitle}>Check your email</Text>
          <Text style={styles.successMessage}>
            We've sent a password reset link to{'\n'}
            <Text style={styles.emailText}>{email}</Text>
          </Text>
          <Text style={styles.instructionText}>
            Click the link in the email to reset your password. 
            If you don't see the email, check your spam folder.
          </Text>
        </View>

        <Button
          title="Back to Sign In"
          onPress={onSwitchToLogin}
          style={styles.backButton}
        />

        <TouchableOpacity
          style={styles.resendContainer}
          onPress={() => {
            setEmailSent(false);
            setEmail('');
          }}
        >
          <Text style={styles.resendText}>
            Didn't receive the email? <Text style={styles.resendLink}>Try again</Text>
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="lock-closed-outline" size={48} color="#6366f1" />
        <Text style={styles.title}>Forgot your password?</Text>
        <Text style={styles.subtitle}>
          Enter your email address and we'll send you a link to reset your password.
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <Input
          value={email}
          onChangeText={handleEmailChange}
          placeholder="Email address"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          error={error}
        />
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>

      <Button
        title={isLoading ? 'Sending...' : 'Send Reset Link'}
        onPress={handleResetPassword}
        disabled={isLoading}
        style={styles.resetButton}
      />

      <TouchableOpacity
        style={styles.backToLogin}
        onPress={onSwitchToLogin}
      >
        <Ionicons name="arrow-back" size={16} color="#6366f1" />
        <Text style={styles.backToLoginText}>Back to Sign In</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 4,
  },
  resetButton: {
    marginBottom: 24,
  },
  backToLogin: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backToLoginText: {
    color: '#6366f1',
    fontSize: 16,
    marginLeft: 8,
  },
  successContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 16,
  },
  successMessage: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 16,
  },
  emailText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  instructionText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  backButton: {
    marginBottom: 24,
  },
  resendContainer: {
    alignItems: 'center',
  },
  resendText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  resendLink: {
    color: '#6366f1',
    fontWeight: '600',
  },
});