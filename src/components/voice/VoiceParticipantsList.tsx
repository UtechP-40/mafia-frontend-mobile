import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VoiceParticipant, ConnectionQuality } from '../../types/voice';
import VoiceActivityIndicator from './VoiceActivityIndicator';

interface VoiceParticipantsListProps {
  participants: VoiceParticipant[];
  currentPlayerId: string;
  onMuteParticipant?: (playerId: string) => void;
  onUnmuteParticipant?: (playerId: string) => void;
  showMuteControls?: boolean;
  compact?: boolean;
}

const VoiceParticipantsList: React.FC<VoiceParticipantsListProps> = ({
  participants,
  currentPlayerId,
  onMuteParticipant,
  onUnmuteParticipant,
  showMuteControls = false,
  compact = false
}) => {
  const renderParticipant = ({ item }: { item: VoiceParticipant }) => {
    const isCurrentUser = item.playerId === currentPlayerId;
    const { voiceState } = item;

    const getConnectionIcon = () => {
      switch (voiceState.connectionQuality) {
        case ConnectionQuality.EXCELLENT:
          return 'wifi';
        case ConnectionQuality.GOOD:
          return 'wifi';
        case ConnectionQuality.FAIR:
          return 'wifi-outline';
        case ConnectionQuality.POOR:
          return 'wifi-outline';
        case ConnectionQuality.DISCONNECTED:
          return 'wifi-off';
        default:
          return 'wifi-off';
      }
    };

    const getConnectionColor = () => {
      switch (voiceState.connectionQuality) {
        case ConnectionQuality.EXCELLENT:
          return '#10B981';
        case ConnectionQuality.GOOD:
          return '#84CC16';
        case ConnectionQuality.FAIR:
          return '#F59E0B';
        case ConnectionQuality.POOR:
          return '#EF4444';
        case ConnectionQuality.DISCONNECTED:
          return '#9CA3AF';
        default:
          return '#9CA3AF';
      }
    };

    const handleMuteToggle = () => {
      if (voiceState.isMuted && onUnmuteParticipant) {
        onUnmuteParticipant(item.playerId);
      } else if (!voiceState.isMuted && onMuteParticipant) {
        onMuteParticipant(item.playerId);
      }
    };

    if (compact) {
      return (
        <View style={styles.compactParticipant}>
          <VoiceActivityIndicator
            audioLevel={voiceState.audioLevel}
            isSpeaking={voiceState.isSpeaking}
            isMuted={voiceState.isMuted}
            connectionQuality={voiceState.connectionQuality}
            size="small"
            showConnectionQuality={false}
          />
          <Text style={[
            styles.compactUsername,
            isCurrentUser && styles.currentUserText,
            voiceState.isSpeaking && !voiceState.isMuted && styles.speakingText
          ]}>
            {item.username}
            {isCurrentUser && ' (You)'}
          </Text>
        </View>
      );
    }

    return (
      <View style={[
        styles.participant,
        isCurrentUser && styles.currentUserParticipant,
        voiceState.isSpeaking && !voiceState.isMuted && styles.speakingParticipant
      ]}>
        {/* Avatar and Activity Indicator */}
        <View style={styles.participantLeft}>
          <View style={styles.avatarContainer}>
            <View style={[
              styles.avatar,
              voiceState.isSpeaking && !voiceState.isMuted && styles.speakingAvatar
            ]}>
              <Text style={styles.avatarText}>
                {item.username.charAt(0).toUpperCase()}
              </Text>
            </View>
            
            {/* Voice Activity Indicator Overlay */}
            <View style={styles.activityOverlay}>
              <VoiceActivityIndicator
                audioLevel={voiceState.audioLevel}
                isSpeaking={voiceState.isSpeaking}
                isMuted={voiceState.isMuted}
                connectionQuality={voiceState.connectionQuality}
                size="small"
                showConnectionQuality={false}
              />
            </View>
          </View>

          {/* User Info */}
          <View style={styles.userInfo}>
            <Text style={[
              styles.username,
              isCurrentUser && styles.currentUserText,
              voiceState.isSpeaking && !voiceState.isMuted && styles.speakingText
            ]}>
              {item.username}
              {isCurrentUser && ' (You)'}
            </Text>
            
            <View style={styles.statusRow}>
              {/* Connection Quality */}
              <View style={styles.connectionStatus}>
                <Ionicons
                  name={getConnectionIcon()}
                  size={12}
                  color={getConnectionColor()}
                />
                <Text style={[styles.statusText, { color: getConnectionColor() }]}>
                  {voiceState.connectionQuality}
                </Text>
              </View>

              {/* Push-to-Talk Indicator */}
              {voiceState.isPushToTalkActive && (
                <View style={styles.pttIndicator}>
                  <Ionicons name="radio-button-on" size={12} color="#10B981" />
                  <Text style={styles.pttText}>PTT</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.participantRight}>
          {/* Mute Status */}
          <View style={styles.muteStatus}>
            <Ionicons
              name={voiceState.isMuted ? 'mic-off' : 'mic'}
              size={16}
              color={voiceState.isMuted ? '#EF4444' : '#10B981'}
            />
          </View>

          {/* Mute Control (for moderators) */}
          {showMuteControls && !isCurrentUser && (
            <TouchableOpacity
              style={styles.muteButton}
              onPress={handleMuteToggle}
            >
              <Ionicons
                name={voiceState.isMuted ? 'volume-mute' : 'volume-high'}
                size={16}
                color="#6366F1"
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const keyExtractor = (item: VoiceParticipant) => item.playerId;

  if (participants.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="people-outline" size={48} color="#9CA3AF" />
        <Text style={styles.emptyText}>No participants in voice chat</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Voice Chat ({participants.length})
        </Text>
        <View style={styles.headerIndicators}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendText}>Speaking</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>Muted</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={participants}
        renderItem={renderParticipant}
        keyExtractor={keyExtractor}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  headerIndicators: {
    flexDirection: 'row',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 10,
    color: '#6B7280',
  },
  list: {
    maxHeight: 300,
  },
  participant: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  currentUserParticipant: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  speakingParticipant: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  participantLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speakingAvatar: {
    backgroundColor: '#10B981',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  activityOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 2,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  currentUserText: {
    color: '#6366F1',
  },
  speakingText: {
    color: '#10B981',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  pttIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  pttText: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '500',
  },
  participantRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  muteStatus: {
    padding: 4,
  },
  muteButton: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
  compactParticipant: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginHorizontal: 2,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  compactUsername: {
    fontSize: 12,
    color: '#374151',
    marginLeft: 6,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default VoiceParticipantsList;