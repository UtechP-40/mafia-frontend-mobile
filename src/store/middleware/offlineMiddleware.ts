import { Middleware } from '@reduxjs/toolkit';
import { offlineSyncService } from '../../services/offlineSync';
import { progressiveLoaderService } from '../../services/progressiveLoader';
import {
  setOnlineStatus,
  addPendingAction,
  setSyncInProgress,
  setLastSyncTime,
  storeOfflineData,
  addConflictResolution,
  addSyncError,
  queueChatMessage,
  queueVote,
  queueProfileUpdate,
} from '../slices/offlineSlice';
import { addNotification } from '../slices/uiSlice';
import { setConnectionStatus } from '../slices/gameSlice';

// Actions that should be queued when offline
const OFFLINE_QUEUEABLE_ACTIONS = {
  // Chat actions
  'game/addChatMessage': 'SEND_CHAT_MESSAGE',
  'chat/sendMessage': 'SEND_CHAT_MESSAGE',
  
  // Game actions
  'game/castVote': 'CAST_VOTE',
  'game/performAction': 'PERFORM_GAME_ACTION',
  
  // Profile actions
  'auth/updateUser': 'UPDATE_PLAYER_PROFILE',
  'profile/updateProfile': 'UPDATE_PLAYER_PROFILE',
  
  // Social actions
  'friends/sendFriendRequest': 'SEND_FRIEND_REQUEST',
  'friends/removeFriend': 'REMOVE_FRIEND',
  'friends/respondToRequest': 'RESPOND_FRIEND_REQUEST',
} as const;

// Actions that should trigger data loading
const DATA_LOADING_ACTIONS = {
  'auth/loginUser/fulfilled': 'preloadCriticalData',
  'game/joinRoom/fulfilled': 'loadGameData',
  'navigation/navigateToSocial': 'loadSocialData',
} as const;

export const offlineMiddleware: Middleware = (store) => (next) => (action) => {
  const state = store.getState();
  const isOnline = offlineSyncService.getOnlineStatus();
  
  // Update online status in Redux when it changes
  if (action.type === 'network/statusChanged') {
    store.dispatch(setOnlineStatus(action.payload.isOnline));
    store.dispatch(setConnectionStatus(action.payload.isOnline));
    
    if (action.payload.isOnline) {
      // Connection restored - trigger sync
      store.dispatch(setSyncInProgress(true));
      offlineSyncService.syncOfflineActions()
        .then(() => {
          store.dispatch(setSyncInProgress(false));
          store.dispatch(setLastSyncTime(Date.now()));
        })
        .catch((error) => {
          store.dispatch(setSyncInProgress(false));
          store.dispatch(addSyncError({
            action: { id: 'sync', type: 'SYNC', payload: {}, timestamp: Date.now(), retryCount: 0, maxRetries: 0, priority: 'high' },
            error: error.message,
          }));
        });
    }
  }

  // Handle offline queueable actions
  const queueableActionType = OFFLINE_QUEUEABLE_ACTIONS[action.type as keyof typeof OFFLINE_QUEUEABLE_ACTIONS];
  if (queueableActionType && !isOnline) {
    // Queue the action for later sync
    const priority = getActionPriority(action.type);
    
    store.dispatch(addPendingAction({
      type: queueableActionType,
      payload: action.payload,
      maxRetries: getMaxRetries(queueableActionType),
      priority,
    }));

    // Also queue using the offline sync service
    offlineSyncService.queueAction({
      type: queueableActionType,
      payload: action.payload,
      maxRetries: getMaxRetries(queueableActionType),
      priority,
    });

    // Show offline notification
    store.dispatch(addNotification({
      message: 'Action queued for sync when online',
      type: 'info',
      duration: 3000,
    }));

    // Handle specific offline actions
    handleOfflineAction(action, store);
    
    // Don't proceed with the original action
    return;
  }

  // Handle data loading actions
  const loadingAction = DATA_LOADING_ACTIONS[action.type as keyof typeof DATA_LOADING_ACTIONS];
  if (loadingAction && isOnline) {
    // Trigger progressive data loading
    triggerDataLoading(loadingAction, action.payload, store);
  }

  // Continue with the original action
  const result = next(action);

  // Handle post-action processing
  handlePostAction(action, store, state);

  return result;
};

// Get action priority based on type
function getActionPriority(actionType: string): 'high' | 'medium' | 'low' {
  const highPriorityActions = ['game/castVote', 'game/performAction'];
  const mediumPriorityActions = ['game/addChatMessage', 'chat/sendMessage'];
  
  if (highPriorityActions.includes(actionType)) return 'high';
  if (mediumPriorityActions.includes(actionType)) return 'medium';
  return 'low';
}

// Get max retries based on action type
function getMaxRetries(actionType: string): number {
  const retryMap: Record<string, number> = {
    'CAST_VOTE': 5,
    'PERFORM_GAME_ACTION': 5,
    'SEND_CHAT_MESSAGE': 3,
    'UPDATE_PLAYER_PROFILE': 3,
    'SEND_FRIEND_REQUEST': 2,
    'REMOVE_FRIEND': 2,
    'RESPOND_FRIEND_REQUEST': 2,
  };
  
  return retryMap[actionType] || 3;
}

// Handle specific offline actions
function handleOfflineAction(action: any, store: any): void {
  switch (action.type) {
    case 'game/addChatMessage':
      store.dispatch(queueChatMessage({
        roomId: action.payload.roomId || 'current',
        message: action.payload.content || action.payload.message,
        tempId: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      }));
      break;

    case 'game/castVote':
      store.dispatch(queueVote({
        gameId: action.payload.gameId || 'current',
        targetId: action.payload.targetId,
        playerId: action.payload.playerId || store.getState().auth.user?.id,
      }));
      break;

    case 'auth/updateUser':
      store.dispatch(queueProfileUpdate({
        playerId: action.payload.id || store.getState().auth.user?.id,
        updates: action.payload,
      }));
      break;
  }
}

// Trigger progressive data loading
function triggerDataLoading(loadingType: string, payload: any, store: any): void {
  switch (loadingType) {
    case 'preloadCriticalData':
      const userId = payload.user?.id || store.getState().auth.user?.id;
      if (userId) {
        progressiveLoaderService.preloadCriticalData(userId)
          .then((data) => {
            // Store loaded data in offline slice
            Object.entries(data).forEach(([key, value]) => {
              store.dispatch(storeOfflineData({ key, data: value }));
            });
          })
          .catch((error) => {
            console.warn('Failed to preload critical data:', error);
          });
      }
      break;

    case 'loadGameData':
      const roomId = payload.id || payload.roomId;
      if (roomId) {
        progressiveLoaderService.loadGameData(roomId)
          .then((data) => {
            data.forEach((value, key) => {
              store.dispatch(storeOfflineData({ key, data: value }));
            });
          })
          .catch((error) => {
            console.warn('Failed to load game data:', error);
          });
      }
      break;

    case 'loadSocialData':
      progressiveLoaderService.loadSocialData()
        .then((data) => {
          data.forEach((value, key) => {
            store.dispatch(storeOfflineData({ key, data: value }));
          });
        })
        .catch((error) => {
          console.warn('Failed to load social data:', error);
        });
      break;
  }
}

// Handle post-action processing
function handlePostAction(action: any, store: any, previousState: any): void {
  const currentState = store.getState();
  
  // Detect data conflicts
  if (action.type.endsWith('/fulfilled') && action.meta?.arg) {
    const actionType = action.type.replace('/fulfilled', '');
    detectDataConflicts(actionType, action.payload, previousState, currentState, store);
  }

  // Update offline data cache
  if (shouldCacheAction(action.type)) {
    cacheActionData(action, store);
  }

  // Trigger prefetch based on user behavior
  if (shouldTriggerPrefetch(action.type)) {
    triggerPrefetch(action, currentState, store);
  }
}

// Detect data conflicts between local and remote data
function detectDataConflicts(
  actionType: string,
  remoteData: any,
  previousState: any,
  currentState: any,
  store: any
): void {
  const conflictTypes = ['auth/updateUser', 'game/setGameState', 'friends/updateFriend'];
  
  if (!conflictTypes.some(type => actionType.includes(type))) {
    return;
  }

  const localData = getLocalDataForConflict(actionType, previousState);
  if (localData && hasDataConflict(localData, remoteData)) {
    const conflictId = `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    store.dispatch(addConflictResolution({
      id: conflictId,
      type: actionType,
      localData,
      remoteData,
    }));

    store.dispatch(addNotification({
      message: 'Data conflict detected. Please review and resolve.',
      type: 'warning',
      duration: 10000,
    }));
  }
}

// Get local data for conflict detection
function getLocalDataForConflict(actionType: string, state: any): any {
  switch (actionType) {
    case 'auth/updateUser':
      return state.auth.user;
    case 'game/setGameState':
      return state.game.gameState;
    case 'friends/updateFriend':
      return state.friends.friends;
    default:
      return null;
  }
}

// Check if there's a data conflict
function hasDataConflict(localData: any, remoteData: any): boolean {
  if (!localData || !remoteData) return false;
  
  // Simple conflict detection based on timestamps
  const localTimestamp = localData.updatedAt || localData.lastModified || 0;
  const remoteTimestamp = remoteData.updatedAt || remoteData.lastModified || 0;
  
  // If local data is newer than remote, there might be a conflict
  return localTimestamp > remoteTimestamp;
}

// Check if action data should be cached
function shouldCacheAction(actionType: string): boolean {
  const cacheableActions = [
    'auth/loginUser/fulfilled',
    'friends/getFriends/fulfilled',
    'game/getGameHistory/fulfilled',
    'rooms/getPublicRooms/fulfilled',
  ];
  
  return cacheableActions.includes(actionType);
}

// Cache action data for offline access
function cacheActionData(action: any, store: any): void {
  const cacheKey = getCacheKeyForAction(action.type);
  if (cacheKey && action.payload) {
    store.dispatch(storeOfflineData({
      key: cacheKey,
      data: action.payload,
    }));
    
    // Also store in progressive loader cache
    offlineSyncService.storeOfflineData(cacheKey, action.payload);
  }
}

// Get cache key for action
function getCacheKeyForAction(actionType: string): string | null {
  const keyMap: Record<string, string> = {
    'auth/loginUser/fulfilled': 'user_profile',
    'friends/getFriends/fulfilled': 'friends_list',
    'game/getGameHistory/fulfilled': 'game_history',
    'rooms/getPublicRooms/fulfilled': 'public_rooms',
  };
  
  return keyMap[actionType] || null;
}

// Check if action should trigger prefetch
function shouldTriggerPrefetch(actionType: string): boolean {
  const prefetchTriggers = [
    'navigation/navigate',
    'game/joinRoom/fulfilled',
    'auth/loginUser/fulfilled',
  ];
  
  return prefetchTriggers.some(trigger => actionType.includes(trigger));
}

// Trigger prefetch based on user behavior
function triggerPrefetch(action: any, state: any, store: any): void {
  const userContext = {
    currentScreen: state.ui?.currentScreen || 'unknown',
    recentActions: [], // This would be tracked separately
    preferences: state.ui || {},
  };

  progressiveLoaderService.prefetchData(userContext)
    .catch((error) => {
      console.warn('Prefetch failed:', error);
    });
}

// Helper function to setup offline sync listeners
export function setupOfflineListeners(store: any): void {
  // Listen for network status changes
  offlineSyncService.addSyncListener((isOnline: boolean) => {
    store.dispatch(setOnlineStatus(isOnline));
    store.dispatch(setConnectionStatus(isOnline));
    
    if (isOnline) {
      store.dispatch(addNotification({
        message: 'Connection restored. Syncing...',
        type: 'success',
        duration: 3000,
      }));
    } else {
      store.dispatch(addNotification({
        message: 'Connection lost. Working offline...',
        type: 'warning',
        duration: 5000,
      }));
    }
  });
}

// Helper function to cleanup offline listeners
export function cleanupOfflineListeners(): void {
  // This would remove listeners when the app is unmounted
  // Implementation depends on the specific cleanup needs
}