import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { AuthScreen } from '../../../screens/AuthScreen';
import { authSlice } from '../../../store/slices/authSlice';

// Mock expo modules
jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
  isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
  authenticateAsync: jest.fn(() => Promise.resolve({ success: true })),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock the auth components
jest.mock('../LoginForm', () => ({
  LoginForm: ({ onSwitchToRegister, onSwitchToForgotPassword }: any) => {
    const { View, Text, TouchableOpacity } = require('react-native');
    return (
      <View>
        <Text>LoginForm</Text>
        <TouchableOpacity onPress={onSwitchToRegister}>
          <Text>Switch to Register</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onSwitchToForgotPassword}>
          <Text>Switch to Forgot Password</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

jest.mock('../RegisterForm', () => ({
  RegisterForm: ({ onSwitchToLogin, onRegistrationSuccess }: any) => {
    const { View, Text, TouchableOpacity } = require('react-native');
    return (
      <View>
        <Text>RegisterForm</Text>
        <TouchableOpacity onPress={onSwitchToLogin}>
          <Text>Switch to Login</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onRegistrationSuccess}>
          <Text>Registration Success</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

jest.mock('../ForgotPasswordForm', () => ({
  ForgotPasswordForm: ({ onSwitchToLogin }: any) => {
    const { View, Text, TouchableOpacity } = require('react-native');
    return (
      <View>
        <Text>ForgotPasswordForm</Text>
        <TouchableOpacity onPress={onSwitchToLogin}>
          <Text>Switch to Login</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

jest.mock('../OnboardingFlow', () => ({
  OnboardingFlow: ({ onComplete }: any) => {
    const { View, Text, TouchableOpacity } = require('react-native');
    return (
      <View>
        <Text>OnboardingFlow</Text>
        <TouchableOpacity onPress={onComplete}>
          <Text>Complete Onboarding</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

jest.mock('../BiometricLogin', () => ({
  BiometricLogin: () => {
    const { View, Text } = require('react-native');
    return (
      <View>
        <Text>BiometricLogin</Text>
      </View>
    );
  },
}));

jest.mock('../SocialLoginButtons', () => ({
  SocialLoginButtons: () => {
    const { View, Text } = require('react-native');
    return (
      <View>
        <Text>SocialLoginButtons</Text>
      </View>
    );
  },
}));

// Mock the useAuth hook
jest.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    user: null,
  }),
}));

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authSlice.reducer,
    },
    preloadedState: {
      auth: {
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        lastLoginTime: null,
        ...initialState,
      },
    },
  });
};

const renderWithProvider = (component: React.ReactElement, initialState = {}) => {
  const store = createMockStore(initialState);
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

describe('AuthScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form by default', async () => {
    renderWithProvider(<AuthScreen />);

    await waitFor(() => {
      expect(screen.getByText('LoginForm')).toBeTruthy();
      expect(screen.getByText('Mobile Mafia')).toBeTruthy();
      expect(screen.getByText('Welcome back!')).toBeTruthy();
    });
  });

  it('switches to register form when requested', async () => {
    renderWithProvider(<AuthScreen />);

    await waitFor(() => {
      expect(screen.getByText('LoginForm')).toBeTruthy();
    });

    const switchButton = screen.getByText('Switch to Register');
    fireEvent.press(switchButton);

    await waitFor(() => {
      expect(screen.getByText('RegisterForm')).toBeTruthy();
      expect(screen.getByText('Join the game')).toBeTruthy();
    });
  });

  it('switches to forgot password form when requested', async () => {
    renderWithProvider(<AuthScreen />);

    await waitFor(() => {
      expect(screen.getByText('LoginForm')).toBeTruthy();
    });

    const switchButton = screen.getByText('Switch to Forgot Password');
    fireEvent.press(switchButton);

    await waitFor(() => {
      expect(screen.getByText('ForgotPasswordForm')).toBeTruthy();
      expect(screen.getByText('Reset your password')).toBeTruthy();
    });
  });

  it('shows onboarding flow after successful registration', async () => {
    renderWithProvider(<AuthScreen />);

    // Switch to register form
    const switchToRegisterButton = screen.getByText('Switch to Register');
    fireEvent.press(switchToRegisterButton);

    await waitFor(() => {
      expect(screen.getByText('RegisterForm')).toBeTruthy();
    });

    // Trigger registration success
    const registrationSuccessButton = screen.getByText('Registration Success');
    fireEvent.press(registrationSuccessButton);

    await waitFor(() => {
      expect(screen.getByText('OnboardingFlow')).toBeTruthy();
    });
  });

  it('completes onboarding flow and returns to main screen', async () => {
    renderWithProvider(<AuthScreen />);

    // Navigate to onboarding
    const switchToRegisterButton = screen.getByText('Switch to Register');
    fireEvent.press(switchToRegisterButton);

    const registrationSuccessButton = screen.getByText('Registration Success');
    fireEvent.press(registrationSuccessButton);

    await waitFor(() => {
      expect(screen.getByText('OnboardingFlow')).toBeTruthy();
    });

    // Complete onboarding
    const completeButton = screen.getByText('Complete Onboarding');
    fireEvent.press(completeButton);

    await waitFor(() => {
      expect(screen.getByText('LoginForm')).toBeTruthy();
    });
  });

  it('shows biometric login when available', async () => {
    renderWithProvider(<AuthScreen />);

    await waitFor(() => {
      expect(screen.getByText('BiometricLogin')).toBeTruthy();
    });
  });

  it('shows social login buttons on login screen', async () => {
    renderWithProvider(<AuthScreen />);

    await waitFor(() => {
      expect(screen.getByText('SocialLoginButtons')).toBeTruthy();
      expect(screen.getByText('or continue with')).toBeTruthy();
    });
  });

  it('does not show biometric and social login on non-login screens', async () => {
    renderWithProvider(<AuthScreen />);

    // Switch to register form
    const switchButton = screen.getByText('Switch to Register');
    fireEvent.press(switchButton);

    await waitFor(() => {
      expect(screen.getByText('RegisterForm')).toBeTruthy();
      expect(screen.queryByText('BiometricLogin')).toBeNull();
      expect(screen.queryByText('SocialLoginButtons')).toBeNull();
    });
  });

  it('navigates between forms correctly', async () => {
    renderWithProvider(<AuthScreen />);

    // Start with login
    await waitFor(() => {
      expect(screen.getByText('LoginForm')).toBeTruthy();
    });

    // Go to register
    fireEvent.press(screen.getByText('Switch to Register'));
    await waitFor(() => {
      expect(screen.getByText('RegisterForm')).toBeTruthy();
    });

    // Go back to login
    fireEvent.press(screen.getByText('Switch to Login'));
    await waitFor(() => {
      expect(screen.getByText('LoginForm')).toBeTruthy();
    });

    // Go to forgot password
    fireEvent.press(screen.getByText('Switch to Forgot Password'));
    await waitFor(() => {
      expect(screen.getByText('ForgotPasswordForm')).toBeTruthy();
    });

    // Go back to login
    fireEvent.press(screen.getByText('Switch to Login'));
    await waitFor(() => {
      expect(screen.getByText('LoginForm')).toBeTruthy();
    });
  });
});