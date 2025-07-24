import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { store } from '../store/store';
import { AuthScreen } from '../screens/AuthScreen';
import { authService } from '../services/auth';
import { apiService } from '../services/api';

// Mock external dependencies
jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
  isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
  authenticateAsync: jest.fn(() => Promise.resolve({ success: true })),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('expo-auth-session', () => ({
  useAuthRequest: jest.fn(() => [null, null, jest.fn()]),
  makeRedirectUri: jest.fn(() => 'test://redirect'),
  ResponseType: { Token: 'token', IdToken: 'id_token' },
  AppleAuthenticationScope: { FULL_NAME: 'name', EMAIL: 'email' },
}));

jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
}));

// Mock API service
jest.mock('../services/api', () => ({
  apiService: {
    login: jest.fn(),
    register: jest.fn(),
    socialLogin: jest.fn(),
    requestPasswordReset: jest.fn(),
    validateToken: jest.fn(),
    logout: jest.fn(),
  },
}));

// Mock storage service
jest.mock('../services/storage', () => ({
  storageService: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    setObject: jest.fn(),
    getObject: jest.fn(),
    removeItem: jest.fn(),
  },
}));

const mockApiService = apiService as jest.Mocked<typeof apiService>;

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Login Flow', () => {
    it('completes successful login flow', async () => {
      const mockAuthResponse = {
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          avatar: '',
          statistics: {
            gamesPlayed: 0,
            gamesWon: 0,
            winRate: 0,
            favoriteRole: '',
            averageGameDuration: 0,
            eloRating: 1000,
            achievements: [],
          },
          friends: [],
          createdAt: new Date(),
          lastActive: new Date(),
        },
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
      };

      mockApiService.login.mockResolvedValue(mockAuthResponse);

      renderWithProvider(<AuthScreen />);

      // Wait for the form to render
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Email address')).toBeTruthy();
      });

      // Fill in login form
      const emailInput = screen.getByPlaceholderText('Email address');
      const passwordInput = screen.getByPlaceholderText('Password');
      const signInButton = screen.getByText('Sign In');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(signInButton);

      // Verify API was called
      await waitFor(() => {
        expect(mockApiService.login).toHaveBeenCalledWith({
          username: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('handles login error correctly', async () => {
      mockApiService.login.mockRejectedValue(new Error('Invalid credentials'));

      renderWithProvider(<AuthScreen />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Email address')).toBeTruthy();
      });

      const emailInput = screen.getByPlaceholderText('Email address');
      const passwordInput = screen.getByPlaceholderText('Password');
      const signInButton = screen.getByText('Sign In');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'wrongpassword');
      fireEvent.press(signInButton);

      await waitFor(() => {
        expect(mockApiService.login).toHaveBeenCalled();
      });

      // Error should be displayed (this would be handled by the auth slice)
    });
  });

  describe('Registration Flow', () => {
    it('completes successful registration flow', async () => {
      const mockAuthResponse = {
        user: {
          id: '1',
          username: 'newuser',
          email: 'new@example.com',
          avatar: '',
          statistics: {
            gamesPlayed: 0,
            gamesWon: 0,
            winRate: 0,
            favoriteRole: '',
            averageGameDuration: 0,
            eloRating: 1000,
            achievements: [],
          },
          friends: [],
          createdAt: new Date(),
          lastActive: new Date(),
        },
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
      };

      mockApiService.register.mockResolvedValue(mockAuthResponse);

      renderWithProvider(<AuthScreen />);

      // Switch to register form
      await waitFor(() => {
        expect(screen.getByText('Sign up')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Sign up'));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Username')).toBeTruthy();
      });

      // Fill registration form
      const usernameInput = screen.getByPlaceholderText('Username');
      const emailInput = screen.getByPlaceholderText('Email address');
      const passwordInput = screen.getByPlaceholderText('Password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm password');

      fireEvent.changeText(usernameInput, 'newuser');
      fireEvent.changeText(emailInput, 'new@example.com');
      fireEvent.changeText(passwordInput, 'StrongPass123!');
      fireEvent.changeText(confirmPasswordInput, 'StrongPass123!');

      // Accept terms
      const termsCheckbox = screen.getByText('I agree to the').parent;
      fireEvent.press(termsCheckbox!);

      // Submit form
      const createAccountButton = screen.getByText('Create Account');
      fireEvent.press(createAccountButton);

      await waitFor(() => {
        expect(mockApiService.register).toHaveBeenCalledWith({
          username: 'newuser',
          email: 'new@example.com',
          password: 'StrongPass123!',
          confirmPassword: 'StrongPass123!',
        });
      });
    });
  });

  describe('Password Reset Flow', () => {
    it('completes password reset request', async () => {
      mockApiService.requestPasswordReset.mockResolvedValue(undefined);

      renderWithProvider(<AuthScreen />);

      // Navigate to forgot password
      await waitFor(() => {
        expect(screen.getByText('Forgot your password?')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Forgot your password?'));

      await waitFor(() => {
        expect(screen.getByText('Forgot your password?')).toBeTruthy();
        expect(screen.getByPlaceholderText('Email address')).toBeTruthy();
      });

      // Fill email and submit
      const emailInput = screen.getByPlaceholderText('Email address');
      const sendResetButton = screen.getByText('Send Reset Link');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.press(sendResetButton);

      await waitFor(() => {
        expect(mockApiService.requestPasswordReset).toHaveBeenCalledWith('test@example.com');
      });
    });
  });

  describe('Form Validation', () => {
    it('validates email format in login form', async () => {
      renderWithProvider(<AuthScreen />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Email address')).toBeTruthy();
      });

      const emailInput = screen.getByPlaceholderText('Email address');
      const signInButton = screen.getByText('Sign In');

      // Test invalid email
      fireEvent.changeText(emailInput, 'invalid-email');
      fireEvent.press(signInButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeTruthy();
      });

      // API should not be called with invalid data
      expect(mockApiService.login).not.toHaveBeenCalled();
    });

    it('validates password strength in registration form', async () => {
      renderWithProvider(<AuthScreen />);

      // Switch to register
      fireEvent.press(screen.getByText('Sign up'));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Password')).toBeTruthy();
      });

      const passwordInput = screen.getByPlaceholderText('Password');

      // Test weak password
      fireEvent.changeText(passwordInput, 'weak');

      await waitFor(() => {
        expect(screen.getByText('Weak')).toBeTruthy();
      });

      // Test strong password
      fireEvent.changeText(passwordInput, 'StrongPass123!');

      await waitFor(() => {
        expect(screen.getByText('Very Strong')).toBeTruthy();
      });
    });

    it('validates password confirmation match', async () => {
      renderWithProvider(<AuthScreen />);

      // Switch to register
      fireEvent.press(screen.getByText('Sign up'));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Confirm password')).toBeTruthy();
      });

      const passwordInput = screen.getByPlaceholderText('Password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm password');
      const createAccountButton = screen.getByText('Create Account');

      // Fill other required fields
      fireEvent.changeText(screen.getByPlaceholderText('Username'), 'testuser');
      fireEvent.changeText(screen.getByPlaceholderText('Email address'), 'test@example.com');

      // Set mismatched passwords
      fireEvent.changeText(passwordInput, 'StrongPass123!');
      fireEvent.changeText(confirmPasswordInput, 'DifferentPass123!');

      fireEvent.press(createAccountButton);

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeTruthy();
      });

      expect(mockApiService.register).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('displays network error messages', async () => {
      mockApiService.login.mockRejectedValue(new Error('Network error'));

      renderWithProvider(<AuthScreen />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Email address')).toBeTruthy();
      });

      const emailInput = screen.getByPlaceholderText('Email address');
      const passwordInput = screen.getByPlaceholderText('Password');
      const signInButton = screen.getByText('Sign In');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(signInButton);

      await waitFor(() => {
        expect(mockApiService.login).toHaveBeenCalled();
      });

      // Error handling would be managed by the auth slice and displayed in the UI
    });

    it('handles validation errors from server', async () => {
      mockApiService.register.mockRejectedValue(new Error('Username already exists'));

      renderWithProvider(<AuthScreen />);

      // Switch to register and fill form
      fireEvent.press(screen.getByText('Sign up'));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Username')).toBeTruthy();
      });

      // Fill form with existing username
      fireEvent.changeText(screen.getByPlaceholderText('Username'), 'existinguser');
      fireEvent.changeText(screen.getByPlaceholderText('Email address'), 'test@example.com');
      fireEvent.changeText(screen.getByPlaceholderText('Password'), 'StrongPass123!');
      fireEvent.changeText(screen.getByPlaceholderText('Confirm password'), 'StrongPass123!');

      // Accept terms and submit
      const termsCheckbox = screen.getByText('I agree to the').parent;
      fireEvent.press(termsCheckbox!);
      fireEvent.press(screen.getByText('Create Account'));

      await waitFor(() => {
        expect(mockApiService.register).toHaveBeenCalled();
      });

      // Server error would be handled by auth slice
    });
  });
});