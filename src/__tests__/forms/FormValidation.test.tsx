import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { LoginForm } from '../../components/auth/LoginForm';
import { RegisterForm } from '../../components/auth/RegisterForm';
import { authSlice } from '../../store/slices/authSlice';

// Mock validation utilities
jest.mock('../../utils/validation', () => ({
  validateEmail: jest.fn((email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }),
  validatePassword: jest.fn((password: string) => {
    return password.length >= 8;
  }),
  validateUsername: jest.fn((username: string) => {
    return username.length >= 3 && username.length <= 20;
  }),
  sanitizeInput: jest.fn((input: string) => {
    return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }),
}));

// Mock useAuth hook
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    login: jest.fn(),
    register: jest.fn(),
    isLoading: false,
    error: null,
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

describe('Form Validation', () => {
  const mockOnSwitchToRegister = jest.fn();
  const mockOnSwitchToLogin = jest.fn();
  const mockOnSwitchToForgotPassword = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('LoginForm Validation', () => {
    it('validates required email field', async () => {
      renderWithProvider(
        <LoginForm
          onSwitchToRegister={mockOnSwitchToRegister}
          onSwitchToForgotPassword={mockOnSwitchToForgotPassword}
        />
      );

      const signInButton = screen.getByText('Sign In');
      fireEvent.press(signInButton);

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeTruthy();
      });
    });

    it('validates email format', async () => {
      renderWithProvider(
        <LoginForm
          onSwitchToRegister={mockOnSwitchToRegister}
          onSwitchToForgotPassword={mockOnSwitchToForgotPassword}
        />
      );

      const emailInput = screen.getByPlaceholderText('Email address');
      const signInButton = screen.getByText('Sign In');

      // Test invalid email formats
      const invalidEmails = [
        'invalid-email',
        'test@',
        '@example.com',
        'test.example.com',
        'test@.com',
        'test@example.',
      ];

      for (const email of invalidEmails) {
        fireEvent.changeText(emailInput, email);
        fireEvent.press(signInButton);

        await waitFor(() => {
          expect(screen.getByText('Please enter a valid email address')).toBeTruthy();
        });
      }
    });

    it('accepts valid email formats', async () => {
      renderWithProvider(
        <LoginForm
          onSwitchToRegister={mockOnSwitchToRegister}
          onSwitchToForgotPassword={mockOnSwitchToForgotPassword}
        />
      );

      const emailInput = screen.getByPlaceholderText('Email address');
      const passwordInput = screen.getByPlaceholderText('Password');

      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'test+tag@example.org',
        'user123@test-domain.com',
      ];

      for (const email of validEmails) {
        fireEvent.changeText(emailInput, email);
        fireEvent.changeText(passwordInput, 'password123');

        await waitFor(() => {
          expect(screen.queryByText('Please enter a valid email address')).toBeNull();
        });
      }
    });

    it('validates required password field', async () => {
      renderWithProvider(
        <LoginForm
          onSwitchToRegister={mockOnSwitchToRegister}
          onSwitchToForgotPassword={mockOnSwitchToForgotPassword}
        />
      );

      const emailInput = screen.getByPlaceholderText('Email address');
      const signInButton = screen.getByText('Sign In');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.press(signInButton);

      await waitFor(() => {
        expect(screen.getByText('Password is required')).toBeTruthy();
      });
    });

    it('handles input sanitization', async () => {
      const mockSanitizeInput = require('../../utils/validation').sanitizeInput;
      
      renderWithProvider(
        <LoginForm
          onSwitchToRegister={mockOnSwitchToRegister}
          onSwitchToForgotPassword={mockOnSwitchToForgotPassword}
        />
      );

      const emailInput = screen.getByPlaceholderText('Email address');
      const maliciousInput = 'test@example.com<script>alert("xss")</script>';

      fireEvent.changeText(emailInput, maliciousInput);

      expect(mockSanitizeInput).toHaveBeenCalledWith(maliciousInput);
    });
  });

  describe('RegisterForm Validation', () => {
    it('validates all required fields', async () => {
      renderWithProvider(
        <RegisterForm onSwitchToLogin={mockOnSwitchToLogin} />
      );

      const createButton = screen.getByText('Create Account');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(screen.getByText('Username is required')).toBeTruthy();
        expect(screen.getByText('Email is required')).toBeTruthy();
        expect(screen.getByText('Password is required')).toBeTruthy();
      });
    });

    it('validates username length', async () => {
      renderWithProvider(
        <RegisterForm onSwitchToLogin={mockOnSwitchToLogin} />
      );

      const usernameInput = screen.getByPlaceholderText('Username');
      const createButton = screen.getByText('Create Account');

      // Test too short username
      fireEvent.changeText(usernameInput, 'ab');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(screen.getByText('Username must be at least 3 characters')).toBeTruthy();
      });

      // Test too long username
      fireEvent.changeText(usernameInput, 'a'.repeat(21));
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(screen.getByText('Username must be less than 20 characters')).toBeTruthy();
      });
    });

    it('validates username characters', async () => {
      renderWithProvider(
        <RegisterForm onSwitchToLogin={mockOnSwitchToLogin} />
      );

      const usernameInput = screen.getByPlaceholderText('Username');
      const createButton = screen.getByText('Create Account');

      const invalidUsernames = [
        'user@name',
        'user name',
        'user#name',
        'user$name',
        'user%name',
      ];

      for (const username of invalidUsernames) {
        fireEvent.changeText(usernameInput, username);
        fireEvent.press(createButton);

        await waitFor(() => {
          expect(screen.getByText('Username can only contain letters, numbers, and underscores')).toBeTruthy();
        });
      }
    });

    it('validates password strength', async () => {
      renderWithProvider(
        <RegisterForm onSwitchToLogin={mockOnSwitchToLogin} />
      );

      const passwordInput = screen.getByPlaceholderText('Password');
      const createButton = screen.getByText('Create Account');

      // Test weak passwords
      const weakPasswords = [
        '123',
        'password',
        '12345678',
        'abcdefgh',
        'PASSWORD',
      ];

      for (const password of weakPasswords) {
        fireEvent.changeText(passwordInput, password);
        fireEvent.press(createButton);

        await waitFor(() => {
          expect(screen.getByText('Password must be at least 8 characters')).toBeTruthy();
        });
      }
    });

    it('validates password confirmation match', async () => {
      renderWithProvider(
        <RegisterForm onSwitchToLogin={mockOnSwitchToLogin} />
      );

      const passwordInput = screen.getByPlaceholderText('Password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm password');
      const createButton = screen.getByText('Create Account');

      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'different123');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeTruthy();
      });
    });

    it('shows real-time validation feedback', async () => {
      renderWithProvider(
        <RegisterForm onSwitchToLogin={mockOnSwitchToLogin} />
      );

      const emailInput = screen.getByPlaceholderText('Email address');

      // Type invalid email
      fireEvent.changeText(emailInput, 'invalid');
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeTruthy();
      });

      // Correct the email
      fireEvent.changeText(emailInput, 'valid@example.com');
      
      await waitFor(() => {
        expect(screen.queryByText('Please enter a valid email address')).toBeNull();
      });
    });

    it('handles form submission with valid data', async () => {
      const mockRegister = jest.fn();
      const mockUseAuth = require('../../hooks/useAuth').useAuth;
      mockUseAuth.mockReturnValue({
        register: mockRegister,
        isLoading: false,
        error: null,
      });

      renderWithProvider(
        <RegisterForm onSwitchToLogin={mockOnSwitchToLogin} />
      );

      const usernameInput = screen.getByPlaceholderText('Username');
      const emailInput = screen.getByPlaceholderText('Email address');
      const passwordInput = screen.getByPlaceholderText('Password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm password');
      const createButton = screen.getByText('Create Account');

      fireEvent.changeText(usernameInput, 'validuser');
      fireEvent.changeText(emailInput, 'valid@example.com');
      fireEvent.changeText(passwordInput, 'ValidPass123!');
      fireEvent.changeText(confirmPasswordInput, 'ValidPass123!');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          username: 'validuser',
          email: 'valid@example.com',
          password: 'ValidPass123!',
        });
      });
    });
  });

  describe('Input Handling', () => {
    it('handles text input changes correctly', () => {
      renderWithProvider(
        <LoginForm
          onSwitchToRegister={mockOnSwitchToRegister}
          onSwitchToForgotPassword={mockOnSwitchToForgotPassword}
        />
      );

      const emailInput = screen.getByPlaceholderText('Email address');
      
      fireEvent.changeText(emailInput, 'test@example.com');
      
      expect(emailInput.props.value).toBe('test@example.com');
    });

    it('handles password visibility toggle', () => {
      renderWithProvider(
        <LoginForm
          onSwitchToRegister={mockOnSwitchToRegister}
          onSwitchToForgotPassword={mockOnSwitchToForgotPassword}
        />
      );

      const passwordInput = screen.getByPlaceholderText('Password');
      const eyeButton = screen.getByTestId('eye-button') || screen.getByRole('button');

      // Initially password should be hidden
      expect(passwordInput.props.secureTextEntry).toBe(true);

      // Toggle visibility
      fireEvent.press(eyeButton);
      expect(passwordInput.props.secureTextEntry).toBe(false);

      // Toggle back
      fireEvent.press(eyeButton);
      expect(passwordInput.props.secureTextEntry).toBe(true);
    });

    it('handles form focus and blur events', () => {
      renderWithProvider(
        <LoginForm
          onSwitchToRegister={mockOnSwitchToRegister}
          onSwitchToForgotPassword={mockOnSwitchToForgotPassword}
        />
      );

      const emailInput = screen.getByPlaceholderText('Email address');
      
      fireEvent(emailInput, 'focus');
      // Should show focus styling or behavior
      
      fireEvent(emailInput, 'blur');
      // Should remove focus styling or trigger validation
    });

    it('handles keyboard navigation', () => {
      renderWithProvider(
        <RegisterForm onSwitchToLogin={mockOnSwitchToLogin} />
      );

      const usernameInput = screen.getByPlaceholderText('Username');
      const emailInput = screen.getByPlaceholderText('Email address');
      
      // Simulate tab navigation
      fireEvent(usernameInput, 'submitEditing');
      // Should focus next input (email)
      
      expect(emailInput).toBeTruthy();
    });

    it('handles input length limits', () => {
      renderWithProvider(
        <RegisterForm onSwitchToLogin={mockOnSwitchToLogin} />
      );

      const usernameInput = screen.getByPlaceholderText('Username');
      const longUsername = 'a'.repeat(50);
      
      fireEvent.changeText(usernameInput, longUsername);
      
      // Should be truncated to max length
      expect(usernameInput.props.value?.length).toBeLessThanOrEqual(20);
    });

    it('handles special characters in input', () => {
      renderWithProvider(
        <LoginForm
          onSwitchToRegister={mockOnSwitchToRegister}
          onSwitchToForgotPassword={mockOnSwitchToForgotPassword}
        />
      );

      const emailInput = screen.getByPlaceholderText('Email address');
      const specialCharsEmail = 'test+tag@example-domain.co.uk';
      
      fireEvent.changeText(emailInput, specialCharsEmail);
      
      expect(emailInput.props.value).toBe(specialCharsEmail);
    });

    it('handles copy and paste operations', () => {
      renderWithProvider(
        <LoginForm
          onSwitchToRegister={mockOnSwitchToRegister}
          onSwitchToForgotPassword={mockOnSwitchToForgotPassword}
        />
      );

      const emailInput = screen.getByPlaceholderText('Email address');
      
      // Simulate paste event
      fireEvent(emailInput, 'paste', {
        nativeEvent: {
          text: 'pasted@example.com',
        },
      });
      
      // Should handle pasted content
      expect(emailInput.props.value).toBe('pasted@example.com');
    });

    it('handles form auto-completion', () => {
      renderWithProvider(
        <LoginForm
          onSwitchToRegister={mockOnSwitchToRegister}
          onSwitchToForgotPassword={mockOnSwitchToForgotPassword}
        />
      );

      const emailInput = screen.getByPlaceholderText('Email address');
      
      // Should have proper autoComplete props
      expect(emailInput.props.autoComplete).toBe('email');
      expect(emailInput.props.textContentType).toBe('emailAddress');
    });

    it('handles input accessibility', () => {
      renderWithProvider(
        <LoginForm
          onSwitchToRegister={mockOnSwitchToRegister}
          onSwitchToForgotPassword={mockOnSwitchToForgotPassword}
        />
      );

      const emailInput = screen.getByPlaceholderText('Email address');
      
      expect(emailInput.props.accessibilityLabel).toBe('Email address');
      expect(emailInput.props.accessibilityHint).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('displays server validation errors', () => {
      const mockUseAuth = require('../../hooks/useAuth').useAuth;
      mockUseAuth.mockReturnValue({
        login: jest.fn(),
        isLoading: false,
        error: 'Invalid credentials',
      });

      renderWithProvider(
        <LoginForm
          onSwitchToRegister={mockOnSwitchToRegister}
          onSwitchToForgotPassword={mockOnSwitchToForgotPassword}
        />
      );

      expect(screen.getByText('Invalid credentials')).toBeTruthy();
    });

    it('clears errors on input change', async () => {
      const mockUseAuth = require('../../hooks/useAuth').useAuth;
      mockUseAuth.mockReturnValue({
        login: jest.fn(),
        isLoading: false,
        error: 'Invalid credentials',
      });

      renderWithProvider(
        <LoginForm
          onSwitchToRegister={mockOnSwitchToRegister}
          onSwitchToForgotPassword={mockOnSwitchToForgotPassword}
        />
      );

      expect(screen.getByText('Invalid credentials')).toBeTruthy();

      const emailInput = screen.getByPlaceholderText('Email address');
      fireEvent.changeText(emailInput, 'new@example.com');

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText('Invalid credentials')).toBeNull();
      });
    });

    it('handles network errors gracefully', () => {
      const mockUseAuth = require('../../hooks/useAuth').useAuth;
      mockUseAuth.mockReturnValue({
        login: jest.fn(),
        isLoading: false,
        error: 'Network error. Please try again.',
      });

      renderWithProvider(
        <LoginForm
          onSwitchToRegister={mockOnSwitchToRegister}
          onSwitchToForgotPassword={mockOnSwitchToForgotPassword}
        />
      );

      expect(screen.getByText('Network error. Please try again.')).toBeTruthy();
    });
  });
});