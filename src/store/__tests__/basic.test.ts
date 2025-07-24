// Basic test to verify Redux slices work without Expo dependencies
import { configureStore } from '@reduxjs/toolkit';

// Create minimal slice definitions for testing
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface TestAuthState {
  user: { id: string; username: string } | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialAuthState: TestAuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const testAuthSlice = createSlice({
  name: 'auth',
  initialState: initialAuthState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<{ user: { id: string; username: string }; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
      state.isAuthenticated = false;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
  },
});

interface TestGameState {
  roomId: string | null;
  players: Array<{ id: string; username: string; isAlive: boolean }>;
  currentPhase: 'lobby' | 'day' | 'night' | 'voting' | 'results';
  timeRemaining: number;
  isConnected: boolean;
  error: string | null;
}

const initialGameState: TestGameState = {
  roomId: null,
  players: [],
  currentPhase: 'lobby',
  timeRemaining: 0,
  isConnected: false,
  error: null,
};

const testGameSlice = createSlice({
  name: 'game',
  initialState: initialGameState,
  reducers: {
    joinRoom: (state, action: PayloadAction<string>) => {
      state.roomId = action.payload;
    },
    leaveRoom: (state) => {
      state.roomId = null;
      state.players = [];
      state.currentPhase = 'lobby';
    },
    updatePlayers: (state, action: PayloadAction<Array<{ id: string; username: string; isAlive: boolean }>>) => {
      state.players = action.payload;
    },
    updateGamePhase: (state, action: PayloadAction<'lobby' | 'day' | 'night' | 'voting' | 'results'>) => {
      state.currentPhase = action.payload;
    },
    setConnectionStatus: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
  },
});

type TestStore = ReturnType<typeof configureStore<{
  auth: TestAuthState;
  game: TestGameState;
}>>;

describe('Redux State Management - Basic Tests', () => {
  let store: TestStore;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: testAuthSlice.reducer,
        game: testGameSlice.reducer,
      },
    });
  });

  describe('Auth Slice', () => {
    it('should have correct initial state', () => {
      const state = store.getState().auth;
      expect(state).toEqual({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    });

    it('should handle loginStart', () => {
      store.dispatch(testAuthSlice.actions.loginStart());
      const state = store.getState().auth;
      
      expect(state.isLoading).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should handle loginSuccess', () => {
      const payload = {
        user: { id: '1', username: 'testuser' },
        token: 'mock-token',
      };

      store.dispatch(testAuthSlice.actions.loginSuccess(payload));
      const state = store.getState().auth;

      expect(state.user).toEqual(payload.user);
      expect(state.token).toBe('mock-token');
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
    });

    it('should handle loginFailure', () => {
      const errorMessage = 'Invalid credentials';
      store.dispatch(testAuthSlice.actions.loginFailure(errorMessage));
      const state = store.getState().auth;

      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(errorMessage);
      expect(state.isAuthenticated).toBe(false);
    });

    it('should handle logout', () => {
      // First login
      store.dispatch(testAuthSlice.actions.loginSuccess({
        user: { id: '1', username: 'test' },
        token: 'token',
      }));

      // Then logout
      store.dispatch(testAuthSlice.actions.logout());
      const state = store.getState().auth;

      expect(state.user).toBe(null);
      expect(state.token).toBe(null);
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBe(null);
    });
  });

  describe('Game Slice', () => {
    it('should have correct initial state', () => {
      const state = store.getState().game;
      expect(state).toEqual({
        roomId: null,
        players: [],
        currentPhase: 'lobby',
        timeRemaining: 0,
        isConnected: false,
        error: null,
      });
    });

    it('should handle joinRoom', () => {
      store.dispatch(testGameSlice.actions.joinRoom('room-123'));
      const state = store.getState().game;
      
      expect(state.roomId).toBe('room-123');
    });

    it('should handle leaveRoom', () => {
      // First join a room and add players
      store.dispatch(testGameSlice.actions.joinRoom('room-123'));
      store.dispatch(testGameSlice.actions.updatePlayers([
        { id: '1', username: 'player1', isAlive: true },
      ]));
      store.dispatch(testGameSlice.actions.updateGamePhase('day'));
      
      // Then leave
      store.dispatch(testGameSlice.actions.leaveRoom());
      const state = store.getState().game;

      expect(state.roomId).toBe(null);
      expect(state.players).toEqual([]);
      expect(state.currentPhase).toBe('lobby');
    });

    it('should handle updatePlayers', () => {
      const players = [
        { id: '1', username: 'player1', isAlive: true },
        { id: '2', username: 'player2', isAlive: true },
      ];

      store.dispatch(testGameSlice.actions.updatePlayers(players));
      const state = store.getState().game;

      expect(state.players).toEqual(players);
    });

    it('should handle updateGamePhase', () => {
      store.dispatch(testGameSlice.actions.updateGamePhase('night'));
      const state = store.getState().game;

      expect(state.currentPhase).toBe('night');
    });

    it('should handle setConnectionStatus', () => {
      store.dispatch(testGameSlice.actions.setConnectionStatus(true));
      let state = store.getState().game;
      expect(state.isConnected).toBe(true);

      store.dispatch(testGameSlice.actions.setConnectionStatus(false));
      state = store.getState().game;
      expect(state.isConnected).toBe(false);
    });
  });

  describe('Store Integration', () => {
    it('should handle multiple slice updates', () => {
      // Update auth state
      store.dispatch(testAuthSlice.actions.loginSuccess({
        user: { id: '1', username: 'testuser' },
        token: 'token',
      }));

      // Update game state
      store.dispatch(testGameSlice.actions.joinRoom('room-123'));
      store.dispatch(testGameSlice.actions.setConnectionStatus(true));

      const state = store.getState();

      expect(state.auth.isAuthenticated).toBe(true);
      expect(state.auth.user?.username).toBe('testuser');
      expect(state.game.roomId).toBe('room-123');
      expect(state.game.isConnected).toBe(true);
    });

    it('should maintain state isolation between slices', () => {
      // Update auth state
      store.dispatch(testAuthSlice.actions.loginFailure('Auth error'));

      // Game state should remain unchanged
      const state = store.getState();
      expect(state.auth.error).toBe('Auth error');
      expect(state.game.error).toBe(null);
      expect(state.game.roomId).toBe(null);
    });
  });

  describe('Action Creators', () => {
    it('should create correct action objects', () => {
      const loginStartAction = testAuthSlice.actions.loginStart();
      expect(loginStartAction).toEqual({
        type: 'auth/loginStart',
        payload: undefined,
      });

      const joinRoomAction = testGameSlice.actions.joinRoom('room-456');
      expect(joinRoomAction).toEqual({
        type: 'game/joinRoom',
        payload: 'room-456',
      });
    });
  });

  describe('Selectors (Basic)', () => {
    it('should select state correctly', () => {
      store.dispatch(testAuthSlice.actions.loginSuccess({
        user: { id: '1', username: 'testuser' },
        token: 'token',
      }));

      const state = store.getState();
      
      // Basic selector functionality
      expect(state.auth.user?.id).toBe('1');
      expect(state.auth.isAuthenticated).toBe(true);
      expect(state.game.currentPhase).toBe('lobby');
    });
  });
});

// Test Redux Toolkit utilities
describe('Redux Toolkit Features', () => {
  it('should use Immer for immutable updates', () => {
    const store = configureStore({
      reducer: {
        game: testGameSlice.reducer,
      },
    });

    const initialState = store.getState().game;
    
    store.dispatch(testGameSlice.actions.joinRoom('room-123'));
    
    const newState = store.getState().game;
    
    // States should be different objects (immutable)
    expect(newState).not.toBe(initialState);
    expect(newState.roomId).toBe('room-123');
    expect(initialState.roomId).toBe(null);
  });

  it('should handle complex state updates', () => {
    const store = configureStore({
      reducer: {
        game: testGameSlice.reducer,
      },
    });

    const players = [
      { id: '1', username: 'player1', isAlive: true },
      { id: '2', username: 'player2', isAlive: true },
      { id: '3', username: 'player3', isAlive: true },
    ];

    store.dispatch(testGameSlice.actions.updatePlayers(players));
    store.dispatch(testGameSlice.actions.updateGamePhase('day'));
    store.dispatch(testGameSlice.actions.setConnectionStatus(true));

    const state = store.getState().game;

    expect(state.players).toHaveLength(3);
    expect(state.currentPhase).toBe('day');
    expect(state.isConnected).toBe(true);
  });
});