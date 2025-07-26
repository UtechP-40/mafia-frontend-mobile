import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useOffline } from '../hooks/useOffline';

export const OfflineIndicator: React.FC = () => {
  const { 
    isOnline, 
    syncStatus, 
    pendingActionsCount, 
    syncNow, 
    hasPendingConflicts 
  } = useOffline();

  if (isOnline && syncStatus === 'synced' && pendingActionsCount === 0 && !hasPendingConflicts) {
    return null; // Don't show anything when everything is synced
  }

  const getStatusColor = () => {
    switch (syncStatus) {
      case 'offline': return '#ff4444';
      case 'syncing': return '#ffaa00';
      case 'pending': return '#ff8800';
      case 'synced': return '#44ff44';
      default: return '#888888';
    }
  };

  const getStatusText = () => {
    switch (syncStatus) {
      case 'offline': return 'Offline';
      case 'syncing': return 'Syncing...';
      case 'pending': return `${pendingActionsCount} pending`;
      case 'synced': return 'Synced';
      default: return 'Unknown';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: getStatusColor() }]}>
      <Text style={styles.statusText}>{getStatusText()}</Text>
      
      {hasPendingConflicts && (
        <Text style={styles.conflictText}>Conflicts need resolution</Text>
      )}
      
      {isOnline && pendingActionsCount > 0 && (
        <TouchableOpacity onPress={syncNow} style={styles.syncButton}>
          <Text style={styles.syncButtonText}>Sync Now</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  conflictText: {
    color: 'white',
    fontSize: 12,
    fontStyle: 'italic',
  },
  syncButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  syncButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});