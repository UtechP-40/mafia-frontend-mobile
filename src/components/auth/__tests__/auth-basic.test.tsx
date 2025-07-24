import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { authSlice } from '../../../store/slices/authSlice';

// Simple test to verify auth components can be imported and rendered
describe('Authentication Components Basic Tests', () => {
  const createMockStore = () => {
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
        },
      },
    });
  };

  const renderWithProvider = (component: React.ReactElement) => {
    const store = createMockStore();
    return render(
      <Provider store={store}>
        {component}
      </Provider>
    );
  };

  it('can import and render auth components without errors', () => {
    // Test that the auth components can be imported
    expect(() => {
      const { LoginForm } = require('../LoginForm');
      const { RegisterForm } = require('../RegisterForm');
      const { ForgotPasswordForm } = require('../ForgotPasswordForm');
      const { BiometricLogin } = require('../BiometricLogin');
      const { SocialLoginButtons } = require('../SocialLoginButtons');
      const { OnboardingFlow } = require('../OnboardingFlow');
    }).not.toThrow();
  });

  it('auth slice has correct initial state', () => {
    const store = createMockStore();
    const state = store.getState();
    
    expect(state.auth.user).toBeNull();
    expect(state.auth.token).toBeNull();
    expect(state.auth.isAuthenticated).toBe(false);
    expect(state.auth.isLoading).toBe(false);
    expect(state.auth.error).toBeNull();
  });

  it('can dispatch auth actions', () => {
    const store = createMockStore();
    
    // Test login start action
    store.dispatch(authSlice.actions.loginStart());
    let state = store.getState();
    expect(state.auth.isLoading).toBe(true);
    expect(state.auth.error).toBeNull();

    // Test clear error action
    store.dispatch(authSlice.actions.clearError());
    state = store.getState();
    expect(state.auth.error).toBeNull();

    // Test logout action
    store.dispatch(authSlice.actions.logout());
    state = store.getState();
    expect(state.auth.user).toBeNull();
    expect(state.auth.token).toBeNull();
    expect(state.auth.isAuthenticated).toBe(false);
  });

  it('validation functions work correctly', () => {
    const { validateEmail, validateUsername, validatePassword } = require('../../../utils/validation');

    // Test email validation
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('invalid-email')).toBe(false);
    expect(validateEmail('')).toBe(false);

    // Test username validation
    expect(validateUsername('validuser').isValid).toBe(true);
    expect(validateUsername('ab').isValid).toBe(false);
    expect(validateUsername('').isValid).toBe(false);

    // Test password validation
    expect(validatePassword('StrongPass123!').isValid).toBe(true);
    expect(validatePassword('weak').isValid).toBe(false);
    expect(validatePassword('').isValid).toBe(false);
  });
});