# Redux State Management Implementation

This directory contains the complete Redux state management implementation for the Mobile Mafia Game, including comprehensive slices, middleware, persistence, and testing.

## Structure

```
src/store/
├── slices/
│   ├── authSlice.ts          # Authentication state management
│   ├── gameSlice.ts          # Game state management
│   ├── uiSlice.ts            # UI state management
│   └── index.ts              # Slice exports
├── middleware/
│   └── socketMiddleware.ts   # Socket.io integration middleware
├── __tests__/
│   ├── authSlice.test.ts     # Auth slice tests
│   ├── gameSlice.test.ts     # Game slice tests
│   ├── uiSlice.test.ts       # UI slice tests
│   ├── socketMiddleware.test.ts # Socket middleware tests
│   ├── persistence.test.ts   # Persistence tests
│   └── basic.test.ts         # Basic integration tests
├── store.ts                  # Store configuration
├── persistence.ts            # Redux Persist configuration
├── index.ts                  # Store exports
└── README.md                 # This file
```

## Features Implemented

### 1. Redux Store Configuration
- **Store Setup**: Configured with Redux Toolkit's `configureStore`
- **Middleware**: Includes Socket.io middleware and Redux Persist
- **DevTools**: Development tools integration with tracing
- **Type Safety**: Full TypeScript support with proper typing

### 2. State Slices

#### Auth Slice (`authSlice.ts`)
- **State**: User authentication, tokens, loading states
- **Actions**: Login, register, logout, token refresh, user updates
- **Async Thunks**: `loginUser`, `registerUser`, `refreshAuthToken`
- **Selectors**: Authentication status, user data, loading states

#### Game Slice (`gameSlice.ts`)
- **State**: Room management, game state, players, voting, chat
- **Actions**: Room operations, game flow, player management, voting
- **Async Thunks**: `createRoom`, `joinRoom`
- **Selectors**: Game state, players, connection status

#### UI Slice (`uiSlice.ts`)
- **State**: Loading, modals, notifications, theme, navigation
- **Actions**: UI state management, settings, performance metrics
- **Features**: Modal management, notification system, theme switching

### 3. Socket.io Middleware
- **Real-time Integration**: Connects Redux actions to Socket.io events
- **Event Handling**: Automatic socket event emission for specific actions
- **Connection Management**: Handles connect/disconnect based on auth state
- **Error Handling**: Graceful error handling for socket operations

### 4. State Persistence
- **AsyncStorage Integration**: Persists state to device storage
- **Selective Persistence**: Configurable whitelist/blacklist per slice
- **Offline Support**: Maintains critical state during offline periods
- **Data Transforms**: Handles Date objects and complex data types
- **Migration Support**: Schema migration system for updates

### 5. Comprehensive Testing
- **Unit Tests**: Complete test coverage for all slices
- **Integration Tests**: Store integration and middleware testing
- **Async Testing**: Async thunk and middleware testing
- **Mock Setup**: Proper mocking for external dependencies

## Usage Examples

### Basic Store Usage
```typescript
import { store, persistor } from './store';
import { loginUser, selectUser } from './slices';

// Dispatch actions
store.dispatch(loginUser({ username: 'user', password: 'pass' }));

// Select state
const user = selectUser(store.getState());
```

### With React Components
```typescript
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, loginUser } from '../store/slices';

function LoginComponent() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  
  const handleLogin = (credentials) => {
    dispatch(loginUser(credentials));
  };
  
  return (
    // Component JSX
  );
}
```

### Persistence Management
```typescript
import { clearPersistedData, getStorageInfo } from './persistence';

// Clear all persisted data
await clearPersistedData();

// Get storage information
const storageInfo = await getStorageInfo();
```

## Configuration

### Store Configuration
The store is configured with:
- **Reducers**: Auth, Game, UI slices with persistence
- **Middleware**: Socket middleware + default middleware
- **DevTools**: Enhanced Redux DevTools in development
- **Serialization**: Custom serialization checks for complex data

### Persistence Configuration
Each slice has its own persistence configuration:
- **Auth**: Persists user data, tokens, authentication state
- **Game**: Persists current player and chat messages only
- **UI**: Persists user preferences and settings

### Socket Middleware Configuration
The middleware handles:
- **Action Mapping**: Maps Redux actions to socket events
- **Connection Management**: Auto-connect/disconnect based on auth
- **Event Listeners**: Sets up comprehensive socket event handling
- **Error Handling**: Graceful error handling and logging

## Testing

### Running Tests
```bash
# Run all store tests
npm test -- --testPathPattern="store/__tests__"

# Run specific test file
npm test -- --testPathPattern="authSlice.test.ts"

# Run with coverage
npm test -- --coverage --testPathPattern="store/__tests__"
```

### Test Coverage
- **Auth Slice**: 100% coverage of actions, reducers, async thunks
- **Game Slice**: Complete coverage of game state management
- **UI Slice**: Full coverage of UI state and settings
- **Middleware**: Socket integration and error handling tests
- **Persistence**: Storage utilities and configuration tests

## Performance Considerations

### Optimizations Implemented
- **Selective Persistence**: Only persists necessary data
- **Memoized Selectors**: Efficient state selection
- **Immutable Updates**: Uses Immer for efficient state updates
- **Connection Pooling**: Efficient socket connection management

### Memory Management
- **State Cleanup**: Proper cleanup on logout/disconnect
- **Event Listener Management**: Prevents memory leaks
- **Storage Limits**: Monitors and manages storage usage

## Security Features

### Data Protection
- **Token Management**: Secure token storage and refresh
- **Input Validation**: Validates all state updates
- **Error Sanitization**: Prevents sensitive data leakage

### Authentication Security
- **Token Expiration**: Automatic token refresh handling
- **Session Management**: Secure session state management
- **Logout Cleanup**: Complete state cleanup on logout

## Future Enhancements

### Planned Features
- **Offline Queue**: Queue actions during offline periods
- **State Synchronization**: Conflict resolution for concurrent updates
- **Performance Monitoring**: Real-time performance metrics
- **Advanced Caching**: Intelligent caching strategies

### Scalability Considerations
- **State Normalization**: Normalized state structure for large datasets
- **Lazy Loading**: Lazy load non-critical state
- **Memory Optimization**: Advanced memory management
- **Background Sync**: Background state synchronization

## Troubleshooting

### Common Issues
1. **Persistence Errors**: Check AsyncStorage permissions
2. **Socket Connection**: Verify authentication token
3. **State Updates**: Ensure proper action dispatching
4. **Type Errors**: Check TypeScript configuration

### Debug Tools
- **Redux DevTools**: State inspection and time travel
- **Console Logging**: Comprehensive logging system
- **Performance Monitoring**: Built-in performance tracking
- **Error Reporting**: Detailed error reporting system

This implementation provides a robust, scalable, and maintainable state management solution for the Mobile Mafia Game, with comprehensive testing and documentation.