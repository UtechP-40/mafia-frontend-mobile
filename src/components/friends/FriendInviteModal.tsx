import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Modal } from '../ui';
import { Ionicons } from '@expo/vector-icons';
import { 
  selectOnlineFriends,
  inviteFriendToGame 
} from '../../store/slices/friendsSlice';
import { addNotification } from '../../store/slices/uiSlice';

interface FriendInviteModalProps {
  visible: boolean;
  onClose: () => void;
  roomId: string;
  roomName?: string;
}

export const FriendInviteModal: React.FC<FriendInviteModalProps> = ({
  visible,
  onClose,
  roomId,
  roomName = 'Private Room'
}) => {
  const dispatch = useDispatch();
  const onlineFriends = useSelector(selectOnlineFriends);
  const [invitingFriends, setInvitingFriends] = useState<Set<string>>(new Set());

  const handleInviteFriend = async (friendId: string, friendUsername: string) => {
    setInvitingFriends(prev => new Set(prev).add(friendId));
    
    try {
      await dispatch(inviteFriendToGame({ friendId, roomId })).unwrap();
      
      dispatch(addNotification({
        message: `Invitation sent to ${friendUsername}`,
        type: 'success'
      }));
    } catch (error) {
      dispatch(addNotification({
        message: error || `Failed to invite ${friendUsername}`,
        type: 'error'
      }));
    } finally {
      setInvitingFriends(prev => {
        const newSet = new Set(prev);
        newSet.delete(friendId);
        return newSet;
      });
    }
  };

  const renderFriendItem = ({ item: friend }: { item: any }) => {
    const isInviting = invitingFriends.has(friend.id);
    const canInvite = friend.status === 'online' && !isInviting;

    return (
      <View style={styles.friendItem}>
        <View style={styles.friendInfo}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {friend.username.charAt(0).toUpperCase()}
            </Text>
            <View style={[
              styles.statusIndicator, 
              { backgroundColor: getStatusColor(friend.status) }
            ]} />
          </View>
          <View style={styles.friendDetails}>
            <Text style={styles.friendName}>{friend.username}</Text>
            <Text style={styles.friendStatus}>
              {getStatusText(friend.status)}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={[
            styles.inviteButton,
            !canInvite && styles.inviteButtonDisabled
          ]}
          onPress={() => handleInviteFriend(friend.id, friend.username)}
          disabled={!canInvite}
        >
          {isInviting ? (
            <Ionicons name="hourglass-outline" size={20} color="#9ca3af" />
          ) : (
            <Ionicons 
              name="send-outline" 
              size={20} 
              color={canInvite ? "#ffffff" : "#6b7280"} 
            />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#10b981';
      case 'in-game': return '#f59e0b';
      case 'away': return '#f97316';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'in-game': return 'In Game';
      case 'away': return 'Away';
      default: return 'Offline';
    }
  };

  return (
    <Modal visible={visible} onClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Invite Friends</Text>
          <Text style={styles.subtitle}>to {roomName}</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {onlineFriends.length > 0 ? (
          <FlatList
            data={onlineFriends}
            renderItem={renderFriendItem}
            keyExtractor={(item) => item.id}
            style={styles.friendsList}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#6b7280" />
            <Text style={styles.emptyStateText}>No online friends</Text>
            <Text style={styles.emptyStateSubtext}>
              Your friends need to be online to receive invitations
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
    minHeight: 300,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 4,
  },
  friendsList: {
    flex: 1,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatarText: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 40,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#2d2d2d',
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  friendStatus: {
    fontSize: 14,
    color: '#9ca3af',
  },
  inviteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#6366f1',
  },
  inviteButtonDisabled: {
    backgroundColor: '#374151',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
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
});