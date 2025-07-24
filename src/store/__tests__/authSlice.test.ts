import { configureStore } from '@reduxjs/toolkit';
import { authSlice, loginUser, registerUser, refreshAuthToken, selectAuth, selectUser, selectIsAuthenticated } from '../slices/authSlice';
import { User, LoginCredentials, RegisterData, AuthResponse } from '../../types/user';

// Mock fetch for async thunks
global.fetch = jest.fn();

describe('authSlice', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authSlice.reducer,
      },
    });
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().auth;
      expect(state).toEqual({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        lastLoginTime: null,
      });
    });
  });

  describe('synchronous actions', () => {
    it('should handle loginStart', () => {
      store.dispatch(authSlice.actions.loginStart());
      const state = store.getState().auth;
      
      expect(state.isLoading).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should handle loginSuccess', () => {
      const mockAuthResponse: AuthResponse = {
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          avatar: 'avatar.jpg',
          statistics: {
            gamesPlayed: 0,
            gamesWon: 0,
            winRate: 0,
            favoriteRole: 'villager',
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

      store.dispatch(authSlice.actions.loginSuccess(mockAuthResponse));
      const state = store.getState().auth;

      expect(state.user).toEqual(mockAuthResponse.user);
      expect(state.token).toBe('mock-token');
      expect(state.refreshToken).toBe('mock-refresh-token');
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
      expect(state.lastLoginTime).toBeGreaterThan(0);
    });

    it('should handle loginFailure', () => {
      const errorMessage = 'Invalid credentials';
      store.dispatch(authSlice.actions.loginFailure(errorMessage));
      const state = store.getState().auth;

      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(errorMessage);
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBe(null);
      expect(state.token).toBe(null);
      expect(state.refreshToken).toBe(null);
    });

    it('should handle logout', () => {
      // First login
      const mockAuthResponse: AuthResponse = {
        user: { id: '1', username: 'test' } as User,
        token: 'token',
        refreshToken: 'refresh-token',
      };
      store.dispatch(authSlice.actions.loginSuccess(mockAuthResponse));

      // Then logout
      store.dispatch(authSlice.actions.logout());
      const state = store.getState().auth;

      expect(state.user).toBe(null);
      expect(state.token).toBe(null);
      expect(state.refreshToken).toBe(null);
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBe(null);
      expect(state.lastLoginTime).toBe(null);
    });

    it('should handle updateUser', () => {
      // First login
      const mockUser: User = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        avatar: 'avatar.jpg',
        statistics: {} as any,
        friends: [],
        createdAt: new Date(),
        lastActive: new Date(),
      };
      
      store.dispatch(authSlice.actions.loginSuccess({
        user: mockUser,
        token: 'token',
        refreshToken: 'refresh-token',
      }));

      // Update user
      const updates = { username: 'newusername', avatar: 'newavatar.jpg' };
      store.dispatch(authSlice.actions.updateUser(updates));
      const state = store.getState().auth;

      expect(state.user?.username).toBe('newusername');
      expect(state.user?.avatar).toBe('newavatar.jpg');
      expect(state.user?.email).toBe('test@example.com'); // Should remain unchanged
    });

    it('should handle clearError', () => {
      store.dispatch(authSlice.actions.loginFailure('Some error'));
      store.dispatch(authSlice.actions.clearError());
      const state = store.getState().auth;

      expect(state.error).toBe(null);
    });

    it('should handle setTokens', () => {
      const tokens = { token: 'new-token', refreshToken: 'new-refresh-token' };
      store.dispatch(authSlice.actions.setTokens(tokens));
      const state = store.getState().auth;

      expect(state.token).toBe('new-token');
      expect(state.refreshToken).toBe('new-refresh-token');
    });
  });

  describe('async thunks', () => {
    describe('loginUser', () => {
      it('should handle successful login', async () => {
        const mockResponse: AuthResponse = {
          user: { id: '1', username: 'testuser' } as User,
          token: 'mock-token',
          refreshToken: 'mock-refresh-token',
        };

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const credentials: LoginCredentials = {
          username: 'testuser',
          password: 'password123',
        };

        await store.dispatch(loginUser(credentials));
        const state = store.getState().auth;

        expect(state.user).toEqual(mockResponse.user);
        expect(state.token).toBe('mock-token');
        expect(state.refreshToken).toBe('mock-refresh-token');
        expect(state.isAuthenticated).toBe(true);
        expect(state.isLoading).toBe(false);
        expect(state.error).toBe(null);
      });

      it('should handle login failure', async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 401,
        });

        const credentials: LoginCredentials = {
          username: 'testuser',
          password: 'wrongpassword',
        };

        await store.dispatch(loginUser(credentials));
        const state = store.getState().auth;

        expect(state.user).toBe(null);
        expect(state.token).toBe(null);
        expect(state.isAuthenticated).toBe(false);
        expect(state.isLoading).toBe(false);
        expect(state.error).toBe('Login failed');
      });

      it('should handle network error', async () => {
        (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        const credentials: LoginCredentials = {
          username: 'testuser',
          password: 'password123',
        };

        await store.dispatch(loginUser(credentials));
        const state = store.getState().auth;

        expect(state.isLoading).toBe(false);
        expect(state.error).toBe('Network error');
        expect(state.isAuthenticated).toBe(false);
      });
    });

    describe('registerUser', () => {
      it('should handle successful registration', async () => {
        const mockResponse: AuthResponse = {
          user: { id: '1', username: 'newuser' } as User,
          token: 'mock-token',
          refreshToken: 'mock-refresh-token',
        };

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const userData: RegisterData = {
          username: 'newuser',
          email: 'new@example.com',
          password: 'password123',
          confirmPassword: 'password123',
        };

        await store.dispatch(registerUser(userData));
        const state = store.getState().auth;

        expect(state.user).toEqual(mockResponse.user);
        expect(state.token).toBe('mock-token');
        expect(state.isAuthenticated).toBe(true);
        expect(state.isLoading).toBe(false);
        expect(state.error).toBe(null);
      });

      it('should handle registration failure', async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 400,
        });

        const userData: RegisterData = {
          username: 'existinguser',
          email: 'existing@example.com',
          password: 'password123',
          confirmPassword: 'password123',
        };

        await store.dispatch(registerUser(userData));
        const state = store.getState().auth;

        expect(state.user).toBe(null);
        expect(state.isAuthenticated).toBe(false);
        expect(state.isLoading).toBe(false);
        expect(state.error).toBe('Registration failed');
      });
    });

    describe('refreshAuthToken', () => {
      it('should handle successful token refresh', async () => {
        // Setup initial state with refresh token
        store.dispatch(authSlice.actions.setTokens({
          token: 'old-token',
          refreshToken: 'refresh-token',
        }));

        const mockResponse = {
          token: 'new-token',
          refreshToken: 'new-refresh-token',
        };

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        await store.dispatch(refreshAuthToken());
        const state = store.getState().auth;

        expect(state.token).toBe('new-token');
        expect(state.refreshToken).toBe('new-refresh-token');
      });

      it('should handle token refresh failure and logout user', async () => {
        // Setup initial state
        store.dispatch(authSlice.actions.loginSuccess({
          user: { id: '1', username: 'test' } as User,
          token: 'token',
          refreshToken: 'refresh-token',
        }));

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 401,
        });

        await store.dispatch(refreshAuthToken());
        const state = store.getState().auth;

        expect(state.user).toBe(null);
        expect(state.token).toBe(null);
        expect(state.refreshToken).toBe(null);
        expect(state.isAuthenticated).toBe(false);
        expect(state.error).toBe('Session expired. Please login again.');
      });
    });
  });

  describe('selectors', () => {
    it('should select auth state', () => {
      const state = store.getState();
      const authState = selectAuth(state);
      expect(authState).toEqual(state.auth);
    });

    it('should select user', () => {
      const mockUser = { id: '1', username: 'test' } as User;
      store.dispatch(authSlice.actions.loginSuccess({
        user: mockUser,
        token: 'token',
        refreshToken: 'refresh-token',
      }));

      const state = store.getState();
      const user = selectUser(state);
      expect(user).toEqual(mockUser);
    });

    it('should select isAuthenticated', () => {
      const state = store.getState();
      expect(selectIsAuthenticated(state)).toBe(false);

      store.dispatch(authSlice.actions.loginSuccess({
        user: { id: '1' } as User,
        token: 'token',
        refreshToken: 'refresh-token',
      }));

      const newState = store.getState();
      expect(selectIsAuthenticated(newState)).toBe(true);
    });
  });
});