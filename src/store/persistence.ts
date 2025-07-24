import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistReducer, persistStore, PersistConfig } from 'redux-persist';
import { combineReducers } from '@reduxjs/toolkit';
import { authSlice } from './slices/authSlice';
import { gameSlice } from './slices/gameSlice';
import { uiSlice } from './slices/uiSlice';

// Auth persistence config - persist most auth data
const authPersistConfig: PersistConfig<any> = {
  key: 'auth',
  storage: AsyncStorage,
  whitelist: ['user', 'token', 'refreshToken', 'isAuthenticated', 'lastLoginTime'],
  blacklist: ['isLoading', 'error'], // Don't persist loading states and errors
};

// Game persistence config - only persist certain game data for offline capability
const gamePersistConfig: PersistConfig<any> = {
  key: 'game',
  storage: AsyncStorage,
  whitelist: [
    'currentPlayer', // Keep current player info
    'chatMessages', // Keep chat history for offline viewing
  ],
  blacklist: [
    'currentRoom', // Don't persist room state (should rejoin)
    'gameState', // Don't persist game state (should resync)
    'players', // Don't persist other players (should resync)
    'votes', // Don't persist votes (should resync)
    'isConnected', // Don't persist connection state
    'error', // Don't persist errors
    'connectionError',
    'isJoiningRoom',
    'isCreatingRoom',
    'isStartingGame',
  ],
};

// UI persistence config - persist user preferences and settings
const uiPersistConfig: PersistConfig<any> = {
  key: 'ui',
  storage: AsyncStorage,
  whitelist: [
    'theme',
    'soundEnabled',
    'vibrationEnabled',
    'animationsEnabled',
    'showPlayerList',
    'showChat',
  ],
  blacklist: [
    'isLoading',
    'loadingMessage',
    'activeModals',
    'notifications',
    'currentScreen',
    'navigationHistory',
    'chatInputFocused',
    'isOnline',
    'connectionQuality',
    'fps',
    'memoryUsage',
  ],
};

// Create persisted reducers
const persistedAuthReducer = persistReducer(authPersistConfig, authSlice.reducer);
const persistedGameReducer = persistReducer(gamePersistConfig, gameSlice.reducer);
const persistedUIReducer = persistReducer(uiPersistConfig, uiSlice.reducer);

// Root reducer with persistence
export const rootReducer = combineReducers({
  auth: persistedAuthReducer,
  game: persistedGameReducer,
  ui: persistedUIReducer,
});

// Persistence configuration for the entire store
export const persistConfig: PersistConfig<any> = {
  key: 'root',
  storage: AsyncStorage,
  // We're handling persistence at the slice level, so no whitelist/blacklist here
  whitelist: [], // Empty because we're using slice-level persistence
};

// Helper function to clear all persisted data
export const clearPersistedData = async () => {
  try {
    await AsyncStorage.multiRemove(['persist:auth', 'persist:game', 'persist:ui', 'persist:root']);
    console.log('Persisted data cleared successfully');
  } catch (error) {
    console.error('Failed to clear persisted data:', error);
  }
};

// Helper function to get storage info
export const getStorageInfo = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const persistKeys = keys.filter(key => key.startsWith('persist:'));
    
    const storageInfo = await Promise.all(
      persistKeys.map(async (key) => {
        const value = await AsyncStorage.getItem(key);
        return {
          key,
          size: value ? value.length : 0,
          hasData: !!value,
        };
      })
    );
    
    return storageInfo;
  } catch (error) {
    console.error('Failed to get storage info:', error);
    return [];
  }
};

// Migration function for handling schema changes
export const migrations = {
  // Example migration for version 1
  1: (state: any) => {
    // Handle any data structure changes
    return {
      ...state,
      // Add migration logic here
    };
  },
};

// Transform functions for data serialization/deserialization
export const transforms = [
  // Transform for handling Date objects
  {
    in: (inboundState: any, key: string) => {
      // Convert date strings back to Date objects
      if (key === 'auth' && inboundState.lastLoginTime) {
        return {
          ...inboundState,
          lastLoginTime: new Date(inboundState.lastLoginTime),
        };
      }
      return inboundState;
    },
    out: (outboundState: any, key: string) => {
      // Convert Date objects to strings for storage
      if (key === 'auth' && outboundState.lastLoginTime instanceof Date) {
        return {
          ...outboundState,
          lastLoginTime: outboundState.lastLoginTime.getTime(),
        };
      }
      return outboundState;
    },
  },
];

// Rehydration complete callback
export const onRehydrateComplete = (persistor: any) => {
  console.log('Redux state rehydration complete');
  
  // Perform any post-rehydration logic here
  // For example, validate tokens, check for expired data, etc.
};

// Error handler for persistence
export const onPersistError = (error: Error) => {
  console.error('Redux persistence error:', error);
  
  // Handle persistence errors gracefully
  // Could show user notification, fallback to memory-only mode, etc.
};