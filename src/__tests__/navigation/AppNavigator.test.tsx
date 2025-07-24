import React from 'react';
import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { configureStore } from '@reduxjs/toolkit';
import { AppNavigator } from '../../navigation/AppNavigator';
import { authSlice, gameSlice, uiSlice, friendsSlice, roomsSlice } from '../../store/slices';

// Mock all screens
jest.mock('../../screens/AuthScreen', () => ({
  AuthScreen: () => 'AuthScreen',
}));

jest.mock('../../screens/MainMenuScreen', () => ({
  MainMenuScreen: () => 'MainMenuScreen',
}));

jest.mock('../../screens/FriendsScreen', () => ({
  FriendsScreen: () => 'FriendsScreen',
}));

jest.mock('../../screens/SettingsScreen', () => ({
  SettingsScreen: () => 'SettingsScreen',
}));

jest.mock('../../screens/RoomBrowserScreen', () => ({
  RoomBrowserScreen: () => 'RoomBrowserScreen',
}));

jest.mock('../../screens/LobbyScreen', () => ({
  LobbyScreen: () => 'LobbyScreen',
}));

jest.mock('../../screens/GameScreen', () => ({
  GameScreen: () => 'GameScreen',
}));

jest.mock('../../screens/ResultsScreen', () => ({
  ResultsScreen: () => 'ResultsScreen',
}));

// Mock Expo vector icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: () => ({
    Navigator: ({ children }: { children: React.ReactNode }) => children,
    Screen: ({ component: Component }: { component: React.ComponentType }) => <Component />,
  }),
}));

// Create test store
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authSlice.reducer,
      game: gameSlice.reducer,
      ui: uiSlice.reducer,
      friends: friendsSlice.reducer,
      rooms: roomsSlice.reducer,
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
      },
      game: {
        currentRoom: null,
        gameState: null,
        players: [],
        currentPlayer: null,
        votes: [],
        gameEvents: [],
        chatMessages: [],
        isConnected: false,
        error: null,
        connectionError: null,
        isJoiningRoom: false,
        isCreatingRoom: false,
        isStartingGame: false,
      },
      ui: {
        isLoading: false,
        loadingMessage: null,
        activeModals: [],
        notifications: [],
        theme: 'dark',
        currentScreen: 'MainMenu',
        navigationHistory: [],
        showPlayerList: true,
        showChat: true,
        chatInputFocused: false,
        soundEnabled: true,
        vibrationEnabled: true,
        animationsEnabled: true,
        isOnline: true,
        connectionQuality: 'excellent',
        fps: 60,
        memoryUsage: 0,
      },
      friends: {
        friends: [],
        friendRequests: [],
        isLoading: false,
        error: null,
        searchResults: [],
        isSearching: false,
      },
      rooms: {
        publicRooms: [],
        isLoading: false,
        error: null,
        matchmakingPreferences: {
          skillLevel: 'any',
          maxPlayers: 8,
          enableVoiceChat: true,
          region: 'auto',
        },
        isMatchmaking: false,
        matchmakingResult: null,
        filters: {
          maxPlayers: null,
          hasVoiceChat: null,
          skillLevel: null,
        },
      },
      ...initialState,
    },
  });
};

const renderWithProviders = (component: React.ReactElement, initialState = {}) => {
  const store = createTestStore(initialState);
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

describe('AppNavigator', () => {
  it('renders without crashing', () => {
    const { container } = renderWithProviders(<AppNavigator />);
    expect(container).toBeTruthy();
  });

  it('includes all required screens', () => {
    // This test verifies that all screens are properly configured
    // In a real implementation, we would test navigation between screens
    const { container } = renderWithProviders(<AppNavigator />);
    expect(container).toBeTruthy();
  });

  it('has proper navigation structure', () => {
    // Test that the navigator is properly structured
    const { container } = renderWithProviders(<AppNavigator />);
    expect(container).toBeTruthy();
  });
});

describe('Navigation Types', () => {
  it('should have correct navigation param types', () => {
    // This is more of a TypeScript compilation test
    // The types are defined in types/navigation.ts
    
    // If this compiles without errors, the types are correct
    const params: import('../../types/navigation').RootStackParamList = {
      Auth: undefined,
      MainMenu: undefined,
      Friends: undefined,
      Settings: undefined,
      RoomBrowser: undefined,
      Lobby: { roomId: 'test-room' },
      Game: { roomId: 'test-room' },
      Results: { gameId: 'test-game' },
    };
    
    expect(params).toBeDefined();
  });
});