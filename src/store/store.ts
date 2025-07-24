import { configureStore } from '@reduxjs/toolkit';
import { persistStore, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import { rootReducer, onPersistError } from './persistence';
import { socketMiddleware } from './middleware/socketMiddleware';

// Configure the store with persistence and middleware
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          FLUSH,
          REHYDRATE,
          PAUSE,
          PERSIST,
          PURGE,
          REGISTER,
          // Ignore socket-related actions that may contain non-serializable data
          'game/setGameState',
          'game/addGameEvent',
          'game/addChatMessage',
        ],
        ignoredPaths: [
          // Ignore paths that may contain non-serializable data
          'game.gameState.createdAt',
          'game.gameState.updatedAt',
          'game.gameEvents',
          'game.chatMessages',
          'auth.user.createdAt',
          'auth.user.lastActive',
        ],
      },
      thunk: {
        extraArgument: {
          // Add any extra arguments for thunks here
        },
      },
    }).concat(socketMiddleware),
  devTools: __DEV__ && {
    name: 'Mobile Mafia Game',
    trace: true,
    traceLimit: 25,
  },
});

// Create persistor
export const persistor = persistStore(store, undefined, (error?: any) => {
  if (error) {
    onPersistError(error);
  }
});

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Store utilities
export const getStoreState = () => store.getState();

// Helper function to dispatch actions
export const dispatchAction = (action: any) => store.dispatch(action);

// Helper function to reset the entire store
export const resetStore = () => {
  persistor.purge();
  // Optionally reload the app or reset to initial state
};

// Development helpers
if (__DEV__) {
  // Add store to global scope for debugging
  (global as any).store = store;
  (global as any).persistor = persistor;
}