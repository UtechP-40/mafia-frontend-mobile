import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useOffline, useProgressiveLoader, useConflictResolution } from '../useOffline';
import offlineSlice from '../../store/slices/offlineSlice';
import uiSlice from './mocks/uiSlice';
import { offlineSyncService } from '../../services/offlineSync';
import { progressiveLoaderService } from '../../services/progressiveLoader';

// Mock services
jest.mock('../../services/offlineSync');
jest.mock('../../services/progressiveLoader');

const mockOfflineSyncService = offlineSyncService as jest.Mocked<typeof offlineSyncService>;
const mockProgressiveLoaderService = progressiveLoaderService as jest.Mocked<typeof progressiveLoaderService>;

// Create test store
const createTestStore = () => {
  return configureStore({
    reducer: {
      offline: offlineSlice,
      ui: uiSlice,
    },
  });
};

// Wrapper component for hooks
const createWrapper = (store: ReturnType<typeof createTestStore>) => {
  return ({ children }: { children: React.ReactNode }) => {
    return React.createElement(Provider, { store }, children);
  };
};

describe('useOffline', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    jest.clearAllMocks();
    store = createTestStore();
    
    // Mock offline sync service
    mockOfflineSyncService.getOnlineStatus.mockReturnValue(true);
    mockOfflineSyncService.addSyncListener.mockImplementation(() => {});
    mockOfflineSyncService.removeSyncListener.mockImplementation(() => {});
    mockOfflineSyncService.queueAction.mockResolvedValue();
    mockOfflineSyncService.clearOfflineData.mockResolvedValue();
    
    // Mock progressive loader service
    mockProgressiveLoaderService.clearCache.mockResolvedValue();
  });

  it('should return initial offline state', () => {
    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useOffline(), { wrapper });

    expect(result.current.isOnline).toBe(true);
    expect(result.current.syncStatus).toBe('idle');
    expect(result.current.syncInProgress).toBe(false);
    expect(result.current.pendingActionsCount).toBe(0);
    expect(result.current.hasPendingConflicts).toBe(false);
  });

  it('should initialize offline sync service listeners', () => {
    const wrapper = createWrapper(store);
    renderHook(() => useOffline(), { wrapper });

    expect(mockOfflineSyncService.addSyncListener).toHaveBeenCalled();
    expect(mockOfflineSyncService.getOnlineStatus).toHaveBeenCalled();
  });

  it('should cleanup listeners on unmount', () => {
    const wrapper = createWrapper(store);
    const { unmount } = renderHook(() => useOffline(), { wrapper });

    unmount();

    expect(mockOfflineSyncService.removeSyncListener).toHaveBeenCalled();
  });

  it('should sync now when online', async () => {
    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useOffline(), { wrapper });

    await act(async () => {
      await result.current.syncNow();
    });

    // Should have dispatched sync action
    const state = store.getState();
    expect(state.ui.notifications).toHaveLength(1);
    expect(state.ui.notifications[0].message).toContain('Sync completed');
  });

  it('should not sync when offline', async () => {
    // Set offline state
    store.dispatch({ type: 'offline/setOnlineStatus', payload: false });
    
    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useOffline(), { wrapper });

    await act(async () => {
      await result.current.syncNow();
    });

    // Should show error notification
    const state = store.getState();
    expect(state.ui.notifications).toHaveLength(1);
    expect(state.ui.notifications[0].message).toContain('Cannot sync while offline');
    expect(state.ui.notifications[0].type).toBe('error');
  });

  it('should load data progressively', async () => {
    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useOffline(), { wrapper });

    const requests = [
      {
        id: 'test_data',
        type: 'test',
        endpoint: '/test',
        priority: { level: 'high' as const, order: 1 },
      },
    ];

    await act(async () => {
      await result.current.loadData(requests);
    });

    // Should have dispatched load data action
    const state = store.getState();
    expect(state.offline.dataLoadingProgress.total).toBe(1);
  });

  it('should resolve conflicts', async () => {
    // Add a conflict first
    store.dispatch({
      type: 'offline/addConflictResolution',
      payload: {
        id: 'conflict1',
        type: 'test',
        localData: { local: true },
        remoteData: { remote: true },
      },
    });

    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useOffline(), { wrapper });

    await act(async () => {
      await result.current.resolveConflict('conflict1', 'local');
    });

    // Should show success notification
    const state = store.getState();
    expect(state.ui.notifications).toHaveLength(1);
    expect(state.ui.notifications[0].message).toContain('Conflict resolved');
  });

  it('should clear errors', () => {
    // Add an error first
    store.dispatch({
      type: 'offline/addSyncError',
      payload: {
        action: {
          id: 'action1',
          type: 'TEST',
          payload: {},
          timestamp: Date.now(),
          retryCount: 0,
          maxRetries: 3,
          priority: 'high',
        },
        error: 'Test error',
      },
    });

    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useOffline(), { wrapper });

    act(() => {
      result.current.clearErrors();
    });

    const state = store.getState();
    expect(state.offline.syncErrors).toHaveLength(0);
  });

  it('should clear all offline data', async () => {
    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useOffline(), { wrapper });

    await act(async () => {
      result.current.clearAllOfflineData();
    });

    expect(mockOfflineSyncService.clearOfflineData).toHaveBeenCalled();
    expect(mockProgressiveLoaderService.clearCache).toHaveBeenCalled();
    
    const state = store.getState();
    expect(state.ui.notifications).toHaveLength(1);
    expect(state.ui.notifications[0].message).toContain('All offline data cleared');
  });

  it('should get offline data by key', () => {
    // Add some offline data
    store.dispatch({
      type: 'offline/storeOfflineData',
      payload: {
        key: 'test_key',
        data: { test: 'data' },
      },
    });

    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useOffline(), { wrapper });

    const data = result.current.getOfflineDataByKey('test_key');
    expect(data).toEqual({ test: 'data' });

    const nonExistentData = result.current.getOfflineDataByKey('non_existent');
    expect(nonExistentData).toBe(null);
  });

  it('should queue actions', async () => {
    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useOffline(), { wrapper });

    const action = {
      type: 'TEST_ACTION',
      payload: { test: true },
      priority: 'high' as const,
      maxRetries: 5,
    };

    await act(async () => {
      await result.current.queueAction(action);
    });

    expect(mockOfflineSyncService.queueAction).toHaveBeenCalledWith({
      type: 'TEST_ACTION',
      payload: { test: true },
      priority: 'high',
      maxRetries: 5,
    });

    const state = store.getState();
    expect(state.ui.notifications).toHaveLength(1);
    expect(state.ui.notifications[0].message).toContain('Action queued for sync');
  });
});

describe('useProgressiveLoader', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    jest.clearAllMocks();
    store = createTestStore();
  });

  it('should load critical data', async () => {
    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useProgressiveLoader(), { wrapper });

    await act(async () => {
      await result.current.loadCriticalData('user123');
    });

    const state = store.getState();
    expect(state.offline.dataLoadingProgress.total).toBe(3); // user_profile, user_friends, user_achievements
  });

  it('should load game data', async () => {
    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useProgressiveLoader(), { wrapper });

    await act(async () => {
      await result.current.loadGameData('room123');
    });

    const state = store.getState();
    expect(state.offline.dataLoadingProgress.total).toBe(3); // room_details, room_players, game_history
  });

  it('should load social data', async () => {
    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useProgressiveLoader(), { wrapper });

    await act(async () => {
      await result.current.loadSocialData();
    });

    const state = store.getState();
    expect(state.offline.dataLoadingProgress.total).toBe(3); // friends_activities, friends_leaderboard, public_rooms
  });

  it('should get cached data', () => {
    // Add some offline data
    store.dispatch({
      type: 'offline/storeOfflineData',
      payload: {
        key: 'cached_key',
        data: { cached: true },
      },
    });

    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useProgressiveLoader(), { wrapper });

    const data = result.current.getCachedData('cached_key');
    expect(data).toEqual({ cached: true });
  });

  it('should invalidate cache', () => {
    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useProgressiveLoader(), { wrapper });

    act(() => {
      result.current.invalidateCache('user_');
    });

    expect(mockProgressiveLoaderService.invalidateCache).toHaveBeenCalledWith('user_');
  });
});

describe('useConflictResolution', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    jest.clearAllMocks();
    store = createTestStore();
  });

  it('should resolve conflicts', async () => {
    // Add a conflict
    store.dispatch({
      type: 'offline/addConflictResolution',
      payload: {
        id: 'conflict1',
        type: 'test',
        localData: { local: true },
        remoteData: { remote: true },
      },
    });

    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useConflictResolution(), { wrapper });

    let resolveResult;
    await act(async () => {
      resolveResult = await result.current.resolveConflict('conflict1', 'local');
    });

    expect(resolveResult).toEqual({ success: true });
  });

  it('should get pending conflicts', () => {
    // Add conflicts
    store.dispatch({
      type: 'offline/addConflictResolution',
      payload: {
        id: 'conflict1',
        type: 'test',
        localData: {},
        remoteData: {},
      },
    });
    
    store.dispatch({
      type: 'offline/addConflictResolution',
      payload: {
        id: 'conflict2',
        type: 'test',
        localData: {},
        remoteData: {},
      },
    });

    // Resolve one conflict
    store.dispatch({
      type: 'offline/updateConflictResolution',
      payload: {
        id: 'conflict1',
        resolution: 'local',
      },
    });

    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useConflictResolution(), { wrapper });

    const pendingConflicts = result.current.getPendingConflicts();
    expect(pendingConflicts).toHaveLength(1);
    expect(pendingConflicts[0].id).toBe('conflict2');
  });

  it('should get conflict by id', () => {
    // Add a conflict
    store.dispatch({
      type: 'offline/addConflictResolution',
      payload: {
        id: 'conflict1',
        type: 'test',
        localData: { local: true },
        remoteData: { remote: true },
      },
    });

    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useConflictResolution(), { wrapper });

    const conflict = result.current.getConflictById('conflict1');
    expect(conflict).toBeDefined();
    expect(conflict?.id).toBe('conflict1');
    expect(conflict?.localData).toEqual({ local: true });

    const nonExistentConflict = result.current.getConflictById('non_existent');
    expect(nonExistentConflict).toBeUndefined();
  });

  it('should track has pending conflicts', () => {
    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useConflictResolution(), { wrapper });

    expect(result.current.hasPendingConflicts).toBe(false);

    // Add a conflict
    act(() => {
      store.dispatch({
        type: 'offline/addConflictResolution',
        payload: {
          id: 'conflict1',
          type: 'test',
          localData: {},
          remoteData: {},
        },
      });
    });

    expect(result.current.hasPendingConflicts).toBe(true);
  });
});