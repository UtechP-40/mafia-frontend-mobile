import React, { useEffect } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { useOffline, useProgressiveLoader } from '../hooks/useOffline';
import { OfflineIndicator } from '../components/OfflineIndicator';

/**
 * Example component demonstrating offline functionality usage
 * This shows how to:
 * 1. Monitor online/offline status
 * 2. Queue actions when offline
 * 3. Load data progressively
 * 4. Handle sync conflicts
 */
export const OfflineGameExample: React.FC = () => {
  const {
    isOnline,
    syncStatus,
    pendingActionsCount,
    hasPendingConflicts,
    conflictResolutions,
    queueAction,
    resolveConflict,
    syncNow,
    getOfflineDataByKey,
  } = useOffline();

  const {
    loadCriticalData,
    loadGameData,
    getCachedData,
    dataLoadingProgress,
  } = useProgressiveLoader();

  // Load critical data on component mount
  useEffect(() => {
    loadCriticalData('user123').catch(console.error);
  }, [loadCriticalData]);

  // Handle sending a chat message (works offline)
  const handleSendMessage = async () => {
    try {
      await queueAction({
        type: 'SEND_CHAT_MESSAGE',
        payload: {
          roomId: 'room123',
          message: 'Hello from offline!',
          timestamp: Date.now(),
        },
        priority: 'high',
        maxRetries: 3,
      });

      Alert.alert('Success', isOnline ? 'Message sent!' : 'Message queued for sync');
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
    }
  };

  // Handle casting a vote (works offline)
  const handleCastVote = async () => {
    try {
      await queueAction({
        type: 'CAST_VOTE',
        payload: {
          gameId: 'game123',
          targetId: 'player456',
          playerId: 'currentPlayer',
        },
        priority: 'high',
        maxRetries: 5,
      });

      Alert.alert('Success', isOnline ? 'Vote cast!' : 'Vote queued for sync');
    } catch (error) {
      Alert.alert('Error', 'Failed to cast vote');
    }
  };

  // Handle joining a game room
  const handleJoinRoom = async () => {
    try {
      await loadGameData('room123');
      Alert.alert('Success', 'Room data loaded');
    } catch (error) {
      Alert.alert('Error', 'Failed to load room data');
    }
  };

  // Handle conflict resolution
  const handleResolveConflict = async (conflictId: string) => {
    try {
      await resolveConflict(conflictId, 'local');
      Alert.alert('Success', 'Conflict resolved');
    } catch (error) {
      Alert.alert('Error', 'Failed to resolve conflict');
    }
  };

  // Get cached user profile
  const userProfile = getCachedData('user_profile');
  const gameHistory = getOfflineDataByKey('game_history');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Offline Game Example</Text>
      
      {/* Offline status indicator */}
      <OfflineIndicator />
      
      {/* Connection status */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Status:</Text>
        <Text style={[styles.statusValue, { color: isOnline ? 'green' : 'red' }]}>
          {isOnline ? 'Online' : 'Offline'}
        </Text>
      </View>

      {/* Sync status */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Sync:</Text>
        <Text style={styles.statusValue}>{syncStatus}</Text>
      </View>

      {/* Pending actions */}
      {pendingActionsCount > 0 && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Pending:</Text>
          <Text style={styles.statusValue}>{pendingActionsCount} actions</Text>
        </View>
      )}

      {/* Data loading progress */}
      {dataLoadingProgress.total > 0 && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Loading:</Text>
          <Text style={styles.statusValue}>
            {dataLoadingProgress.loaded}/{dataLoadingProgress.total}
          </Text>
        </View>
      )}

      {/* Cached data info */}
      {userProfile && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>User:</Text>
          <Text style={styles.statusValue}>{userProfile.username || 'Unknown'}</Text>
        </View>
      )}

      {gameHistory && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Games:</Text>
          <Text style={styles.statusValue}>{gameHistory.games?.length || 0} cached</Text>
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.buttonContainer}>
        <Button title="Send Message" onPress={handleSendMessage} />
        <Button title="Cast Vote" onPress={handleCastVote} />
        <Button title="Join Room" onPress={handleJoinRoom} />
        
        {isOnline && pendingActionsCount > 0 && (
          <Button title="Sync Now" onPress={syncNow} />
        )}
      </View>

      {/* Conflict resolution */}
      {hasPendingConflicts && (
        <View style={styles.conflictContainer}>
          <Text style={styles.conflictTitle}>Conflicts Need Resolution:</Text>
          {conflictResolutions
            .filter(c => c.resolution === 'pending')
            .map(conflict => (
              <View key={conflict.id} style={styles.conflictItem}>
                <Text style={styles.conflictText}>
                  {conflict.type} conflict
                </Text>
                <Button
                  title="Resolve"
                  onPress={() => handleResolveConflict(conflict.id)}
                />
              </View>
            ))}
        </View>
      )}

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>How to test:</Text>
        <Text style={styles.instructionsText}>
          1. Turn off network to go offline{'\n'}
          2. Try sending messages or casting votes{'\n'}
          3. Turn network back on{'\n'}
          4. Watch actions sync automatically{'\n'}
          5. Check cached data persists offline
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    marginVertical: 2,
    borderRadius: 4,
  },
  statusLabel: {
    fontWeight: 'bold',
  },
  statusValue: {
    color: '#666',
  },
  buttonContainer: {
    marginVertical: 20,
    gap: 10,
  },
  conflictContainer: {
    backgroundColor: '#fff3cd',
    padding: 16,
    borderRadius: 8,
    marginVertical: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  conflictTitle: {
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 10,
  },
  conflictItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  conflictText: {
    color: '#856404',
  },
  instructionsContainer: {
    backgroundColor: '#d1ecf1',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#17a2b8',
  },
  instructionsTitle: {
    fontWeight: 'bold',
    color: '#0c5460',
    marginBottom: 8,
  },
  instructionsText: {
    color: '#0c5460',
    lineHeight: 20,
  },
});