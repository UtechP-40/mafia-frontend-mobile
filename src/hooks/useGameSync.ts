import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSocket } from './useSocket';
import {
  selectGame,
  selectCurrentPlayer,
  selectIsConnected,
  setGameState,
  updateGamePhase,
  updateTimeRemaining,
  updateVotes,
  eliminatePlayer,
  addGameEvent,
  addChatMessage,
  setConnectionStatus,
  setConnectionError,
  clearConnectionError,
} from '../store/slices/gameSlice';
import { selectAuth } from '../store/slices/authSlice';
import { GameState, GamePhase, Vote, GameEvent } from '../types/game';

interface SyncOptions {
  enableConflictResolution?: boolean;
  syncInterval?: number;
  maxRetries?: number;
}

interface GameSyncState {
  lastSyncTime: number;
  pendingUpdates: Map<string, any>;
  isResyncing: boolean;
  conflictCount: number;
}

export const useGameSync = (options: SyncOptions = {}) => {
  const {
    enableConflictResolution = true,
    syncInterval = 5000,
    maxRetries = 3,
  } = options;

  const dispatch = useDispatch();
  const { token } = useSelector(selectAuth);
  const gameState = useSelector(selectGame);
  const currentPlayer = useSelector(selectCurrentPlayer);
  const isConnected = useSelector(selectIsConnected);
  
  const { emit, on, off } = useSocket(token);
  
  const syncStateRef = useRef<GameSyncState>({
    lastSyncTime: Date.now(),
    pendingUpdates: new Map(),
    isResyncing: false,
    conflictCount: 0,
  });

  const syncIntervalRef = useRef<NodeJS.Timeout>();
  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  // Sync game state with server
  const syncGameState = useCallback(() => {
    if (!isConnected || syncStateRef.current.isResyncing) return;

    emit('request-game-sync', {
      roomId: gameState.currentRoom?.id,
      lastSyncTime: syncStateRef.current.lastSyncTime,
      clientState: {
        phase: gameState.currentPhase,
        dayNumber: gameState.dayNumber,
        timeRemaining: gameState.timeRemaining,
        votes: gameState.votes,
        players: gameState.players,
      },
    });
  }, [isConnected, gameState, emit]);

  // Handle game state updates from server
  const handleGameStateUpdate = useCallback((data: { gameState: GameState; timestamp: number }) => {
    const { gameState: serverState, timestamp } = data;
    
    // Check if this update is newer than our last sync
    if (timestamp > syncStateRef.current.lastSyncTime) {
      dispatch(setGameState(serverState));
      syncStateRef.current.lastSyncTime = timestamp;
      
      // Clear any pending updates that are now resolved
      syncStateRef.current.pendingUpdates.clear();
    }
  }, [dispatch]);

  // Handle phase changes with conflict detection
  const handlePhaseChange = useCallback((data: { 
    phase: GamePhase; 
    timeRemaining: number; 
    timestamp: number;
    dayNumber?: number;
  }) => {
    const { phase, timeRemaining, timestamp, dayNumber } = data;
    
    // Check for conflicts
    if (enableConflictResolution && gameState.currentPhase !== phase) {
      const timeDiff = Math.abs(timestamp - syncStateRef.current.lastSyncTime);
      
      // If the time difference is significant, there might be a conflict
      if (timeDiff > 1000) {
        syncStateRef.current.conflictCount++;
        console.warn(`Phase conflict detected: client=${gameState.currentPhase}, server=${phase}`);
        
        // Request full sync to resolve conflict
        syncGameState();
        return;
      }
    }
    
    dispatch(updateGamePhase(phase));
    dispatch(updateTimeRemaining(timeRemaining));
    
    if (dayNumber !== undefined && dayNumber !== gameState.dayNumber) {
      dispatch({ type: 'game/incrementDay' });
    }
    
    syncStateRef.current.lastSyncTime = timestamp;
  }, [dispatch, gameState.currentPhase, gameState.dayNumber, enableConflictResolution, syncGameState]);

  // Handle vote updates with optimistic updates
  const handleVotesUpdate = useCallback((data: { votes: Vote[]; timestamp: number }) => {
    const { votes, timestamp } = data;
    
    // Only update if this is newer than our last sync
    if (timestamp >= syncStateRef.current.lastSyncTime) {
      dispatch(updateVotes(votes));
      syncStateRef.current.lastSyncTime = timestamp;
    }
  }, [dispatch]);

  // Handle player elimination
  const handlePlayerElimination = useCallback((data: {
    playerId: string;
    reason: string;
    timestamp: number;
  }) => {
    const { playerId, reason, timestamp } = data;
    
    dispatch(eliminatePlayer(playerId));
    dispatch(addGameEvent({
      id: `elimination-${playerId}-${timestamp}`,
      type: 'elimination',
      playerId,
      data: { reason },
      timestamp: new Date(timestamp),
    }));
    
    syncStateRef.current.lastSyncTime = timestamp;
  }, [dispatch]);

  // Handle sync conflicts
  const handleSyncConflict = useCallback((data: {
    serverState: any;
    clientState: any;
    conflictingFields: string[];
    resolution: 'server' | 'client' | 'merge';
  }) => {
    const { serverState, conflictingFields, resolution } = data;
    
    console.log('Sync conflict detected:', {
      conflictingFields,
      resolution,
      conflictCount: syncStateRef.current.conflictCount,
    });
    
    syncStateRef.current.conflictCount++;
    
    switch (resolution) {
      case 'server':
        // Accept server state
        dispatch(setGameState(serverState));
        break;
        
      case 'client':
        // Keep client state (rare case)
        break;
        
      case 'merge':
        // Merge states (complex logic would go here)
        dispatch(setGameState({
          ...gameState.gameState,
          ...serverState,
        }));
        break;
    }
    
    syncStateRef.current.lastSyncTime = Date.now();
    syncStateRef.current.isResyncing = false;
    
    // Clear pending updates
    syncStateRef.current.pendingUpdates.clear();
  }, [dispatch, gameState.gameState]);

  // Handle connection events
  const handleDisconnect = useCallback((reason: string) => {
    dispatch(setConnectionStatus(false));
    dispatch(setConnectionError(`Disconnected: ${reason}`));
    
    // Stop sync interval
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }
    
    // Attempt to reconnect with exponential backoff
    let retryCount = 0;
    const attemptReconnect = () => {
      if (retryCount >= maxRetries) {
        console.error('Max reconnection attempts reached');
        return;
      }
      
      retryCount++;
      const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 30000);
      
      retryTimeoutRef.current = setTimeout(() => {
        emit('reconnect', { 
          lastSyncTime: syncStateRef.current.lastSyncTime,
          playerId: currentPlayer?.id,
        });
        attemptReconnect();
      }, delay);
    };
    
    attemptReconnect();
  }, [dispatch, emit, currentPlayer?.id, maxRetries]);

  const handleReconnect = useCallback(() => {
    dispatch(setConnectionStatus(true));
    dispatch(clearConnectionError());
    
    // Clear retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    
    // Request full sync
    syncGameState();
    
    // Restart sync interval
    startSyncInterval();
  }, [dispatch, syncGameState]);

  // Start periodic sync
  const startSyncInterval = useCallback(() => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }
    
    syncIntervalRef.current = setInterval(() => {
      if (isConnected && !syncStateRef.current.isResyncing) {
        syncGameState();
      }
    }, syncInterval);
  }, [isConnected, syncGameState, syncInterval]);

  // Setup socket listeners
  useEffect(() => {
    if (!isConnected) return;

    on('game-state-update', handleGameStateUpdate);
    on('phase-changed', handlePhaseChange);
    on('votes-updated', handleVotesUpdate);
    on('player-eliminated', handlePlayerElimination);
    on('sync-conflict', handleSyncConflict);
    on('disconnect', handleDisconnect);
    on('reconnect', handleReconnect);

    // Start periodic sync
    startSyncInterval();

    return () => {
      off('game-state-update');
      off('phase-changed');
      off('votes-updated');
      off('player-eliminated');
      off('sync-conflict');
      off('disconnect');
      off('reconnect');
      
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [
    isConnected,
    on,
    off,
    handleGameStateUpdate,
    handlePhaseChange,
    handleVotesUpdate,
    handlePlayerElimination,
    handleSyncConflict,
    handleDisconnect,
    handleReconnect,
    startSyncInterval,
  ]);

  // Optimistic update function
  const performOptimisticUpdate = useCallback((
    updateType: string,
    updateData: any,
    serverAction: () => void
  ) => {
    const updateId = `${updateType}-${Date.now()}`;
    
    // Store pending update
    syncStateRef.current.pendingUpdates.set(updateId, {
      type: updateType,
      data: updateData,
      timestamp: Date.now(),
    });
    
    // Perform optimistic update locally
    switch (updateType) {
      case 'vote':
        dispatch(updateVotes([...gameState.votes, updateData]));
        break;
      case 'chat':
        dispatch(addChatMessage(updateData));
        break;
      // Add more cases as needed
    }
    
    // Send to server
    serverAction();
    
    // Set timeout to revert if not confirmed
    setTimeout(() => {
      if (syncStateRef.current.pendingUpdates.has(updateId)) {
        console.warn(`Optimistic update ${updateId} not confirmed, reverting`);
        syncStateRef.current.pendingUpdates.delete(updateId);
        // Request sync to get correct state
        syncGameState();
      }
    }, 5000);
    
    return updateId;
  }, [dispatch, gameState.votes, syncGameState]);

  // Confirm optimistic update
  const confirmOptimisticUpdate = useCallback((updateId: string) => {
    syncStateRef.current.pendingUpdates.delete(updateId);
  }, []);

  // Get sync statistics
  const getSyncStats = useCallback(() => ({
    lastSyncTime: syncStateRef.current.lastSyncTime,
    pendingUpdates: syncStateRef.current.pendingUpdates.size,
    isResyncing: syncStateRef.current.isResyncing,
    conflictCount: syncStateRef.current.conflictCount,
    isConnected,
  }), [isConnected]);

  // Force sync
  const forceSync = useCallback(() => {
    syncStateRef.current.isResyncing = true;
    syncGameState();
  }, [syncGameState]);

  return {
    syncGameState,
    performOptimisticUpdate,
    confirmOptimisticUpdate,
    getSyncStats,
    forceSync,
    isResyncing: syncStateRef.current.isResyncing,
    conflictCount: syncStateRef.current.conflictCount,
  };
};