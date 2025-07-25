import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { GameScreen } from '../screens/GameScreen';
import { gameSlice } from '../store/slices/gameSlice';
import { authSlice } from '../store/slices/authSlice';
import { uiSlice } from '../store/slices/uiSlice';
import { socketService } from '../services/socket';
import { GamePhase, Player } from '../types/game';

// Mock socket service
jest.mock('../services/socket', () => ({
  socketService: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    isConnected: jest.fn(() => true),
    getConnectionState: jest.fn(() => ({
      connected: true,
      reconnectAttempts: 0,
      pendingActions: 0,
      isResyncing: false,
    })),
  },
}));

// Mock useSocket hook
jest.mock('../hooks/useSocket', () => ({
  useSocket: () => ({
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    isConnected: true,
  }),
}));

// Mock Alert
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: {
      alert: jest.fn(),
    },
  };
});

describe('Real-Time Game Screen', () => {
  let store: any;
  let mockSocketEmit: jest.Mock;
  let mockSocketOn: jest.Mock;
  let mockSocketOff: jest.Mock;

  const mockPlayers: Player[] = [
    {
      id: 'player1',
      username: 'Alice',
      avatar: 'avatar1',
      role: 'villager',
      isAlive: true,
      isHost: true,
    },
    {
      id: 'player2',
      username: 'Bob',
      avatar: 'avatar2',
      role: 'mafia',
      isAlive: true,
      isHost: false,
    },
    {
      id: 'player3',
      username: 'Charlie',
      avatar: 'avatar3',
      role: 'detective',
      isAlive: true,
      isHost: false,
    },
  ];

  const mockGameState = {
    currentRoom: {
      id: 'room1',
      code: 'ABC123',
      hostId: 'player1',
      players: mockPlayers,
      settings: {
        isPublic: false,
        maxPlayers: 8,
        gameSettings: {
          maxPlayers: 8,
          enableVoiceChat: false,
          dayPhaseDuration: 300,
          nightPhaseDuration: 180,
          votingDuration: 60,
          roles: [],
        },
        allowSpectators: false,
        requireInvite: false,
      },
      status: 'in_progress' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    gameState: {
      id: 'game1',
      roomId: 'room1',
      phase: 'day' as GamePhase,
      dayNumber: 1,
      players: mockPlayers,
      eliminatedPlayers: [],
      votes: [],
      timeRemaining: 180,
      settings: {
        maxPlayers: 8,
        enableVoiceChat: false,
        dayPhaseDuration: 300,
        nightPhaseDuration: 180,
        votingDuration: 60,
        roles: [],
      },
      history: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    currentPhase: 'day' as GamePhase,
    dayNumber: 1,
    timeRemaining: 180,
    players: mockPlayers,
    eliminatedPlayers: [],
    currentPlayer: mockPlayers[0],
    votes: [],
    hasVoted: false,
    votingTarget: null,
    gameEvents: [],
    chatMessages: [],
    isConnected: true,
    isInGame: true,
    isHost: true,
    isJoiningRoom: false,
    isCreatingRoom: false,
    isStartingGame: false,
    error: null,
    connectionError: null,
    roomCode: 'ABC123',
  };

  beforeEach(() => {
    store = configureStore({
      reducer: {
        game: gameSlice.reducer,
        auth: authSlice.reducer,
        ui: uiSlice.reducer,
      },
      preloadedState: {
        game: mockGameState,
        auth: {
          user: { id: 'player1', username: 'Alice' },
          token: 'mock-token',
          isAuthenticated: true,
          isLoading: false,
          error: null,
        },
        ui: {
          notifications: [],
          theme: 'dark',
          isLoading: false,
        },
      },
    });

    mockSocketEmit = jest.fn();
    mockSocketOn = jest.fn();
    mockSocketOff = jest.fn();

    (socketService.emit as jest.Mock) = mockSocketEmit;
    (socketService.on as jest.Mock) = mockSocketOn;
    (socketService.off as jest.Mock) = mockSocketOff;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderGameScreen = () => {
    return render(
      <Provider store={store}>
        <GameScreen />
      </Provider>
    );
  };

  describe('Socket Integration', () => {
    it('should set up socket listeners on mount', () => {
      renderGameScreen();

      expect(mockSocketOn).toHaveBeenCalledWith('game-state-update', expect.any(Function));
      expect(mockSocketOn).toHaveBeenCalledWith('phase-changed', expect.any(Function));
      expect(mockSocketOn).toHaveBeenCalledWith('votes-updated', expect.any(Function));
      expect(mockSocketOn).toHaveBeenCalledWith('player-eliminated', expect.any(Function));
      expect(mockSocketOn).toHaveBeenCalledWith('game-ended', expect.any(Function));
      expect(mockSocketOn).toHaveBeenCalledWith('chat-message', expect.any(Function));
      expect(mockSocketOn).toHaveBeenCalledWith('system-message', expect.any(Function));
    });

    it('should clean up socket listeners on unmount', () => {
      const { unmount } = renderGameScreen();

      unmount();

      expect(mockSocketOff).toHaveBeenCalledWith('game-state-update');
      expect(mockSocketOff).toHaveBeenCalledWith('phase-changed');
      expect(mockSocketOff).toHaveBeenCalledWith('votes-updated');
      expect(mockSocketOff).toHaveBeenCalledWith('player-eliminated');
      expect(mockSocketOff).toHaveBeenCalledWith('game-ended');
      expect(mockSocketOff).toHaveBeenCalledWith('chat-message');
      expect(mockSocketOff).toHaveBeenCalledWith('system-message');
    });
  });

  describe('Real-Time Game State Updates', () => {
    it('should handle phase changes with animations', async () => {
      const { getByText } = renderGameScreen();

      // Simulate phase change event
      const phaseChangeHandler = mockSocketOn.mock.calls.find(
        call => call[0] === 'phase-changed'
      )?.[1];

      expect(phaseChangeHandler).toBeDefined();

      await act(async () => {
        phaseChangeHandler({
          phase: 'voting',
          timeRemaining: 60,
        });
      });

      // Should update the phase indicator
      await waitFor(() => {
        expect(getByText('Voting Time')).toBeTruthy();
      });
    });

    it('should handle player elimination events', async () => {
      const { getByText } = renderGameScreen();

      const eliminationHandler = mockSocketOn.mock.calls.find(
        call => call[0] === 'player-eliminated'
      )?.[1];

      expect(eliminationHandler).toBeDefined();

      await act(async () => {
        eliminationHandler({
          playerId: 'player2',
          reason: 'voted out',
        });
      });

      // Should show elimination message in chat
      await waitFor(() => {
        expect(getByText(/has been eliminated/)).toBeTruthy();
      });
    });

    it('should handle game end events', async () => {
      const { getByText } = renderGameScreen();

      const gameEndHandler = mockSocketOn.mock.calls.find(
        call => call[0] === 'game-ended'
      )?.[1];

      expect(gameEndHandler).toBeDefined();

      await act(async () => {
        gameEndHandler({
          winner: 'Villagers',
          results: { winningTeam: 'villagers' },
        });
      });

      // Should show game end message
      await waitFor(() => {
        expect(getByText(/Game ended! Winner: Villagers/)).toBeTruthy();
      });
    });
  });

  describe('Voting System', () => {
    it('should emit vote when player votes', async () => {
      // Set up voting phase
      store.dispatch({
        type: 'game/updateGamePhase',
        payload: 'voting',
      });

      const { getByText } = renderGameScreen();

      // Find and press vote button (this would be in the VotingInterface)
      const voteButton = getByText('Confirm Vote');
      
      await act(async () => {
        fireEvent.press(voteButton);
      });

      expect(mockSocketEmit).toHaveBeenCalledWith('cast-vote', expect.objectContaining({
        playerId: 'player1',
        timestamp: expect.any(String),
      }));
    });

    it('should handle real-time vote updates', async () => {
      const { rerender } = renderGameScreen();

      const votesUpdateHandler = mockSocketOn.mock.calls.find(
        call => call[0] === 'votes-updated'
      )?.[1];

      expect(votesUpdateHandler).toBeDefined();

      await act(async () => {
        votesUpdateHandler({
          votes: [
            { playerId: 'player1', targetId: 'player2', timestamp: new Date() },
            { playerId: 'player3', targetId: 'player2', timestamp: new Date() },
          ],
        });
      });

      // Votes should be updated in the store
      const state = store.getState();
      expect(state.game.votes).toHaveLength(2);
    });
  });

  describe('Chat System', () => {
    it('should emit chat messages', async () => {
      const { getByText, getByPlaceholderText } = renderGameScreen();

      // Open chat overlay
      const chatButton = getByText('💬 Chat');
      await act(async () => {
        fireEvent.press(chatButton);
      });

      // Type and send message
      const chatInput = getByPlaceholderText('Type a message...');
      const sendButton = getByText('Send');

      await act(async () => {
        fireEvent.changeText(chatInput, 'Hello everyone!');
        fireEvent.press(sendButton);
      });

      expect(mockSocketEmit).toHaveBeenCalledWith('send-chat-message', expect.objectContaining({
        content: 'Hello everyone!',
        playerId: 'player1',
        playerName: 'Alice',
        type: 'player_chat',
      }));
    });

    it('should handle incoming chat messages', async () => {
      const { getByText } = renderGameScreen();

      const chatMessageHandler = mockSocketOn.mock.calls.find(
        call => call[0] === 'chat-message'
      )?.[1];

      expect(chatMessageHandler).toBeDefined();

      await act(async () => {
        chatMessageHandler({
          message: {
            id: 'msg1',
            content: 'Hello from Bob!',
            playerId: 'player2',
            playerName: 'Bob',
            timestamp: new Date(),
            type: 'player_chat',
          },
        });
      });

      // Open chat to see the message
      const chatButton = getByText('💬 Chat');
      await act(async () => {
        fireEvent.press(chatButton);
      });

      await waitFor(() => {
        expect(getByText('Hello from Bob!')).toBeTruthy();
      });
    });

    it('should handle system messages', async () => {
      const { getByText } = renderGameScreen();

      const systemMessageHandler = mockSocketOn.mock.calls.find(
        call => call[0] === 'system-message'
      )?.[1];

      expect(systemMessageHandler).toBeDefined();

      await act(async () => {
        systemMessageHandler({
          message: 'Game is starting!',
          type: 'important',
        });
      });

      // Open chat to see the system message
      const chatButton = getByText('💬 Chat');
      await act(async () => {
        fireEvent.press(chatButton);
      });

      await waitFor(() => {
        expect(getByText('Game is starting!')).toBeTruthy();
      });
    });
  });

  describe('Connection Management', () => {
    it('should show reconnecting status when disconnected', async () => {
      // Mock disconnected state
      (socketService.isConnected as jest.Mock).mockReturnValue(false);
      
      store.dispatch({
        type: 'game/setConnectionError',
        payload: 'Connection lost',
      });

      const { getByText } = renderGameScreen();

      await waitFor(() => {
        expect(getByText(/Disconnected from game server/)).toBeTruthy();
        expect(getByText('Retry Connection')).toBeTruthy();
      });
    });

    it('should handle reconnection', async () => {
      const { getByText } = renderGameScreen();

      const reconnectHandler = mockSocketOn.mock.calls.find(
        call => call[0] === 'reconnect'
      )?.[1];

      expect(reconnectHandler).toBeDefined();

      await act(async () => {
        reconnectHandler();
      });

      // Should emit sync request
      expect(mockSocketEmit).toHaveBeenCalledWith('request-sync', expect.objectContaining({
        lastSyncTime: expect.any(Number),
      }));
    });
  });

  describe('Conflict Resolution', () => {
    it('should handle sync conflicts', async () => {
      const { getByText } = renderGameScreen();

      const syncConflictHandler = mockSocketOn.mock.calls.find(
        call => call[0] === 'sync-conflict'
      )?.[1];

      expect(syncConflictHandler).toBeDefined();

      const mockServerState = {
        gameState: { ...mockGameState.gameState, dayNumber: 2 },
        votes: [],
      };

      await act(async () => {
        syncConflictHandler({
          serverState: mockServerState,
          clientState: mockGameState,
        });
      });

      // Should log conflict resolution
      expect(console.log).toHaveBeenCalledWith('Sync conflict detected, resolving with server state');
    });
  });

  describe('Phase Transitions', () => {
    it('should animate phase transitions', async () => {
      const { getByText } = renderGameScreen();

      // Mock Animated.timing
      const mockTiming = jest.fn(() => ({
        start: jest.fn(),
      }));
      
      jest.spyOn(require('react-native'), 'Animated').mockImplementation(() => ({
        timing: mockTiming,
        sequence: jest.fn((animations) => ({
          start: jest.fn(),
        })),
        Value: jest.fn(() => ({
          interpolate: jest.fn(),
        })),
      }));

      const phaseChangeHandler = mockSocketOn.mock.calls.find(
        call => call[0] === 'phase-changed'
      )?.[1];

      await act(async () => {
        phaseChangeHandler({
          phase: 'night',
          timeRemaining: 120,
        });
      });

      // Should trigger animation
      expect(mockTiming).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should display game errors', async () => {
      const { Alert } = require('react-native');
      
      store.dispatch({
        type: 'game/setGameError',
        payload: 'Invalid move',
      });

      renderGameScreen();

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Game Error', 'Invalid move', expect.any(Array));
      });
    });

    it('should handle connection errors gracefully', async () => {
      store.dispatch({
        type: 'game/setConnectionError',
        payload: 'Network timeout',
      });

      const { getByText } = renderGameScreen();

      await waitFor(() => {
        expect(getByText(/Reconnecting to game/)).toBeTruthy();
      });
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const renderSpy = jest.fn();
      
      const TestComponent = () => {
        renderSpy();
        return <GameScreen />;
      };

      const { rerender } = render(
        <Provider store={store}>
          <TestComponent />
        </Provider>
      );

      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Trigger a state change that shouldn't affect the component
      store.dispatch({
        type: 'ui/addNotification',
        payload: { message: 'Test', type: 'info' },
      });

      rerender(
        <Provider store={store}>
          <TestComponent />
        </Provider>
      );

      // Should not re-render for unrelated state changes
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });
  });
});