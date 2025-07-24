import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { LoginForm } from '../LoginForm';
import { authSlice } from '../../../store/slices/authSlice';

// Mock the useAuth hook
jest.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    login: jest.fn(),
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

describe('LoginForm', () => {
  const mockOnSwitchToRegister = jest.fn();
  const mockOnSwitchToForgotPassword = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form correctly', () => {
    renderWithProvider(
      <LoginForm
        onSwitchToRegister={mockOnSwitchToRegister}
        onSwitchToForgotPassword={mockOnSwitchToForgotPassword}
      />
    );

    expect(screen.getByPlaceholderText('Email address')).toBeTruthy();
    expect(screen.getByPlaceholderText('Password')).toBeTruthy();
    expect(screen.getByText('Sign In')).toBeTruthy();
    expect(screen.getByText('Forgot your password?')).toBeTruthy();
    expect(screen.getByText('Sign up')).toBeTruthy();
  });

  it('validates email input correctly', async () => {
    renderWithProvider(
      <LoginForm
        onSwitchToRegister={mockOnSwitchToRegister}
        onSwitchToForgotPassword={mockOnSwitchToForgotPassword}
      />
    );

    const emailInput = screen.getByPlaceholderText('Email address');
    const signInButton = screen.getByText('Sign In');

    // Test empty email
    fireEvent.press(signInButton);
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeTruthy();
    });

    // Test invalid email
    fireEvent.changeText(emailInput, 'invalid-email');
    fireEvent.press(signInButton);
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeTruthy();
    });

    // Test valid email clears error
    fireEvent.changeText(emailInput, 'test@example.com');
    await waitFor(() => {
      expect(screen.queryByText('Please enter a valid email address')).toBeNull();
    });
  });

  it('validates password input correctly', async () => {
    renderWithProvider(
      <LoginForm
        onSwitchToRegister={mockOnSwitchToRegister}
        onSwitchToForgotPassword={mockOnSwitchToForgotPassword}
      />
    );

    const emailInput = screen.getByPlaceholderText('Email address');
    const signInButton = screen.getByText('Sign In');

    // Fill valid email
    fireEvent.changeText(emailInput, 'test@example.com');

    // Test empty password
    fireEvent.press(signInButton);
    await waitFor(() => {
      expect(screen.getByText('Password is required')).toBeTruthy();
    });
  });

  it('toggles password visibility', () => {
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

  it('calls onSwitchToRegister when sign up link is pressed', () => {
    renderWithProvider(
      <LoginForm
        onSwitchToRegister={mockOnSwitchToRegister}
        onSwitchToForgotPassword={mockOnSwitchToForgotPassword}
      />
    );

    const signUpLink = screen.getByText('Sign up');
    fireEvent.press(signUpLink);

    expect(mockOnSwitchToRegister).toHaveBeenCalledTimes(1);
  });

  it('calls onSwitchToForgotPassword when forgot password link is pressed', () => {
    renderWithProvider(
      <LoginForm
        onSwitchToRegister={mockOnSwitchToRegister}
        onSwitchToForgotPassword={mockOnSwitchToForgotPassword}
      />
    );

    const forgotPasswordLink = screen.getByText('Forgot your password?');
    fireEvent.press(forgotPasswordLink);

    expect(mockOnSwitchToForgotPassword).toHaveBeenCalledTimes(1);
  });

  it('displays loading state correctly', () => {
    const mockUseAuth = require('../../../hooks/useAuth').useAuth;
    mockUseAuth.mockReturnValue({
      login: jest.fn(),
      isLoading: true,
      error: null,
    });

    renderWithProvider(
      <LoginForm
        onSwitchToRegister={mockOnSwitchToRegister}
        onSwitchToForgotPassword={mockOnSwitchToForgotPassword}
      />
    );

    expect(screen.getByText('Signing in...')).toBeTruthy();
    expect(screen.getByText('Signing in...').parent?.props.disabled).toBe(true);
  });

  it('displays error message correctly', () => {
    const mockUseAuth = require('../../../hooks/useAuth').useAuth;
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

  it('submits form with valid credentials', async () => {
    const mockLogin = jest.fn();
    const mockUseAuth = require('../../../hooks/useAuth').useAuth;
    mockUseAuth.mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: null,
    });

    renderWithProvider(
      <LoginForm
        onSwitchToRegister={mockOnSwitchToRegister}
        onSwitchToForgotPassword={mockOnSwitchToForgotPassword}
      />
    );

    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const signInButton = screen.getByText('Sign In');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        username: 'test@example.com',
        password: 'password123',
      });
    });
  });
});