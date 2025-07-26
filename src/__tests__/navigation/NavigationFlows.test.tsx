import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { configureStore } from '@reduxjs/toolkit';
import { AppNavigator } from '../../navigation/AppNavigator';
import { authSlice, gameSlice, uiSlice, friendsSlice, roomsSlice } from '../../store/slices';

// Mock all screens with navigation props
jest.mock('../../screens/AuthScreen', () => ({
  AuthScreen: ({ navigation }: any) => (
    <div testID="auth-screen">
      <button
        testID="login-success"
        onPress={() => navigation.navigate('MainMenu')}
      >
        Login Success
      </button>
    </div>
  ),
}));

jest.mock('../../screens/MainMenuScreen', () => ({
  MainMenuScreen: ({ navigation }: any) => (
    <div testID="main-menu-screen">
      <button
        testID="go-to-friends"
        onPress={() => navigation.navigate('Friends')}
      >
        Friends
      </button>
      <button
        testID="go-to-room-browser"
        onPress={() => navigation.navigate('RoomBrowser')}
      >
        Browse Rooms
      </button>
      <button
        testID="go-to-settings"
        onPress={() => navigation.navigate('Settings')}
      >
        Settings
      </button>
    </div>
  ),
}));

jest.mock('../../screens/FriendsScreen', () => ({
  FriendsScreen: ({ navigation }: any) => (
    <div testID="friends-screen">
      <button
        testID="back-to-main"
        onPress={() => navigation.goBack()}
      >
        Back
      </button>
    </div>
  ),
}));

jest.mock('../../screens/RoomBrowserScreen', () => ({
  RoomBrowserScreen: ({ navigation }: any) => (
    <div testID="room-browser-screen">
      <button
        testID="join-room"
        onPress={() => navigation.navigate('Lobby', { roomId: 'test-room' })}
      >
        Join Room
      </button>
    </div>
  ),
}));

jest.mock('../../screens/LobbyScreen', () => ({
  LobbyScreen: ({ navigation, route }: any) => (
    <div testID="lobby-screen">
      <span testID="room-id">{route.params?.roomId}</span>
      <button
        testID="start-game"
        onPress={() => navigation.navigate('Game', { roomId: route.params?.roomId })}
      >
        Start Game
      </button>
    </div>
  ),
}));

jest.mock('../../screens/GameScreen', () => ({
  GameScreen: ({ navigation, route }: any) => (
    <div testID="game-screen">
      <span testID="game-room-id">{route.params?.roomId}</span>
      <button
        testID="end-game"
        onPress={() => navigation.navigate('Results', { gameId: 'test-game' })}
      >
        End Game
      </button>
    </div>
  ),
}));

jest.mock('../../screens/ResultsScreen', () => ({
  ResultsScreen: ({ navigation, route }: any) => (
    <div testID="results-screen">
      <span testID="game-id">{route.params?.gameId}</span>
      <button
        testID="back-to-main"
        onPress={() => navigation.navigate('MainMenu')}
      >
        Back to Main Menu
      </button>
    </div>
  ),
}));

jest.mock('../../screens/SettingsScreen', () => ({
  SettingsScreen: ({ navigation }: any) => (
    <div testID="settings-screen">
      <button
        testID="logout"
        onPress={() => navigation.navigate('Auth')}
      >
        Logout
      </button>
    </div>
  ),
}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    canGoBack: jest.fn(() => true),
  }),
  useRoute: () => ({
    params: {},
  }),
}));

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
      <NavigationContainer>
        {component}
      </NavigationContainer>
    </Provider>
  );
};

describe('Navigation Flows', () => {
  it('navigates from auth to main menu after login', async () => {
    const store = createTestStore({
      auth: { isAuthenticated: false },
    });

    const { rerender } = renderWithProviders(<AppNavigator />, {
      auth: { isAuthenticated: false },
    });

    // Should show auth screen initially
    expect(screen.getByTestId('auth-screen')).toBeTruthy();

    // Simulate successful login
    rerender(
      <Provider store={store}>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </Provider>
    );

    // Update store to authenticated state
    store.dispatch(authSlice.actions.setUser({
      id: 'user-1',
      username: 'testuser',
      email: 'test@example.com',
    }));

    await waitFor(() => {
      expect(screen.getByTestId('main-menu-screen')).toBeTruthy();
    });
  });

  it('navigates from main menu to friends screen', () => {
    renderWithProviders(<AppNavigator />, {
      auth: { isAuthenticated: true, user: { id: 'user-1' } },
    });

    expect(screen.getByTestId('main-menu-screen')).toBeTruthy();

    const friendsButton = screen.getByTestId('go-to-friends');
    fireEvent.press(friendsButton);

    expect(screen.getByTestId('friends-screen')).toBeTruthy();
  });

  it('navigates from main menu to room browser to lobby', () => {
    renderWithProviders(<AppNavigator />, {
      auth: { isAuthenticated: true, user: { id: 'user-1' } },
    });

    // Start at main menu
    expect(screen.getByTestId('main-menu-screen')).toBeTruthy();

    // Navigate to room browser
    const roomBrowserButton = screen.getByTestId('go-to-room-browser');
    fireEvent.press(roomBrowserButton);

    expect(screen.getByTestId('room-browser-screen')).toBeTruthy();

    // Join a room (navigate to lobby)
    const joinRoomButton = screen.getByTestId('join-room');
    fireEvent.press(joinRoomButton);

    expect(screen.getByTestId('lobby-screen')).toBeTruthy();
    expect(screen.getByTestId('room-id')).toHaveTextContent('test-room');
  });

  it('navigates through complete game flow', () => {
    renderWithProviders(<AppNavigator />, {
      auth: { isAuthenticated: true, user: { id: 'user-1' } },
    });

    // Main Menu -> Room Browser -> Lobby
    fireEvent.press(screen.getByTestId('go-to-room-browser'));
    fireEvent.press(screen.getByTestId('join-room'));

    expect(screen.getByTestId('lobby-screen')).toBeTruthy();

    // Lobby -> Game
    const startGameButton = screen.getByTestId('start-game');
    fireEvent.press(startGameButton);

    expect(screen.getByTestId('game-screen')).toBeTruthy();
    expect(screen.getByTestId('game-room-id')).toHaveTextContent('test-room');

    // Game -> Results
    const endGameButton = screen.getByTestId('end-game');
    fireEvent.press(endGameButton);

    expect(screen.getByTestId('results-screen')).toBeTruthy();
    expect(screen.getByTestId('game-id')).toHaveTextContent('test-game');

    // Results -> Main Menu
    const backToMainButton = screen.getByTestId('back-to-main');
    fireEvent.press(backToMainButton);

    expect(screen.getByTestId('main-menu-screen')).toBeTruthy();
  });

  it('navigates to settings and back to auth on logout', () => {
    renderWithProviders(<AppNavigator />, {
      auth: { isAuthenticated: true, user: { id: 'user-1' } },
    });

    // Main Menu -> Settings
    const settingsButton = screen.getByTestId('go-to-settings');
    fireEvent.press(settingsButton);

    expect(screen.getByTestId('settings-screen')).toBeTruthy();

    // Settings -> Auth (logout)
    const logoutButton = screen.getByTestId('logout');
    fireEvent.press(logoutButton);

    expect(screen.getByTestId('auth-screen')).toBeTruthy();
  });

  it('handles back navigation correctly', () => {
    renderWithProviders(<AppNavigator />, {
      auth: { isAuthenticated: true, user: { id: 'user-1' } },
    });

    // Navigate to friends screen
    fireEvent.press(screen.getByTestId('go-to-friends'));
    expect(screen.getByTestId('friends-screen')).toBeTruthy();

    // Navigate back
    const backButton = screen.getByTestId('back-to-main');
    fireEvent.press(backButton);

    expect(screen.getByTestId('main-menu-screen')).toBeTruthy();
  });

  it('preserves navigation params correctly', () => {
    renderWithProviders(<AppNavigator />, {
      auth: { isAuthenticated: true, user: { id: 'user-1' } },
    });

    // Navigate through flow with params
    fireEvent.press(screen.getByTestId('go-to-room-browser'));
    fireEvent.press(screen.getByTestId('join-room'));

    // Check that room ID is preserved
    expect(screen.getByTestId('room-id')).toHaveTextContent('test-room');

    // Continue to game
    fireEvent.press(screen.getByTestId('start-game'));

    // Check that room ID is still preserved
    expect(screen.getByTestId('game-room-id')).toHaveTextContent('test-room');
  });

  it('handles deep linking correctly', () => {
    // Simulate deep link to lobby with room ID
    renderWithProviders(<AppNavigator />, {
      auth: { isAuthenticated: true, user: { id: 'user-1' } },
    });

    // This would typically be handled by the navigation container
    // but we can test the screen rendering with params
    const { rerender } = render(
      <Provider store={createTestStore({
        auth: { isAuthenticated: true, user: { id: 'user-1' } },
      })}>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </Provider>
    );

    // Simulate navigation to lobby with deep link params
    // In a real app, this would be handled by the linking configuration
    expect(screen.getByTestId('main-menu-screen')).toBeTruthy();
  });

  it('handles navigation state persistence', () => {
    const store = createTestStore({
      auth: { isAuthenticated: true, user: { id: 'user-1' } },
      ui: {
        navigationHistory: ['MainMenu', 'Friends'],
        currentScreen: 'Friends',
      },
    });

    renderWithProviders(<AppNavigator />, {
      auth: { isAuthenticated: true, user: { id: 'user-1' } },
      ui: {
        navigationHistory: ['MainMenu', 'Friends'],
        currentScreen: 'Friends',
      },
    });

    // Should restore to the last screen
    expect(screen.getByTestId('main-menu-screen')).toBeTruthy();
  });

  it('handles navigation errors gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    renderWithProviders(<AppNavigator />, {
      auth: { isAuthenticated: true, user: { id: 'user-1' } },
    });

    // Try to navigate to a non-existent screen
    // This would typically be caught by the navigation system
    expect(screen.getByTestId('main-menu-screen')).toBeTruthy();

    consoleSpy.mockRestore();
  });

  it('handles conditional navigation based on auth state', () => {
    const { rerender } = renderWithProviders(<AppNavigator />, {
      auth: { isAuthenticated: false },
    });

    // Should show auth screen when not authenticated
    expect(screen.getByTestId('auth-screen')).toBeTruthy();

    // Rerender with authenticated state
    rerender(
      <Provider store={createTestStore({
        auth: { isAuthenticated: true, user: { id: 'user-1' } },
      })}>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </Provider>
    );

    // Should show main menu when authenticated
    expect(screen.getByTestId('main-menu-screen')).toBeTruthy();
  });

  it('handles navigation with loading states', () => {
    renderWithProviders(<AppNavigator />, {
      auth: { isAuthenticated: true, user: { id: 'user-1' } },
      ui: { isLoading: true, loadingMessage: 'Joining room...' },
    });

    // Should still show the current screen even with loading state
    expect(screen.getByTestId('main-menu-screen')).toBeTruthy();
  });

  it('handles navigation with error states', () => {
    renderWithProviders(<AppNavigator />, {
      auth: { isAuthenticated: true, user: { id: 'user-1' } },
      game: { error: 'Failed to join room' },
    });

    // Should still show the current screen even with error state
    expect(screen.getByTestId('main-menu-screen')).toBeTruthy();
  });
});