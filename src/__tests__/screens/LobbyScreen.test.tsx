import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { LobbyScreen } from '../../screens/LobbyScreen';
import { gameSlice } from '../../store/slices/gameSlice';
import { authSlice } from '../../store/slices/authSlice';
import { uiSlice } from '../../store/slices/uiSlice';
import { socketService } from '../../services/socket';
import { Alert } from 'react-native';

// Mock socket service
jest.mock('../../services/socket', () => ({
  socketService: {
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    isConnected: jest.fn(() => true),
  },
}));

const mockSocketService = socketService as jest.Mocked<typeof socketService>;

describe('LobbyScreen', () => {
  let store: any;
  
  const mockRoom = {
    id: 'room-1',
    code: 'ABC123',
    hostId: 'player-1',
    players: [
      {
        id: 'player-1',
        username: 'Host Player',
        avatar: '',
        isAlive: true,
        isHost: true,
      },
      {
        id: 'player-2',
        username: 'Regular Player',
        avatar: '',
        isAlive: true,
        isHost: false,
      },
    ],
    settings: {
      isPublic: true,
      maxPlayers: 8,
      gameSettings: {
        maxPlayers: 8,
        enableVoiceChat: true,
        dayPhaseDuration: 300,
        nightPhaseDuration: 120,
        votingDuration: 60,
        roles: [],
      },
      allowSpectators: false,
      requireInvite: false,
    },
    status: 'waiting' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCurrentPlayer = {
    id: 'player-2',
    username: 'Regular Player',
    avatar: '',
    isAlive: true,
    isHost: false,
  };

  beforeEach(() => {
    store = configureStore({
      reducer: {
        game: gameSlice.reducer,
        auth: authSlice.reducer,
        ui: uiSlice.reducer,
      },
      preloadedState: {
        game: {
          currentRoom: mockRoom,
          players: mockRoom.players,
          currentPlayer: mockCurrentPlayer,
          isHost: false,
          isConnected: true,
          isInGame: false,
          currentPhase: 'lobby' as const,
          dayNumber: 0,
          timeRemaining: 0,
          eliminatedPlayers: [],
          votes: [],
          hasVoted: false,
          votingTarget: null,
          gameEvents: [],
          chatMessages: [],
          isJoiningRoom: false,
          isCreatingRoom: false,
          isStartingGame: false,
          error: null,
          connectionError: null,
          gameState: null,
          roomCode: 'ABC123',
        },
        auth: {
          user: mockCurrentPlayer,
          token: 'mock-token',
          isAuthenticated: true,
          isLoading: false,
          error: null,
        },
        ui: {
          notifications: [],
          isLoading: false,
          theme: 'dark',
        },
      },
    });

    jest.clearAllMocks();
  });

  const renderLobbyScreen = () => {
    return render(
      <Provider store={store}>
        <LobbyScreen />
      </Provider>
    );
  };

  describe('Basic Rendering', () => {
    it('renders lobby screen with room information', () => {
      const { getByText } = renderLobbyScreen();
      
      expect(getByText('Room ABC123')).toBeTruthy();
      expect(getByText('2/8 players • 0 ready')).toBeTruthy();
      expect(getByText('Players')).toBeTruthy();
      expect(getByText('Lobby Chat')).toBeTruthy();
    });

    it('displays all players in the room', () => {
      const { getByText } = renderLobbyScreen();
      
      expect(getByText('Host Player')).toBeTruthy();
      expect(getByText('Regular Player')).toBeTruthy();
    });

    it('shows ready up button for non-host players', () => {
      const { getByText } = renderLobbyScreen();
      
      expect(getByText('Ready Up')).toBeTruthy();
    });

    it('shows leave room button', () => {
      const { getByText } = renderLobbyScreen();
      
      expect(getByText('Leave')).toBeTruthy();
    });
  });

  describe('Host Functionality', () => {
    beforeEach(() => {
      // Set current player as host
      store.dispatch({
        type: 'game/setCurrentPlayer',
        payload: { ...mockCurrentPlayer, id: 'player-1', isHost: true },
      });
      store.dispatch({
        type: 'game/setCurrentRoom',
        payload: { ...mockRoom, hostId: 'player-1' },
      });
    });

    it('shows start game button for host', () => {
      const { getByText } = renderLobbyScreen();
      
      expect(getByText(/Start Game/)).toBeTruthy();
    });

    it('shows room settings section for host', () => {
      const { getByText } = renderLobbyScreen();
      
      expect(getByText('Room Settings')).toBeTruthy();
      expect(getByText('Max Players')).toBeTruthy();
      expect(getByText('Day Phase (seconds)')).toBeTruthy();
      expect(getByText('Night Phase (seconds)')).toBeTruthy();
    });

    it('allows host to update room settings', async () => {
      const { getByText, getByDisplayValue } = renderLobbyScreen();
      
      const maxPlayersInput = getByDisplayValue('8');
      fireEvent.changeText(maxPlayersInput, '10');
      
      const updateButton = getByText('Update Settings');
      fireEvent.press(updateButton);
      
      expect(mockSocketService.emit).toHaveBeenCalledWith('update-room-settings', {
        roomId: 'room-1',
        settings: expect.objectContaining({
          maxPlayers: 10,
        }),
      });
    });

    it('disables start game button when not enough players are ready', () => {
      const { getByText } = renderLobbyScreen();
      
      const startButton = getByText(/Start Game/);
      expect(startButton.props.accessibilityState?.disabled).toBe(true);
    });
  });

  describe('Ready System', () => {
    it('allows player to toggle ready state', async () => {
      const { getByText } = renderLobbyScreen();
      
      const readyButton = getByText('Ready Up');
      fireEvent.press(readyButton);
      
      expect(mockSocketService.emit).toHaveBeenCalledWith('toggle-ready', {
        roomId: 'room-1',
        isReady: true,
      });
    });

    it('updates button text when player becomes ready', async () => {
      const { getByText } = renderLobbyScreen();
      
      const readyButton = getByText('Ready Up');
      fireEvent.press(readyButton);
      
      await waitFor(() => {
        expect(getByText('Not Ready')).toBeTruthy();
      });
    });

    it('updates ready count when players become ready', () => {
      // Simulate player ready state change
      act(() => {
        store.dispatch({
          type: 'game/updatePlayerReady',
          payload: { playerId: 'player-2', isReady: true },
        });
      });

      const { getByText } = renderLobbyScreen();
      expect(getByText('2/8 players • 1 ready')).toBeTruthy();
    });
  });

  describe('Chat Functionality', () => {
    it('displays chat interface', () => {
      const { getByText, getByPlaceholderText } = renderLobbyScreen();
      
      expect(getByText('Lobby Chat')).toBeTruthy();
      expect(getByPlaceholderText('Type a message...')).toBeTruthy();
      expect(getByText('Send')).toBeTruthy();
    });

    it('allows sending chat messages', async () => {
      const { getByText, getByPlaceholderText } = renderLobbyScreen();
      
      const chatInput = getByPlaceholderText('Type a message...');
      const sendButton = getByText('Send');
      
      fireEvent.changeText(chatInput, 'Hello everyone!');
      fireEvent.press(sendButton);
      
      expect(mockSocketService.emit).toHaveBeenCalledWith('lobby-chat-message', {
        roomId: 'room-1',
        message: 'Hello everyone!',
      });
    });

    it('clears input after sending message', async () => {
      const { getByText, getByPlaceholderText } = renderLobbyScreen();
      
      const chatInput = getByPlaceholderText('Type a message...');
      const sendButton = getByText('Send');
      
      fireEvent.changeText(chatInput, 'Test message');
      fireEvent.press(sendButton);
      
      await waitFor(() => {
        expect(chatInput.props.value).toBe('');
      });
    });

    it('disables send button when input is empty', () => {
      const { getByText } = renderLobbyScreen();
      
      const sendButton = getByText('Send');
      expect(sendButton.props.accessibilityState?.disabled).toBe(true);
    });

    it('displays empty chat message when no messages', () => {
      const { getByText } = renderLobbyScreen();
      
      expect(getByText('No messages yet. Say hello!')).toBeTruthy();
    });
  });

  describe('Real-time Updates', () => {
    it('sets up socket listeners on mount', () => {
      renderLobbyScreen();
      
      expect(mockSocketService.on).toHaveBeenCalledWith('player-ready-changed', expect.any(Function));
      expect(mockSocketService.on).toHaveBeenCalledWith('lobby-chat-message', expect.any(Function));
    });

    it('cleans up socket listeners on unmount', () => {
      const { unmount } = renderLobbyScreen();
      
      unmount();
      
      expect(mockSocketService.off).toHaveBeenCalledWith('player-ready-changed');
      expect(mockSocketService.off).toHaveBeenCalledWith('lobby-chat-message');
    });

    it('handles player join animations', async () => {
      const { rerender } = renderLobbyScreen();
      
      // Add a new player
      const newPlayer = {
        id: 'player-3',
        username: 'New Player',
        avatar: '',
        isAlive: true,
        isHost: false,
      };
      
      act(() => {
        store.dispatch({
          type: 'game/addPlayer',
          payload: newPlayer,
        });
      });
      
      rerender(
        <Provider store={store}>
          <LobbyScreen />
        </Provider>
      );
      
      await waitFor(() => {
        expect(store.getState().game.players).toHaveLength(3);
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when game error occurs', () => {
      act(() => {
        store.dispatch({
          type: 'game/setGameError',
          payload: 'Connection failed',
        });
      });

      const { getByText } = renderLobbyScreen();
      expect(getByText('Connection failed')).toBeTruthy();
    });

    it('shows reconnecting message when disconnected', () => {
      act(() => {
        store.dispatch({
          type: 'game/setConnectionStatus',
          payload: false,
        });
      });

      const { getByText } = renderLobbyScreen();
      expect(getByText('Reconnecting to server...')).toBeTruthy();
    });

    it('handles missing room gracefully', () => {
      act(() => {
        store.dispatch({
          type: 'game/leaveRoom',
        });
      });

      const { getByText } = renderLobbyScreen();
      expect(getByText('Room not found')).toBeTruthy();
    });
  });

  describe('Leave Room', () => {
    it('shows confirmation dialog when leaving room', async () => {
      const { Alert } = require('react-native');
      const { getByText } = renderLobbyScreen();
      
      const leaveButton = getByText('Leave');
      fireEvent.press(leaveButton);
      
      expect(Alert.alert).toHaveBeenCalledWith(
        'Leave Room',
        'Are you sure you want to leave this room?',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Cancel' }),
          expect.objectContaining({ text: 'Leave' }),
        ])
      );
    });

    it('emits leave room event when confirmed', async () => {
      const { Alert } = require('react-native');
      const { getByText } = renderLobbyScreen();
      
      // Mock Alert.alert to automatically call the leave callback
      Alert.alert.mockImplementation((title, message, buttons) => {
        const leaveButton = buttons.find((b: any) => b.text === 'Leave');
        if (leaveButton) {
          leaveButton.onPress();
        }
      });
      
      const leaveButton = getByText('Leave');
      fireEvent.press(leaveButton);
      
      expect(mockSocketService.emit).toHaveBeenCalledWith('leave-room', {
        roomId: 'room-1',
      });
    });
  });

  describe('Accessibility', () => {
    it('provides proper accessibility labels', () => {
      const { getByText } = renderLobbyScreen();
      
      const readyButton = getByText('Ready Up');
      expect(readyButton.props.accessible).toBe(true);
      
      const leaveButton = getByText('Leave');
      expect(leaveButton.props.accessible).toBe(true);
    });
  });
});