import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { apiService } from './api';
import { store } from '../store/store';
import { setConnectionStatus } from '../store/slices/gameSlice';
import { addNotification } from '../store/slices/uiSlice';

// Types for offline actions
export interface OfflineAction {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  priority: 'high' | 'medium' | 'low';
}

export interface SyncResult {
  success: boolean;
  error?: string;
  conflictResolution?: 'local' | 'remote' | 'merged';
}

// Storage keys
const OFFLINE_ACTIONS_KEY = 'offline_actions';
const LAST_SYNC_KEY = 'last_sync_timestamp';
const OFFLINE_DATA_KEY = 'offline_data';

class OfflineSyncService {
  private isOnline: boolean = true;
  private syncInProgress: boolean = false;
  private actionQueue: OfflineAction[] = [];
  private syncListeners: Array<(isOnline: boolean) => void> = [];

  constructor() {
    this.initializeNetworkListener();
    this.loadOfflineActions();
  }

  // Initialize network state monitoring
  private async initializeNetworkListener() {
    // Get initial network state
    const netInfo = await NetInfo.fetch();
    this.isOnline = netInfo.isConnected ?? false;
    
    // Listen for network changes
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? false;
      
      // Update Redux store
      store.dispatch(setConnectionStatus(this.isOnline));
      
      // Notify listeners
      this.syncListeners.forEach(listener => listener(this.isOnline));
      
      // If we just came back online, start sync
      if (!wasOnline && this.isOnline) {
        this.handleConnectionRestored();
      } else if (wasOnline && !this.isOnline) {
        this.handleConnectionLost();
      }
    });
  }

  // Handle connection restored
  private async handleConnectionRestored() {
    store.dispatch(addNotification({
      message: 'Connection restored. Syncing data...',
      type: 'info',
      duration: 3000,
    }));

    await this.syncOfflineActions();
    await this.syncOfflineData();
  }

  // Handle connection lost
  private handleConnectionLost() {
    store.dispatch(addNotification({
      message: 'Connection lost. Working offline...',
      type: 'warning',
      duration: 5000,
    }));
  }

  // Add action to offline queue
  async queueAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    const offlineAction: OfflineAction = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
      ...action,
    };

    this.actionQueue.push(offlineAction);
    await this.saveOfflineActions();

    // If online, try to sync immediately
    if (this.isOnline && !this.syncInProgress) {
      await this.syncOfflineActions();
    }
  }

  // Save offline actions to storage
  private async saveOfflineActions(): Promise<void> {
    try {
      await AsyncStorage.setItem(OFFLINE_ACTIONS_KEY, JSON.stringify(this.actionQueue));
    } catch (error) {
      console.error('Failed to save offline actions:', error);
    }
  }

  // Load offline actions from storage
  private async loadOfflineActions(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(OFFLINE_ACTIONS_KEY);
      if (stored) {
        this.actionQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load offline actions:', error);
      this.actionQueue = [];
    }
  }

  // Sync offline actions when connection is restored
  async syncOfflineActions(): Promise<void> {
    if (!this.isOnline || this.syncInProgress || this.actionQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;

    try {
      // Sort actions by priority and timestamp
      const sortedActions = [...this.actionQueue].sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        return priorityDiff !== 0 ? priorityDiff : a.timestamp - b.timestamp;
      });

      const successfulActions: string[] = [];
      const failedActions: OfflineAction[] = [];

      for (const action of sortedActions) {
        try {
          const result = await this.executeAction(action);
          if (result.success) {
            successfulActions.push(action.id);
          } else {
            action.retryCount++;
            if (action.retryCount < action.maxRetries) {
              failedActions.push(action);
            } else {
              console.warn(`Action ${action.id} failed after ${action.maxRetries} retries:`, result.error);
            }
          }
        } catch (error) {
          action.retryCount++;
          if (action.retryCount < action.maxRetries) {
            failedActions.push(action);
          } else {
            console.error(`Action ${action.id} failed permanently:`, error);
          }
        }
      }

      // Remove successful actions and update failed ones
      this.actionQueue = failedActions;
      await this.saveOfflineActions();

      if (successfulActions.length > 0) {
        store.dispatch(addNotification({
          message: `Synced ${successfulActions.length} offline actions`,
          type: 'success',
          duration: 3000,
        }));
      }

      if (failedActions.length > 0) {
        store.dispatch(addNotification({
          message: `${failedActions.length} actions failed to sync`,
          type: 'warning',
          duration: 5000,
        }));
      }

    } finally {
      this.syncInProgress = false;
    }
  }

  // Execute a specific offline action
  private async executeAction(action: OfflineAction): Promise<SyncResult> {
    switch (action.type) {
      case 'SEND_CHAT_MESSAGE':
        return this.syncChatMessage(action.payload);
      
      case 'CAST_VOTE':
        return this.syncVote(action.payload);
      
      case 'UPDATE_PLAYER_PROFILE':
        return this.syncPlayerProfile(action.payload);
      
      case 'SEND_FRIEND_REQUEST':
        return this.syncFriendRequest(action.payload);
      
      case 'REMOVE_FRIEND':
        return this.syncRemoveFriend(action.payload);
      
      default:
        return { success: false, error: `Unknown action type: ${action.type}` };
    }
  }

  // Sync chat message
  private async syncChatMessage(payload: any): Promise<SyncResult> {
    try {
      // This would typically call the socket service or API
      // For now, we'll simulate the sync
      console.log('Syncing chat message:', payload);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Sync vote
  private async syncVote(payload: any): Promise<SyncResult> {
    try {
      // This would typically call the socket service or API
      console.log('Syncing vote:', payload);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Sync player profile update
  private async syncPlayerProfile(payload: any): Promise<SyncResult> {
    try {
      await apiService.put('/players/profile', payload);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Sync friend request
  private async syncFriendRequest(payload: any): Promise<SyncResult> {
    try {
      await apiService.sendFriendRequest(payload.friendId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Sync remove friend
  private async syncRemoveFriend(payload: any): Promise<SyncResult> {
    try {
      await apiService.removeFriend(payload.friendId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Store data for offline access
  async storeOfflineData(key: string, data: any): Promise<void> {
    try {
      const offlineData = await this.getOfflineData();
      offlineData[key] = {
        data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(OFFLINE_DATA_KEY, JSON.stringify(offlineData));
    } catch (error) {
      console.error('Failed to store offline data:', error);
    }
  }

  // Get offline data
  async getOfflineData(): Promise<Record<string, any>> {
    try {
      const stored = await AsyncStorage.getItem(OFFLINE_DATA_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to get offline data:', error);
      return {};
    }
  }

  // Sync offline data with server
  async syncOfflineData(): Promise<void> {
    if (!this.isOnline) return;

    try {
      const offlineData = await this.getOfflineData();
      const lastSync = await this.getLastSyncTimestamp();

      // Sync each data type
      for (const [key, value] of Object.entries(offlineData)) {
        if (value.timestamp > lastSync) {
          await this.syncDataType(key, value.data);
        }
      }

      await this.setLastSyncTimestamp(Date.now());
    } catch (error) {
      console.error('Failed to sync offline data:', error);
    }
  }

  // Sync specific data type
  private async syncDataType(key: string, data: any): Promise<void> {
    switch (key) {
      case 'player_profile':
        await this.syncPlayerProfile(data);
        break;
      case 'game_settings':
        // Sync game settings if needed
        break;
      case 'friends_list':
        // Sync friends list if needed
        break;
      default:
        console.warn(`Unknown data type for sync: ${key}`);
    }
  }

  // Get last sync timestamp
  private async getLastSyncTimestamp(): Promise<number> {
    try {
      const stored = await AsyncStorage.getItem(LAST_SYNC_KEY);
      return stored ? parseInt(stored, 10) : 0;
    } catch (error) {
      console.error('Failed to get last sync timestamp:', error);
      return 0;
    }
  }

  // Set last sync timestamp
  private async setLastSyncTimestamp(timestamp: number): Promise<void> {
    try {
      await AsyncStorage.setItem(LAST_SYNC_KEY, timestamp.toString());
    } catch (error) {
      console.error('Failed to set last sync timestamp:', error);
    }
  }

  // Conflict resolution
  async resolveConflict(localData: any, remoteData: any, conflictType: string): Promise<any> {
    switch (conflictType) {
      case 'player_profile':
        return this.resolvePlayerProfileConflict(localData, remoteData);
      
      case 'game_state':
        return this.resolveGameStateConflict(localData, remoteData);
      
      default:
        // Default to remote data for unknown conflicts
        return remoteData;
    }
  }

  // Resolve player profile conflicts
  private resolvePlayerProfileConflict(local: any, remote: any): any {
    // Merge strategy: keep most recent changes for each field
    return {
      ...remote,
      // Keep local changes if they're more recent
      ...(local.updatedAt > remote.updatedAt ? {
        username: local.username,
        avatar: local.avatar,
      } : {}),
      // Always merge statistics (additive)
      statistics: {
        ...remote.statistics,
        gamesPlayed: Math.max(local.statistics?.gamesPlayed || 0, remote.statistics?.gamesPlayed || 0),
        gamesWon: Math.max(local.statistics?.gamesWon || 0, remote.statistics?.gamesWon || 0),
      },
    };
  }

  // Resolve game state conflicts
  private resolveGameStateConflict(local: any, remote: any): any {
    // For game state, always prefer remote (server is authoritative)
    return remote;
  }

  // Add sync listener
  addSyncListener(listener: (isOnline: boolean) => void): void {
    this.syncListeners.push(listener);
  }

  // Remove sync listener
  removeSyncListener(listener: (isOnline: boolean) => void): void {
    const index = this.syncListeners.indexOf(listener);
    if (index > -1) {
      this.syncListeners.splice(index, 1);
    }
  }

  // Get current online status
  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  // Get pending actions count
  getPendingActionsCount(): number {
    return this.actionQueue.length;
  }

  // Clear all offline data
  async clearOfflineData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        OFFLINE_ACTIONS_KEY,
        LAST_SYNC_KEY,
        OFFLINE_DATA_KEY,
      ]);
      this.actionQueue = [];
    } catch (error) {
      console.error('Failed to clear offline data:', error);
    }
  }

  // Force sync (for manual sync triggers)
  async forceSync(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }

    await this.syncOfflineActions();
    await this.syncOfflineData();
  }
}

// Export singleton instance
export const offlineSyncService = new OfflineSyncService();