import { io, Socket } from 'socket.io-client';

interface QueuedAction {
  id: string;
  event: string;
  data: any;
  timestamp: number;
  retryCount: number;
}

interface SyncState {
  lastSyncTime: number;
  pendingActions: QueuedAction[];
  isResyncing: boolean;
}

class SocketService {
  private socket: Socket | null = null;
  private readonly serverUrl = 'http://localhost:3000'; // Will be configured later
  private syncState: SyncState = {
    lastSyncTime: 0,
    pendingActions: [],
    isResyncing: false,
  };
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(this.serverUrl, {
      auth: {
        token,
      },
      transports: ['websocket'],
      timeout: 10000,
      forceNew: true,
    });

    this.setupEventHandlers();
    this.startHeartbeat();
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.reconnectAttempts = 0;
      this.syncState.lastSyncTime = Date.now();
      
      // Process any pending actions
      this.processPendingActions();
      
      // Request sync if we have a previous sync time
      if (this.syncState.lastSyncTime > 0) {
        this.requestSync();
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
      this.stopHeartbeat();
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't reconnect
        return;
      }
      
      // Attempt to reconnect
      this.attemptReconnect();
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.attemptReconnect();
    });

    // Sync-related events
    this.socket.on('sync-request', (data) => {
      this.handleSyncRequest(data);
    });

    this.socket.on('sync-conflict', (data) => {
      this.handleSyncConflict(data);
    });

    this.socket.on('action-acknowledged', (data) => {
      this.handleActionAcknowledged(data);
    });

    this.socket.on('action-rejected', (data) => {
      this.handleActionRejected(data);
    });

    // Heartbeat
    this.socket.on('pong', () => {
      // Server responded to ping
    });
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping');
      }
    }, 30000); // 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    setTimeout(() => {
      console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      this.socket?.connect();
    }, delay);
  }

  private requestSync(): void {
    if (this.syncState.isResyncing) return;
    
    this.syncState.isResyncing = true;
    this.emit('request-sync', {
      lastSyncTime: this.syncState.lastSyncTime,
      pendingActions: this.syncState.pendingActions.map(action => ({
        id: action.id,
        event: action.event,
        timestamp: action.timestamp,
      })),
    });
  }

  private handleSyncRequest(data: any): void {
    // Server is requesting our current state for sync
    this.emit('sync-response', {
      lastSyncTime: this.syncState.lastSyncTime,
      pendingActions: this.syncState.pendingActions,
    });
  }

  private handleSyncConflict(data: { serverState: any; conflictingActions: string[] }): void {
    console.log('Sync conflict detected, resolving...');
    
    // Remove conflicting actions from pending queue
    this.syncState.pendingActions = this.syncState.pendingActions.filter(
      action => !data.conflictingActions.includes(action.id)
    );
    
    // Update sync time
    this.syncState.lastSyncTime = Date.now();
    this.syncState.isResyncing = false;
    
    // Emit conflict event for the UI to handle
    this.socket?.emit('sync-conflict-resolved', data);
  }

  private handleActionAcknowledged(data: { actionId: string }): void {
    // Remove acknowledged action from pending queue
    this.syncState.pendingActions = this.syncState.pendingActions.filter(
      action => action.id !== data.actionId
    );
  }

  private handleActionRejected(data: { actionId: string; reason: string }): void {
    // Remove rejected action and potentially retry
    const rejectedAction = this.syncState.pendingActions.find(
      action => action.id === data.actionId
    );
    
    if (rejectedAction && rejectedAction.retryCount < 3) {
      rejectedAction.retryCount++;
      rejectedAction.timestamp = Date.now();
      // Will be retried in next processPendingActions call
    } else {
      this.syncState.pendingActions = this.syncState.pendingActions.filter(
        action => action.id !== data.actionId
      );
    }
  }

  private processPendingActions(): void {
    if (!this.socket?.connected || this.syncState.pendingActions.length === 0) {
      return;
    }

    // Process actions in chronological order
    const sortedActions = [...this.syncState.pendingActions].sort(
      (a, b) => a.timestamp - b.timestamp
    );

    sortedActions.forEach(action => {
      this.socket?.emit(action.event, {
        ...action.data,
        actionId: action.id,
        isRetry: action.retryCount > 0,
      });
    });
  }

  disconnect(): void {
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.syncState = {
      lastSyncTime: 0,
      pendingActions: [],
      isResyncing: false,
    };
    this.reconnectAttempts = 0;
  }

  emit(event: string, data: any): void {
    const actionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    if (this.socket?.connected) {
      this.socket.emit(event, { ...data, actionId });
      
      // Add to pending actions for conflict resolution
      if (this.isGameAction(event)) {
        this.syncState.pendingActions.push({
          id: actionId,
          event,
          data,
          timestamp: Date.now(),
          retryCount: 0,
        });
      }
    } else {
      // Queue action for when connection is restored
      if (this.isGameAction(event)) {
        this.syncState.pendingActions.push({
          id: actionId,
          event,
          data,
          timestamp: Date.now(),
          retryCount: 0,
        });
      }
    }
  }

  private isGameAction(event: string): boolean {
    const gameActions = [
      'cast-vote',
      'send-chat-message',
      'use-ability',
      'ready-toggle',
      'start-game',
    ];
    return gameActions.includes(event);
  }

  on(event: string, callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string): void {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getConnectionState(): {
    connected: boolean;
    reconnectAttempts: number;
    pendingActions: number;
    isResyncing: boolean;
  } {
    return {
      connected: this.isConnected(),
      reconnectAttempts: this.reconnectAttempts,
      pendingActions: this.syncState.pendingActions.length,
      isResyncing: this.syncState.isResyncing,
    };
  }

  // Force a sync request (useful for debugging or manual sync)
  forcSync(): void {
    this.requestSync();
  }

  // Clear pending actions (useful for cleanup)
  clearPendingActions(): void {
    this.syncState.pendingActions = [];
  }
}

export const socketService = new SocketService();