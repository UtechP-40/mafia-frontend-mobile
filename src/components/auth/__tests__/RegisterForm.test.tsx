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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders register form correctly', () => {
    renderWithProvider(
      <RegisterForm onSwitchToLogin={mockOnSwitchToLogin} />
    );

    expect(screen.getByPlaceholderText('Username')).toBeTruthy();
    expect(screen.getByPlaceholderText('Email address')).toBeTruthy();
    expect(screen.getByPlaceholderText('Password')).toBeTruthy();
    expect(screen.getByPlaceholderText('Confirm password')).toBeTruthy();
    expect(screen.getByText('Create Account')).toBeTruthy();
    expect(screen.getByText('Sign in')).toBeTruthy();
  });

  it('validates username input correctly', async () => {
    renderWithProvider(
      <RegisterForm onSwitchToLogin={mockOnSwitchToLogin} />
    );

    const usernameInput = screen.getByPlaceholderText('Username');
    const createButton = screen.getByText('Create Account');

    // Test empty username
    fireEvent.press(createButton);
    await waitFor(() => {
      expect(screen.getByText('Username is required')).toBeTruthy();
    });

    // Test short username
    fireEvent.changeText(usernameInput, 'ab');
    fireEvent.press(createButton);
    await waitFor(() => {
      expect(screen.getByText('Username must be at least 3 characters')).toBeTruthy();
    });

    // Test valid username clears error
    fireEvent.changeText(usernameInput, 'validuser');
    await waitFor(() => {
      expect(screen.queryByText('Username must be at least 3 characters')).toBeNull();
    });
  });

  it('validates email input correctly', async () => {
    renderWithProvider(
      <RegisterForm onSwitchToLogin={mockOnSwitchToLogin} />
    );

    const emailInput = screen.getByPlaceholderText('Email address');
    const createButton = screen.getByText('Create Account');

    // Test empty email
    fireEvent.press(createButton);
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeTruthy();
    });

    // Test invalid email
    fireEvent.changeText(emailInput, 'invalid-email');
    fireEvent.press(createButton);
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeTruthy();
    });
  });

  it('validates password input correctly', async () => {
    renderWithProvider(
      <RegisterForm onSwitchToLogin={mockOnSwitchToLogin} />
    );

    const passwordInput = screen.getByPlaceholderText('Password');
    const createButton = screen.getByText('Create Account');

    // Test empty password
    fireEvent.press(createButton);
    await waitFor(() => {
      expect(screen.getByText('Password is required')).toBeTruthy();
    });

    // Test short password
    fireEvent.changeText(passwordInput, '123');
    fireEvent.press(createButton);
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters')).toBeTruthy();
    });
  });

  it('validates password confirmation correctly', async () => {
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

  it('submits form with valid data', async () => {
    const mockRegister = jest.fn();
    const mockUseAuth = require('../../../hooks/useAuth').useAuth;
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

    fireEvent.changeText(usernameInput, 'testuser');
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(confirmPasswordInput, 'password123');
    fireEvent.press(createButton);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('displays loading state correctly', () => {
    const mockUseAuth = require('../../../hooks/useAuth').useAuth;
    mockUseAuth.mockReturnValue({
      register: jest.fn(),
      isLoading: true,
      error: null,
    });

    renderWithProvider(
      <RegisterForm onSwitchToLogin={mockOnSwitchToLogin} />
    );

    expect(screen.getByText('Creating account...')).toBeTruthy();
    expect(screen.getByText('Creating account...').parent?.props.disabled).toBe(true);
  });

  it('calls onSwitchToLogin when sign in link is pressed', () => {
    renderWithProvider(
      <RegisterForm onSwitchToLogin={mockOnSwitchToLogin} />
    );

    const signInLink = screen.getByText('Sign in');
    fireEvent.press(signInLink);

    expect(mockOnSwitchToLogin).toHaveBeenCalledTimes(1);
  });
});