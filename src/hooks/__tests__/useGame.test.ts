import { renderHook, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useGame } from '../useGame';
import { gameSlice } from '../../store/slices/gameSlice';
import { authSlice } from '../../store/slices/authSlice';

// Mock socket service
jest.mock('../../services/socket', () => ({
  socketService: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    joinRoom: jest.fn(),
    leaveRoom: jest.fn(),
    sendMessage: jest.fn(),
    castVote: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    isConnected: jest.fn(() => true),
  },
}));

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      game: gameSlice.reducer,
      auth: authSlice.reducer,
    },
    preloadedState: {
      game: {
        currentRoom: null,
        roomCode: null,
        gameState: null,
        currentPhase: 'lobby',
        dayNumber: 0,
        timeRemaining: 0,
        players: [],
        eliminatedPlayers: [],
        currentPlayer: null,
        votes: [],
        hasVoted: false,
        votingTarget: null,
        gameEvents: [],
        chatMessages: [],
        isConnected: false,
        isInGame: false,
        isHost: false,
        isJoiningRoom: false,
        isCreatingRoom: false,
        isStartingGame: false,
        error: null,
        connectionError: null,
      },
      auth: {
        user: {
          id: 'user-1',
          username: 'testuser',
          email: 'test@example.com',
        },
        token: 'test-token',
        isAuthenticated: true,
        isLoading: false,
        error: null,
      },
      ...initialState,
    },
  });
};

const wrapper = ({ children, store }: any) => (
  <Provider store={store}>{children}</Provider>
);

describe('useGame', () => {
  let store: ReturnType<typeof createMockStore>;
  const mockSocketService = require('../../services/socket').socketService;

  beforeEach(() => {
    store = createMockStore();
    jest.clearAllMocks();
  });

  it('returns initial game state', () => {
    const { result } = renderHook(() => useGame(), {
      wrapper: (props) => wrapper({ ...props, store }),
    });

    expect(result.current.currentRoom).toBeNull();
    expect(result.current.isInGame).toBe(false);
    expect(result.current.isHost).toBe(false);
    expect(result.current.players).toEqual([]);
    expect(result.current.currentPhase).toBe('lobby');
  });

  it('creates a room successfully', async () => {
    const mockRoom = {
      id: 'room-1',
      code: 'ABC123',
      hostId: 'user-1',
      players: [],
      settings: {
        isPublic: true,
        maxPlayers: 8,
        gameSettings: {},
        allowSpectators: false,
        requireInvite: false,
      },
      status: 'waiting',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockRoom),
    });

    const { result } = renderHook(() => useGame(), {
      wrapper: (props) => wrapper({ ...props, store }),
    });

    await act(async () => {
      await result.current.createRoom({
        isPublic: true,
        maxPlayers: 8,
        gameSettings: {},
        allowSpectators: false,
        requireInvite: false,
      });
    });

    expect(result.current.currentRoom).toEqual(mockRoom);
    expect(result.current.roomCode).toBe('ABC123');
    expect(result.current.isHost).toBe(true);
  });

  it('joins a room successfully', async () => {
    const mockRoom = {
      id: 'room-1',
      code: 'ABC123',
      hostId: 'user-2',
      players: [],
      settings: {},
      status: 'waiting',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockRoom),
    });

    const { result } = renderHook(() => useGame(), {
      wrapper: (props) => wrapper({ ...props, store }),
    });

    await act(async () => {
      await result.current.joinRoom('ABC123');
    });

    expect(result.current.currentRoom).toEqual(mockRoom);
    expect(result.current.roomCode).toBe('ABC123');
    expect(result.current.isHost).toBe(false);
    expect(mockSocketService.joinRoom).toHaveBeenCalledWith('ABC123');
  });

  it('leaves a room', () => {
    // Set up room state first
    store = createMockStore({
      game: {
        currentRoom: { id: 'room-1', code: 'ABC123' },
        roomCode: 'ABC123',
        isHost: true,
      },
    });

    const { result } = renderHook(() => useGame(), {
      wrapper: (props) => wrapper({ ...props, store }),
    });

    act(() => {
      result.current.leaveRoom();
    });

    expect(mockSocketService.leaveRoom).toHaveBeenCalledWith('ABC123');
    expect(result.current.currentRoom).toBeNull();
    expect(result.current.roomCode).toBeNull();
  });

  it('starts a game', () => {
    store = createMockStore({
      game: {
        currentRoom: { id: 'room-1', code: 'ABC123' },
        isHost: true,
        players: [
          { id: 'user-1', username: 'player1', isAlive: true, isHost: true },
          { id: 'user-2', username: 'player2', isAlive: true, isHost: false },
        ],
      },
    });

    const { result } = renderHook(() => useGame(), {
      wrapper: (props) => wrapper({ ...props, store }),
    });

    act(() => {
      result.current.startGame();
    });

    expect(result.current.isInGame).toBe(true);
    expect(result.current.currentPhase).toBe('day');
    expect(result.current.dayNumber).toBe(1);
  });

  it('casts a vote', () => {
    store = createMockStore({
      game: {
        currentRoom: { id: 'room-1', code: 'ABC123' },
        isInGame: true,
        currentPhase: 'day',
        currentPlayer: { id: 'user-1', username: 'player1' },
      },
    });

    const { result } = renderHook(() => useGame(), {
      wrapper: (props) => wrapper({ ...props, store }),
    });

    act(() => {
      result.current.castVote('user-2');
    });

    expect(mockSocketService.castVote).toHaveBeenCalledWith({
      targetId: 'user-2',
      roomId: 'room-1',
    });
    expect(result.current.hasVoted).toBe(true);
    expect(result.current.votingTarget).toBe('user-2');
  });

  it('sends chat message', () => {
    store = createMockStore({
      game: {
        currentRoom: { id: 'room-1', code: 'ABC123' },
        currentPlayer: { id: 'user-1', username: 'player1' },
      },
    });

    const { result } = renderHook(() => useGame(), {
      wrapper: (props) => wrapper({ ...props, store }),
    });

    act(() => {
      result.current.sendChatMessage('Hello everyone!');
    });

    expect(mockSocketService.sendMessage).toHaveBeenCalledWith({
      content: 'Hello everyone!',
      roomId: 'room-1',
      playerId: 'user-1',
    });
  });

  it('handles player elimination', () => {
    store = createMockStore({
      game: {
        players: [
          { id: 'user-1', username: 'player1', isAlive: true, isHost: true },
          { id: 'user-2', username: 'player2', isAlive: true, isHost: false },
        ],
      },
    });

    const { result } = renderHook(() => useGame(), {
      wrapper: (props) => wrapper({ ...props, store }),
    });

    act(() => {
      result.current.eliminatePlayer('user-2');
    });

    const eliminatedPlayer = result.current.players.find(p => p.id === 'user-2');
    expect(eliminatedPlayer?.isAlive).toBe(false);
    expect(result.current.eliminatedPlayers).toHaveLength(1);
    expect(result.current.eliminatedPlayers[0].id).toBe('user-2');
  });

  it('updates game phase', () => {
    const { result } = renderHook(() => useGame(), {
      wrapper: (props) => wrapper({ ...props, store }),
    });

    act(() => {
      result.current.updateGamePhase('night');
    });

    expect(result.current.currentPhase).toBe('night');
    expect(result.current.hasVoted).toBe(false);
    expect(result.current.votingTarget).toBeNull();
  });

  it('handles connection status changes', () => {
    const { result } = renderHook(() => useGame(), {
      wrapper: (props) => wrapper({ ...props, store }),
    });

    act(() => {
      result.current.setConnectionStatus(true);
    });

    expect(result.current.isConnected).toBe(true);
    expect(result.current.connectionError).toBeNull();

    act(() => {
      result.current.setConnectionStatus(false);
    });

    expect(result.current.isConnected).toBe(false);
  });

  it('handles game errors', () => {
    const { result } = renderHook(() => useGame(), {
      wrapper: (props) => wrapper({ ...props, store }),
    });

    act(() => {
      result.current.setGameError('Something went wrong');
    });

    expect(result.current.error).toBe('Something went wrong');

    act(() => {
      result.current.clearGameError();
    });

    expect(result.current.error).toBeNull();
  });

  it('resets game state', () => {
    store = createMockStore({
      game: {
        currentRoom: { id: 'room-1', code: 'ABC123' },
        isInGame: true,
        currentPhase: 'night',
        dayNumber: 3,
        players: [
          { id: 'user-1', username: 'player1', role: 'mafia', isAlive: false },
          { id: 'user-2', username: 'player2', role: 'villager', isAlive: true },
        ],
        eliminatedPlayers: [{ id: 'user-1', username: 'player1' }],
        votes: [{ playerId: 'user-2', targetId: 'user-1', timestamp: new Date() }],
        hasVoted: true,
        votingTarget: 'user-1',
        gameEvents: [{ id: 'event-1', type: 'player_eliminated' }],
        chatMessages: [{ id: 'msg-1', content: 'Hello' }],
      },
    });

    const { result } = renderHook(() => useGame(), {
      wrapper: (props) => wrapper({ ...props, store }),
    });

    act(() => {
      result.current.resetGame();
    });

    expect(result.current.isInGame).toBe(false);
    expect(result.current.currentPhase).toBe('lobby');
    expect(result.current.dayNumber).toBe(0);
    expect(result.current.eliminatedPlayers).toEqual([]);
    expect(result.current.votes).toEqual([]);
    expect(result.current.hasVoted).toBe(false);
    expect(result.current.votingTarget).toBeNull();
    expect(result.current.gameEvents).toEqual([]);
    expect(result.current.chatMessages).toEqual([]);

    // Players should remain but be reset
    expect(result.current.players).toHaveLength(2);
    expect(result.current.players[0].role).toBeUndefined();
    expect(result.current.players[0].isAlive).toBe(true);
  });

  it('handles room settings update', () => {
    store = createMockStore({
      game: {
        currentRoom: {
          id: 'room-1',
          settings: {
            isPublic: true,
            maxPlayers: 8,
            allowSpectators: false,
          },
        },
        isHost: true,
      },
    });

    const { result } = renderHook(() => useGame(), {
      wrapper: (props) => wrapper({ ...props, store }),
    });

    act(() => {
      result.current.updateRoomSettings({
        maxPlayers: 10,
        allowSpectators: true,
      });
    });

    expect(result.current.currentRoom?.settings.maxPlayers).toBe(10);
    expect(result.current.currentRoom?.settings.allowSpectators).toBe(true);
    expect(result.current.currentRoom?.settings.isPublic).toBe(true); // Should remain unchanged
  });

  it('handles vote clearing', () => {
    store = createMockStore({
      game: {
        votes: [
          { playerId: 'user-1', targetId: 'user-2', timestamp: new Date() },
          { playerId: 'user-3', targetId: 'user-2', timestamp: new Date() },
        ],
        hasVoted: true,
        votingTarget: 'user-2',
      },
    });

    const { result } = renderHook(() => useGame(), {
      wrapper: (props) => wrapper({ ...props, store }),
    });

    act(() => {
      result.current.clearVotes();
    });

    expect(result.current.votes).toEqual([]);
    expect(result.current.hasVoted).toBe(false);
    expect(result.current.votingTarget).toBeNull();
  });

  it('handles time remaining updates', () => {
    const { result } = renderHook(() => useGame(), {
      wrapper: (props) => wrapper({ ...props, store }),
    });

    act(() => {
      result.current.updateTimeRemaining(120);
    });

    expect(result.current.timeRemaining).toBe(120);
  });

  it('handles day increment', () => {
    store = createMockStore({
      game: {
        dayNumber: 1,
      },
    });

    const { result } = renderHook(() => useGame(), {
      wrapper: (props) => wrapper({ ...props, store }),
    });

    act(() => {
      result.current.incrementDay();
    });

    expect(result.current.dayNumber).toBe(2);
  });

  it('handles game events', () => {
    const { result } = renderHook(() => useGame(), {
      wrapper: (props) => wrapper({ ...props, store }),
    });

    const gameEvent = {
      id: 'event-1',
      type: 'player_join',
      playerId: 'user-1',
      timestamp: new Date(),
    };

    act(() => {
      result.current.addGameEvent(gameEvent);
    });

    expect(result.current.gameEvents).toHaveLength(1);
    expect(result.current.gameEvents[0]).toEqual(gameEvent);
  });

  it('handles chat messages', () => {
    const { result } = renderHook(() => useGame(), {
      wrapper: (props) => wrapper({ ...props, store }),
    });

    const chatMessage = {
      id: 'msg-1',
      playerId: 'user-1',
      content: 'Hello everyone!',
      timestamp: new Date(),
    };

    act(() => {
      result.current.addChatMessage(chatMessage);
    });

    expect(result.current.chatMessages).toHaveLength(1);
    expect(result.current.chatMessages[0]).toEqual(chatMessage);
  });
});