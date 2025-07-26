import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { VoiceChat } from '../VoiceChat';

// Mock WebRTC service
jest.mock('../../../services/WebRTCService', () => ({
  WebRTCService: {
    getInstance: jest.fn(() => ({
      initializeConnection: jest.fn(),
      joinRoom: jest.fn(),
      leaveRoom: jest.fn(),
      toggleMute: jest.fn(),
      toggleSpeaker: jest.fn(),
      getConnectionState: jest.fn(() => 'connected'),
      on: jest.fn(),
      off: jest.fn(),
    })),
  },
}));

// Mock react-native-webrtc
jest.mock('react-native-webrtc', () => ({
  RTCPeerConnection: jest.fn(),
  RTCSessionDescription: jest.fn(),
  RTCIceCandidate: jest.fn(),
  mediaDevices: {
    getUserMedia: jest.fn(() => Promise.resolve({})),
    enumerateDevices: jest.fn(() => Promise.resolve([])),
  },
}));

describe('VoiceChat', () => {
  const mockProps = {
    roomId: 'test-room',
    participants: [
      {
        id: 'user-1',
        username: 'User1',
        isMuted: false,
        isSpeaking: false,
        audioLevel: 0.5,
      },
      {
        id: 'user-2',
        username: 'User2',
        isMuted: true,
        isSpeaking: false,
        audioLevel: 0,
      },
    ],
    currentUserId: 'user-1',
    isEnabled: true,
    onParticipantUpdate: jest.fn(),
    onError: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders voice chat interface correctly', () => {
    render(<VoiceChat {...mockProps} />);

    expect(screen.getByTestId('voice-chat-container')).toBeTruthy();
    expect(screen.getByTestId('mute-button')).toBeTruthy();
    expect(screen.getByTestId('speaker-button')).toBeTruthy();
  });

  it('displays participants correctly', () => {
    render(<VoiceChat {...mockProps} />);

    expect(screen.getByText('User1')).toBeTruthy();
    expect(screen.getByText('User2')).toBeTruthy();
  });

  it('shows mute status correctly', () => {
    render(<VoiceChat {...mockProps} />);

    const user1Indicator = screen.getByTestId('participant-user-1');
    const user2Indicator = screen.getByTestId('participant-user-2');

    expect(user1Indicator).not.toHaveStyle({ opacity: 0.5 });
    expect(user2Indicator).toHaveStyle({ opacity: 0.5 });
  });

  it('handles mute button press', () => {
    const mockWebRTCService = require('../../../services/WebRTCService').WebRTCService.getInstance();
    
    render(<VoiceChat {...mockProps} />);

    const muteButton = screen.getByTestId('mute-button');
    fireEvent.press(muteButton);

    expect(mockWebRTCService.toggleMute).toHaveBeenCalledTimes(1);
  });

  it('handles speaker button press', () => {
    const mockWebRTCService = require('../../../services/WebRTCService').WebRTCService.getInstance();
    
    render(<VoiceChat {...mockProps} />);

    const speakerButton = screen.getByTestId('speaker-button');
    fireEvent.press(speakerButton);

    expect(mockWebRTCService.toggleSpeaker).toHaveBeenCalledTimes(1);
  });

  it('shows speaking indicator when user is speaking', () => {
    const speakingProps = {
      ...mockProps,
      participants: [
        {
          ...mockProps.participants[0],
          isSpeaking: true,
          audioLevel: 0.8,
        },
        mockProps.participants[1],
      ],
    };

    render(<VoiceChat {...speakingProps} />);

    const speakingIndicator = screen.getByTestId('speaking-indicator-user-1');
    expect(speakingIndicator).toBeTruthy();
    expect(speakingIndicator).toHaveStyle({
      backgroundColor: '#4CAF50',
    });
  });

  it('shows audio level visualization', () => {
    render(<VoiceChat {...mockProps} />);

    const audioLevel = screen.getByTestId('audio-level-user-1');
    expect(audioLevel).toBeTruthy();
    expect(audioLevel).toHaveStyle({
      width: '50%', // 0.5 audio level = 50% width
    });
  });

  it('handles connection state changes', async () => {
    const mockWebRTCService = require('../../../services/WebRTCService').WebRTCService.getInstance();
    mockWebRTCService.getConnectionState.mockReturnValue('connecting');

    render(<VoiceChat {...mockProps} />);

    expect(screen.getByText('Connecting...')).toBeTruthy();

    // Simulate connection established
    mockWebRTCService.getConnectionState.mockReturnValue('connected');
    
    // Trigger re-render by updating props
    const { rerender } = render(<VoiceChat {...mockProps} />);
    rerender(<VoiceChat {...mockProps} />);

    await waitFor(() => {
      expect(screen.queryByText('Connecting...')).toBeNull();
    });
  });

  it('handles voice chat disabled state', () => {
    const disabledProps = { ...mockProps, isEnabled: false };
    
    render(<VoiceChat {...disabledProps} />);

    expect(screen.getByText('Voice chat is disabled')).toBeTruthy();
    expect(screen.getByTestId('mute-button')).toHaveStyle({
      opacity: 0.5,
    });
    expect(screen.getByTestId('speaker-button')).toHaveStyle({
      opacity: 0.5,
    });
  });

  it('shows push-to-talk mode correctly', () => {
    const pttProps = { ...mockProps, pushToTalkMode: true };
    
    render(<VoiceChat {...pttProps} />);

    expect(screen.getByTestId('ptt-button')).toBeTruthy();
    expect(screen.getByText('Hold to Talk')).toBeTruthy();
  });

  it('handles push-to-talk button interactions', () => {
    const mockWebRTCService = require('../../../services/WebRTCService').WebRTCService.getInstance();
    const pttProps = { ...mockProps, pushToTalkMode: true };
    
    render(<VoiceChat {...pttProps} />);

    const pttButton = screen.getByTestId('ptt-button');
    
    // Press and hold
    fireEvent(pttButton, 'pressIn');
    expect(mockWebRTCService.toggleMute).toHaveBeenCalledWith(false);

    // Release
    fireEvent(pttButton, 'pressOut');
    expect(mockWebRTCService.toggleMute).toHaveBeenCalledWith(true);
  });

  it('handles permission errors', async () => {
    const mockWebRTCService = require('../../../services/WebRTCService').WebRTCService.getInstance();
    mockWebRTCService.initializeConnection.mockRejectedValue(new Error('Permission denied'));

    render(<VoiceChat {...mockProps} />);

    await waitFor(() => {
      expect(mockProps.onError).toHaveBeenCalledWith('Microphone permission denied');
    });
  });

  it('shows network quality indicator', () => {
    const qualityProps = {
      ...mockProps,
      participants: [
        {
          ...mockProps.participants[0],
          connectionQuality: 'poor',
        },
        mockProps.participants[1],
      ],
    };

    render(<VoiceChat {...qualityProps} />);

    const qualityIndicator = screen.getByTestId('quality-indicator-user-1');
    expect(qualityIndicator).toBeTruthy();
    expect(qualityIndicator).toHaveStyle({
      backgroundColor: '#FF5722', // Poor quality = red
    });
  });

  it('handles participant joining', () => {
    const { rerender } = render(<VoiceChat {...mockProps} />);

    const updatedProps = {
      ...mockProps,
      participants: [
        ...mockProps.participants,
        {
          id: 'user-3',
          username: 'User3',
          isMuted: false,
          isSpeaking: false,
          audioLevel: 0,
        },
      ],
    };

    rerender(<VoiceChat {...updatedProps} />);

    expect(screen.getByText('User3')).toBeTruthy();
    expect(mockProps.onParticipantUpdate).toHaveBeenCalled();
  });

  it('handles participant leaving', () => {
    const { rerender } = render(<VoiceChat {...mockProps} />);

    const updatedProps = {
      ...mockProps,
      participants: [mockProps.participants[0]], // Remove User2
    };

    rerender(<VoiceChat {...updatedProps} />);

    expect(screen.queryByText('User2')).toBeNull();
  });

  it('shows voice activity detection', () => {
    const vadProps = {
      ...mockProps,
      voiceActivityDetection: true,
      participants: [
        {
          ...mockProps.participants[0],
          isSpeaking: true,
          voiceActivity: 0.9,
        },
        mockProps.participants[1],
      ],
    };

    render(<VoiceChat {...vadProps} />);

    const vadIndicator = screen.getByTestId('vad-indicator-user-1');
    expect(vadIndicator).toBeTruthy();
    expect(vadIndicator).toHaveStyle({
      opacity: 0.9,
    });
  });

  it('handles audio device switching', () => {
    render(<VoiceChat {...mockProps} />);

    const deviceButton = screen.getByTestId('audio-device-button');
    fireEvent.press(deviceButton);

    expect(screen.getByText('Select Audio Device')).toBeTruthy();
    expect(screen.getByText('Speaker')).toBeTruthy();
    expect(screen.getByText('Earpiece')).toBeTruthy();
    expect(screen.getByText('Bluetooth')).toBeTruthy();
  });

  it('shows volume controls', () => {
    render(<VoiceChat {...mockProps} />);

    const volumeControl = screen.getByTestId('volume-control');
    expect(volumeControl).toBeTruthy();

    const volumeSlider = screen.getByTestId('volume-slider');
    fireEvent(volumeSlider, 'valueChange', 0.8);

    // Volume should be updated
    expect(volumeSlider.props.value).toBe(0.8);
  });
});