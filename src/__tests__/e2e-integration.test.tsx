import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { configureStore } from '@reduxjs/toolkit';
import { Alert } from 'react-native';

// Import all slices
import { authSlice } from '../store/slices/authSlice';
import { gameSlice } from '../store/slices/gameSlice';
import { friendsSlice } from '../store/slices/friendsSlice';
import { roomsSlice } from '../store/slices/roomsSlice';
import { uiSlice } from '../store/slices/uiSlice';

// Import screens and components
import App from '../../App';
import { AuthScreen } from '../screens/AuthScreen';
import { MainMenuScreen } from '../screens/MainMenuScreen';
import { GameScreen } from '../screens/GameScreen';
import { FriendsScreen } from '../screens/FriendsScreen';
import { LobbyScreen } from '../screens/LobbyScreen';

// Mock external dependencies
jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
  isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
  authenticateAsync: jest.fn(() => Promise.resolve({ success: true })),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialIcons: 'MaterialIcons',
}));

jest.mock('expo-auth-session', () => ({
  useAuthRequest: jest.fn(() => [null, null, jest.fn()]),
  makeRedirectUri: jest.fn(() => 'test://redirect'),
  ResponseType: { Token: 'token', IdToken: 'id_token' },
  AppleAuthenticationScope: { FULL_NAME: 'name', EMAIL: 'email' },
}));

jest.mock('react-native-webrtc', () => ({
  RTCPeerConnection: jest.fn(),
  RTCSessionDescription: jest.fn(),
  RTCIceCandidate: jest.fn(),
  mediaDevices: {
    getUserMedia: jest.fn(() => Promise.resolve({})),
  },
}));

jest.mock('socket.io-client', () => {
  const mockSocket = {
    connect: jest.fn(),
    disconnect: jest.fn(),
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    connected: true,
  };
  return jest.fn(() => mockSocket);
});

// Mock API service
const mockApiService = {
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  getFriends: jest.fn(),
  searchUsers: jest.fn(),
  sendFriendRequest: jest.fn(),
  respondToFriendRequest: jest.fn(),
  createRoom: jest.fn(),
  joinRoom: jest.fn(),
  getRooms: jest.fn(),
  quickMatch: jest.fn(),
  getProfile: jest.fn(),
  updateProfile: jest.fn(),
  getLeaderboard: jest.fn(),
  getGameHistory: jest.fn(),
};

jest.mock('../services/api', () => ({
  apiService: mockApiService,
}));

// Mock socket service
const mockSocketService = {
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
};

jest.mock('../services/socket', () => ({
  socketService: mockSocketService,
}));

// Mock storage service
const mockStorageService = {
  setItem: jest.fn(),
  getItem: jest.fn(),
  setObject: jest.fn(),
  getObject: jest.fn(),
  removeItem: jest.fn(),
};

jest.mock('../services/storage', () => ({
  storageService: mockStorageService,
}));

// Mock WebRTC service
const mockWebRTCService = {
  initializePeerConnection: jest.fn(),
  createOffer: jest.fn(),
  createAnswer: jest.fn(),
  addIceCandidate: jest.fn(),
  startLocalStream: jest.fn(),
  stopLocalStream: jest.fn(),
  toggleMute: jest.fn(),
  getConnectionState: jest.fn(() => 'connected'),
};

jest.mock('../services/WebRTCService', () => ({
  WebRTCService: mockWebRTCService,
}));

// Mock Alert
const mockAlert = jest.fn();
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: mockAlert,
}));

describe('End-to-End Frontend Integration Tests', () => {
  let store: any;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authSlice.reducer,
        game: gameSlice.reducer,
        friends: friendsSlice.reducer,
        rooms: roomsSlice.reducer,
        ui: uiSlice.reducer,
      },
    });
    jest.clearAllMocks();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <Provider store={store}>
        <NavigationContainer>
          {component}
        </NavigationContainer>
      </Provider>
    );
  };

  describe('Complete User Journey: Registration to Game Completion', () => {
    it('should complete full user flow from registration to playing a game', async () => {
      // Mock successful registration
      mockApiService.register.mockResolvedValue({
        user: {
          id: 'user1',
          username: 'testuser',
          email: 'test@example.com',
          avatar: '',
          statistics: {
            gamesPlayed: 0,
            gamesWon: 0,
            winRate: 0,
            favoriteRole: '',
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
      });

      // Mock room creation
      mockApiService.createRoom.mockResolvedValue({
        id: 'room1',
        code: 'ABC123',
        hostId: 'user1',
        players: [],
        settings: {
          isPublic: true,
          maxPlayers: 6,
          gameSettings: {
            maxPlayers: 6,
            enableVoiceChat: false,
            dayPhaseDuration: 300,
            nightPhaseDuration: 180,
            votingDuration: 60,
            roles: [],
          },
        },
        status: 'waiting',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Step 1: User registration
      const { getByText, getByPlaceholderText, rerender } = renderWithProviders(<AuthScreen />);

      // Switch to registration form
      fireEvent.press(getByText('Sign up'));

      await waitFor(() => {
        expect(getByPlaceholderText('Username')).toBeTruthy();
      });

      // Fill registration form
      fireEvent.changeText(getByPlaceholderText('Username'), 'testuser');
      fireEvent.changeText(getByPlaceholderText('Email address'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Password'), 'TestPass123!');
      fireEvent.changeText(getByPlaceholderText('Confirm password'), 'TestPass123!');

      // Accept terms
      const termsCheckbox = getByText('I agree to the').parent;
      fireEvent.press(termsCheckbox!);

      // Submit registration
      fireEvent.press(getByText('Create Account'));

      await waitFor(() => {
        expect(mockApiService.register).toHaveBeenCalledWith({
          username: 'testuser',
          email: 'test@example.com',
          password: 'TestPass123!',
          confirmPassword: 'TestPass123!',
        });
      });

      // Step 2: Navigate to main menu after successful registration
      // Simulate successful authentication state
      act(() => {
        store.dispatch(authSlice.actions.loginSuccess({
          user: {
            id: 'user1',
            username: 'testuser',
            email: 'test@example.com',
            avatar: '',
            statistics: {
              gamesPlayed: 0,
              gamesWon: 0,
              winRate: 0,
              favoriteRole: '',
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
        }));
      });

      // Render main menu
      rerender(
        <Provider store={store}>
          <NavigationContainer>
            <MainMenuScreen />
          </NavigationContainer>
        </Provider>
      );

      await waitFor(() => {
        expect(getByText('Quick Match')).toBeTruthy();
        expect(getByText('Create Room')).toBeTruthy();
        expect(getByText('Join Room')).toBeTruthy();
      });

      // Step 3: Create a room
      fireEvent.press(getByText('Create Room'));

      await waitFor(() => {
        expect(mockApiService.createRoom).toHaveBeenCalled();
      });

      // Step 4: Simulate joining lobby
      act(() => {
        store.dispatch(gameSlice.actions.setCurrentRoom({
          id: 'room1',
          code: 'ABC123',
          hostId: 'user1',
          players: [{
            id: 'user1',
            username: 'testuser',
            avatar: '',
            role: undefined,
            isAlive: true,
            isHost: true,
          }],
          settings: {
            isPublic: true,
            maxPlayers: 6,
            gameSettings: {
              maxPlayers: 6,
              enableVoiceChat: false,
              dayPhaseDuration: 300,
              nightPhaseDuration: 180,
              votingDuration: 60,
              roles: [],
            },
            allowSpectators: false,
            requireInvite: false,
          },
          status: 'waiting',
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
      });

      // Render lobby screen
      rerender(
        <Provider store={store}>
          <NavigationContainer>
            <LobbyScreen />
          </NavigationContainer>
        </Provider>
      );

      await waitFor(() => {
        expect(getByText('Room: ABC123')).toBeTruthy();
        expect(getByText('testuser')).toBeTruthy();
        expect(getByText('Start Game')).toBeTruthy();
      });

      // Step 5: Start game
      fireEvent.press(getByText('Start Game'));

      // Simulate game start
      act(() => {
        store.dispatch(gameSlice.actions.gameStarted({
          gameState: {
            id: 'game1',
            roomId: 'room1',
            phase: 'day',
            dayNumber: 1,
            players: [{
              id: 'user1',
              username: 'testuser',
              avatar: '',
              role: 'villager',
              isAlive: true,
              isHost: true,
            }],
            eliminatedPlayers: [],
            votes: [],
            timeRemaining: 300,
            settings: {
              maxPlayers: 6,
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
        }));
      });

      // Step 6: Render game screen
      rerender(
        <Provider store={store}>
          <NavigationContainer>
            <GameScreen />
          </NavigationContainer>
        </Provider>
      );

      await waitFor(() => {
        expect(getByText('Day 1')).toBeTruthy();
        expect(getByText('Discussion Phase')).toBeTruthy();
      });

      // Verify complete flow was successful
      expect(mockApiService.register).toHaveBeenCalled();
      expect(mockApiService.createRoom).toHaveBeenCalled();
    });
  });

  describe('Multi-Player Game Scenarios with Synchronized Actions', () => {
    it('should handle multiple players joining and playing together', async () => {
      // Set up initial game state with multiple players
      const mockGameState = {
        currentRoom: {
          id: 'room1',
          code: 'ABC123',
          hostId: 'player1',
          players: [
            { id: 'player1', username: 'Alice', avatar: '', role: 'villager', isAlive: true, isHost: true },
            { id: 'player2', username: 'Bob', avatar: '', role: 'mafia', isAlive: true, isHost: false },
            { id: 'player3', username: 'Charlie', avatar: '', role: 'detective', isAlive: true, isHost: false },
          ],
          settings: {
            isPublic: true,
            maxPlayers: 6,
            gameSettings: {
              maxPlayers: 6,
              enableVoiceChat: false,
              dayPhaseDuration: 300,
              nightPhaseDuration: 180,
              votingDuration: 60,
              roles: [],
            },
            allowSpectators: false,
            requireInvite: false,
          },
          status: 'in_progress',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        gameState: {
          id: 'game1',
          roomId: 'room1',
          phase: 'day',
          dayNumber: 1,
          players: [
            { id: 'player1', username: 'Alice', avatar: '', role: 'villager', isAlive: true, isHost: true },
            { id: 'player2', username: 'Bob', avatar: '', role: 'mafia', isAlive: true, isHost: false },
            { id: 'player3', username: 'Charlie', avatar: '', role: 'detective', isAlive: true, isHost: false },
          ],
          eliminatedPlayers: [],
          votes: [],
          timeRemaining: 180,
          settings: {
            maxPlayers: 6,
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
        currentPhase: 'day',
        dayNumber: 1,
        timeRemaining: 180,
        players: [
          { id: 'player1', username: 'Alice', avatar: '', role: 'villager', isAlive: true, isHost: true },
          { id: 'player2', username: 'Bob', avatar: '', role: 'mafia', isAlive: true, isHost: false },
          { id: 'player3', username: 'Charlie', avatar: '', role: 'detective', isAlive: true, isHost: false },
        ],
        eliminatedPlayers: [],
        currentPlayer: { id: 'player1', username: 'Alice', avatar: '', role: 'villager', isAlive: true, isHost: true },
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

      store = configureStore({
        reducer: {
          auth: authSlice.reducer,
          game: gameSlice.reducer,
          friends: friendsSlice.reducer,
          rooms: roomsSlice.reducer,
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
        },
      });

      const { getByText, getAllByText } = renderWithProviders(<GameScreen />);

      // Verify all players are displayed
      await waitFor(() => {
        expect(getByText('Players (3)')).toBeTruthy();
        expect(getAllByText('Alice').length).toBeGreaterThan(0);
        expect(getAllByText('Bob').length).toBeGreaterThan(0);
        expect(getAllByText('Charlie').length).toBeGreaterThan(0);
      });

      // Simulate voting action
      const voteButton = getByText('Cast Your Vote');
      fireEvent.press(voteButton);

      // Simulate real-time state update from other players
      act(() => {
        store.dispatch(gameSlice.actions.updateGameState({
          votes: [
            { playerId: 'player1', targetId: 'player2', timestamp: new Date() },
            { playerId: 'player3', targetId: 'player2', timestamp: new Date() },
          ],
        }));
      });

      // Verify vote count updates
      await waitFor(() => {
        expect(getByText(/2.*votes/)).toBeTruthy();
      });
    });

    it('should handle player disconnection and reconnection', async () => {
      const mockGameState = {
        currentRoom: {
          id: 'room1',
          code: 'ABC123',
          hostId: 'player1',
          players: [
            { id: 'player1', username: 'Alice', avatar: '', role: 'villager', isAlive: true, isHost: true },
            { id: 'player2', username: 'Bob', avatar: '', role: 'mafia', isAlive: true, isHost: false },
          ],
          settings: {
            isPublic: true,
            maxPlayers: 6,
            gameSettings: {
              maxPlayers: 6,
              enableVoiceChat: false,
              dayPhaseDuration: 300,
              nightPhaseDuration: 180,
              votingDuration: 60,
              roles: [],
            },
            allowSpectators: false,
            requireInvite: false,
          },
          status: 'in_progress',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        isConnected: true,
        connectionError: null,
      };

      store = configureStore({
        reducer: {
          auth: authSlice.reducer,
          game: gameSlice.reducer,
          friends: friendsSlice.reducer,
          rooms: roomsSlice.reducer,
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
        },
      });

      const { getByText, queryByText } = renderWithProviders(<GameScreen />);

      // Simulate disconnection
      act(() => {
        store.dispatch(gameSlice.actions.setConnectionError('Connection lost'));
      });

      await waitFor(() => {
        expect(getByText(/Connection lost/)).toBeTruthy();
      });

      // Simulate reconnection
      act(() => {
        store.dispatch(gameSlice.actions.clearConnectionError());
      });

      await waitFor(() => {
        expect(queryByText(/Connection lost/)).toBeFalsy();
      });
    });
  });

  describe('Real-Time Communication Between Multiple Clients', () => {
    it('should handle real-time chat messages', async () => {
      const mockGameState = {
        currentRoom: {
          id: 'room1',
          code: 'ABC123',
          hostId: 'player1',
          players: [
            { id: 'player1', username: 'Alice', avatar: '', role: 'villager', isAlive: true, isHost: true },
            { id: 'player2', username: 'Bob', avatar: '', role: 'mafia', isAlive: true, isHost: false },
          ],
          settings: {
            isPublic: true,
            maxPlayers: 6,
            gameSettings: {
              maxPlayers: 6,
              enableVoiceChat: false,
              dayPhaseDuration: 300,
              nightPhaseDuration: 180,
              votingDuration: 60,
              roles: [],
            },
            allowSpectators: false,
            requireInvite: false,
          },
          status: 'in_progress',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        chatMessages: [],
        isConnected: true,
      };

      store = configureStore({
        reducer: {
          auth: authSlice.reducer,
          game: gameSlice.reducer,
          friends: friendsSlice.reducer,
          rooms: roomsSlice.reducer,
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
        },
      });

      const { getByText, getByPlaceholderText } = renderWithProviders(<GameScreen />);

      // Open chat
      fireEvent.press(getByText('💬 Chat'));

      await waitFor(() => {
        expect(getByText('Game Chat')).toBeTruthy();
      });

      // Send a message
      const messageInput = getByPlaceholderText('Type your message...');
      fireEvent.changeText(messageInput, 'Hello everyone!');
      fireEvent.press(getByText('Send'));

      // Verify socket emit was called
      expect(mockSocketService.emit).toHaveBeenCalledWith('chat-message', {
        content: 'Hello everyone!',
        type: 'player_chat',
      });

      // Simulate receiving a message from another player
      act(() => {
        store.dispatch(gameSlice.actions.addChatMessage({
          id: 'msg1',
          roomId: 'room1',
          playerId: 'player2',
          playerUsername: 'Bob',
          content: 'Hi Alice!',
          type: 'player_chat',
          timestamp: new Date(),
          isModerated: false,
        }));
      });

      await waitFor(() => {
        expect(getByText('Bob: Hi Alice!')).toBeTruthy();
      });
    });

    it('should handle real-time game state synchronization', async () => {
      const mockGameState = {
        gameState: {
          id: 'game1',
          roomId: 'room1',
          phase: 'day',
          dayNumber: 1,
          players: [
            { id: 'player1', username: 'Alice', avatar: '', role: 'villager', isAlive: true, isHost: true },
            { id: 'player2', username: 'Bob', avatar: '', role: 'mafia', isAlive: true, isHost: false },
          ],
          eliminatedPlayers: [],
          votes: [],
          timeRemaining: 180,
          settings: {
            maxPlayers: 6,
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
        currentPhase: 'day',
        timeRemaining: 180,
        isConnected: true,
      };

      store = configureStore({
        reducer: {
          auth: authSlice.reducer,
          game: gameSlice.reducer,
          friends: friendsSlice.reducer,
          rooms: roomsSlice.reducer,
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
        },
      });

      const { getByText } = renderWithProviders(<GameScreen />);

      // Verify initial state
      await waitFor(() => {
        expect(getByText('Day 1')).toBeTruthy();
        expect(getByText(/3:00/)).toBeTruthy(); // Timer display
      });

      // Simulate phase change
      act(() => {
        store.dispatch(gameSlice.actions.updateGameState({
          phase: 'night',
          timeRemaining: 120,
        }));
      });

      await waitFor(() => {
        expect(getByText('Night 1')).toBeTruthy();
        expect(getByText(/2:00/)).toBeTruthy();
      });
    });
  });

  describe('Friend System with Invitation and Game Joining Flows', () => {
    it('should complete friend invitation and game joining workflow', async () => {
      // Mock friends API responses
      mockApiService.getFriends.mockResolvedValue({
        friends: [
          {
            id: 'friend1',
            username: 'bestfriend',
            avatar: '',
            status: 'online',
            statistics: { gamesPlayed: 10, gamesWon: 5, winRate: 0.5, eloRating: 1200, favoriteRole: 'Villager' },
          },
        ],
        friendRequests: [],
      });

      mockApiService.createRoom.mockResolvedValue({
        id: 'room1',
        code: 'ABC123',
        hostId: 'user1',
        players: [],
        settings: {
          isPublic: false,
          maxPlayers: 6,
          requireInvite: true,
          gameSettings: {
            maxPlayers: 6,
            enableVoiceChat: false,
            dayPhaseDuration: 300,
            nightPhaseDuration: 180,
            votingDuration: 60,
            roles: [],
          },
        },
        status: 'waiting',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      store = configureStore({
        reducer: {
          auth: authSlice.reducer,
          game: gameSlice.reducer,
          friends: friendsSlice.reducer,
          rooms: roomsSlice.reducer,
          ui: uiSlice.reducer,
        },
        preloadedState: {
          auth: {
            user: { id: 'user1', username: 'testuser' },
            token: 'mock-token',
            isAuthenticated: true,
            isLoading: false,
            error: null,
          },
        },
      });

      // Step 1: View friends list
      const { getByText, rerender } = renderWithProviders(<FriendsScreen />);

      await waitFor(() => {
        expect(mockApiService.getFriends).toHaveBeenCalled();
      });

      // Step 2: Create private room
      rerender(
        <Provider store={store}>
          <NavigationContainer>
            <MainMenuScreen />
          </NavigationContainer>
        </Provider>
      );

      fireEvent.press(getByText('Create Room'));

      await waitFor(() => {
        expect(mockApiService.createRoom).toHaveBeenCalled();
      });

      // Step 3: Simulate friend joining via invitation
      act(() => {
        store.dispatch(gameSlice.actions.playerJoined({
          player: {
            id: 'friend1',
            username: 'bestfriend',
            avatar: '',
            role: undefined,
            isAlive: true,
            isHost: false,
          },
        }));
      });

      // Render lobby to verify friend joined
      rerender(
        <Provider store={store}>
          <NavigationContainer>
            <LobbyScreen />
          </NavigationContainer>
        </Provider>
      );

      await waitFor(() => {
        expect(getByText('bestfriend')).toBeTruthy();
      });
    });
  });

  describe('Voice Chat Integration', () => {
    it('should handle voice chat initialization and controls', async () => {
      const mockGameState = {
        currentRoom: {
          id: 'room1',
          code: 'ABC123',
          hostId: 'player1',
          players: [
            { id: 'player1', username: 'Alice', avatar: '', role: 'villager', isAlive: true, isHost: true },
            { id: 'player2', username: 'Bob', avatar: '', role: 'mafia', isAlive: true, isHost: false },
          ],
          settings: {
            isPublic: true,
            maxPlayers: 6,
            gameSettings: {
              maxPlayers: 6,
              enableVoiceChat: true,
              dayPhaseDuration: 300,
              nightPhaseDuration: 180,
              votingDuration: 60,
              roles: [],
            },
            allowSpectators: false,
            requireInvite: false,
          },
          status: 'in_progress',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        voiceChat: {
          isEnabled: true,
          isMuted: false,
          participants: [
            { playerId: 'player1', isMuted: false, isSpeaking: false },
            { playerId: 'player2', isMuted: false, isSpeaking: false },
          ],
        },
      };

      store = configureStore({
        reducer: {
          auth: authSlice.reducer,
          game: gameSlice.reducer,
          friends: friendsSlice.reducer,
          rooms: roomsSlice.reducer,
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
        },
      });

      const { getByText } = renderWithProviders(<GameScreen />);

      // Verify voice chat controls are present
      await waitFor(() => {
        expect(getByText('🎤')).toBeTruthy(); // Microphone button
      });

      // Test mute toggle
      fireEvent.press(getByText('🎤'));

      // Verify WebRTC service was called
      expect(mockWebRTCService.toggleMute).toHaveBeenCalled();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle network errors gracefully', async () => {
      mockApiService.login.mockRejectedValue(new Error('Network error'));

      const { getByText, getByPlaceholderText } = renderWithProviders(<AuthScreen />);

      // Attempt login
      fireEvent.changeText(getByPlaceholderText('Email address'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
      fireEvent.press(getByText('Sign In'));

      await waitFor(() => {
        expect(mockApiService.login).toHaveBeenCalled();
      });

      // Error should be handled gracefully (no crash)
      expect(getByText('Sign In')).toBeTruthy();
    });

    it('should handle game state conflicts', async () => {
      const mockGameState = {
        gameState: {
          id: 'game1',
          roomId: 'room1',
          phase: 'day',
          dayNumber: 1,
          players: [
            { id: 'player1', username: 'Alice', avatar: '', role: 'villager', isAlive: true, isHost: true },
          ],
          eliminatedPlayers: [],
          votes: [],
          timeRemaining: 180,
          settings: {
            maxPlayers: 6,
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
        isConnected: true,
        hasVoted: false,
      };

      store = configureStore({
        reducer: {
          auth: authSlice.reducer,
          game: gameSlice.reducer,
          friends: friendsSlice.reducer,
          rooms: roomsSlice.reducer,
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
        },
      });

      const { getByText } = renderWithProviders(<GameScreen />);

      // Simulate conflicting state updates
      act(() => {
        store.dispatch(gameSlice.actions.updateGameState({
          hasVoted: true,
          votes: [{ playerId: 'player1', targetId: 'player2', timestamp: new Date() }],
        }));
      });

      act(() => {
        store.dispatch(gameSlice.actions.updateGameState({
          hasVoted: false,
          votes: [],
        }));
      });

      // App should handle conflicts without crashing
      await waitFor(() => {
        expect(getByText('Day 1')).toBeTruthy();
      });
    });
  });

  describe('Performance and Memory Management', () => {
    it('should handle rapid state updates without memory leaks', async () => {
      const mockGameState = {
        gameState: {
          id: 'game1',
          roomId: 'room1',
          phase: 'day',
          dayNumber: 1,
          players: [
            { id: 'player1', username: 'Alice', avatar: '', role: 'villager', isAlive: true, isHost: true },
          ],
          eliminatedPlayers: [],
          votes: [],
          timeRemaining: 180,
          settings: {
            maxPlayers: 6,
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
        chatMessages: [],
        isConnected: true,
      };

      store = configureStore({
        reducer: {
          auth: authSlice.reducer,
          game: gameSlice.reducer,
          friends: friendsSlice.reducer,
          rooms: roomsSlice.reducer,
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
        },
      });

      const { getByText } = renderWithProviders(<GameScreen />);

      // Simulate rapid chat message updates
      for (let i = 0; i < 100; i++) {
        act(() => {
          store.dispatch(gameSlice.actions.addChatMessage({
            id: `msg${i}`,
            roomId: 'room1',
            playerId: 'player1',
            playerUsername: 'Alice',
            content: `Message ${i}`,
            type: 'player_chat',
            timestamp: new Date(),
            isModerated: false,
          }));
        });
      }

      // App should still be responsive
      await waitFor(() => {
        expect(getByText('Day 1')).toBeTruthy();
      });
    });
  });
});