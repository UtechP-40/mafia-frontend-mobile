import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { offlineSyncService, OfflineAction } from '../../services/offlineSync';
import { progressiveLoaderService } from '../../services/progressiveLoader';

interface OfflineState {
  isOnline: boolean;
  pendingActions: OfflineAction[];
  syncInProgress: boolean;
  lastSyncTime: number | null;
  offlineData: Record<string, any>;
  conflictResolutions: Array<{
    id: string;
    type: string;
    localData: any;
    remoteData: any;
    resolution: 'local' | 'remote' | 'merged' | 'pending';
    timestamp: number;
  }>;
  syncErrors: Array<{
    id: string;
    action: OfflineAction;
    error: string;
    timestamp: number;
  }>;
  dataLoadingProgress: {
    total: number;
    loaded: number;
    currentBatch: string[];
    failed: string[];
  };
}

const initialState: OfflineState = {
  isOnline: true,
  pendingActions: [],
  syncInProgress: false,
  lastSyncTime: null,
  offlineData: {},
  conflictResolutions: [],
  syncErrors: [],
  dataLoadingProgress: {
    total: 0,
    loaded: 0,
    currentBatch: [],
    failed: [],
  },
};

// Async thunks for offline operations
export const syncOfflineActions = createAsyncThunk(
  'offline/syncActions',
  async (_, { rejectWithValue }) => {
    try {
      await offlineSyncService.syncOfflineActions();
      return { success: true };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Sync failed');
    }
  }
);

export const loadProgressiveData = createAsyncThunk(
  'offline/loadProgressiveData',
  async (requests: Array<{
    id: string;
    type: string;
    endpoint: string;
    priority: { level: 'critical' | 'high' | 'medium' | 'low'; order: number };
    params?: any;
  }>, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setDataLoadingProgress({
        total: requests.length,
        loaded: 0,
        currentBatch: requests.slice(0, 5).map(r => r.id),
        failed: [],
      }));

      const results = await progressiveLoaderService.loadData(requests);
      
      dispatch(setDataLoadingProgress({
        total: requests.length,
        loaded: results.size,
        currentBatch: [],
        failed: [],
      }));

      return Object.fromEntries(results);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Progressive loading failed');
    }
  }
);

export const resolveDataConflict = createAsyncThunk(
  'offline/resolveConflict',
  async (params: {
    conflictId: string;
    resolution: 'local' | 'remote' | 'merged';
    mergedData?: any;
  }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { offline: OfflineState };
      const conflict = state.offline.conflictResolutions.find(c => c.id === params.conflictId);
      
      if (!conflict) {
        throw new Error('Conflict not found');
      }

      let resolvedData;
      switch (params.resolution) {
        case 'local':
          resolvedData = conflict.localData;
          break;
        case 'remote':
          resolvedData = conflict.remoteData;
          break;
        case 'merged':
          resolvedData = params.mergedData || await offlineSyncService.resolveConflict(
            conflict.localData,
            conflict.remoteData,
            conflict.type
          );
          break;
      }

      return {
        conflictId: params.conflictId,
        resolution: params.resolution,
        resolvedData,
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Conflict resolution failed');
    }
  }
);

export const offlineSlice = createSlice({
  name: 'offline',
  initialState,
  reducers: {
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      const wasOffline = !state.isOnline;
      state.isOnline = action.payload;
      
      // If we just came back online, trigger sync
      if (wasOffline && action.payload && state.pendingActions.length > 0) {
        state.syncInProgress = true;
      }
    },

    addPendingAction: (state, action: PayloadAction<Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>>) => {
      const pendingAction: OfflineAction = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        retryCount: 0,
        ...action.payload,
      };
      
      state.pendingActions.push(pendingAction);
    },

    removePendingAction: (state, action: PayloadAction<string>) => {
      state.pendingActions = state.pendingActions.filter(action => action.id !== action.payload);
    },

    updatePendingAction: (state, action: PayloadAction<{ id: string; updates: Partial<OfflineAction> }>) => {
      const actionIndex = state.pendingActions.findIndex(a => a.id === action.payload.id);
      if (actionIndex >= 0) {
        state.pendingActions[actionIndex] = {
          ...state.pendingActions[actionIndex],
          ...action.payload.updates,
        };
      }
    },

    setSyncInProgress: (state, action: PayloadAction<boolean>) => {
      state.syncInProgress = action.payload;
    },

    setLastSyncTime: (state, action: PayloadAction<number>) => {
      state.lastSyncTime = action.payload;
    },

    storeOfflineData: (state, action: PayloadAction<{ key: string; data: any }>) => {
      state.offlineData[action.payload.key] = {
        data: action.payload.data,
        timestamp: Date.now(),
      };
    },

    removeOfflineData: (state, action: PayloadAction<string>) => {
      delete state.offlineData[action.payload];
    },

    addConflictResolution: (state, action: PayloadAction<{
      id: string;
      type: string;
      localData: any;
      remoteData: any;
    }>) => {
      state.conflictResolutions.push({
        ...action.payload,
        resolution: 'pending',
        timestamp: Date.now(),
      });
    },

    updateConflictResolution: (state, action: PayloadAction<{
      id: string;
      resolution: 'local' | 'remote' | 'merged';
    }>) => {
      const conflictIndex = state.conflictResolutions.findIndex(c => c.id === action.payload.id);
      if (conflictIndex >= 0) {
        state.conflictResolutions[conflictIndex].resolution = action.payload.resolution;
      }
    },

    removeConflictResolution: (state, action: PayloadAction<string>) => {
      state.conflictResolutions = state.conflictResolutions.filter(c => c.id !== action.payload);
    },

    addSyncError: (state, action: PayloadAction<{
      action: OfflineAction;
      error: string;
    }>) => {
      state.syncErrors.push({
        id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        action: action.payload.action,
        error: action.payload.error,
        timestamp: Date.now(),
      });

      // Keep only last 50 errors
      if (state.syncErrors.length > 50) {
        state.syncErrors = state.syncErrors.slice(-50);
      }
    },

    clearSyncErrors: (state) => {
      state.syncErrors = [];
    },

    removeSyncError: (state, action: PayloadAction<string>) => {
      state.syncErrors = state.syncErrors.filter(error => error.id !== action.payload);
    },

    setDataLoadingProgress: (state, action: PayloadAction<{
      total: number;
      loaded: number;
      currentBatch: string[];
      failed: string[];
    }>) => {
      state.dataLoadingProgress = action.payload;
    },

    updateDataLoadingProgress: (state, action: PayloadAction<{
      loaded?: number;
      currentBatch?: string[];
      failed?: string[];
    }>) => {
      state.dataLoadingProgress = {
        ...state.dataLoadingProgress,
        ...action.payload,
      };
    },

    resetDataLoadingProgress: (state) => {
      state.dataLoadingProgress = {
        total: 0,
        loaded: 0,
        currentBatch: [],
        failed: [],
      };
    },

    clearOfflineData: (state) => {
      state.offlineData = {};
      state.pendingActions = [];
      state.conflictResolutions = [];
      state.syncErrors = [];
      state.lastSyncTime = null;
    },

    // Action for handling chat messages offline
    queueChatMessage: (state, action: PayloadAction<{
      roomId: string;
      message: string;
      tempId: string;
    }>) => {
      const chatAction: OfflineAction = {
        id: action.payload.tempId,
        type: 'SEND_CHAT_MESSAGE',
        payload: action.payload,
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3,
        priority: 'high',
      };
      
      state.pendingActions.push(chatAction);
    },

    // Action for handling votes offline
    queueVote: (state, action: PayloadAction<{
      gameId: string;
      targetId: string;
      playerId: string;
    }>) => {
      const voteAction: OfflineAction = {
        id: `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'CAST_VOTE',
        payload: action.payload,
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 5,
        priority: 'high',
      };
      
      state.pendingActions.push(voteAction);
    },

    // Action for handling profile updates offline
    queueProfileUpdate: (state, action: PayloadAction<{
      playerId: string;
      updates: any;
    }>) => {
      const profileAction: OfflineAction = {
        id: `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'UPDATE_PLAYER_PROFILE',
        payload: action.payload,
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3,
        priority: 'medium',
      };
      
      state.pendingActions.push(profileAction);
    },
  },

  extraReducers: (builder) => {
    builder
      // Sync offline actions
      .addCase(syncOfflineActions.pending, (state) => {
        state.syncInProgress = true;
      })
      .addCase(syncOfflineActions.fulfilled, (state) => {
        state.syncInProgress = false;
        state.lastSyncTime = Date.now();
        // Clear successfully synced actions
        state.pendingActions = state.pendingActions.filter(action => action.retryCount >= action.maxRetries);
      })
      .addCase(syncOfflineActions.rejected, (state, action) => {
        state.syncInProgress = false;
        state.syncErrors.push({
          id: `sync_error_${Date.now()}`,
          action: { id: 'sync', type: 'SYNC', payload: {}, timestamp: Date.now(), retryCount: 0, maxRetries: 0, priority: 'high' },
          error: action.payload as string,
          timestamp: Date.now(),
        });
      })

      // Load progressive data
      .addCase(loadProgressiveData.pending, (state) => {
        // Progress is handled by the action itself
      })
      .addCase(loadProgressiveData.fulfilled, (state, action) => {
        // Store loaded data
        Object.entries(action.payload).forEach(([key, value]) => {
          state.offlineData[key] = {
            data: value,
            timestamp: Date.now(),
          };
        });
        
        state.dataLoadingProgress = {
          total: 0,
          loaded: 0,
          currentBatch: [],
          failed: [],
        };
      })
      .addCase(loadProgressiveData.rejected, (state, action) => {
        state.syncErrors.push({
          id: `load_error_${Date.now()}`,
          action: { id: 'load', type: 'LOAD_DATA', payload: {}, timestamp: Date.now(), retryCount: 0, maxRetries: 0, priority: 'medium' },
          error: action.payload as string,
          timestamp: Date.now(),
        });
      })

      // Resolve data conflict
      .addCase(resolveDataConflict.fulfilled, (state, action) => {
        const { conflictId, resolution, resolvedData } = action.payload;
        
        // Update conflict resolution
        const conflictIndex = state.conflictResolutions.findIndex(c => c.id === conflictId);
        if (conflictIndex >= 0) {
          state.conflictResolutions[conflictIndex].resolution = resolution;
        }

        // Store resolved data
        state.offlineData[conflictId] = {
          data: resolvedData,
          timestamp: Date.now(),
        };
      })
      .addCase(resolveDataConflict.rejected, (state, action) => {
        state.syncErrors.push({
          id: `conflict_error_${Date.now()}`,
          action: { id: 'conflict', type: 'RESOLVE_CONFLICT', payload: {}, timestamp: Date.now(), retryCount: 0, maxRetries: 0, priority: 'high' },
          error: action.payload as string,
          timestamp: Date.now(),
        });
      });
  },
});

export const {
  setOnlineStatus,
  addPendingAction,
  removePendingAction,
  updatePendingAction,
  setSyncInProgress,
  setLastSyncTime,
  storeOfflineData,
  removeOfflineData,
  addConflictResolution,
  updateConflictResolution,
  removeConflictResolution,
  addSyncError,
  clearSyncErrors,
  removeSyncError,
  setDataLoadingProgress,
  updateDataLoadingProgress,
  resetDataLoadingProgress,
  clearOfflineData,
  queueChatMessage,
  queueVote,
  queueProfileUpdate,
} = offlineSlice.actions;

// Selectors
export const selectOffline = (state: { offline: OfflineState }) => state.offline;
export const selectIsOnline = (state: { offline: OfflineState }) => state.offline.isOnline;
export const selectPendingActions = (state: { offline: OfflineState }) => state.offline.pendingActions;
export const selectSyncInProgress = (state: { offline: OfflineState }) => state.offline.syncInProgress;
export const selectLastSyncTime = (state: { offline: OfflineState }) => state.offline.lastSyncTime;
export const selectOfflineData = (state: { offline: OfflineState }) => state.offline.offlineData;
export const selectConflictResolutions = (state: { offline: OfflineState }) => state.offline.conflictResolutions;
export const selectSyncErrors = (state: { offline: OfflineState }) => state.offline.syncErrors;
export const selectDataLoadingProgress = (state: { offline: OfflineState }) => state.offline.dataLoadingProgress;

// Computed selectors
export const selectPendingActionsCount = (state: { offline: OfflineState }) => 
  state.offline.pendingActions.length;

export const selectHasPendingConflicts = (state: { offline: OfflineState }) => 
  state.offline.conflictResolutions.some(c => c.resolution === 'pending');

export const selectSyncStatus = (state: { offline: OfflineState }) => {
  const { isOnline, syncInProgress, pendingActions, lastSyncTime } = state.offline;
  
  if (!isOnline) return 'offline';
  if (syncInProgress) return 'syncing';
  if (pendingActions.length > 0) return 'pending';
  if (lastSyncTime && Date.now() - lastSyncTime < 60000) return 'synced';
  return 'idle';
};

export default offlineSlice.reducer;