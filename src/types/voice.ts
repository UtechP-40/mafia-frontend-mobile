export interface VoiceState {
  playerId: string;
  isMuted: boolean;
  isSpeaking: boolean;
  audioLevel: number;
  connectionQuality: ConnectionQuality;
  isPushToTalkActive: boolean;
}

export interface VoiceRoom {
  roomId: string;
  participants: VoiceParticipant[];
  isRecording: boolean;
  settings: VoiceSettings;
}

export interface VoiceParticipant {
  playerId: string;
  username: string;
  voiceState: VoiceState;
  peerConnection?: RTCPeerConnection;
  localStream?: MediaStream;
  remoteStream?: MediaStream;
}

export interface VoiceSettings {
  enableVoiceActivation: boolean;
  voiceActivationThreshold: number;
  enableNoiseSuppression: boolean;
  enableEchoCancellation: boolean;
  enableAutoGainControl: boolean;
  audioQuality: AudioQuality;
  pushToTalkKey?: string;
}

export enum ConnectionQuality {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  DISCONNECTED = 'disconnected'
}

export enum AudioQuality {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  AUTO = 'auto'
}

export interface VoicePermissions {
  microphone: boolean;
  speaker: boolean;
}

export interface AudioConstraints {
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
  sampleRate?: number;
  channelCount?: number;
}

export interface VoiceAnalytics {
  sessionDuration: number;
  averageAudioLevel: number;
  connectionDrops: number;
  qualityScore: number;
  networkLatency: number;
}

// WebRTC signaling messages
export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'voice-state-update';
  fromPlayerId: string;
  toPlayerId: string;
  data: any;
  timestamp: Date;
}

export interface ICECandidateMessage {
  candidate: RTCIceCandidate;
  sdpMLineIndex: number;
  sdpMid: string;
}

export interface OfferAnswerMessage {
  sdp: RTCSessionDescription;
}

export interface VoiceStateUpdate {
  isMuted: boolean;
  isSpeaking: boolean;
  audioLevel: number;
  isPushToTalkActive: boolean;
}