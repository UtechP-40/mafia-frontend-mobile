import { renderHook, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useAuth } from '../useAuth';
import { authSlice } from '../../store/slices/authSlice';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Keychain from 'react-native-keychain';

// Mock dependencies
jest.mock('expo-local-authentication');
jest.mock('react-native-keychain');
jest.mock('../../services/api', () => ({
  apiService: {
    login: jest.fn(),
    register: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
  },
}));

const mockLocalAuth = LocalAuthentication as jest.Mocked<typeof LocalAuthentication>;
const mockKeychain = Keychain as jest.Mocked<typeof Keychain>;

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

const wrapper = ({ children, store }: any) => (
  <Provider store={store}>{children}</Provider>
);

describe('useAuth', () => {
  let store: ReturnType<typeof createMockStore>;
  const mockApiService = require('../../services/api').apiService;

  beforeEach(() => {
    store = createMockStore();
    jest.clearAllMocks();
    mockLocalAuth.hasHardwareAsync.mockResolvedValue(true);
    mockLocalAuth.isEnrolledAsync.mockResolvedValue(true);
    mockKeychain.getInternetCredentials.mockResolvedValue({
      username: 'test@example.com',
      password: 'password123',
    });
  });

  it('returns initial auth state', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: (props) => wrapper({ ...props, store }),
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles successful login', async () => {
    const mockUser = {
      id: 'user-1',
      username: 'testuser',
      email: 'test@example.com',
    };

    mockApiService.login.mockResolvedValue({
      user: mockUser,
      token: 'access-token',
      refreshToken: 'refresh-token',
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: (props) => wrapper({ ...props, store }),
    });

    await act(async () => {
      await result.current.login({
        username: 'test@example.com',
        password: 'password123',
      });
    });

    expect(mockApiService.login).toHaveBeenCalledWith({
      username: 'test@example.com',
      password: 'password123',
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('handles login failure', async () => {
    mockApiService.login.mockRejectedValue(new Error('Invalid credentials'));

    const { result } = renderHook(() => useAuth(), {
      wrapper: (props) => wrapper({ ...props, store }),
    });

    await act(async () => {
      await result.current.login({
        username: 'test@example.com',
        password: 'wrongpassword',
      });
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBe('Invalid credentials');
  });

  it('handles successful registration', async () => {
    const mockUser = {
      id: 'user-1',
      username: 'newuser',
      email: 'new@example.com',
    };

    mockApiService.register.mockResolvedValue({
      user: mockUser,
      token: 'access-token',
      refreshToken: 'refresh-token',
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: (props) => wrapper({ ...props, store }),
    });

    await act(async () => {
      await result.current.register({
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
      });
    });

    expect(mockApiService.register).toHaveBeenCalledWith({
      username: 'newuser',
      email: 'new@example.com',
      password: 'password123',
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('handles registration failure', async () => {
    mockApiService.register.mockRejectedValue(new Error('Email already exists'));

    const { result } = renderHook(() => useAuth(), {
      wrapper: (props) => wrapper({ ...props, store }),
    });

    await act(async () => {
      await result.current.register({
        username: 'newuser',
        email: 'existing@example.com',
        password: 'password123',
      });
    });

    expect(result.current.error).toBe('Email already exists');
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('handles logout', async () => {
    // Set up authenticated state
    store = createMockStore({
      user: { id: 'user-1', username: 'testuser' },
      token: 'access-token',
      isAuthenticated: true,
    });

    mockApiService.logout.mockResolvedValue({});

    const { result } = renderHook(() => useAuth(), {
      wrapper: (props) => wrapper({ ...props, store }),
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(mockApiService.logout).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.token).toBeNull();
  });

  it('handles biometric login when available', async () => {
    const mockUser = {
      id: 'user-1',
      username: 'testuser',
      email: 'test@example.com',
    };

    mockLocalAuth.authenticateAsync.mockResolvedValue({
      success: true,
      error: undefined,
      warning: undefined,
    });

    mockApiService.login.mockResolvedValue({
      user: mockUser,
      token: 'access-token',
      refreshToken: 'refresh-token',
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: (props) => wrapper({ ...props, store }),
    });

    await act(async () => {
      await result.current.loginWithBiometrics();
    });

    expect(mockLocalAuth.authenticateAsync).toHaveBeenCalled();
    expect(mockKeychain.getInternetCredentials).toHaveBeenCalled();
    expect(mockApiService.login).toHaveBeenCalledWith({
      username: 'test@example.com',
      password: 'password123',
    });
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('handles biometric login failure', async () => {
    mockLocalAuth.authenticateAsync.mockResolvedValue({
      success: false,
      error: 'user_cancel',
      warning: undefined,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: (props) => wrapper({ ...props, store }),
    });

    await act(async () => {
      await result.current.loginWithBiometrics();
    });

    expect(result.current.error).toBe('Authentication was cancelled');
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('handles biometric login when not available', async () => {
    mockLocalAuth.hasHardwareAsync.mockResolvedValue(false);

    const { result } = renderHook(() => useAuth(), {
      wrapper: (props) => wrapper({ ...props, store }),
    });

    await act(async () => {
      await result.current.loginWithBiometrics();
    });

    expect(result.current.error).toBe('Biometric authentication not available');
  });

  it('handles token refresh', async () => {
    store = createMockStore({
      token: 'old-token',
      refreshToken: 'refresh-token',
      isAuthenticated: true,
    });

    mockApiService.refreshToken.mockResolvedValue({
      token: 'new-token',
      refreshToken: 'new-refresh-token',
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: (props) => wrapper({ ...props, store }),
    });

    await act(async () => {
      await result.current.refreshAuthToken();
    });

    expect(mockApiService.refreshToken).toHaveBeenCalledWith('refresh-token');
    // Token should be updated in store
  });

  it('handles token refresh failure', async () => {
    store = createMockStore({
      token: 'old-token',
      refreshToken: 'invalid-refresh-token',
      isAuthenticated: true,
    });

    mockApiService.refreshToken.mockRejectedValue(new Error('Invalid refresh token'));

    const { result } = renderHook(() => useAuth(), {
      wrapper: (props) => wrapper({ ...props, store }),
    });

    await act(async () => {
      await result.current.refreshAuthToken();
    });

    // Should logout user when refresh fails
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('checks biometric availability', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: (props) => wrapper({ ...props, store }),
    });

    const isAvailable = await result.current.isBiometricAvailable();

    expect(mockLocalAuth.hasHardwareAsync).toHaveBeenCalled();
    expect(mockLocalAuth.isEnrolledAsync).toHaveBeenCalled();
    expect(isAvailable).toBe(true);
  });

  it('handles guest login', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: (props) => wrapper({ ...props, store }),
    });

    await act(async () => {
      await result.current.loginAsGuest();
    });

    expect(result.current.user?.username).toBe('Guest');
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.isGuest).toBe(true);
  });

  it('handles password reset request', async () => {
    mockApiService.requestPasswordReset = jest.fn().mockResolvedValue({});

    const { result } = renderHook(() => useAuth(), {
      wrapper: (props) => wrapper({ ...props, store }),
    });

    await act(async () => {
      await result.current.requestPasswordReset('test@example.com');
    });

    expect(mockApiService.requestPasswordReset).toHaveBeenCalledWith('test@example.com');
  });

  it('clears auth error', () => {
    store = createMockStore({
      error: 'Some error',
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: (props) => wrapper({ ...props, store }),
    });

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('updates user profile', async () => {
    store = createMockStore({
      user: { id: 'user-1', username: 'oldname' },
      isAuthenticated: true,
    });

    mockApiService.updateProfile = jest.fn().mockResolvedValue({
      id: 'user-1',
      username: 'newname',
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: (props) => wrapper({ ...props, store }),
    });

    await act(async () => {
      await result.current.updateProfile({ username: 'newname' });
    });

    expect(mockApiService.updateProfile).toHaveBeenCalledWith({ username: 'newname' });
  });

  it('handles loading states correctly', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: (props) => wrapper({ ...props, store }),
    });

    expect(result.current.isLoading).toBe(false);

    // Start login
    const loginPromise = act(async () => {
      await result.current.login({
        username: 'test@example.com',
        password: 'password123',
      });
    });

    // Should be loading during login
    expect(result.current.isLoading).toBe(true);

    await loginPromise;

    // Should not be loading after login completes
    expect(result.current.isLoading).toBe(false);
  });
});