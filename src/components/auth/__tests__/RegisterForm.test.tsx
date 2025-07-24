import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { RegisterForm } from '../RegisterForm';
import { authSlice } from '../../../store/slices/authSlice';

// Mock the useAuth hook
jest.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
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

describe('RegisterForm', () => {
  const mockOnSwitchToLogin = jest.fn();
  const mockOnRegistrationSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders registration form correctly', () => {
    renderWithProvider(
      <RegisterForm
        onSwitchToLogin={mockOnSwitchToLogin}
        onRegistrationSuccess={mockOnRegistrationSuccess}
      />
    );

    expect(screen.getByPlaceholderText('Username')).toBeTruthy();
    expect(screen.getByPlaceholderText('Email address')).toBeTruthy();
    expect(screen.getByPlaceholderText('Password')).toBeTruthy();
    expect(screen.getByPlaceholderText('Confirm password')).toBeTruthy();
    expect(screen.getByText('Create Account')).toBeTruthy();
    expect(screen.getByText('Sign in')).toBeTruthy();
  });

  it('validates username correctly', async () => {
    renderWithProvider(
      <RegisterForm
        onSwitchToLogin={mockOnSwitchToLogin}
        onRegistrationSuccess={mockOnRegistrationSuccess}
      />
    );

    const usernameInput = screen.getByPlaceholderText('Username');
    const createAccountButton = screen.getByText('Create Account');

    // Test empty username
    fireEvent.press(createAccountButton);
    await waitFor(() => {
      expect(screen.getByText('Username is required')).toBeTruthy();
    });

    // Test short username
    fireEvent.changeText(usernameInput, 'ab');
    fireEvent.press(createAccountButton);
    await waitFor(() => {
      expect(screen.getByText('Username must be at least 3 characters long')).toBeTruthy();
    });

    // Test invalid characters
    fireEvent.changeText(usernameInput, 'user@name');
    fireEvent.press(createAccountButton);
    await waitFor(() => {
      expect(screen.getByText('Username can only contain letters, numbers, underscores, and hyphens')).toBeTruthy();
    });
  });

  it('validates email correctly', async () => {
    renderWithProvider(
      <RegisterForm
        onSwitchToLogin={mockOnSwitchToLogin}
        onRegistrationSuccess={mockOnRegistrationSuccess}
      />
    );

    const emailInput = screen.getByPlaceholderText('Email address');
    const createAccountButton = screen.getByText('Create Account');

    // Fill valid username first
    const usernameInput = screen.getByPlaceholderText('Username');
    fireEvent.changeText(usernameInput, 'validuser');

    // Test empty email
    fireEvent.press(createAccountButton);
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeTruthy();
    });

    // Test invalid email
    fireEvent.changeText(emailInput, 'invalid-email');
    fireEvent.press(createAccountButton);
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeTruthy();
    });
  });

  it('validates password strength correctly', async () => {
    renderWithProvider(
      <RegisterForm
        onSwitchToLogin={mockOnSwitchToLogin}
        onRegistrationSuccess={mockOnRegistrationSuccess}
      />
    );

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

  it('validates password confirmation correctly', async () => {
    renderWithProvider(
      <RegisterForm
        onSwitchToLogin={mockOnSwitchToLogin}
        onRegistrationSuccess={mockOnRegistrationSuccess}
      />
    );

    const passwordInput = screen.getByPlaceholderText('Password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm password');
    const createAccountButton = screen.getByText('Create Account');

    // Fill other required fields
    fireEvent.changeText(screen.getByPlaceholderText('Username'), 'validuser');
    fireEvent.changeText(screen.getByPlaceholderText('Email address'), 'test@example.com');
    fireEvent.changeText(passwordInput, 'StrongPass123!');

    // Test empty confirm password
    fireEvent.press(createAccountButton);
    await waitFor(() => {
      expect(screen.getByText('Please confirm your password')).toBeTruthy();
    });

    // Test mismatched passwords
    fireEvent.changeText(confirmPasswordInput, 'DifferentPass123!');
    fireEvent.press(createAccountButton);
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeTruthy();
    });
  });

  it('validates terms acceptance', async () => {
    renderWithProvider(
      <RegisterForm
        onSwitchToLogin={mockOnSwitchToLogin}
        onRegistrationSuccess={mockOnRegistrationSuccess}
      />
    );

    const createAccountButton = screen.getByText('Create Account');

    // Fill all required fields
    fireEvent.changeText(screen.getByPlaceholderText('Username'), 'validuser');
    fireEvent.changeText(screen.getByPlaceholderText('Email address'), 'test@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Password'), 'StrongPass123!');
    fireEvent.changeText(screen.getByPlaceholderText('Confirm password'), 'StrongPass123!');

    // Test without accepting terms
    fireEvent.press(createAccountButton);
    await waitFor(() => {
      expect(screen.getByText('You must accept the terms and conditions')).toBeTruthy();
    });
  });

  it('toggles terms acceptance checkbox', () => {
    renderWithProvider(
      <RegisterForm
        onSwitchToLogin={mockOnSwitchToLogin}
        onRegistrationSuccess={mockOnRegistrationSuccess}
      />
    );

    const termsContainer = screen.getByText('I agree to the').parent;
    
    // Initially unchecked
    fireEvent.press(termsContainer!);
    
    // Should be checked now (test would need to verify checkbox state)
    // This is a simplified test - in practice you'd check the checkbox visual state
  });

  it('calls onSwitchToLogin when sign in link is pressed', () => {
    renderWithProvider(
      <RegisterForm
        onSwitchToLogin={mockOnSwitchToLogin}
        onRegistrationSuccess={mockOnRegistrationSuccess}
      />
    );

    const signInLink = screen.getByText('Sign in');
    fireEvent.press(signInLink);

    expect(mockOnSwitchToLogin).toHaveBeenCalledTimes(1);
  });

  it('displays loading state correctly', () => {
    const mockUseAuth = require('../../../hooks/useAuth').useAuth;
    mockUseAuth.mockReturnValue({
      register: jest.fn(),
      isLoading: true,
      error: null,
    });

    renderWithProvider(
      <RegisterForm
        onSwitchToLogin={mockOnSwitchToLogin}
        onRegistrationSuccess={mockOnRegistrationSuccess}
      />
    );

    expect(screen.getByText('Creating account...')).toBeTruthy();
  });

  it('submits form with valid data', async () => {
    const mockRegister = jest.fn();
    const mockUseAuth = require('../../../hooks/useAuth').useAuth;
    mockUseAuth.mockReturnValue({
      register: mockRegister,
      isLoading: false,
      error: null,
    });

    renderWithProvider(
      <RegisterForm
        onSwitchToLogin={mockOnSwitchToLogin}
        onRegistrationSuccess={mockOnRegistrationSuccess}
      />
    );

    // Fill all fields
    fireEvent.changeText(screen.getByPlaceholderText('Username'), 'validuser');
    fireEvent.changeText(screen.getByPlaceholderText('Email address'), 'test@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Password'), 'StrongPass123!');
    fireEvent.changeText(screen.getByPlaceholderText('Confirm password'), 'StrongPass123!');
    
    // Accept terms
    const termsContainer = screen.getByText('I agree to the').parent;
    fireEvent.press(termsContainer!);

    // Submit form
    fireEvent.press(screen.getByText('Create Account'));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        username: 'validuser',
        email: 'test@example.com',
        password: 'StrongPass123!',
        confirmPassword: 'StrongPass123!',
      });
    });
  });
});