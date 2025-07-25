import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Switch,
  Slider,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VoiceSettings, AudioQuality, ConnectionQuality } from '../../types/voice';
import VoiceActivityIndicator from './VoiceActivityIndicator';

interface VoiceChatControlsProps {
  isMuted: boolean;
  isSpeaking: boolean;
  audioLevel: number;
  connectionQuality: ConnectionQuality;
  voiceSettings: VoiceSettings;
  isPushToTalkMode: boolean;
  isPushToTalkActive: boolean;
  onToggleMute: () => void;
  onTogglePushToTalk: () => void;
  onUpdateVoiceSettings: (settings: Partial<VoiceSettings>) => void;
  participantCount: number;
  disabled?: boolean;
}

const VoiceChatControls: React.FC<VoiceChatControlsProps> = ({
  isMuted,
  isSpeaking,
  audioLevel,
  connectionQuality,
  voiceSettings,
  isPushToTalkMode,
  isPushToTalkActive,
  onToggleMute,
  onTogglePushToTalk,
  onUpdateVoiceSettings,
  participantCount,
  disabled = false
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [tempSettings, setTempSettings] = useState<VoiceSettings>(voiceSettings);

  const handleSaveSettings = () => {
    onUpdateVoiceSettings(tempSettings);
    setShowSettings(false);
  };

  const handleCancelSettings = () => {
    setTempSettings(voiceSettings);
    setShowSettings(false);
  };

  const getConnectionQualityText = () => {
    switch (connectionQuality) {
      case ConnectionQuality.EXCELLENT:
        return 'Excellent';
      case ConnectionQuality.GOOD:
        return 'Good';
      case ConnectionQuality.FAIR:
        return 'Fair';
      case ConnectionQuality.POOR:
        return 'Poor';
      case ConnectionQuality.DISCONNECTED:
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  const getConnectionQualityColor = () => {
    switch (connectionQuality) {
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

  const getAudioQualityText = (quality: AudioQuality) => {
    switch (quality) {
      case AudioQuality.LOW:
        return 'Low (8kHz)';
      case AudioQuality.MEDIUM:
        return 'Medium (16kHz)';
      case AudioQuality.HIGH:
        return 'High (48kHz)';
      case AudioQuality.AUTO:
        return 'Auto';
      default:
        return 'Auto';
    }
  };

  return (
    <View style={styles.container}>
      {/* Main Controls */}
      <View style={styles.mainControls}>
        {/* Voice Activity Indicator */}
        <View style={styles.activityContainer}>
          <VoiceActivityIndicator
            audioLevel={audioLevel}
            isSpeaking={isSpeaking}
            isMuted={isMuted}
            connectionQuality={connectionQuality}
            size="medium"
            showConnectionQuality={true}
          />
        </View>

        {/* Mute Button */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            isMuted && styles.controlButtonActive,
            disabled && styles.controlButtonDisabled
          ]}
          onPress={onToggleMute}
          disabled={disabled}
        >
          <Ionicons
            name={isMuted ? 'mic-off' : 'mic'}
            size={20}
            color={disabled ? '#9CA3AF' : isMuted ? '#EF4444' : '#6366F1'}
          />
        </TouchableOpacity>

        {/* Push-to-Talk Toggle */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            isPushToTalkMode && styles.controlButtonActive,
            disabled && styles.controlButtonDisabled
          ]}
          onPress={onTogglePushToTalk}
          disabled={disabled}
        >
          <Ionicons
            name="radio-button-on"
            size={20}
            color={disabled ? '#9CA3AF' : isPushToTalkMode ? '#10B981' : '#6366F1'}
          />
        </TouchableOpacity>

        {/* Settings Button */}
        <TouchableOpacity
          style={[styles.controlButton, disabled && styles.controlButtonDisabled]}
          onPress={() => setShowSettings(true)}
          disabled={disabled}
        >
          <Ionicons
            name="settings"
            size={20}
            color={disabled ? '#9CA3AF' : '#6366F1'}
          />
        </TouchableOpacity>
      </View>

      {/* Status Info */}
      <View style={styles.statusInfo}>
        <View style={styles.statusItem}>
          <View style={[styles.statusDot, { backgroundColor: getConnectionQualityColor() }]} />
          <Text style={styles.statusText}>{getConnectionQualityText()}</Text>
        </View>
        
        <View style={styles.statusItem}>
          <Ionicons name="people" size={12} color="#6B7280" />
          <Text style={styles.statusText}>{participantCount} connected</Text>
        </View>

        {isPushToTalkMode && (
          <View style={styles.statusItem}>
            <View style={[
              styles.statusDot, 
              { backgroundColor: isPushToTalkActive ? '#10B981' : '#9CA3AF' }
            ]} />
            <Text style={styles.statusText}>
              {isPushToTalkActive ? 'PTT Active' : 'PTT Ready'}
            </Text>
          </View>
        )}
      </View>

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCancelSettings}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleCancelSettings}>
              <Text style={styles.modalCancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Voice Settings</Text>
            <TouchableOpacity onPress={handleSaveSettings}>
              <Text style={styles.modalSaveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Voice Activation */}
            <View style={styles.settingSection}>
              <Text style={styles.sectionTitle}>Voice Activation</Text>
              
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Enable Voice Activation</Text>
                <Switch
                  value={tempSettings.enableVoiceActivation}
                  onValueChange={(value) =>
                    setTempSettings({ ...tempSettings, enableVoiceActivation: value })
                  }
                />
              </View>

              {tempSettings.enableVoiceActivation && (
                <View style={styles.settingItem}>
                  <Text style={styles.settingLabel}>
                    Sensitivity: {Math.round(tempSettings.voiceActivationThreshold * 100)}%
                  </Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={0.05}
                    maximumValue={0.5}
                    value={tempSettings.voiceActivationThreshold}
                    onValueChange={(value) =>
                      setTempSettings({ ...tempSettings, voiceActivationThreshold: value })
                    }
                    minimumTrackTintColor="#6366F1"
                    maximumTrackTintColor="#E5E7EB"
                    thumbTintColor="#6366F1"
                  />
                </View>
              )}
            </View>

            {/* Audio Processing */}
            <View style={styles.settingSection}>
              <Text style={styles.sectionTitle}>Audio Processing</Text>
              
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Noise Suppression</Text>
                <Switch
                  value={tempSettings.enableNoiseSuppression}
                  onValueChange={(value) =>
                    setTempSettings({ ...tempSettings, enableNoiseSuppression: value })
                  }
                />
              </View>

              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Echo Cancellation</Text>
                <Switch
                  value={tempSettings.enableEchoCancellation}
                  onValueChange={(value) =>
                    setTempSettings({ ...tempSettings, enableEchoCancellation: value })
                  }
                />
              </View>

              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Auto Gain Control</Text>
                <Switch
                  value={tempSettings.enableAutoGainControl}
                  onValueChange={(value) =>
                    setTempSettings({ ...tempSettings, enableAutoGainControl: value })
                  }
                />
              </View>
            </View>

            {/* Audio Quality */}
            <View style={styles.settingSection}>
              <Text style={styles.sectionTitle}>Audio Quality</Text>
              
              {Object.values(AudioQuality).map((quality) => (
                <TouchableOpacity
                  key={quality}
                  style={styles.qualityOption}
                  onPress={() => setTempSettings({ ...tempSettings, audioQuality: quality })}
                >
                  <View style={styles.qualityOptionContent}>
                    <Text style={styles.qualityOptionText}>
                      {getAudioQualityText(quality)}
                    </Text>
                    {tempSettings.audioQuality === quality && (
                      <Ionicons name="checkmark" size={20} color="#6366F1" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 12,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  mainControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  activityContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  controlButtonActive: {
    backgroundColor: '#EEF2FF',
    borderWidth: 2,
    borderColor: '#6366F1',
  },
  controlButtonDisabled: {
    opacity: 0.5,
  },
  statusInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalCancelButton: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalSaveButton: {
    fontSize: 16,
    color: '#6366F1',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  settingSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingLabel: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  slider: {
    flex: 1,
    marginLeft: 16,
  },
  qualityOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  qualityOptionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qualityOptionText: {
    fontSize: 14,
    color: '#374151',
  },
});

export default VoiceChatControls;