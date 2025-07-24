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
import { validateEmail, validateUsername, validatePassword } from '../../utils/validation';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  onRegistrationSuccess: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSwitchToLogin,
  onRegistrationSuccess,
}) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  const { register, isLoading, error } = useAuth();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Username validation
    const usernameValidation = validateUsername(formData.username);
    if (!usernameValidation.isValid) {
      newErrors.username = usernameValidation.error!;
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.error!;
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Terms acceptance
    if (!acceptedTerms) {
      newErrors.terms = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });
      onRegistrationSuccess();
    } catch (err) {
      Alert.alert('Registration Failed', 'Please check your information and try again.');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    if (!password) return { strength: 0, label: '', color: '#6b7280' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

    const strengthMap = [
      { strength: 0, label: 'Very Weak', color: '#ef4444' },
      { strength: 1, label: 'Weak', color: '#f97316' },
      { strength: 2, label: 'Fair', color: '#eab308' },
      { strength: 3, label: 'Good', color: '#22c55e' },
      { strength: 4, label: 'Strong', color: '#16a34a' },
      { strength: 5, label: 'Very Strong', color: '#15803d' },
    ];

    return strengthMap[score];
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Input
          value={formData.username}
          onChangeText={(text) => handleInputChange('username', text)}
          placeholder="Username"
          autoCapitalize="none"
          autoComplete="username"
          error={errors.username}
        />
        {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Input
          value={formData.email}
          onChangeText={(text) => handleInputChange('email', text)}
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
            value={formData.password}
            onChangeText={(text) => handleInputChange('password', text)}
            placeholder="Password"
            secureTextEntry={!showPassword}
            autoComplete="new-password"
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
        {formData.password && (
          <View style={styles.strengthContainer}>
            <View style={styles.strengthBar}>
              <View 
                style={[
                  styles.strengthFill, 
                  { 
                    width: `${(passwordStrength.strength / 5) * 100}%`,
                    backgroundColor: passwordStrength.color 
                  }
                ]} 
              />
            </View>
            <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
              {passwordStrength.label}
            </Text>
          </View>
        )}
        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.passwordContainer}>
          <Input
            value={formData.confirmPassword}
            onChangeText={(text) => handleInputChange('confirmPassword', text)}
            placeholder="Confirm password"
            secureTextEntry={!showConfirmPassword}
            autoComplete="new-password"
            error={errors.confirmPassword}
            style={styles.passwordInput}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Ionicons
              name={showConfirmPassword ? 'eye-off' : 'eye'}
              size={20}
              color="#9ca3af"
            />
          </TouchableOpacity>
        </View>
        {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
      </View>

      <TouchableOpacity
        style={styles.termsContainer}
        onPress={() => setAcceptedTerms(!acceptedTerms)}
      >
        <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
          {acceptedTerms && (
            <Ionicons name="checkmark" size={16} color="#ffffff" />
          )}
        </View>
        <Text style={styles.termsText}>
          I agree to the{' '}
          <Text style={styles.termsLink}>Terms of Service</Text>
          {' '}and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </TouchableOpacity>
      {errors.terms && <Text style={styles.errorText}>{errors.terms}</Text>}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <Button
        title={isLoading ? 'Creating account...' : 'Create Account'}
        onPress={handleRegister}
        disabled={isLoading}
        style={styles.registerButton}
      />

      <View style={styles.switchContainer}>
        <Text style={styles.switchText}>Already have an account? </Text>
        <TouchableOpacity onPress={onSwitchToLogin}>
          <Text style={styles.switchLink}>Sign in</Text>
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
  strengthContainer: {
    marginTop: 8,
  },
  strengthBar: {
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#6b7280',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  termsText: {
    flex: 1,
    color: '#9ca3af',
    fontSize: 14,
    lineHeight: 20,
  },
  termsLink: {
    color: '#6366f1',
    textDecorationLine: 'underline',
  },
  errorContainer: {
    marginBottom: 16,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 4,
  },
  registerButton: {
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