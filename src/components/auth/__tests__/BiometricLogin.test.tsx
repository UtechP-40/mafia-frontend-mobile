import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { BiometricLogin } from '../BiometricLogin';
import * as LocalAuthentication from 'expo-local-authentication';

// Mock expo-local-authentication
jest.mock('expo-local-authentication');

const mockLocalAuth = LocalAuthentication as jest.Mocked<typeof LocalAuthentication>;

describe('BiometricLogin', () => {
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalAuth.hasHardwareAsync.mockResolvedValue(true);
    mockLocalAuth.isEnrolledAsync.mockResolvedValue(true);
  });

  it('renders biometric login button when hardware is available', async () => {
    render(
      <BiometricLogin onSuccess={mockOnSuccess} onError={mockOnError} />
    );

    await waitFor(() => {
      expect(screen.getByText('Use Biometric Login')).toBeTruthy();
    });
  });

  it('does not render when hardware is not available', async () => {
    mockLocalAuth.hasHardwareAsync.mockResolvedValue(false);

    render(
      <BiometricLogin onSuccess={mockOnSuccess} onError={mockOnError} />
    );

    await waitFor(() => {
      expect(screen.queryByText('Use Biometric Login')).toBeNull();
    });
  });

  it('does not render when biometrics are not enrolled', async () => {
    mockLocalAuth.isEnrolledAsync.mockResolvedValue(false);

    render(
      <BiometricLogin onSuccess={mockOnSuccess} onError={mockOnError} />
    );

    await waitFor(() => {
      expect(screen.queryByText('Use Biometric Login')).toBeNull();
    });
  });

  it('handles successful biometric authentication', async () => {
    mockLocalAuth.authenticateAsync.mockResolvedValue({
      success: true,
      error: undefined,
      warning: undefined,
    });

    render(
      <BiometricLogin onSuccess={mockOnSuccess} onError={mockOnError} />
    );

    await waitFor(() => {
      expect(screen.getByText('Use Biometric Login')).toBeTruthy();
    });

    const biometricButton = screen.getByText('Use Biometric Login');
    fireEvent.press(biometricButton);

    await waitFor(() => {
      expect(mockLocalAuth.authenticateAsync).toHaveBeenCalledWith({
        promptMessage: 'Authenticate to access your account',
        fallbackLabel: 'Use password instead',
        disableDeviceFallback: false,
      });
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('handles failed biometric authentication', async () => {
    mockLocalAuth.authenticateAsync.mockResolvedValue({
      success: false,
      error: 'user_cancel',
      warning: undefined,
    });

    render(
      <BiometricLogin onSuccess={mockOnSuccess} onError={mockOnError} />
    );

    await waitFor(() => {
      expect(screen.getByText('Use Biometric Login')).toBeTruthy();
    });

    const biometricButton = screen.getByText('Use Biometric Login');
    fireEvent.press(biometricButton);

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Authentication was cancelled');
    });
  });

  it('handles biometric authentication error', async () => {
    mockLocalAuth.authenticateAsync.mockRejectedValue(new Error('Hardware error'));

    render(
      <BiometricLogin onSuccess={mockOnSuccess} onError={mockOnError} />
    );

    await waitFor(() => {
      expect(screen.getByText('Use Biometric Login')).toBeTruthy();
    });

    const biometricButton = screen.getByText('Use Biometric Login');
    fireEvent.press(biometricButton);

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Biometric authentication failed');
    });
  });

  it('shows loading state during authentication', async () => {
    let resolveAuth: (value: any) => void;
    const authPromise = new Promise((resolve) => {
      resolveAuth = resolve;
    });
    mockLocalAuth.authenticateAsync.mockReturnValue(authPromise);

    render(
      <BiometricLogin onSuccess={mockOnSuccess} onError={mockOnError} />
    );

    await waitFor(() => {
      expect(screen.getByText('Use Biometric Login')).toBeTruthy();
    });

    const biometricButton = screen.getByText('Use Biometric Login');
    fireEvent.press(biometricButton);

    // Should show loading state
    expect(screen.getByText('Authenticating...')).toBeTruthy();
    expect(biometricButton.props.disabled).toBe(true);

    // Resolve the promise
    resolveAuth!({ success: true });

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    });
  });
});