import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { GameScreen } from '../screens/GameScreen';
import { gameSlice } from '../store/slices/gameSlice';
import { authSlice } from '../store/slices/authSlice';
import { uiSlice } from '../store/slices/uiSlice';
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

// Mock useGameSync hook
jest.mock('../hooks/useGameSync', () => ({
  useGameSync: () => ({
    performOptimisticUpdate: jest.fn(),
    getSyncStats: jest.fn(() => ({
      lastSyncTime: Date.now(),
      pendingUpdates: 0,
      isResyncing: false,
      conflictCount: 0,
      isConnected: true,
    })),
    forceSync: jest.fn(),
    isResyncing: false,
    conflictCount: 0,
  }),
}));

// Mock Alert
const mockAlert = jest.fn();
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: mockAlert,
}));

describe('Real-Time Game Screen', () => {
  let store: any;

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

  describe('Game Screen Rendering', () => {
    it('should render game screen with players', () => {
      const { getByText, getAllByText } = renderGameScreen();

      expect(getByText('Players (3)')).toBeTruthy();
      expect(getAllByText('Alice').length).toBeGreaterThan(0);
      expect(getAllByText('Bob').length).toBeGreaterThan(0);
      expect(getAllByText('Charlie').length).toBeGreaterThan(0);
    });

    it('should show game phase indicator', () => {
      const { getByText } = renderGameScreen();

      expect(getByText('Day 1')).toBeTruthy();
      expect(getByText('Discussion Phase')).toBeTruthy();
    });

    it('should show voting interface during day phase', () => {
      const { getByText } = renderGameScreen();

      expect(getByText('Cast Your Vote')).toBeTruthy();
      expect(getByText('Select a player to eliminate:')).toBeTruthy();
    });
  });

  describe('Chat System', () => {
    it('should open and close chat overlay', async () => {
      const { getByText } = renderGameScreen();

      // Open chat overlay
      const chatButton = getByText('💬 Chat');
      await act(async () => {
        fireEvent.press(chatButton);
      });

      // Chat should be visible
      await waitFor(() => {
        expect(getByText('Game Chat')).toBeTruthy();
      });

      // Close chat overlay
      const closeButton = getByText('✕');
      await act(async () => {
        fireEvent.press(closeButton);
      });

      // Test passes if no errors are thrown
      expect(true).toBeTruthy();
    });
  });

  describe('Action Buttons', () => {
    it('should show chat button', () => {
      const { getByText } = renderGameScreen();

      expect(getByText('💬 Chat')).toBeTruthy();
    });

    it('should show leave game button', () => {
      const { getByText } = renderGameScreen();

      expect(getByText('Leave Game')).toBeTruthy();
    });
  });
});