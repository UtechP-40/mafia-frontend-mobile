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
import { useAuth } from '../../hooks/useAuth';
import { validateEmail, validatePassword } from '../../utils/validation';

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onSwitchToForgotPassword: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSwitchToRegister,
  onSwitchToForgotPassword,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  
  const { login, isLoading, error } = useAuth();

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      await login({ username: email, password });
    } catch (err) {
      Alert.alert('Login Failed', 'Please check your credentials and try again.');
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: undefined }));
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: undefined }));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Input
          value={email}
          onChangeText={handleEmailChange}
          placeholder="Email address"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          error={errors.email}
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.passwordContainer}>
          <Input
            value={password}
            onChangeText={handlePasswordChange}
            placeholder="Password"
            secureTextEntry={!showPassword}
            autoComplete="password"
            error={errors.password}
            style={styles.passwordInput}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={20}
              color="#9ca3af"
            />
          </TouchableOpacity>
        </View>
        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.forgotPassword}
        onPress={onSwitchToForgotPassword}
      >
        <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
      </TouchableOpacity>

      <Button
        title={isLoading ? 'Signing in...' : 'Sign In'}
        onPress={handleLogin}
        disabled={isLoading}
        style={styles.loginButton}
      />

      <View style={styles.switchContainer}>
        <Text style={styles.switchText}>Don't have an account? </Text>
        <TouchableOpacity onPress={onSwitchToRegister}>
          <Text style={styles.switchLink}>Sign up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 16,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },
  errorContainer: {
    marginBottom: 16,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#6366f1',
    fontSize: 14,
  },
  loginButton: {
    marginBottom: 24,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  switchLink: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
  },
});