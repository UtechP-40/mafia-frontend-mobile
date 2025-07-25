import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView, 
  TouchableOpacity, 
  RefreshControl,
  Modal,
  TextInput
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import { RootStackParamList } from '../types/navigation';
import { Button, Card } from '../components/ui';
import { 
  selectPublicRooms,
  selectRoomsLoading,
  selectRoomsError,
  fetchPublicRooms,
  setFilters,
  clearError as clearRoomsError
} from '../store/slices/roomsSlice';
import { setCurrentScreen, addNotification } from '../store/slices/uiSlice';
import { Ionicons } from '@expo/vector-icons';

type RoomBrowserNavigationProp = StackNavigationProp<RootStackParamList, 'RoomBrowser'>;

export const RoomBrowserScreen: React.FC = () => {
  const navigation = useNavigation<RoomBrowserNavigationProp>();
  const dispatch = useDispatch();
  
  const publicRooms = useSelector(selectPublicRooms);
  const isLoading = useSelector(selectRoomsLoading);
  const error = useSelector(selectRoomsError);
  const filters = useSelector((state: any) => state.rooms.filters);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomMaxPlayers, setNewRoomMaxPlayers] = useState('8');
  const [newRoomVoiceChat, setNewRoomVoiceChat] = useState(true);

  useEffect(() => {
    dispatch(setCurrentScreen('RoomBrowser'));
    dispatch(fetchPublicRooms(filters));
  }, [dispatch, filters]);

  useEffect(() => {
    if (error) {
      dispatch(addNotification({
        message: error,
        type: 'error'
      }));
      dispatch(clearRoomsError());
    }
  }, [error, dispatch]);

  const handleRefresh = () => {
    dispatch(fetchPublicRooms(filters));
  };

  const handleJoinRoom = (roomId: string, roomName: string) => {
    // TODO: Implement room joining when backend API is ready
    dispatch(addNotification({
      message: 'Room joining feature coming soon!',
      type: 'info'
    }));
  };

  const handleCreateRoom = () => {
    if (!newRoomName.trim()) {
      dispatch(addNotification({
        message: 'Please enter a room name',
        type: 'error'
      }));
      return;
    }

    const maxPlayers = parseInt(newRoomMaxPlayers);
    if (isNaN(maxPlayers) || maxPlayers < 4 || maxPlayers > 12) {
      dispatch(addNotification({
        message: 'Max players must be between 4 and 12',
        type: 'error'
      }));
      return;
    }

    // TODO: Implement room creation when backend API is ready
    dispatch(addNotification({
      message: 'Room creation feature coming soon!',
      type: 'info'
    }));
    setShowCreateModal(false);
  };

  const handleApplyFilters = (newFilters: any) => {
    dispatch(setFilters(newFilters));
    setShowFiltersModal(false);
  };

  const handleClearFilters = () => {
    dispatch(setFilters({}));
    setShowFiltersModal(false);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.maxPlayers !== null) count++;
    if (filters.hasVoiceChat !== null) count++;
    if (filters.skillLevel !== null) count++;
    return count;
  };

  const renderRoomItem = (room: any) => (
    <Card key={room.id}>
      <View style={styles.roomHeader}>
        <View style={styles.roomInfo}>
          <Text style={styles.roomName}>{room.name}</Text>
          <Text style={styles.roomHost}>Hosted by {room.hostUsername}</Text>
        </View>
        <View style={styles.roomStatus}>
          <Text style={styles.playerCount}>
            {room.playerCount}/{room.maxPlayers}
          </Text>
          <View style={[styles.statusIndicator, { 
            backgroundColor: room.status === 'waiting' ? '#10b981' : '#f59e0b' 
          }]} />
        </View>
      </View>
      
      <View style={styles.roomDetails}>
        <View style={styles.roomFeatures}>
          {room.settings.gameSettings.enableVoiceChat && (
            <View style={styles.feature}>
              <Ionicons name="mic" size={16} color="#6366f1" />
              <Text style={styles.featureText}>Voice Chat</Text>
            </View>
          )}
          <View style={styles.feature}>
            <Ionicons name="time" size={16} color="#6366f1" />
            <Text style={styles.featureText}>
              {Math.round(room.settings.gameSettings.dayPhaseDuration / 60)}min rounds
            </Text>
          </View>
        </View>
        
        <Button
          title={room.status === 'waiting' ? 'Join' : 'Spectate'}
          onPress={() => handleJoinRoom(room.id, room.name)}
          disabled={room.playerCount >= room.maxPlayers && room.status === 'waiting'}
          style={styles.joinButton}
        />
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Browse Rooms</Text>
        <TouchableOpacity onPress={() => setShowFiltersModal(true)}>
          <View style={styles.filterButton}>
            <Ionicons name="filter" size={20} color="#ffffff" />
            {getActiveFiltersCount() > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{getActiveFiltersCount()}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          title="Create Room"
          onPress={() => setShowCreateModal(true)}
          style={styles.createButton}
        />
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={isLoading}
        >
          <Ionicons 
            name="refresh" 
            size={20} 
            color="#ffffff" 
            style={isLoading ? styles.spinning : undefined}
          />
        </TouchableOpacity>
      </View>

      {/* Rooms List */}
      <ScrollView 
        style={styles.roomsList}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor="#6366f1"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {publicRooms.length > 0 ? (
          publicRooms.map(renderRoomItem)
        ) : (
          <Card>
            <View style={styles.emptyState}>
              <Ionicons name="home-outline" size={64} color="#6b7280" />
              <Text style={styles.emptyStateText}>No rooms available</Text>
              <Text style={styles.emptyStateSubtext}>
                Create a room or try adjusting your filters
              </Text>
            </View>
          </Card>
        )}
      </ScrollView>

      {/* Create Room Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Room</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Room Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={newRoomName}
                  onChangeText={setNewRoomName}
                  placeholder="Enter room name..."
                  placeholderTextColor="#9ca3af"
                  maxLength={30}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Max Players</Text>
                <TextInput
                  style={styles.textInput}
                  value={newRoomMaxPlayers}
                  onChangeText={setNewRoomMaxPlayers}
                  placeholder="8"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <TouchableOpacity 
                  style={styles.checkboxContainer}
                  onPress={() => setNewRoomVoiceChat(!newRoomVoiceChat)}
                >
                  <View style={[styles.checkbox, newRoomVoiceChat && styles.checkboxChecked]}>
                    {newRoomVoiceChat && <Ionicons name="checkmark" size={16} color="#ffffff" />}
                  </View>
                  <Text style={styles.checkboxLabel}>Enable Voice Chat</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setShowCreateModal(false)}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title="Create"
                onPress={handleCreateRoom}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Filters Modal */}
      <Modal
        visible={showFiltersModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFiltersModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Rooms</Text>
              <TouchableOpacity onPress={() => setShowFiltersModal(false)}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Coming soon...</Text>
              <Text style={styles.emptyStateSubtext}>
                Filter options will be available in a future update
              </Text>
            </View>
            
            <View style={styles.modalActions}>
              <Button
                title="Clear All"
                onPress={handleClearFilters}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title="Done"
                onPress={() => setShowFiltersModal(false)}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  filterButton: {
    position: 'relative',
    padding: 4,
  },
  filterBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  createButton: {
    flex: 1,
  },
  refreshButton: {
    backgroundColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinning: {
    // Add rotation animation if needed
  },
  roomsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  roomHost: {
    fontSize: 14,
    color: '#9ca3af',
  },
  roomStatus: {
    alignItems: 'center',
    gap: 4,
  },
  playerCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  roomDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomFeatures: {
    flexDirection: 'row',
    gap: 16,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featureText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  joinButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#9ca3af',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2d2d2d',
    borderRadius: 16,
    margin: 20,
    minWidth: 300,
    maxWidth: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modalBody: {
    padding: 20,
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
  textInput: {
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#ffffff',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#6b7280',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#ffffff',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  modalButton: {
    flex: 1,
  },
});