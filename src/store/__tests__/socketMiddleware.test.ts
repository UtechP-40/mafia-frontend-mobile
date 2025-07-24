import { configureStore } from '@reduxjs/toolkit';
import { socketMiddleware } from '../middleware/socketMiddleware';
import { authSlice, loginUser } from '../slices/authSlice';
import { gameSlice } from '../slices/gameSlice';
import { uiSlice } from '../slices/uiSlice';
import { socketService } from '../../services/socket';

// Mock the socket service
jest.mock('../../services/socket', () => ({
  socketService: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    isConnected: jest.fn(),
  },
}));

// Mock fetch for async thunks
global.fetch = jest.fn();

describe('socketMiddleware', () => {
  let store: ReturnType<typeof configureStore>;
  let mockSocketService: jest.Mocked<typeof socketService>;

  beforeEach(() => {
    mockSocketService = socketService as jest.Mocked<typeof socketService>;
    jest.clearAllMocks();

    store = configureStore({
      reducer: {
        auth: authSlice.reducer,
        game: gameSlice.reducer,
        ui: uiSlice.reducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: {
            ignoredActions: ['game/setGameState', 'game/addGameEvent', 'game/addChatMessage'],
          },
        }).concat(socketMiddleware),
    });
  });

  describe('authentication integration', () => {
    it('should connect socket on successful login', async () => {
      const mockAuthResponse = {
        user: { id: '1', username: 'testuser' } as any,
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
      };

      mockSocketService.isConnected.mockReturnValue(false);
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAuthResponse,
      });

      await store.dispatch(loginUser({ username: 'test', password: 'password' }));

      expect(mockSocketService.connect).toHaveBeenCalledWith('mock-token');
    });

    it('should not connect socket if already connected', async () => {
      const mockAuthResponse = {
        user: { id: '1', username: 'testuser' } as any,
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
      };

      mockSocketService.isConnected.mockReturnValue(true);
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAuthResponse,
      });

      await store.dispatch(loginUser({ username: 'test', password: 'password' }));

      expect(mockSocketService.connect).not.toHaveBeenCalled();
    });

    it('should disconnect socket on logout', () => {
      mockSocketService.isConnected.mockReturnValue(true);

      store.dispatch(authSlice.actions.logout());

      expect(mockSocketService.disconnect).toHaveBeenCalled();
    });

    it('should not disconnect socket if not connected', () => {
      mockSocketService.isConnected.mockReturnValue(false);

      store.dispatch(authSlice.actions.logout());

      expect(mockSocketService.disconnect).not.toHaveBeenCalled();
    });
  });

  describe('socket event emission', () => {
    beforeEach(() => {
      mockSocketService.isConnected.mockReturnValue(true);
    });

    it('should emit socket event for castVote action', () => {
      const votePayload = { targetId: 'user-2' };
      store.dispatch(gameSlice.actions.castVote(votePayload));

      expect(mockSocketService.emit).toHaveBeenCalledWith('cast-vote', votePayload);
    });

    it('should emit socket event for startGame action', () => {
      store.dispatch(gameSlice.actions.startGame());

      expect(mockSocketService.emit).toHaveBeenCalledWith('start-game', undefined);
    });

    it('should emit socket event for leaveRoom action', () => {
      store.dispatch(gameSlice.actions.leaveRoom());

      expect(mockSocketService.emit).toHaveBeenCalledWith('leave-room', undefined);
    });

    it('should emit socket event for addChatMessage action', () => {
      const messagePayload = { id: 'msg-1', content: 'Hello', playerId: 'user-1' };
      store.dispatch(gameSlice.actions.addChatMessage(messagePayload));

      expect(mockSocketService.emit).toHaveBeenCalledWith('send-chat-message', messagePayload);
    });

    it('should not emit socket event if not connected', () => {
      mockSocketService.isConnected.mockReturnValue(false);

      store.dispatch(gameSlice.actions.castVote({ targetId: 'user-2' }));

      expect(mockSocketService.emit).not.toHaveBeenCalled();
    });
  });

  describe('socket event listeners setup', () => {
    it('should setup socket listeners on connection', async () => {
      const mockAuthResponse = {
        user: { id: '1', username: 'testuser' } as any,
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
      };

      mockSocketService.isConnected.mockReturnValue(false);
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAuthResponse,
      });

      await store.dispatch(loginUser({ username: 'test', password: 'password' }));

      // Verify that socket listeners are set up
      expect(mockSocketService.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockSocketService.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(mockSocketService.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
      expect(mockSocketService.on).toHaveBeenCalledWith('room-joined', expect.any(Function));
      expect(mockSocketService.on).toHaveBeenCalledWith('player-joined', expect.any(Function));
      expect(mockSocketService.on).toHaveBeenCalledWith('player-left', expect.any(Function));
      expect(mockSocketService.on).toHaveBeenCalledWith('game-started', expect.any(Function));
      expect(mockSocketService.on).toHaveBeenCalledWith('game-state-update', expect.any(Function));
      expect(mockSocketService.on).toHaveBeenCalledWith('phase-changed', expect.any(Function));
      expect(mockSocketService.on).toHaveBeenCalledWith('player-eliminated', expect.any(Function));
      expect(mockSocketService.on).toHaveBeenCalledWith('votes-updated', expect.any(Function));
      expect(mockSocketService.on).toHaveBeenCalledWith('game-ended', expect.any(Function));
      expect(mockSocketService.on).toHaveBeenCalledWith('chat-message', expect.any(Function));
      expect(mockSocketService.on).toHaveBeenCalledWith('system-message', expect.any(Function));
      expect(mockSocketService.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockSocketService.on).toHaveBeenCalledWith('game-error', expect.any(Function));
    });
  });

  describe('error handling', () => {
    it('should handle socket emit errors gracefully', () => {
      mockSocketService.isConnected.mockReturnValue(true);
      mockSocketService.emit.mockImplementation(() => {
        throw new Error('Socket emit failed');
      });

      // Should not throw an error
      expect(() => {
        store.dispatch(gameSlice.actions.castVote({ targetId: 'user-2' }));
      }).not.toThrow();
    });

    it('should log socket emit errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockSocketService.isConnected.mockReturnValue(true);
      mockSocketService.emit.mockImplementation(() => {
        throw new Error('Socket emit failed');
      });

      store.dispatch(gameSlice.actions.castVote({ targetId: 'user-2' }));

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to emit socket event cast-vote:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('action filtering', () => {
    beforeEach(() => {
      mockSocketService.isConnected.mockReturnValue(true);
    });

    it('should only emit socket events for specific actions', () => {
      // This action should not trigger a socket event
      store.dispatch(gameSlice.actions.setConnectionStatus(true));

      expect(mockSocketService.emit).not.toHaveBeenCalled();
    });

    it('should emit socket events for mapped actions only', () => {
      // Test all mapped actions
      store.dispatch(gameSlice.actions.castVote({ targetId: 'user-2' }));
      store.dispatch(gameSlice.actions.startGame());
      store.dispatch(gameSlice.actions.leaveRoom());
      store.dispatch(gameSlice.actions.addChatMessage({ id: 'msg-1', content: 'Hello' }));

      expect(mockSocketService.emit).toHaveBeenCalledTimes(4);
      expect(mockSocketService.emit).toHaveBeenCalledWith('cast-vote', { targetId: 'user-2' });
      expect(mockSocketService.emit).toHaveBeenCalledWith('start-game', undefined);
      expect(mockSocketService.emit).toHaveBeenCalledWith('leave-room', undefined);
      expect(mockSocketService.emit).toHaveBeenCalledWith('send-chat-message', { id: 'msg-1', content: 'Hello' });
    });
  });

  describe('async thunk integration', () => {
    it('should emit socket events for async thunk pending actions', async () => {
      mockSocketService.isConnected.mockReturnValue(true);
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'room-1', code: 'ABC123' }),
      });

      // This should trigger a socket event when the thunk is pending
      await store.dispatch(gameSlice.createRoom({
        isPublic: true,
        maxPlayers: 8,
        gameSettings: {} as any,
        allowSpectators: false,
        requireInvite: false,
      }));

      expect(mockSocketService.emit).toHaveBeenCalledWith('create-room', expect.any(Object));
    });
  });
});