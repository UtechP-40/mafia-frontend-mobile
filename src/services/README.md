# Offline Capability and Sync

This module implements comprehensive offline functionality for the Mobile Mafia Game, allowing users to continue playing and interacting with the app even when network connectivity is poor or unavailable.

## Features

### 1. Offline Mode with Local Data Storage
- **Automatic Network Detection**: Uses `@react-native-community/netinfo` to monitor network status
- **Local Data Persistence**: Stores critical game data locally using AsyncStorage
- **Graceful Degradation**: App continues to function with cached data when offline

### 2. Data Synchronization Logic
- **Automatic Sync**: Syncs pending actions when connection is restored
- **Retry Mechanism**: Implements exponential backoff for failed sync attempts
- **Priority-based Queuing**: High-priority actions (votes, game actions) sync first

### 3. Action Queue System
- **Offline Action Queuing**: Queues user actions when offline for later sync
- **Action Types Supported**:
  - Chat messages
  - Vote casting
  - Profile updates
  - Friend requests
  - Game actions

### 4. Conflict Resolution
- **Automatic Detection**: Detects conflicts between local and remote data
- **Resolution Strategies**:
  - Local wins (for user preferences)
  - Remote wins (for game state)
  - Merge strategy (for statistics)
- **User Intervention**: Allows manual conflict resolution when needed

### 5. Progressive Data Loading
- **Priority-based Loading**: Loads critical data first, then secondary data
- **Batch Processing**: Processes data requests in configurable batches
- **Caching Strategy**: Implements intelligent caching with expiration
- **Prefetching**: Predicts and preloads data based on user behavior

## Architecture

### Services

#### OfflineSyncService (`offlineSync.ts`)
- Manages network status monitoring
- Handles action queuing and synchronization
- Implements conflict resolution logic
- Provides data storage for offline access

#### ProgressiveLoaderService (`progressiveLoader.ts`)
- Manages progressive data loading
- Implements caching strategies
- Handles batch processing and prioritization
- Provides prefetching capabilities

### Redux Integration

#### OfflineSlice (`offlineSlice.ts`)
- Manages offline state in Redux store
- Tracks pending actions, sync status, and conflicts
- Provides selectors for offline-related data

#### OfflineMiddleware (`offlineMiddleware.ts`)
- Intercepts actions and queues them when offline
- Triggers data loading based on user actions
- Handles conflict detection and resolution

### React Hooks

#### useOffline (`useOffline.ts`)
- Primary hook for offline functionality
- Provides sync status, pending actions, and control functions
- Handles conflict resolution UI logic

#### useProgressiveLoader
- Hook for progressive data loading
- Provides loading progress and cached data access
- Handles data invalidation

## Usage Examples

### Basic Offline Detection
```typescript
import { useOffline } from '../hooks/useOffline';

const MyComponent = () => {
  const { isOnline, syncStatus, pendingActionsCount } = useOffline();
  
  return (
    <View>
      <Text>Status: {isOnline ? 'Online' : 'Offline'}</Text>
      <Text>Sync: {syncStatus}</Text>
      {pendingActionsCount > 0 && (
        <Text>{pendingActionsCount} actions pending</Text>
      )}
    </View>
  );
};
```

### Queuing Actions When Offline
```typescript
const { queueAction, isOnline } = useOffline();

const sendMessage = async (message: string) => {
  await queueAction({
    type: 'SEND_CHAT_MESSAGE',
    payload: { roomId: 'room123', message },
    priority: 'high',
    maxRetries: 3,
  });
  
  showNotification(
    isOnline ? 'Message sent!' : 'Message queued for sync'
  );
};
```

### Progressive Data Loading
```typescript
const { loadCriticalData, getCachedData } = useProgressiveLoader();

useEffect(() => {
  loadCriticalData(userId);
}, [userId]);

const userProfile = getCachedData('user_profile');
```

### Conflict Resolution
```typescript
const { conflictResolutions, resolveConflict } = useOffline();

const handleConflict = async (conflictId: string) => {
  await resolveConflict(conflictId, 'local'); // or 'remote', 'merged'
};
```

## Configuration

### Loading Strategy
```typescript
progressiveLoaderService.updateStrategy({
  batchSize: 5,
  maxConcurrent: 3,
  retryAttempts: 3,
  cacheExpiry: 5 * 60 * 1000, // 5 minutes
});
```

### Persistence Configuration
The offline functionality integrates with Redux Persist to store:
- Pending actions for sync
- Cached offline data
- Last sync timestamps

## Testing

### Unit Tests
- `offlineSync.test.ts`: Tests offline sync service functionality
- `progressiveLoader.test.ts`: Tests progressive loading service
- `offlineSlice.test.ts`: Tests Redux slice and selectors
- `useOffline.test.ts`: Tests React hooks

### Integration Testing
Use the `OfflineGameExample` component to test offline functionality:
1. Turn off network connectivity
2. Perform actions (send messages, cast votes)
3. Turn network back on
4. Verify actions sync automatically

## Performance Considerations

### Memory Management
- Limits cached data size and age
- Implements LRU eviction for cache
- Cleans up expired data automatically

### Network Efficiency
- Batches sync requests to reduce network calls
- Implements request deduplication
- Uses compression for large data transfers

### Battery Optimization
- Reduces background sync frequency when battery is low
- Implements smart retry intervals
- Pauses non-critical syncing when device is idle

## Error Handling

### Network Errors
- Automatic retry with exponential backoff
- Graceful fallback to cached data
- User notifications for persistent failures

### Data Conflicts
- Automatic resolution for simple conflicts
- User intervention prompts for complex conflicts
- Audit logging for conflict resolution decisions

### Storage Errors
- Fallback to memory-only mode if storage fails
- Data integrity checks on startup
- Recovery mechanisms for corrupted data

## Security Considerations

### Data Encryption
- Sensitive data encrypted before local storage
- Secure key management for encryption
- Data sanitization before sync

### Authentication
- Token refresh handling during sync
- Secure storage of authentication tokens
- Automatic logout on security violations

## Future Enhancements

### Planned Features
- Peer-to-peer sync for local multiplayer
- Advanced conflict resolution algorithms
- Machine learning for prefetch optimization
- Real-time collaboration features

### Performance Improvements
- WebAssembly for data processing
- Service worker integration
- Advanced caching strategies
- Background sync optimization