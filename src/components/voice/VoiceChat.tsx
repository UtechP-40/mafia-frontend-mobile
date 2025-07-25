import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  AppState,
  AppStateStatus,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Socket } from 'socket.io-client';
import VoiceChatManager from '../../services/VoiceChatManager';
import VoiceChatControls from './VoiceChatControls';
import VoiceParticipantsList from './VoiceParticipantsList';
import PushToTalkButton from './PushToTalkButton';
import { 
  VoiceParticipant, 
  VoiceSettings, 
  ConnectionQuality,
  VoiceAnalytics 
} from '../../types/voice';
import { RootState } from '../../store/store';

interface VoiceChatProps {
  socket: Socket;
  roomId: string;
  playerId: string;
  enabled: boolean;
  onError?: (error: Error) => void;
  onAnalytics?: (analytics: VoiceAnalytics) => void;
  showParticipantsList?: boolean;
  showPushToTalkButton?: boolean;
  compact?: boolean;
}

const VoiceChat: React.FC<VoiceChatProps> = ({
  socket,
  roomId,
  playerId,
  enabled,
  onError,
  onAnalytics,
  showParticipantsList = true,
  showPushToTalkButton = false,
  compact = false
}) => {
  const dispatch = useDispatch();
  const voiceChatManager = useRef<VoiceChatManager | null>(null);
  
  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [participants, setParticipants] = useState<VoiceParticipant[]>([]);
  const [isMuted, setIsMuted] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>(ConnectionQuality.DISCONNECTED);
  const [isPushToTalkMode, setIsPushToTalkMode] = useState(false);
  const [isPushToTalkActive, setIsPushToTalkActive] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    enableVoiceActivation: true,
    voiceActivationThreshold: 0.1,
    enableNoiseSuppression: true,
    enableEchoCancellation: true,
    enableAutoGainControl: true,
    audioQuality: 'auto' as any,
    pushToTalkKey: undefined
  });

  // Initialize voice chat
  useEffect(() => {
    if (!enabled || !socket || !roomId || !playerId) {
      return;
    }

    const initializeVoiceChat = async () => {
      try {
        voiceChatManager.current = new VoiceChatManager();
        setupVoiceChatEventHandlers();
        
        await voiceChatManager.current.initialize(socket, roomId, playerId);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize voice chat:', error);
        if (onError) {
          onError(error as Error);
        }
        
        // Show user-friendly error message
        Alert.alert(
          'Voice Chat Error',
          'Failed to initialize voice chat. Please check your microphone permissions and try again.',
          [{ text: 'OK' }]
        );
      }
    };

    initializeVoiceChat();

    return () => {
      if (voiceChatManager.current) {
        voiceChatManager.current.disconnect();
        voiceChatManager.current = null;
      }
      setIsInitialized(false);
    };
  }, [enabled, socket, roomId, playerId]);

  // Setup event handlers
  const setupVoiceChatEventHandlers = () => {
    if (!voiceChatManager.current) return;

    const manager = voiceChatManager.current;

    manager.on('initialized', () => {
      console.log('Voice chat initialized');
    });

    manager.on('participantJoined', (participant: VoiceParticipant) => {
      setParticipants(prev => [...prev, participant]);
    });

    manager.on('participantLeft', ({ playerId: leftPlayerId }) => {
      setParticipants(prev => prev.filter(p => p.playerId !== leftPlayerId));
    });

    manager.on('participantVoiceStateChanged', ({ playerId: changedPlayerId, voiceState }) => {
      setParticipants(prev => prev.map(p => 
        p.playerId === changedPlayerId 
          ? { ...p, voiceState }
          : p
      ));
    });

    manager.on('localVoiceStateChanged', (voiceState) => {
      setIsMuted(voiceState.isMuted);
      setIsSpeaking(voiceState.isSpeaking);
      setAudioLevel(voiceState.audioLevel);
      setConnectionQuality(voiceState.connectionQuality);
      setIsPushToTalkActive(voiceState.isPushToTalkActive);
    });

    manager.on('pushToTalkModeChanged', ({ enabled: pttEnabled }) => {
      setIsPushToTalkMode(pttEnabled);
    });

    manager.on('reconnectionAttempted', ({ playerId: reconnectPlayerId }) => {
      console.log(`Attempting to reconnect to ${reconnectPlayerId}`);
    });

    manager.on('reconnectionFailed', ({ playerId: failedPlayerId, error }) => {
      console.error(`Failed to reconnect to ${failedPlayerId}:`, error);
    });

    manager.on('error', (error) => {
      console.error('Voice chat error:', error);
      if (onError) {
        onError(error);
      }
    });
  };

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (voiceChatManager.current) {
        if (nextAppState === 'background') {
          // Mute when app goes to background
          voiceChatManager.current.setMute(true);
        } else if (nextAppState === 'active') {
          // Restore previous mute state when app becomes active
          // This could be enhanced to remember the previous state
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  // Analytics reporting
  useEffect(() => {
    if (!voiceChatManager.current || !onAnalytics) return;

    const analyticsInterval = setInterval(() => {
      const analytics = voiceChatManager.current!.getVoiceAnalytics();
      onAnalytics(analytics);
    }, 30000); // Report every 30 seconds

    return () => clearInterval(analyticsInterval);
  }, [onAnalytics]);

  // Event handlers
  const handleToggleMute = () => {
    if (voiceChatManager.current) {
      const newMutedState = voiceChatManager.current.toggleMute();
      setIsMuted(newMutedState);
    }
  };

  const handleTogglePushToTalk = () => {
    if (voiceChatManager.current) {
      const newMode = !isPushToTalkMode;
      voiceChatManager.current.setPushToTalkMode(newMode);
      setIsPushToTalkMode(newMode);
    }
  };

  const handleUpdateVoiceSettings = (newSettings: Partial<VoiceSettings>) => {
    if (voiceChatManager.current) {
      const updatedSettings = { ...voiceSettings, ...newSettings };
      voiceChatManager.current.updateVoiceSettings(updatedSettings);
      setVoiceSettings(updatedSettings);
    }
  };

  const handlePushToTalkPressIn = () => {
    if (voiceChatManager.current && isPushToTalkMode) {
      voiceChatManager.current.setPushToTalkActive(true);
      setIsPushToTalkActive(true);
    }
  };

  const handlePushToTalkPressOut = () => {
    if (voiceChatManager.current && isPushToTalkMode) {
      voiceChatManager.current.setPushToTalkActive(false);
      setIsPushToTalkActive(false);
    }
  };

  const handleMuteParticipant = (participantId: string) => {
    // This would typically be a moderator function
    // For now, we'll just emit an event to the server
    socket.emit('voice:mute-participant', {
      roomId,
      targetPlayerId: participantId,
      moderatorId: playerId
    });
  };

  const handleUnmuteParticipant = (participantId: string) => {
    // This would typically be a moderator function
    socket.emit('voice:unmute-participant', {
      roomId,
      targetPlayerId: participantId,
      moderatorId: playerId
    });
  };

  if (!enabled || !isInitialized) {
    return null;
  }

  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      {/* Voice Chat Controls */}
      <VoiceChatControls
        isMuted={isMuted}
        isSpeaking={isSpeaking}
        audioLevel={audioLevel}
        connectionQuality={connectionQuality}
        voiceSettings={voiceSettings}
        isPushToTalkMode={isPushToTalkMode}
        isPushToTalkActive={isPushToTalkActive}
        onToggleMute={handleToggleMute}
        onTogglePushToTalk={handleTogglePushToTalk}
        onUpdateVoiceSettings={handleUpdateVoiceSettings}
        participantCount={participants.length}
        disabled={false}
      />

      {/* Participants List */}
      {showParticipantsList && (
        <VoiceParticipantsList
          participants={participants}
          currentPlayerId={playerId}
          onMuteParticipant={handleMuteParticipant}
          onUnmuteParticipant={handleUnmuteParticipant}
          showMuteControls={false} // Could be enabled for moderators
          compact={compact}
        />
      )}

      {/* Push-to-Talk Button */}
      {showPushToTalkButton && isPushToTalkMode && (
        <View style={styles.pushToTalkContainer}>
          <PushToTalkButton
            isActive={isPushToTalkActive}
            isMuted={isMuted}
            onPressIn={handlePushToTalkPressIn}
            onPressOut={handlePushToTalkPressOut}
            onToggleMute={handleToggleMute}
            disabled={false}
            size="large"
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  compactContainer: {
    flex: 0,
  },
  pushToTalkContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
});

export de