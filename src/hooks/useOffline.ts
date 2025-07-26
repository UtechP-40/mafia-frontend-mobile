import { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { offlineSyncService } from '../services/offlineSync';
import { progressiveLoaderService } from '../services/progressiveLoader';
import {
  selectIsOnline,
  selectPendingActions,
  selectSyncInProgress,
  selectLastSyncTime,
  selectOfflineData,
  selectConflictResolutions,
  selectSyncErrors,
  selectDataLoadingProgress,
  selectPendingActionsCount,
  selectHasPendingConflicts,
  selectSyncStatus,
  syncOfflineActions,
  loadProgressiveData,
  resolveDataConflict,
  clearSyncErrors,
  clearOfflineData,
  setOnlineStatus,
} from '../store/slices/offlineSlice';
import { addNotification } from '../store/slices/uiSlice';

export interface UseOfflineReturn {
  // Status
  isOnline: boolean;
  syncStatus: 'offline' | 'syncing' | 'pending' | 'synced' | 'idle';
  syncInProgress: boolean;
  lastSyncTime: number | null;
  
  // Pending actions
  pendingActions: any[];
  pendingActionsCount: number;
  
  // Data
  offlineData: Record<string, any>;
  dataLoadingProgress: {
    total: number;
    loaded: number;
    currentBatch: string[];
    failed: string[];
  };
  
  // Conflicts
  conflictResolutions: any[];
  hasPendingConflicts: boolean;
  
  // Errors
  syncErrors: any[];
  
  // Actions
  syncNow: () => Promise<void>;
  loadData: (requests: any[]) => Promise<void>;
  resolveConflict: (conflictId: string, resolution: 'local' | 'remote' | 'merged', mergedData?: any) => Promise<void>;
  clearErrors: () => void;
  clearAllOfflineData: () => void;
  getOfflineDataByKey: (key: string) => any;
  queueAction: (action: any) => Promise<void>;
}

export const useOffline = (): UseOfflineReturn => {
  const dispatch = useDispatch();
  
  // Selectors
  const isOnline = useSelector(selectIsOnline);
  const syncStatus = useSelector(selectSyncStatus);
  const syncInProgress = useSelector(selectSyncInProgress);
  const lastSyncTime = useSelector(selectLastSyncTime);
  const pendingActions = useSelector(selectPendingActions);
  const pendingActionsCount = useSelector(selectPendingActionsCount);
  const offlineData = useSelector(selectOfflineData);
  const dataLoadingProgress = useSelector(selectDataLoadingProgress);
  const conflictResolutions = useSelector(selectConflictResolutions);
  const hasPendingConflicts = useSelector(selectHasPendingConflicts);
  const syncErrors = useSelector(selectSyncErrors);

  // Initialize offline sync service
  useEffect(() => {
    const handleNetworkChange = (online: boolean) => {
      dispatch(setOnlineStatus(online));
    };

    // Add listener for network changes
    offlineSyncService.addSyncListener(handleNetworkChange);

    // Initial sync status
    dispatch(setOnlineStatus(offlineSyncService.getOnlineStatus()));

    return () => {
      offlineSyncService.removeSyncListener(handleNetworkChange);
    };
  }, [dispatch]);

  // Sync now function
  const syncNow = useCallback(async () => {
    if (!isOnline) {
      dispatch(addNotification({
        message: 'Cannot sync while offline',
        type: 'error',
        duration: 3000,
      }));
      return;
    }

    try {
      await dispatch(syncOfflineActions()).unwrap();
      dispatch(addNotification({
        message: 'Sync completed successfully',
        type: 'success',
        duration: 3000,
      }));
    } catch (error) {
      dispatch(addNotification({
        message: `Sync failed: ${error}`,
        type: 'error',
        duration: 5000,
      }));
    }
  }, [dispatch, isOnline]);

  // Load data function
  const loadData = useCallback(async (requests: Array<{
    id: string;
    type: string;
    endpoint: string;
    priority: { level: 'critical' | 'high' | 'medium' | 'low'; order: number };
    params?: any;
  }>) => {
    try {
      await dispatch(loadProgressiveData(requests)).unwrap();
    } catch (error) {
      dispatch(addNotification({
        message: `Failed to load data: ${error}`,
        type: 'error',
        duration: 5000,
      }));
    }
  }, [dispatch]);

  // Resolve conflict function
  const resolveConflict = useCallback(async (
    conflictId: string,
    resolution: 'local' | 'remote' | 'merged',
    mergedData?: any
  ) => {
    try {
      await dispatch(resolveDataConflict({
        conflictId,
        resolution,
        mergedData,
      })).unwrap();
      
      dispatch(addNotification({
        message: 'Conflict resolved successfully',
        type: 'success',
        duration: 3000,
      }));
    } catch (error) {
      dispatch(addNotification({
        message: `Failed to resolve conflict: ${error}`,
        type: 'error',
        duration: 5000,
      }));
    }
  }, [dispatch]);

  // Clear errors function
  const clearErrors = useCallback(() => {
    dispatch(clearSyncErrors());
  }, [dispatch]);

  // Clear all offline data function
  const clearAllOfflineData = useCallback(() => {
    dispatch(clearOfflineData());
    offlineSyncService.clearOfflineData();
    progressiveLoaderService.clearCache();
    
    dispatch(addNotification({
      message: 'All offline data cleared',
      type: 'info',
      duration: 3000,
    }));
  }, [dispatch]);

  // Get offline data by key function
  const getOfflineDataByKey = useCallback((key: string) => {
    return offlineData[key]?.data || null;
  }, [offlineData]);

  // Queue action function
  const queueAction = useCallback(async (action: {
    type: string;
    payload: any;
    priority?: 'high' | 'medium' | 'low';
    maxRetries?: number;
  }) => {
    await offlineSyncService.queueAction({
      type: action.type,
      payload: action.payload,
      priority: action.priority || 'medium',
      maxRetries: action.maxRetries || 3,
    });

    dispatch(addNotification({
      message: 'Action queued for sync',
      type: 'info',
      duration: 2000,
    }));
  }, [dispatch]);

  return {
    // Status
    isOnline,
    syncStatus,
    syncInProgress,
    lastSyncTime,
    
    // Pending actions
    pendingActions,
    pendingActionsCount,
    
    // Data
    offlineData,
    dataLoadingProgress,
    
    // Conflicts
    conflictResolutions,
    hasPendingConflicts,
    
    // Errors
    syncErrors,
    
    // Actions
    syncNow,
    loadData,
    resolveConflict,
    clearErrors,
    clearAllOfflineData,
    getOfflineDataByKey,
    queueAction,
  };
};

// Hook for progressive data loading
export const useProgressiveLoader = () => {
  const dispatch = useDispatch();
  const dataLoadingProgress = useSelector(selectDataLoadingProgress);
  const offlineData = useSelector(selectOfflineData);

  const loadCriticalData = useCallback(async (userId: string) => {
    const requests = [
      {
        id: 'user_profile',
        type: 'player_profile',
        endpoint: '/players/profile',
        priority: { level: 'critical' as const, order: 1 },
      },
      {
        id: 'user_friends',
        type: 'friends_list',
        endpoint: '/players/friends',
        priority: { level: 'critical' as const, order: 2 },
      },
      {
        id: 'user_achievements',
        type: 'achievements',
        endpoint: '/games/achievements',
        priority: { level: 'high' as const, order: 1 },
      },
    ];

    await dispatch(loadProgressiveData(requests));
  }, [dispatch]);

  const loadGameData = useCallback(async (roomId: string) => {
    const requests = [
      {
        id: 'room_details',
        type: 'room_details',
        endpoint: `/rooms/${roomId}`,
        priority: { level: 'critical' as const, order: 1 },
      },
      {
        id: 'room_players',
        type: 'room_players',
        endpoint: `/rooms/${roomId}/players`,
        priority: { level: 'critical' as const, order: 2 },
      },
      {
        id: 'game_history',
        type: 'game_history',
        endpoint: '/games/history',
        priority: { level: 'medium' as const, order: 1 },
        params: { limit: 10 },
      },
    ];

    await dispatch(loadProgressiveData(requests));
  }, [dispatch]);

  const loadSocialData = useCallback(async () => {
    const requests = [
      {
        id: 'friends_activities',
        type: 'friends_activities',
        endpoint: '/players/friends/activities',
        priority: { level: 'medium' as const, order: 1 },
      },
      {
        id: 'friends_leaderboard',
        type: 'friends_leaderboard',
        endpoint: '/players/friends/leaderboard',
        priority: { level: 'low' as const, order: 1 },
      },
      {
        id: 'public_rooms',
        type: 'public_rooms',
        endpoint: '/rooms/public',
        priority: { level: 'medium' as const, order: 2 },
      },
    ];

    await dispatch(loadProgressiveData(requests));
  }, [dispatch]);

  const getCachedData = useCallback((key: string) => {
    return offlineData[key]?.data || null;
  }, [offlineData]);

  const invalidateCache = useCallback((pattern: string) => {
    progressiveLoaderService.invalidateCache(pattern);
  }, []);

  return {
    dataLoadingProgress,
    loadCriticalData,
    loadGameData,
    loadSocialData,
    getCachedData,
    invalidateCache,
  };
};

// Hook for conflict resolution
export const useConflictResolution = () => {
  const dispatch = useDispatch();
  const conflictResolutions = useSelector(selectConflictResolutions);
  const hasPendingConflicts = useSelector(selectHasPendingConflicts);

  const resolveConflict = useCallback(async (
    conflictId: string,
    resolution: 'local' | 'remote' | 'merged',
    mergedData?: any
  ) => {
    try {
      await dispatch(resolveDataConflict({
        conflictId,
        resolution,
        mergedData,
      })).unwrap();
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }, [dispatch]);

  const getPendingConflicts = useCallback(() => {
    return conflictResolutions.filter(c => c.resolution === 'pending');
  }, [conflictResolutions]);

  const getConflictById = useCallback((id: string) => {
    return conflictResolutions.find(c => c.id === id);
  }, [conflictResolutions]);

  return {
    conflictResolutions,
    hasPendingConflicts,
    resolveConflict,
    getPendingConflicts,
    getConflictById,
  };
};